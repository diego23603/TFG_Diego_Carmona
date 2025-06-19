import Stripe from 'stripe';
import { User, Appointment } from '@shared/schema';
import { storage } from './storage';
import { validateDiscountCode, applyDiscount, recordDiscountCodeUsage, predefinedDiscountCodes } from './discount-codes';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil"
});

// Precios de los planes - En producción, estos vendrían desde el panel de Stripe
// En modo de desarrollo, usamos una estrategia diferente en lugar de IDs de precios
const PRICES = {
  client: {
    basic: null, // Plan básico gratuito
    premium: null, // Usaremos montos directos en lugar de IDs para desarrollo
  },
  professional: {
    basic: null, // Usaremos montos directos en lugar de IDs para desarrollo
    premium: null, // Usaremos montos directos en lugar de IDs para desarrollo
  },
};

// Cantidades en centavos para checkout directo (solo para desarrollo)
const AMOUNTS = {
  client: {
    basic: 0,
    premium: 1500, // 15€/mes
  },
  professional: {
    basic: 2500, // 25€/mes
    premium: 4999, // 49.99€/mes
  },
};

// Crear o actualizar un cliente en Stripe
export async function getOrCreateStripeCustomer(user: User): Promise<string> {
  // Si el usuario ya tiene un ID de cliente de Stripe, devolverlo
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  try {
    // Crear un nuevo cliente en Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: {
        userId: user.id.toString(),
      },
    });

    // Actualizar el ID de cliente de Stripe en nuestra base de datos
    await storage.updateUser(user.id, {
      stripeCustomerId: customer.id,
    });

    return customer.id;
  } catch (error) {
    console.error('Error al crear cliente en Stripe:', error);
    throw new Error('No se pudo crear el cliente en Stripe');
  }
}

// Crear una sesión de Checkout para suscripción
export async function createSubscriptionCheckoutSession(
  user: User,
  plan: 'basic' | 'premium',
  returnUrl: string,
  discountCode?: string
): Promise<{ 
  sessionId: string; 
  clientSecret: string; 
  url: string; 
  amount: number;
  originalAmount?: number;
  discountApplied?: boolean;
  discountDescription?: string; 
}> {
  try {
    const customerId = await getOrCreateStripeCustomer(user);
    
    // Determinar el tipo de usuario y precio correcto
    const userType = user.isProfessional ? 'professional' : 'client';
    const priceId = PRICES[userType][plan];
    let amount = AMOUNTS[userType][plan];
    const originalAmount = amount;
    
    // Para el plan básico gratuito, simplemente actualizamos el estado
    if (plan === 'basic' && userType === 'client') {
      return {
        sessionId: 'free_plan',
        clientSecret: 'free_plan',
        url: returnUrl,
        amount: 0,
      };
    }
    
    // Para el manejo de descuentos con Stripe, vamos a utilizar sus cupones nativos
    // En lugar de nuestra implementación personalizada
    console.log('No se proporcionó código de descuento.');
    
    let discountApplied = false;
    let discountDescription = '';
    let couponId = null;

    // Crear la sesión de Checkout
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [],
      mode: 'subscription', // Modo de suscripción para productos recurrentes
      success_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}${returnUrl}?success=false`,
      metadata: {
        userId: user.id.toString(),
        plan,
        userType,
      },
      allow_promotion_codes: true, // Permitir códigos promocionales directamente en la página de checkout
    };
    
    // Si tenemos un código de descuento, guardarlo en los metadatos
    if (discountCode) {
      console.log(`Código de descuento recibido: ${discountCode}`);
      sessionParams.metadata.discountCode = discountCode;
    }
    
    // Para desarrollo, usamos montos directos en lugar de IDs de precios
    sessionParams.line_items = [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Plan ${plan} - ${userType === 'client' ? 'Cliente' : 'Profesional'}`,
          description: plan === 'premium' 
            ? 'Suscripción mensual sin comisiones'
            : 'Suscripción mensual básica',
        },
        unit_amount: amount,
        recurring: {
          interval: 'month',
        },
      },
      quantity: 1,
    }];
    
    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      clientSecret: session.client_secret || '',
      url: session.url || '',
      amount,
      originalAmount: discountApplied ? originalAmount : undefined,
      discountApplied,
      discountDescription: discountApplied ? discountDescription : undefined,
    };
  } catch (error) {
    console.error('Error al crear sesión de suscripción:', error);
    throw new Error('No se pudo crear la sesión de suscripción');
  }
}

// Crear códigos promocionales en Stripe
export async function createPromotionalCodes() {
  try {
    console.log("Creando códigos promocionales en Stripe...");
    
    // Crear cupón para WELCOME10
    try {
      // Comprobar si ya existe
      await stripe.coupons.retrieve('WELCOME10');
      console.log("Cupón WELCOME10 ya existe");
    } catch (err) {
      // Crear el cupón
      const welcome10 = await stripe.coupons.create({
        id: 'WELCOME10',
        percent_off: 10,
        duration: 'once',
        name: '10% dto. primera suscripción'
      });
      
      // Crear el código promocional
      await stripe.promotionCodes.create({
        coupon: welcome10.id,
        code: 'WELCOME10',
        active: true
      });
      
      console.log("Creado cupón WELCOME10");
    }
    
    // Crear cupón para FREEMONTH
    try {
      await stripe.coupons.retrieve('FREEMONTH');
      console.log("Cupón FREEMONTH ya existe");
    } catch (err) {
      // Crear el cupón para un mes gratis (100% de descuento)
      const freeMonth = await stripe.coupons.create({
        id: 'FREEMONTH',
        percent_off: 100,
        duration: 'once',
        name: 'Primer mes gratis'
      });
      
      // Crear el código promocional
      await stripe.promotionCodes.create({
        coupon: freeMonth.id,
        code: 'FREEMONTH',
        active: true
      });
      
      console.log("Creado cupón FREEMONTH");
    }
    
    return true;
  } catch (error) {
    console.error("Error al crear códigos promocionales:", error);
    return false;
  }
}

// Cancelar una suscripción
export async function cancelSubscription(user: User): Promise<boolean> {
  try {
    // Si el usuario no tiene suscripción o ID de cliente de Stripe, no hay nada que cancelar
    if (!user.stripeCustomerId) {
      throw new Error('No hay suscripción activa para cancelar');
    }

    // Obtener todas las suscripciones activas del cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      throw new Error('No hay suscripciones activas para cancelar');
    }

    // Cancelar la suscripción más reciente
    const subscription = subscriptions.data[0];
    
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    // Actualizar el estado de la suscripción en nuestra base de datos
    // No cambiamos el tipo de suscripción inmediatamente, solo cuando expire
    await storage.updateUser(user.id, {
      // La suscripción seguirá activa hasta el final del período, 
      // por lo que no cambiamos el tipo de suscripción
    });

    return true;
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    throw new Error('No se pudo cancelar la suscripción');
  }
}

// Crear una cuenta Stripe Connect para profesional
export async function createConnectAccount(userId: number): Promise<{
  accountId: string;
  accountLinkUrl: string;
}> {
  try {
    // Obtener el usuario
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    
    // Verificar que sea un profesional
    if (!user.isProfessional) {
      throw new Error("Solo los profesionales pueden crear cuentas Connect");
    }
    
    // Verificar si ya tiene una cuenta Connect
    if (user.stripeAccountId && user.stripeAccountVerified) {
      throw new Error("El profesional ya tiene una cuenta Connect verificada");
    }
    
    let accountId = user.stripeAccountId;
    
    // Si no tiene cuenta Connect, crear una nueva
    if (!accountId) {
      // Crear una cuenta Connect
      const account = await stripe.accounts.create({
        type: 'express', // Tipo de cuenta más sencillo con onboarding asistido por Stripe
        country: 'ES',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: user.fullName,
          url: process.env.PUBLIC_URL || 'http://localhost:3000',
        },
        metadata: {
          userId: user.id.toString(),
          userType: user.userType,
        },
      });
      
      accountId = account.id;
      
      // Actualizar el usuario con el ID de cuenta
      await storage.updateUser(user.id, {
        stripeAccountId: accountId,
        stripeAccountCreated: true,
      });
    }
    
    // Generar un link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/professional/stripe-connect-refresh`,
      return_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/professional/stripe-connect-success`,
      type: 'account_onboarding',
    });
    
    return {
      accountId,
      accountLinkUrl: accountLink.url,
    };
  } catch (error) {
    console.error("Error al crear cuenta Connect:", error);
    throw new Error(`No se pudo crear la cuenta Connect: ${error.message}`);
  }
}

// Verificar estado de cuenta Connect
export async function getConnectAccountStatus(userId: number): Promise<{
  isVerified: boolean;
  account: {
    charges_enabled: boolean;
    details_submitted: boolean;
    payouts_enabled: boolean;
    requirements: any;
  };
}> {
  try {
    // Obtener el usuario
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    
    // Verificar que tenga una cuenta Connect
    if (!user.stripeAccountId) {
      throw new Error("El usuario no tiene una cuenta Connect");
    }
    
    // Obtener el estado de la cuenta Connect
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    
    // Verificar si la cuenta está completa y activa
    const isVerified = 
      account.charges_enabled && 
      account.details_submitted &&
      account.payouts_enabled;
    
    // Si el estado ha cambiado a verificado, actualizar en base de datos
    if (isVerified && !user.stripeAccountVerified) {
      await storage.updateUser(user.id, {
        stripeAccountVerified: true,
      });
    }
    
    return {
      isVerified,
      account: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements,
      },
    };
  } catch (error) {
    console.error("Error al verificar estado de cuenta Connect:", error);
    throw new Error(`No se pudo verificar el estado de la cuenta Connect: ${error.message}`);
  }
}

// Crear un nuevo link de onboarding para Connect
export async function createConnectAccountLink(userId: number): Promise<{
  url: string;
}> {
  try {
    // Obtener el usuario
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    
    // Verificar que tenga una cuenta Connect
    if (!user.stripeAccountId) {
      throw new Error("El usuario no tiene una cuenta Connect");
    }
    
    // Generar un nuevo link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/professional/stripe-connect-refresh`,
      return_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/professional/stripe-connect-success`,
      type: 'account_onboarding',
    });
    
    return {
      url: accountLink.url,
    };
  } catch (error) {
    console.error("Error al crear link de Connect:", error);
    throw new Error(`No se pudo crear el link de Connect: ${error.message}`);
  }
}

// Crear una intención de pago para una cita
export async function createPaymentIntent(
  amount: number,
  appointmentId: number,
  user: User,
  metadata: Record<string, string> = {}
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  try {
    // Obtener la cita para identificar al profesional
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      throw new Error("Cita no encontrada");
    }
    
    // Obtener al profesional
    const professional = await storage.getUser(appointment.professionalId);
    if (!professional) {
      throw new Error("Profesional no encontrado");
    }
    
    // Verificar si el profesional tiene cuenta Stripe Connect configurada
    if (!professional.stripeAccountId || !professional.stripeAccountVerified) {
      console.warn(`Profesional ${professional.id} no tiene cuenta Stripe Connect verificada. Procesando pago normal.`);
      
      // Obtener o crear el cliente en Stripe
      const customerId = await getOrCreateStripeCustomer(user);
      
      // Crear la intención de pago normal (sin Stripe Connect)
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // La cantidad ya viene en céntimos (centavos)
        currency: 'eur',
        customer: customerId,
        metadata: {
          appointmentId: appointmentId.toString(),
          userId: user.id.toString(),
          professionalId: professional.id.toString(),
          ...metadata
        },
        description: `Pago de cita #${appointmentId}`,
        setup_future_usage: 'off_session',
        automatic_payment_methods: {
          enabled: true,
        },
      });
  
      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentIntentId: paymentIntent.id
      };
    } 
    
    // Procesamiento con Stripe Connect (profesional verificado)
    console.log(`Procesando pago con Stripe Connect para profesional ${professional.id}, cuenta ${professional.stripeAccountId}`);
    
    // Comisión fija de la aplicación: 0.99€ = 99 céntimos
    const applicationFee = 99;
    
    // Obtener o crear el cliente en Stripe
    const customerId = await getOrCreateStripeCustomer(user);
    
    // Crear la intención de pago con Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // La cantidad ya viene en céntimos (centavos)
      currency: 'eur',
      customer: customerId,
      metadata: {
        appointmentId: appointmentId.toString(),
        userId: user.id.toString(),
        professionalId: professional.id.toString(),
        usingConnect: 'true',
        ...metadata
      },
      description: `Pago de cita #${appointmentId}`,
      setup_future_usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
      },
      // Datos de transferencia para Stripe Connect
      transfer_data: {
        destination: professional.stripeAccountId,
      },
      application_fee_amount: applicationFee,
    });

    // Actualizar la cita con la información de comisión
    await storage.updateAppointment(appointmentId, {
      commission: applicationFee
    });

    return {
      clientSecret: paymentIntent.client_secret as string,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error al crear la intención de pago:', error);
    throw new Error('No se pudo crear la intención de pago');
  }
}

// Actualizar el estado de pago de una cita
export async function updateAppointmentPaymentStatus(
  appointmentId: number,
  paymentIntentId: string
): Promise<boolean> {
  try {
    // Obtener la intención de pago para verificar el estado
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`El pago no se ha completado. Estado: ${paymentIntent.status}`);
    }
    
    // Actualizar la cita en nuestra base de datos
    await storage.updateAppointment(appointmentId, {
      paymentStatus: 'paid',
      paymentId: paymentIntentId
    });
    
    console.log(`Pago completado para la cita ${appointmentId}`);
    return true;
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    throw new Error('No se pudo actualizar el estado de pago de la cita');
  }
}

// Webhook para manejar eventos de Stripe
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Verificar que tengamos los metadatos necesarios
        if (!session.metadata?.userId || !session.metadata?.plan) {
          console.error('Faltan metadatos en la sesión de Checkout:', session.id);
          return;
        }
        
        const userId = parseInt(session.metadata.userId, 10);
        const plan = session.metadata.plan as 'basic' | 'premium';
        
        // Actualizar el tipo de suscripción del usuario
        // Establecer la fecha de caducidad 1 mes en el futuro (o según período de facturación)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        
        await storage.updateUser(userId, {
          subscriptionType: plan,
          subscriptionExpiry: expiryDate,
        });
        
        console.log(`Suscripción ${plan} activada para el usuario ${userId}`);
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Verificar si hay un appointmentId en los metadatos
        if (paymentIntent.metadata && paymentIntent.metadata.appointmentId) {
          const appointmentId = parseInt(paymentIntent.metadata.appointmentId, 10);

          // Preparar actualización de la cita
          const updateData: any = {
            paymentStatus: 'paid',
            paymentId: paymentIntent.id
          };
          
          // Verificar si este pago usó Stripe Connect
          if (paymentIntent.metadata.usingConnect === 'true') {
            updateData.feeCollected = true;
            updateData.transferredToProfessional = true;
            
            console.log(`Pago completado para la cita ${appointmentId} vía Stripe Connect. Comisión de 0.99€ cobrada.`);
          } else {
            console.log(`Pago completado para la cita ${appointmentId} vía pago estándar.`);
          }
          
          // Actualizar el estado de pago de la cita
          await storage.updateAppointment(appointmentId, updateData);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (!invoice.customer || !invoice.subscription) {
          console.error('Información de cliente o suscripción faltante:', invoice.id);
          return;
        }
        
        // Buscar usuario por ID de cliente de Stripe
        const user = await storage.getUserByStripeCustomerId(invoice.customer as string);
        
        if (!user) {
          console.error('No se encontró usuario para el cliente:', invoice.customer);
          return;
        }
        
        // Renovar la fecha de expiración de la suscripción
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        
        await storage.updateUser(user.id, {
          subscriptionExpiry: expiryDate,
        });
        
        console.log(`Suscripción renovada para el usuario ${user.id} hasta ${expiryDate}`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (!subscription.customer) {
          console.error('Información de cliente faltante:', subscription.id);
          return;
        }
        
        // Buscar usuario por ID de cliente de Stripe
        const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
        
        if (!user) {
          console.error('No se encontró usuario para el cliente:', subscription.customer);
          return;
        }
        
        // Cambiar el plan del usuario a básico al expirar la suscripción
        await storage.updateUser(user.id, {
          subscriptionType: 'basic',
          subscriptionExpiry: null,
        });
        
        console.log(`La suscripción del usuario ${user.id} ha expirado, plan actualizado a básico`);
        break;
      }
    }
  } catch (error) {
    console.error('Error procesando webhook de Stripe:', error);
  }
}