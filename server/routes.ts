import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertHorseSchema, 
  insertConnectionSchema, 
  insertAppointmentSchema, 
  insertMessageSchema,
  insertMedicalRecordSchema,
  insertServiceRecordSchema,
  insertReviewSchema,
  type User,
  type Appointment
} from "@shared/schema";
import { setupAuth, hashPassword } from "./auth";
import { getAIResponse } from "./openai";
import { 
  createSubscriptionCheckoutSession, 
  cancelSubscription, 
  handleStripeWebhookEvent, 
  createPaymentIntent, 
  updateAppointmentPaymentStatus, 
  createPromotionalCodes,
  createConnectAccount,
  getConnectAccountStatus,
  createConnectAccountLink
} from "./stripe";
import Stripe from "stripe";
import { sendEmail, sendAppointmentRequest, sendAppointmentResponse, sendAppointmentReminder, sendInvoice } from "./email";
import { validateDiscountCode, applyDiscount, DiscountType } from "./discount-codes";

// Inicialización de Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// @ts-ignore - TypeScript error sobre la versión de la API
// Verificar que disponemos de la clave secreta de Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("¡ADVERTENCIA! No se ha configurado STRIPE_SECRET_KEY");
}

// Inicializar Stripe con opciones avanzadas
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Última versión estable compatible
  timeout: 30000, // 30 segundos de timeout
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware global para asegurar que todas las respuestas de API sean JSON
  app.use('/api', (req: Request, res: Response, next: Function) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });
  
  // Configurar autenticación
  setupAuth(app);
  
  // Ruta para obtener estadísticas profesionales específicas
  app.get("/api/statistics/professional/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
      // Obtener todas las citas del profesional
      const appointments = await storage.getAppointmentsByProfessional(Number(id));
      
      // Obtener todos los caballos atendidos por este profesional (sin duplicados)
      const horsesAttended = new Set(appointments.map(app => app.horseId));
      
      // Obtener todos los clientes únicos atendidos por este profesional
      const clientsAttended = new Set(appointments.map(app => app.clientId));
      
      // Agrupar citas por mes para el año actual
      const appointmentsByMonth = [
        { name: 'Ene', citas: 0 },
        { name: 'Feb', citas: 0 },
        { name: 'Mar', citas: 0 },
        { name: 'Abr', citas: 0 },
        { name: 'May', citas: 0 },
        { name: 'Jun', citas: 0 },
        { name: 'Jul', citas: 0 },
        { name: 'Ago', citas: 0 },
        { name: 'Sep', citas: 0 },
        { name: 'Oct', citas: 0 },
        { name: 'Nov', citas: 0 },
        { name: 'Dic', citas: 0 }
      ];
      
      const currentYear = new Date().getFullYear();
      appointments.forEach(appointment => {
        const date = new Date(appointment.date);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          appointmentsByMonth[month].citas += 1;
        }
      });
      
      // Agrupar por tipo de servicio
      const serviceTypesCount = {};
      appointments.forEach(appointment => {
        if (!serviceTypesCount[appointment.serviceType]) {
          serviceTypesCount[appointment.serviceType] = 0;
        }
        serviceTypesCount[appointment.serviceType] += 1;
      });
      
      const appointmentsByType = Object.keys(serviceTypesCount).map(type => ({
        name: type,
        value: serviceTypesCount[type]
      }));
      
      // Obtener actividad por centro ecuestre
      const locationCounts = {};
      appointments.forEach(appointment => {
        const location = appointment.location || 'No especificado';
        if (!locationCounts[location]) {
          locationCounts[location] = 0;
        }
        locationCounts[location] += 1;
      });
      
      const professionalActivity = Object.keys(locationCounts).map(location => ({
        name: location,
        citas: locationCounts[location],
        rating: 4.5 // En un sistema real se calcularía por ubicación
      }));
      
      // Calcular ingresos por mes (asumiendo que cada cita tiene un precio)
      const revenueData = appointmentsByMonth.map(month => ({
        name: month.name,
        ingresos: month.citas * 85 // precio promedio por cita
      }));
      
      // Crecimiento de clientes por año
      const clientGrowth = [
        { name: `${currentYear-2}`, clientes: Math.floor(clientsAttended.size * 0.4) },
        { name: `${currentYear-1}`, clientes: Math.floor(clientsAttended.size * 0.7) },
        { name: `${currentYear}`, clientes: clientsAttended.size }
      ];
      
      // Totales
      const totalAppointments = appointments.length;
      const totalHorses = horsesAttended.size;
      const totalClients = clientsAttended.size;
      const totalRevenue = appointments.length * 85; // Ingreso total estimado
      
      res.json({
        appointmentsByMonth,
        appointmentsByType,
        professionalActivity,
        revenueData,
        clientGrowth,
        totalAppointments,
        totalHorses,
        totalClients,
        totalRevenue
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });
  
  // Ruta para obtener estadísticas generales (solo para administradores)
  app.get("/api/statistics/admin", isAuthenticated, async (req, res) => {
    if (!req.user || (req.user as any).userType !== 'admin') {
      return res.status(403).json({ message: "Acceso no autorizado" });
    }
    
    try {
      // Obtener todas las citas
      const appointments = await storage.getAllAppointments();
      
      // Obtener todos los profesionales
      const professionals = await storage.getAllProfessionals();
      
      // Obtener todos los caballos en el sistema
      const horses = await storage.getAllHorses();
      
      // Obtener todos los clientes
      const clients = await storage.getAllClients();
      
      // Agrupar citas por mes para el año actual
      const appointmentsByMonth = [
        { name: 'Ene', citas: 0 },
        { name: 'Feb', citas: 0 },
        { name: 'Mar', citas: 0 },
        { name: 'Abr', citas: 0 },
        { name: 'May', citas: 0 },
        { name: 'Jun', citas: 0 },
        { name: 'Jul', citas: 0 },
        { name: 'Ago', citas: 0 },
        { name: 'Sep', citas: 0 },
        { name: 'Oct', citas: 0 },
        { name: 'Nov', citas: 0 },
        { name: 'Dic', citas: 0 }
      ];
      
      const currentYear = new Date().getFullYear();
      appointments.forEach(appointment => {
        const date = new Date(appointment.date);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          appointmentsByMonth[month].citas += 1;
        }
      });
      
      // Agrupar por tipo de servicio
      const serviceTypesCount = {};
      appointments.forEach(appointment => {
        if (!serviceTypesCount[appointment.serviceType]) {
          serviceTypesCount[appointment.serviceType] = 0;
        }
        serviceTypesCount[appointment.serviceType] += 1;
      });
      
      const appointmentsByType = Object.keys(serviceTypesCount).map(type => ({
        name: type,
        value: serviceTypesCount[type]
      }));
      
      // Obtener actividad por profesional
      const professionalCounts = {};
      appointments.forEach(appointment => {
        if (!professionalCounts[appointment.professionalId]) {
          professionalCounts[appointment.professionalId] = 0;
        }
        professionalCounts[appointment.professionalId] += 1;
      });
      
      const professionalActivity = await Promise.all(
        Object.keys(professionalCounts).map(async (profId) => {
          const prof = await storage.getUser(Number(profId));
          return {
            name: prof?.username || `Profesional ${profId}`,
            citas: professionalCounts[profId],
            rating: 4.5 // En un sistema real se calcularía
          };
        })
      );
      
      // Calcular ingresos totales por mes
      const revenueData = appointmentsByMonth.map(month => ({
        name: month.name,
        ingresos: month.citas * 85 // precio promedio por cita
      }));
      
      // Crecimiento de clientes por año (simplificado para demo)
      const clientGrowth = [
        { name: `${currentYear-2}`, clientes: Math.floor(clients.length * 0.4) },
        { name: `${currentYear-1}`, clientes: Math.floor(clients.length * 0.7) },
        { name: `${currentYear}`, clientes: clients.length }
      ];
      
      // Totales
      const totalAppointments = appointments.length;
      const totalProfessionals = professionals.length;
      const totalHorses = horses.length;
      const totalClients = clients.length;
      const totalRevenue = appointments.length * 85; // Ingreso total estimado
      
      res.json({
        appointmentsByMonth,
        appointmentsByType,
        professionalActivity,
        revenueData,
        clientGrowth,
        totalAppointments,
        totalProfessionals,
        totalHorses,
        totalClients,
        totalRevenue
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas de administrador:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // Middleware de autenticación
  /************************************************
   * SISTEMA DE CITAS Y PAGOS
   ************************************************/
  
  // Solicitar una cita (cliente → profesional o profesional → cliente)
  app.post("/api/appointments/request", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const {
        horseIds,
        professionalId,
        clientId,
        serviceType,
        title,
        date,
        duration,
        location,
        price,
        isPeriodic,
        frequency,
        endDate,
        notes
      } = req.body;
      
      // Determinar quién crea la cita
      const createdBy = user.isProfessional ? 'professional' : 'client';
      
      // Validar que client o professional IDs son correctos según quién crea
      if (createdBy === 'client' && user.id !== clientId) {
        return res.status(400).json({ message: "No puedes crear citas para otro cliente" });
      }
      
      if (createdBy === 'professional' && user.id !== professionalId) {
        return res.status(400).json({ message: "No puedes crear citas como otro profesional" });
      }
      
      // Validar que hay una conexión entre cliente y profesional
      const connection = await storage.getConnectionByClientAndProfessional(
        clientId,
        professionalId
      );
      
      if (!connection || connection.status !== 'accepted') {
        return res.status(400).json({ 
          message: "No existe una conexión activa entre cliente y profesional" 
        });
      }
      
      // Validar que los caballos pertenecen al cliente
      if (horseIds && horseIds.length > 0) {
        for (const horseId of horseIds) {
          const horse = await storage.getHorse(horseId);
          if (!horse || horse.ownerId !== clientId) {
            return res.status(400).json({ 
              message: `El caballo con ID ${horseId} no pertenece al cliente` 
            });
          }
        }
      }
      
      // Calcular la comisión (5% del precio)
      const commission = price ? Math.round(price * 0.05) : 0;
      
      // Crear la cita con estado "requested"
      const appointmentData = {
        horseIds,
        clientId,
        professionalId,
        serviceType,
        title,
        date: new Date(date),
        duration,
        location,
        status: 'requested',
        price,
        paymentStatus: 'pending',
        isPeriodic: !!isPeriodic,
        frequency: frequency || null,
        endDate: endDate ? new Date(endDate) : null,
        notes,
        commission,
        createdBy
      };
      
      const appointment = await storage.createAppointment(appointmentData);
      
      // Enviar notificación al destinatario
      const requester = await storage.getUser(user.id);
      const recipient = await storage.getUser(
        createdBy === 'client' ? professionalId : clientId
      );
      
      if (recipient && recipient.email) {
        // Obtener los nombres de los caballos para la notificación
        const horseNames = [];
        for (const horseId of horseIds) {
          const horse = await storage.getHorse(horseId);
          if (horse) {
            horseNames.push(horse.name);
          }
        }
        
        await sendAppointmentRequest(
          recipient.email,
          recipient.fullName || recipient.username,
          requester ? (requester.fullName || requester.username) : 'Un usuario',
          new Date(date),
          serviceType,
          horseNames,
          price || 0,
          createdBy === 'client'
        );
      }
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error al solicitar cita:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Responder a una solicitud de cita (aceptar, rechazar o proponer alternativa)
  app.post("/api/appointments/:id/respond", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const user = req.user as User;
      const { action, alternativeDate, alternativeDuration, alternativePrice, alternativeNotes, price, duration } = req.body;
      
      // Validar acción
      if (!['accept', 'reject', 'propose_alternative'].includes(action)) {
        return res.status(400).json({ message: "Acción no válida" });
      }
      
      // Si es aceptar y el usuario es profesional, validar que se envía precio
      if (action === 'accept' && user.isProfessional && !price) {
        return res.status(400).json({ message: "Como profesional, debes establecer un precio para aceptar la cita" });
      }
      
      // Obtener la cita solicitada
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario tiene permisos para responder
      const isClient = user.id === appointment.clientId;
      const isProfessional = user.id === appointment.professionalId;
      
      if (!isClient && !isProfessional) {
        return res.status(403).json({ message: "No tienes permisos para esta acción" });
      }
      
      // Verificar que la cita está en estado "pending", "requested" o "alternative_proposed"
      if (appointment.status !== 'pending' && appointment.status !== 'requested' && appointment.status !== 'alternative_proposed') {
        return res.status(400).json({ 
          message: "Esta cita ya ha sido procesada o no está pendiente de respuesta" 
        });
      }
      
      // Verificar que quien responde no es quien creó la solicitud original
      // Excepción: permitir a profesionales responder a sus propias solicitudes 
      // cuando necesiten agregar precio y duración
      const responderType = isClient ? 'client' : 'professional';
      const needsPriceAndDuration = user.isProfessional && 
        (!appointment.price || !appointment.duration);
      
      if (responderType === appointment.createdBy && !needsPriceAndDuration) {
        return res.status(400).json({ 
          message: "No puedes responder a tu propia solicitud de cita" 
        });
      }
      
      // Responder según la acción
      if (action === 'accept') {
        // Preparar datos de actualización
        const updateData: Partial<Appointment> = {
          status: 'confirmed'
        };
        
        // Si es un profesional, permitir actualizar precio y duración
        // independientemente de quién creó la cita
        if (user.isProfessional) {
          // Registro detallado de los datos recibidos
          console.log("SERVIDOR - Datos recibidos del profesional:", {
            body: req.body,
            price: {
              value: req.body.price,
              type: typeof req.body.price
            },
            duration: {
              value: req.body.duration,
              type: typeof req.body.duration
            }
          });

          // SOLUCIÓN DEFINITIVA: Precio como INTEGER en céntimos de euro
          if (req.body.price !== undefined && req.body.price !== null) {
            let priceInEuros;
            
            // Paso 1: Obtener el precio en euros como número
            if (typeof req.body.price === 'string') {
              // Limpiar y convertir la cadena a número
              const cleanedPrice = req.body.price.replace(',', '.');
              priceInEuros = parseFloat(cleanedPrice);
            } else if (typeof req.body.price === 'number') {
              priceInEuros = req.body.price;
            } else {
              // Último intento de conversión
              priceInEuros = Number(req.body.price);
            }
            
            console.log("SERVIDOR - EUROS RECIBIDOS:", {
              valorOriginal: req.body.price,
              tipo: typeof req.body.price,
              euros: priceInEuros
            });
            
            // Paso 2: Validar que es un número válido y positivo
            if (!isNaN(priceInEuros) && priceInEuros > 0) {
              // Paso 3: Convertir a céntimos (entero)
              const priceInCents = Math.round(priceInEuros * 100);
              updateData.price = priceInCents;
              
              console.log("SERVIDOR - PRECIO FINAL EN CÉNTIMOS:", {
                euros: priceInEuros,
                centimos: priceInCents
              });
            } else {
              const errorMsg = "El precio debe ser un número válido mayor que cero";
              console.error("SERVIDOR - ERROR DE PRECIO: " + errorMsg);
              return res.status(400).json({ message: errorMsg });
            }
          } else {
            const errorMsg = "Se requiere un precio válido para confirmar la cita";
            console.error("SERVIDOR - ERROR DE PRECIO: " + errorMsg);
            return res.status(400).json({ message: errorMsg });
          }
          
          // Actualizar duración si viene proporcionada
          if (req.body.duration !== undefined && req.body.duration !== null) {
            let durationAsNumber;
            
            if (typeof req.body.duration === 'string') {
              durationAsNumber = parseInt(req.body.duration, 10);
            } else {
              durationAsNumber = Number(req.body.duration);
            }
            
            console.log("SERVIDOR - Duración procesada:", {
              original: req.body.duration,
              convertido: durationAsNumber,
              tipo: typeof durationAsNumber
            });
            
            // Solo actualizar si es un número válido (no NaN) y mayor a cero
            if (!isNaN(durationAsNumber) && durationAsNumber > 0) {
              updateData.duration = durationAsNumber;
              console.log("SERVIDOR - Duración final guardada:", updateData.duration);
            } else {
              const errorMsg = "La duración debe ser un número válido mayor que cero";
              console.error("SERVIDOR - " + errorMsg);
              return res.status(400).json({ message: errorMsg });
            }
          } else {
            const errorMsg = "Se requiere una duración válida para confirmar la cita";
            console.error("SERVIDOR - " + errorMsg);
            return res.status(400).json({ message: errorMsg });
          }
        }
        
        // Actualizar la cita con todos los datos aplicables
        const updatedAppointment = await storage.updateAppointment(appointmentId, updateData);
        
        // Notificar al creador de la solicitud
        const requester = await storage.getUser(
          appointment.createdBy === 'client' ? appointment.clientId : appointment.professionalId
        );
        const responder = await storage.getUser(user.id);
        
        if (requester && requester.email) {
          // Obtener los nombres de los caballos para la notificación
          const horseNames = [];
          for (const horseId of appointment.horseIds) {
            const horse = await storage.getHorse(horseId);
            if (horse) {
              horseNames.push(horse.name);
            }
          }
          
          await sendAppointmentResponse(
            requester.email,
            requester.fullName || requester.username,
            responder ? (responder.fullName || responder.username) : 'Un usuario',
            new Date(appointment.date),
            appointment.serviceType,
            horseNames,
            'accepted'
          );
        }
        
        res.json(updatedAppointment);
      } 
      else if (action === 'reject') {
        // Actualizar la cita a rechazada
        const updatedAppointment = await storage.updateAppointment(appointmentId, {
          status: 'rejected'
        });
        
        // Notificar al creador de la solicitud
        const requester = await storage.getUser(
          appointment.createdBy === 'client' ? appointment.clientId : appointment.professionalId
        );
        const responder = await storage.getUser(user.id);
        
        if (requester && requester.email) {
          // Obtener los nombres de los caballos para la notificación
          const horseNames = [];
          for (const horseId of appointment.horseIds) {
            const horse = await storage.getHorse(horseId);
            if (horse) {
              horseNames.push(horse.name);
            }
          }
          
          await sendAppointmentResponse(
            requester.email,
            requester.fullName || requester.username,
            responder ? (responder.fullName || responder.username) : 'Un usuario',
            new Date(appointment.date),
            appointment.serviceType,
            horseNames,
            'rejected'
          );
        }
        
        res.json(updatedAppointment);
      } 
      else if (action === 'propose_alternative') {
        // Validar que hay fecha alternativa
        if (!alternativeDate) {
          return res.status(400).json({ message: "Se requiere fecha alternativa" });
        }
        
        // Calcular la comisión (5% del precio)
        const altPrice = alternativePrice || appointment.price;
        const commission = altPrice ? Math.round(altPrice * 0.05) : 0;
        
        // Crear una nueva cita como alternativa
        const alternativeAppointment = await storage.createAppointment({
          horseIds: appointment.horseIds,
          clientId: appointment.clientId,
          professionalId: appointment.professionalId,
          serviceType: appointment.serviceType,
          title: appointment.title,
          date: new Date(alternativeDate),
          duration: alternativeDuration || appointment.duration,
          location: appointment.location,
          status: 'alternative_proposed',
          price: alternativePrice || appointment.price,
          paymentStatus: 'pending',
          isPeriodic: appointment.isPeriodic,
          frequency: appointment.frequency,
          endDate: appointment.endDate,
          notes: alternativeNotes || appointment.notes,
          commission,
          createdBy: responderType,
          hasAlternative: false,
          originalAppointmentId: appointmentId
        });
        
        // Actualizar la cita original para marcar que tiene alternativa
        await storage.updateAppointment(appointmentId, {
          hasAlternative: true
        });
        
        // Notificar al creador de la solicitud
        const requester = await storage.getUser(
          appointment.createdBy === 'client' ? appointment.clientId : appointment.professionalId
        );
        const responder = await storage.getUser(user.id);
        
        if (requester && requester.email) {
          // Obtener los nombres de los caballos para la notificación
          const horseNames = [];
          for (const horseId of appointment.horseIds) {
            const horse = await storage.getHorse(horseId);
            if (horse) {
              horseNames.push(horse.name);
            }
          }
          
          await sendAppointmentResponse(
            requester.email,
            requester.fullName || requester.username,
            responder ? (responder.fullName || responder.username) : 'Un usuario',
            new Date(appointment.date),
            appointment.serviceType,
            horseNames,
            'alternative_proposed',
            new Date(alternativeDate)
          );
        }
        
        res.json(alternativeAppointment);
      }
    } catch (error) {
      console.error("Error al responder a solicitud de cita:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Procesar pago de una cita
  // Confirmar pago después de procesamiento exitoso con Stripe
  app.post("/api/appointments/:id/confirm-payment", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const user = req.user as User;
      const { paymentMethod } = req.body;
      
      // Obtener la cita
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario es el cliente de la cita
      if (user.id !== appointment.clientId) {
        return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
      }
      
      // Verificar que la cita tiene un paymentId (la intención de pago fue creada)
      if (!appointment.paymentId) {
        return res.status(400).json({ message: "No hay un pago iniciado para esta cita" });
      }
      
      // Actualizar el estado de pago de la cita
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        paymentStatus: 'paid_complete',
        paymentMethod: paymentMethod || 'card'
      });
      
      // Obtener datos del cliente y profesional para generar factura
      const client = await storage.getUser(appointment.clientId);
      const professional = await storage.getUser(appointment.professionalId);
      
      // Generar y enviar factura
      let invoiceUrl = null;
      try {
        // Verificar si tiene precio definido
        if (appointment.price && client && professional) {
          // Generar factura
          invoiceUrl = await sendInvoice(
            client.email,
            client.fullName || client.username,
            professional.fullName || professional.username,
            appointment.price,
            appointment.serviceType,
            new Date(appointment.date)
          );
          
          // Actualizar la URL de la factura en la cita
          if (invoiceUrl) {
            await storage.updateAppointment(appointmentId, { invoiceUrl });
          }
        }
      } catch (invoiceError) {
        console.error("Error generando factura:", invoiceError);
        // No detenemos el proceso por un error de factura
      }
      
      res.json({
        success: true,
        message: "Pago confirmado correctamente",
        invoiceUrl
      });
    } catch (error) {
      console.error("Error confirmando pago:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Obtener intención de pago para Stripe Elements
  app.post("/api/appointments/:id/payment-intent", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const user = req.user as User;
      
      // Obtener la cita
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario es el cliente de la cita
      if (user.id !== appointment.clientId) {
        return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
      }
      
      // Permitir pagos para citas confirmadas o pendientes
      if (appointment.status !== 'confirmed' && appointment.status !== 'pending') {
        return res.status(400).json({ message: "La cita debe estar confirmada o pendiente para realizar el pago" });
      }
      
      // Verificar que la cita tiene un precio
      if (!appointment.price) {
        return res.status(400).json({ message: "La cita no tiene un precio definido" });
      }
      
      try {
        // Obtener datos del cliente
        const client = await storage.getUser(appointment.clientId);
        if (!client) {
          return res.status(404).json({ message: "Cliente no encontrado" });
        }

        // Crear cliente en Stripe si no existe
        let stripeCustomerId = client.stripeCustomerId || null;
        if (!stripeCustomerId) {
          const stripeCustomer = await stripe.customers.create({
            email: client.email,
            name: client.fullName || client.username,
            metadata: {
              userId: client.id.toString()
            }
          });
          
          stripeCustomerId = stripeCustomer.id;
          
          // Actualizar el ID del cliente en la base de datos
          await storage.updateUser(client.id, { 
            stripeCustomerId: stripeCustomerId
          });
        }

        // Calculamos la comisión después de convertir el precio a número
        
        // Convertir el precio a centavos para Stripe (multiplicar por 100)
        // Validar que el precio es un número y no es null/undefined
        if (!appointment.price) {
          return res.status(400).json({ message: "La cita no tiene un precio definido" });
        }
        
        // Asegurarse de que el precio sea un número
        let priceAsNumber: number;
        
        if (typeof appointment.price === 'string') {
          priceAsNumber = parseFloat(appointment.price);
        } else {
          priceAsNumber = Number(appointment.price);
        }
        
        if (isNaN(priceAsNumber)) {
          return res.status(400).json({ message: "El precio de la cita no es válido" });
        }
        
        // SOLUCIÓN DEFINITIVA: El precio ya está en céntimos, no necesitamos multiplicarlo de nuevo
        const priceInCents = Math.round(priceAsNumber);
        
        // Calcular comisión (5% del precio total) en céntimos
        const commission = Math.round(priceAsNumber * 0.05);
        console.log("Precio original (céntimos):", appointment.price, "Precio convertido (céntimos):", priceAsNumber, "Comisión (céntimos):", commission);
        
        // Crear PaymentIntent directamente
        const paymentIntent = await stripe.paymentIntents.create({
          amount: priceInCents,
          currency: 'eur',
          customer: stripeCustomerId,
          metadata: {
            appointmentId: appointment.id.toString(),
            serviceType: appointment.serviceType,
            appointmentDate: new Date(appointment.date).toISOString()
          },
          // Quitamos transfer_data por ahora para simplificar
        });
        
        // SOLUCIÓN DEFINITIVA: Enviar el precio en céntimos y euros para evitar confusiones
        res.json({
          clientSecret: paymentIntent.client_secret,
          amount: priceAsNumber, // Precio en céntimos
          amountEuros: priceAsNumber / 100 // Precio en euros para mostrar en la interfaz
        });
      } catch (paymentError: any) {
        console.error("Error creando intención de pago:", paymentError);
        res.status(400).json({ message: paymentError.message });
      }
    } catch (error) {
      console.error("Error en endpoint de intención de pago:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const user = req.user as User;
      const { paymentMethod, advancePayment } = req.body;
      
      // Validar el método de pago
      if (!['card', 'google_pay', 'apple_pay', 'samsung_pay'].includes(paymentMethod)) {
        return res.status(400).json({ message: "Método de pago no válido" });
      }
      
      // Obtener la cita
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario es el cliente de la cita
      if (user.id !== appointment.clientId) {
        return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
      }
      
      // Permitir pagos para citas confirmadas o pendientes
      if (appointment.status !== 'confirmed' && appointment.status !== 'pending') {
        return res.status(400).json({ message: "La cita debe estar confirmada o pendiente para realizar el pago" });
      }
      
      try {
        const result = await processPayment({
          appointmentId,
          paymentMethod,
          advancePayment: !!advancePayment
        });
        
        res.json(result);
      } catch (paymentError: any) {
        console.error("Error procesando pago:", paymentError);
        res.status(400).json({ message: paymentError.message });
      }
    } catch (error) {
      console.error("Error en endpoint de pago:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Cancelar una cita
  app.post("/api/appointments/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const user = req.user as User;
      const { reason } = req.body;
      
      // Obtener la cita
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario es participante de la cita
      if (user.id !== appointment.clientId && user.id !== appointment.professionalId) {
        return res.status(403).json({ message: "No tienes permisos para cancelar esta cita" });
      }
      
      // Verificar que la cita no está ya completada o cancelada
      if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        return res.status(400).json({ 
          message: "No se puede cancelar una cita que ya está completada o cancelada" 
        });
      }
      
      // Si la cita ya fue pagada, reembolsar el pago (en producción)
      // Aquí iría la lógica de reembolso con Stripe
      
      // Actualizar estado de la cita
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        status: 'cancelled',
        notes: appointment.notes 
          ? `${appointment.notes}\n\nCancelada: ${reason || 'Sin motivo especificado'}`
          : `Cancelada: ${reason || 'Sin motivo especificado'}`
      });
      
      // Notificar a los participantes
      const client = await storage.getUser(appointment.clientId);
      const professional = await storage.getUser(appointment.professionalId);
      
      // Envío de notificaciones (se implementaría con el servicio de email)
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error al cancelar cita:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Completar una cita
  app.post("/api/appointments/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const user = req.user as User;
      const { notes } = req.body;
      
      // Obtener la cita
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario es el profesional de la cita
      if (user.id !== appointment.professionalId) {
        return res.status(403).json({ 
          message: "Solo el profesional puede marcar una cita como completada" 
        });
      }
      
      // Verificar que la cita está confirmada
      if (appointment.status !== 'confirmed') {
        return res.status(400).json({ 
          message: "Solo se pueden completar citas confirmadas" 
        });
      }
      
      // Actualizar la cita
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        status: 'completed',
        notes: notes || appointment.notes
      });
      
      // Si la cita no ha sido pagada, actualizar estado para permitir pago
      if (appointment.paymentStatus === 'pending') {
        await storage.updateAppointment(appointmentId, {
          paymentStatus: 'unpaid'
        });
      }
      
      // Notificar al cliente
      const client = await storage.getUser(appointment.clientId);
      
      // Enviar notificación al cliente (se implementaría con el servicio de email)
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error al completar cita:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Confirmar el pago de una cita tras completar el proceso de pago con Stripe
  app.post("/api/appointments/:id/confirm-payment", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const user = req.user as User;
      const { paymentMethod } = req.body;
      
      // Obtener la cita
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario es el cliente de la cita
      if (user.id !== appointment.clientId) {
        return res.status(403).json({ 
          message: "Solo el cliente puede confirmar el pago de su cita" 
        });
      }
      
      // Verificar que la cita está en un estado válido para pagar
      if (appointment.status !== 'confirmed' && appointment.status !== 'completed') {
        return res.status(400).json({ 
          message: "La cita debe estar confirmada o completada para confirmar el pago" 
        });
      }
      
      // Actualizar el estado de pago de la cita
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        paymentStatus: 'paid_complete',
        paymentMethod: paymentMethod || 'card'
      });
      
      // Notificar al profesional por email (opcional)
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error al confirmar pago:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Enviar recordatorio de cita
  app.post("/api/appointments/:id/send-reminder", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const user = req.user as User;
      
      // Obtener la cita
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario es participante de la cita
      if (user.id !== appointment.clientId && user.id !== appointment.professionalId) {
        return res.status(403).json({ message: "No tienes permisos para esta acción" });
      }
      
      // Verificar que la cita está confirmada y no completada/cancelada
      if (appointment.status !== 'confirmed') {
        return res.status(400).json({ 
          message: "Solo se pueden enviar recordatorios para citas confirmadas" 
        });
      }
      
      // Enviar recordatorio al otro participante
      const recipientId = user.id === appointment.clientId 
        ? appointment.professionalId 
        : appointment.clientId;
      
      const recipient = await storage.getUser(recipientId);
      
      if (recipient && recipient.email) {
        await sendAppointmentReminder(
          recipient.email,
          recipient.fullName || recipient.username,
          new Date(appointment.date),
          appointment.location,
          appointment.serviceType
        );
        
        // Actualizar cita como recordatorio enviado
        await storage.updateAppointment(appointmentId, {
          reminderSent: true
        });
        
        res.json({ success: true, message: "Recordatorio enviado con éxito" });
      } else {
        res.status(400).json({ message: "No se pudo enviar el recordatorio, el destinatario no tiene email" });
      }
    } catch (error) {
      console.error("Error al enviar recordatorio:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Middleware de autenticación
  function isAuthenticated(req: Request, res: Response, next: any) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "No autorizado" });
  }

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash the password before saving
      const hashedPassword = await hashPassword(userData.password);
      const userWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };
      
      const user = await storage.createUser(userWithHashedPassword);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get all users (filtrado según el tipo de usuario que hace la petición)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as User;
      let users = [];
      
      // Si es administrador, devolver todos los usuarios
      if (currentUser.userType === 'admin') {
        const clients = await storage.getAllClients();
        const professionals = await storage.getAllProfessionals();
        users = [...clients, ...professionals];
      } 
      // Si es profesional, devolver solo sus clientes conectados
      else if (currentUser.isProfessional) {
        const connections = await storage.getConnectionsByProfessional(currentUser.id);
        const acceptedConnections = connections.filter(conn => conn.status === 'accepted');
        
        // Obtener los datos de los clientes conectados
        const clientPromises = acceptedConnections.map(conn => 
          storage.getUser(conn.clientId)
        );
        
        // Filtrar los undefined (usuarios que no existen)
        users = (await Promise.all(clientPromises)).filter(Boolean) as User[];
      } 
      // Si es cliente, devolver solo los profesionales conectados
      else {
        const connections = await storage.getConnectionsByClient(currentUser.id);
        const acceptedConnections = connections.filter(conn => conn.status === 'accepted');
        
        // Obtener los datos de los profesionales conectados
        const professionalPromises = acceptedConnections.map(conn => 
          storage.getUser(conn.professionalId)
        );
        
        // Filtrar los undefined
        users = (await Promise.all(professionalPromises)).filter(Boolean) as User[];
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // IMPORTANTE: Las rutas específicas deben ir ANTES que las rutas con parámetros como :id
  
  // Endpoint para obtener profesionales
  app.get("/api/users/professionals", async (req, res) => {
    try {
      const type = req.query.type as string;
      let professionals;
      
      if (type) {
        professionals = await storage.getProfessionalsByType(type);
      } else {
        professionals = await storage.getAllProfessionals();
      }
      
      res.json(professionals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Endpoint para obtener todos los clientes (usuarios que no son profesionales)
  app.get("/api/users/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error("Error obteniendo clientes:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para obtener usuario específico por ID (DEBE IR DESPUÉS de las rutas específicas)
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Endpoint para actualizar usuario por ID
  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      // Forzar el content-type a application/json para asegurar que se devuelva JSON
      res.setHeader('Content-Type', 'application/json');
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }
      
      // Verificar que el usuario existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Verificar permisos: solo el propio usuario o un administrador pueden actualizar
      const currentUser = req.user as User;
      if (currentUser.id !== userId && currentUser.userType !== 'admin') {
        return res.status(403).json({ message: "No tienes permiso para actualizar este perfil" });
      }
      
      // Actualizar el usuario
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(500).json({ message: "Error al actualizar el usuario" });
      }
      
      // Asegurarse de enviar una respuesta JSON válida usando send con JSON.stringify
      return res.status(200).send(JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Ruta para obtener los caballos de un usuario específico
  app.get("/api/users/:id/horses", isAuthenticated, async (req, res) => {
    try {
      // Asegurarse de que la respuesta será en formato JSON
      res.setHeader('Content-Type', 'application/json');
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Verificar que el usuario existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verificar permisos: debe ser el propio usuario o un profesional
      const currentUserId = (req.user as any).id;
      if (userId !== currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        
        // Si es un profesional, permitir acceso a los caballos del cliente
        // Los profesionales necesitan ver los caballos para crear citas
        if (currentUser?.isProfessional) {
          // No verificamos conexión para permitir crear citas con nuevos clientes
          console.log(`Profesional ${currentUserId} accediendo a caballos del cliente ${userId}`);
        } else {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Obtener los caballos
      const horses = await storage.getHorsesByOwner(userId);
      
      // Asegurarse de devolver una respuesta JSON válida
      return res.status(200).send(JSON.stringify(horses));
    } catch (error) {
      console.error("Error obteniendo caballos del usuario:", error);
      return res.status(500).json({ message: "Internal server error", error: String(error) });
    }
  });

  // Horse routes
  app.get("/api/horses", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let horses;
      if (user.isProfessional) {
        // Professionals see all horses for now (should be filtered by connections in real world)
        horses = await storage.getAllHorses();
      } else {
        // Clients only see their own horses
        horses = await storage.getHorsesByOwner(userId);
      }
      
      res.json(horses);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Appointments routes
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let appointments = [];
      
      if (user.userType === 'admin') {
        // Administrador ve todas las citas
        appointments = await storage.getAllAppointments();
      } else if (user.isProfessional) {
        try {
          // Profesional ve citas donde es profesional
          appointments = await storage.getAppointmentsByProfessional(userId);
        } catch (error) {
          console.error("Error al obtener citas:", error);
          return res.status(500).json({ message: "Error interno del servidor" });
        }
      } else {
        // Cliente ve citas donde es cliente
        appointments = await storage.getAppointmentsByClient(userId);
      }
      
      // Para cada cita, buscar información de caballos, cliente y profesional
      const appointmentsWithDetails = await Promise.all(appointments.map(async appointment => {
        try {
          // SOLUCIÓN DEFINITIVA: Tratamiento consistente del precio como INTEGER
          let price = null;
          if (appointment.price !== undefined && appointment.price !== null) {
            // Convertir a número entero directamente
            const priceAsNumber = Number(appointment.price);
              
            if (!isNaN(priceAsNumber)) {
              price = priceAsNumber;
              console.log(`PRECIO OK - Cita ${appointment.id}: ${price} céntimos (${price / 100}€)`);
            } else {
              console.error(`ERROR PRECIO - Cita ${appointment.id}: No se pudo convertir "${appointment.price}" a número`);
            }
          } else {
            console.log(`SIN PRECIO - Cita ${appointment.id}: El precio es undefined o null`);
          }
          
          // Obtener datos de caballos
          const horses = [];
          if (appointment.horseIds && Array.isArray(appointment.horseIds)) {
            for (const horseId of appointment.horseIds) {
              const horse = await storage.getHorse(horseId);
              if (horse) {
                horses.push(horse);
              }
            }
          } else if (appointment.horseId) {
            // Compatibilidad con el modelo antiguo
            const horse = await storage.getHorse(appointment.horseId);
            if (horse) {
              horses.push(horse);
            }
          }
          
          // Obtener datos de cliente y profesional
          const client = await storage.getUser(appointment.clientId);
          const professional = await storage.getUser(appointment.professionalId);
          
          return {
            ...appointment,
            price: price, // Asegurarnos de que el precio sea un número
            horses,
            client: client ? {
              id: client.id,
              username: client.username,
              fullName: client.fullName,
              email: client.email,
              phone: client.phone
            } : null,
            professional: professional ? {
              id: professional.id,
              username: professional.username,
              fullName: professional.fullName,
              email: professional.email,
              phone: professional.phone,
              userType: professional.userType
            } : null
          };
        } catch (err) {
          console.error(`Error al procesar cita ${appointment.id}:`, err);
          return appointment;
        }
      }));
      
      res.json(appointmentsWithDetails);
    } catch (error) {
      console.error("Error al obtener citas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Ruta para obtener una cita específica por su ID
  app.get("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: "ID de cita inválido" });
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario tenga acceso a esta cita
      if (user.id !== appointment.clientId && 
          user.id !== appointment.professionalId && 
          user.userType !== 'admin') {
        return res.status(403).json({ message: "No tienes permiso para ver esta cita" });
      }
      
      // Obtener información adicional
      let client = null;
      let professional = null;
      let horse = null;
      let horses = [];
      
      // Obtener información del cliente
      if (appointment.clientId) {
        client = await storage.getUser(appointment.clientId);
      }
      
      // Obtener información del profesional
      if (appointment.professionalId) {
        professional = await storage.getUser(appointment.professionalId);
      }
      
      // Obtener información del caballo principal
      if (appointment.horseId) {
        horse = await storage.getHorse(appointment.horseId);
      }
      
      // Obtener información de todos los caballos si hay horseIds
      if (appointment.horseIds && Array.isArray(appointment.horseIds)) {
        horses = await Promise.all(appointment.horseIds.map(async (id: number) => {
          try {
            return await storage.getHorse(id);
          } catch (err) {
            console.error(`Error al obtener caballo ${id}:`, err);
            return null;
          }
        }));
        horses = horses.filter(Boolean); // Eliminar posibles nulos
      }
      
      // Incluir información adicional en la respuesta
      const fullAppointment = {
        ...appointment,
        client: client ? {
          id: client.id,
          username: client.username,
          fullName: client.fullName,
          email: client.email,
          phone: client.phone,
          userType: client.userType
        } : null,
        horse: horse ? {
          id: horse.id,
          name: horse.name,
          breed: horse.breed,
          age: horse.age,
          ownerId: horse.ownerId
        } : null,
        horses: horses.map(h => h ? {
          id: h.id,
          name: h.name,
          breed: h.breed,
          age: h.age,
          ownerId: h.ownerId
        } : null),
        professional: professional ? {
          id: professional.id,
          username: professional.username,
          fullName: professional.fullName,
          email: professional.email,
          phone: professional.phone,
          userType: professional.userType
        } : null
      };
      
      res.json(fullAppointment);
    } catch (error) {
      console.error("Error al obtener detalles de cita:", error);
      res.status(500).json({ message: "Error al obtener detalles de la cita" });
    }
  });

  // Endpoint para procesar pagos de citas
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { appointmentId, amount } = req.body;
      const user = req.user as User;
      
      if (!appointmentId || !amount) {
        return res.status(400).json({ message: "Faltan datos requeridos para el pago" });
      }
      
      // Validar que el appointmentId sea un número válido
      const appointmentIdNum = parseInt(appointmentId);
      if (isNaN(appointmentIdNum)) {
        return res.status(400).json({ message: "ID de cita inválido" });
      }
      
      // Validar que la cantidad sea un número válido y positivo
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: "Cantidad de pago inválida" });
      }
      
      // Verificar que la cita exista
      const appointment = await storage.getAppointment(appointmentIdNum);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario tenga permiso para pagar esta cita
      if (user.id !== appointment.clientId && !user.isAdmin) {
        return res.status(403).json({ message: "No tienes permiso para pagar esta cita" });
      }
      
      // Verificar que la cita no esté ya pagada
      if (appointment.paymentStatus === 'paid') {
        return res.status(400).json({ message: "Esta cita ya ha sido pagada" });
      }
      
      // Verificar que la cita tenga precio (debería ser igual a amount, pero aceptamos small de variación)
      if (!appointment.price) {
        return res.status(400).json({ message: "Esta cita no tiene un precio definido" });
      }
      
      // Crear la intención de pago
      const { clientSecret, paymentIntentId } = await createPaymentIntent(
        appointment.price, // Usar el precio de la cita en céntimos
        appointmentIdNum,
        user
      );
      
      // Actualizar la cita con el ID de la intención de pago
      await storage.updateAppointment(appointmentIdNum, {
        paymentId: paymentIntentId
      });
      
      res.json({ clientSecret });
    } catch (error) {
      console.error("Error al crear intención de pago:", error);
      res.status(500).json({ message: "Error al crear intención de pago" });
    }
  });
  
  // Endpoint para actualizar el estado de pago de una cita
  app.post("/api/appointments/:id/pay", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { paymentIntentId } = req.body;
      const user = req.user as User;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Falta ID de intención de pago" });
      }
      
      // Verificar que la cita exista
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      
      // Verificar que el usuario tenga permiso para actualizar esta cita
      if (user.id !== appointment.clientId && !user.isAdmin) {
        return res.status(403).json({ message: "No tienes permiso para actualizar esta cita" });
      }
      
      // Actualizar el estado de pago
      await updateAppointmentPaymentStatus(appointmentId, paymentIntentId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error al actualizar estado de pago:", error);
      res.status(500).json({ message: "Error al actualizar estado de pago" });
    }
  });
  
  app.post("/api/horses", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const horseData = insertHorseSchema.parse({ ...req.body, ownerId: userId });
      const horse = await storage.createHorse(horseData);
      res.status(201).json(horse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/horses/:id", isAuthenticated, async (req, res) => {
    try {
      const horseId = parseInt(req.params.id);
      const horse = await storage.getHorse(horseId);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      const userId = (req.user as any).id;
      // Check if user is the owner or a connected professional
      if (horse.ownerId !== userId) {
        // Check if professional is connected to the owner
        const connection = await storage.getConnectionByClientAndProfessional(horse.ownerId, userId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(horse);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/horses/:id", isAuthenticated, async (req, res) => {
    try {
      const horseId = parseInt(req.params.id);
      const horse = await storage.getHorse(horseId);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      const userId = (req.user as any).id;
      if (horse.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedHorse = await storage.updateHorse(horseId, req.body);
      res.json(updatedHorse);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/horses/:id", isAuthenticated, async (req, res) => {
    try {
      const horseId = parseInt(req.params.id);
      const horse = await storage.getHorse(horseId);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      const userId = (req.user as any).id;
      if (horse.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteHorse(horseId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Connection routes
  app.get("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let connections;
      if (user.isProfessional) {
        connections = await storage.getConnectionsByProfessional(userId);
      } else {
        connections = await storage.getConnectionsByClient(userId);
      }
      
      // Enhance connections with user data
      const enhancedConnections = await Promise.all(
        connections.map(async (connection) => {
          const otherUserId = user.isProfessional ? connection.clientId : connection.professionalId;
          const otherUser = await storage.getUser(otherUserId);
          return {
            ...connection,
            otherUser
          };
        })
      );
      
      res.json(enhancedConnections);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isProfessional) {
        return res.status(400).json({ message: "Professionals cannot send connection requests" });
      }
      
      const { professionalId } = req.body;
      const professional = await storage.getUser(professionalId);
      
      if (!professional || !professional.isProfessional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      
      // Check if connection already exists
      const existingConnection = await storage.getConnectionByClientAndProfessional(userId, professionalId);
      if (existingConnection) {
        return res.status(400).json({ message: "Connection already exists", status: existingConnection.status });
      }
      
      const connectionData = insertConnectionSchema.parse({
        clientId: userId,
        professionalId,
        status: "pending"
      });
      
      const connection = await storage.createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/connections/:id", isAuthenticated, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      const userId = (req.user as any).id;
      if (connection.professionalId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (connection.status !== "pending") {
        return res.status(400).json({ message: "Connection is not pending" });
      }
      
      const { status } = req.body;
      if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedConnection = await storage.updateConnection(connectionId, {
        status,
        responseDate: new Date()
      });
      
      res.json(updatedConnection);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Eliminar conexión (DELETE)
  app.delete("/api/connections/:id", isAuthenticated, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      const userId = (req.user as any).id;
      // Solo el cliente o el profesional pueden eliminar la conexión
      if (connection.clientId !== userId && connection.professionalId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteConnection(connectionId);
      if (success) {
        res.json({ message: "Connection deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete connection" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get horses by owner (for client details page)
  app.get("/api/horses/owner/:ownerId", isAuthenticated, async (req, res) => {
    try {
      const ownerId = parseInt(req.params.ownerId);
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only professionals can view other users' horses, and only if connected
      if (!user.isProfessional || userId === ownerId) {
        if (userId !== ownerId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        // Check if professional is connected to the client
        const connection = await storage.getConnectionByClientAndProfessional(ownerId, userId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const horses = await storage.getHorsesByOwner(ownerId);
      res.json(horses);
    } catch (error) {
      console.error("Error getting horses by owner:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get appointments by client (for client details page)
  app.get("/api/appointments/client/:clientId", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only professionals can view other users' appointments, and only if connected
      if (!user.isProfessional || userId === clientId) {
        if (userId !== clientId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        // Check if professional is connected to the client
        const connection = await storage.getConnectionByClientAndProfessional(clientId, userId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const appointments = await storage.getAppointmentsByClient(clientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error getting appointments by client:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/horses/:horseId/appointments", isAuthenticated, async (req, res) => {
    try {
      const horseId = parseInt(req.params.horseId);
      const horse = await storage.getHorse(horseId);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      const userId = (req.user as any).id;
      // Check if user is the owner or a connected professional
      if (horse.ownerId !== userId) {
        // Check if professional is connected to the owner
        const connection = await storage.getConnectionByClientAndProfessional(horse.ownerId, userId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      try {
        const appointments = await storage.getAppointmentsByHorse(horseId);
        
        // Enhance appointments with related data
        const enhancedAppointments = await Promise.all(
          appointments.map(async (appointment) => {
            try {
              const professional = await storage.getUser(appointment.professionalId);
              const client = await storage.getUser(appointment.clientId);
              return {
                ...appointment,
                professional,
                client
              };
            } catch (err) {
              console.error(`Error al procesar cita para caballo ${horseId}:`, err);
              return appointment;
            }
          })
        );
        
        res.json(enhancedAppointments);
      } catch (error) {
        console.error(`Error al obtener citas para caballo ${horseId}:`, error);
        res.status(500).json({ message: "Error al obtener citas para este caballo" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      // Debug: Mostrar los datos recibidos
      console.log("Datos de la solicitud de cita:", JSON.stringify(req.body, null, 2));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Los profesionales también pueden crear citas
      // Solo validamos diferentes parámetros según el tipo de usuario
      
      const { horseIds, professionalId } = req.body;
      
      // Verificar que horseIds es un array
      if (!Array.isArray(horseIds) || horseIds.length === 0) {
        return res.status(400).json({ message: "Se requiere al menos un caballo para la cita" });
      }
      
      // Verificar permisos según el tipo de usuario
      const { clientId } = req.body;
      
      // Si es profesional, verifica que los caballos pertenecen al cliente seleccionado
      // Si es cliente, verifica que los caballos le pertenecen
      for (const horseId of horseIds) {
        const horse = await storage.getHorse(horseId);
        
        // Verificamos si es un profesional y está creando una cita para un cliente
        if (user.isProfessional && clientId) {
          if (!horse || horse.ownerId !== clientId) {
            return res.status(403).json({ message: `El caballo con ID ${horseId} no pertenece al cliente seleccionado` });
          }
        } else {
          // Es un cliente normal, verificamos que los caballos sean suyos
          if (!horse || horse.ownerId !== userId) {
            return res.status(403).json({ message: `Acceso denegado al caballo con ID ${horseId}` });
          }
        }
      }
      
      // Si es un cliente, verificar que el profesional existe
      if (!user.isProfessional) {
        // Verificar que el profesional existe
        const professional = await storage.getUser(professionalId);
        if (!professional || !professional.isProfessional) {
          return res.status(404).json({ message: "Profesional no encontrado" });
        }
        
        // Verificar que existe una conexión aceptada entre cliente y profesional
        const connection = await storage.getConnectionByClientAndProfessional(userId, professionalId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ message: "No tienes una conexión aceptada con este profesional" });
        }
      }
      
      // Si es un profesional, verificar que el cliente existe
      if (user.isProfessional) {
        const clientIdToCheck = parseInt(req.body.clientId);
        const client = await storage.getUser(clientIdToCheck);
        if (!client || client.isProfessional) {
          return res.status(404).json({ message: "Cliente no encontrado" });
        }
        
        // No verificamos conexión para permitir que los profesionales creen citas con nuevos clientes
        // Si se desea, se podría implementar aquí una verificación opcional
      }
      
      // Asegurarnos que el horseId sea un número
      let horseId = null;
      if (req.body.horseId) {
        horseId = parseInt(req.body.horseId);
      } else if (horseIds && horseIds.length > 0) {
        horseId = parseInt(horseIds[0]);
      }
      
      if (!horseId) {
        return res.status(400).json({ message: "Se requiere especificar un caballo (horseId o horseIds)" });
      }
      
      // Construir objeto con todos los campos requeridos
      const appointmentData = {
        title: req.body.title,
        serviceType: req.body.serviceType,
        horseId: horseId, // Aseguramos que sea un número
        horseIds: horseIds, // Array para múltiples caballos
        
        // Si es profesional, el cliente es el que está en el campo clientId
        // Si es cliente, el cliente es el propio usuario
        clientId: user.isProfessional ? parseInt(req.body.clientId) : userId,
        
        // Si es profesional, el profesional es el propio usuario
        // Si es cliente, el profesional es el que está en el campo professionalId
        professionalId: user.isProfessional ? userId : parseInt(req.body.professionalId),
        date: new Date(req.body.date),
        duration: parseInt(req.body.duration) || 60,
        location: req.body.location || "",
        status: "pending",
        // SOLUCIÓN DEFINITIVA: Convertir a céntimos cuando se crea una cita
        price: req.body.price !== undefined && req.body.price !== null 
          ? Math.round(parseFloat(req.body.price) * 100) // Convertir a céntimos
          : null,
        paymentStatus: "pending",
        paymentMethod: req.body.paymentMethod || null,
        paymentId: req.body.paymentId || null,
        isPeriodic: req.body.isPeriodic === true,
        frequency: req.body.frequency || null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        notes: req.body.notes || "",
        reminderSent: false,
        reportSent: false,
        commission: parseInt(req.body.commission) || Math.round((req.body.price || 0) * 0.05),
        createdBy: user.isProfessional ? "professional" : "client",
        hasAlternative: false,
        originalAppointmentId: req.body.originalAppointmentId || null,
        invoiceUrl: req.body.invoiceUrl || null
      };
      
      // Omitimos totalmente la validación de Zod
      console.log("Datos de la solicitud de cita final:", JSON.stringify(appointmentData, null, 2));
      
      try {
        const appointment = await storage.createAppointment(appointmentData);
        
        // Enviar email de notificación
        try {
          // Si es profesional, enviamos email al cliente
          // Si es cliente, enviamos email al profesional
          
          // Obtenemos los datos del cliente
          const clientId = appointmentData.clientId;
          const client = await storage.getUser(clientId);
          
          // Obtenemos los datos del profesional
          const professionalId = appointmentData.professionalId;
          const professional = await storage.getUser(professionalId);
          
          const horses = await Promise.all(horseIds.map(id => storage.getHorse(id)));
          const horseNames = horses.map(horse => horse ? horse.name : "Caballo sin nombre");
          
          if (client && professional) {
            if (user.isProfessional) {
              // Profesional creó la cita, enviar email al cliente
              await sendAppointmentRequest(
                client.email,
                client.fullName || client.username,
                professional.fullName || professional.username,
                horseNames,
                new Date(appointmentData.date),
                appointmentData.serviceType
              );
            } else {
              // Cliente creó la cita, enviar email al profesional
              await sendAppointmentRequest(
                professional.email,
                professional.fullName || professional.username,
                client.fullName || client.username,
                horseNames,
                new Date(appointmentData.date),
                appointmentData.serviceType
              );
            }
          }
        } catch (emailError) {
          console.error("Error al enviar email de solicitud de cita:", emailError);
          // No devolvemos error aunque falle el email, la cita ya está creada
        }
        
        res.status(201).json(appointment);
      } catch (dbError) {
        console.error("Error al crear cita en la base de datos:", dbError);
        res.status(500).json({ message: "Error al crear la cita" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Añadir logger para debug
      console.log("DEBUG - Appointment update request:", {
        appointmentId,
        userId,
        userIsProfessional: user.isProfessional,
        appointmentCreatedBy: appointment.createdBy,
        requestedStatus: req.body.status,
        currentStatus: appointment.status
      });
      
      // Check permissions
      if (user.isProfessional) {
        if (appointment.professionalId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Si el profesional está cambiando el estado a confirmado o rechazado, enviar email
        const isStatusChange = req.body.status && req.body.status !== appointment.status;
        const isConfirmingOrRejecting = req.body.status === "confirmed" || req.body.status === "rejected";
        
        // Professionals can only update status and certain fields
        const allowedKeys = ["status", "notes", "price", "alternativeDate"];
        if (Object.keys(req.body).some(key => !allowedKeys.includes(key))) {
          return res.status(403).json({ message: "Sólo puedes actualizar estado, notas, precio o fecha alternativa" });
        }
        
        // Si la cita fue creada por el profesional, no puede confirmarla
        // (Esta verificación ya no es necesaria ya que permitimos que cualquiera confirme)
        /*
        if (appointment.createdBy === "professional" && req.body.status === "confirmed") {
          return res.status(400).json({ 
            message: "No puedes confirmar una cita que tú mismo solicitaste. Debe confirmarla el cliente." 
          });
        }
        */
      } else {
        if (appointment.clientId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Clients can't update confirmed appointments (except to cancel)
        if (appointment.status === "confirmed" && req.body.status !== "cancelled") {
          return res.status(403).json({ message: "No puedes modificar citas confirmadas, solo cancelarlas" });
        }
        
        // El cliente puede confirmar citas creadas por profesionales, y no puede confirmar sus propias citas
        // (Esta verificación ya no es necesaria ya que permitimos que cualquiera confirme)
        /*
        if (appointment.createdBy === "client" && req.body.status === "confirmed") {
          return res.status(400).json({ 
            message: "No puedes confirmar una cita que tú mismo solicitaste. Debe confirmarla el profesional." 
          });
        }
        */
        
        // Permitir que el cliente confirme citas creadas por profesionales
        if (appointment.createdBy === "professional" && req.body.status === "confirmed") {
          // Cliente confirmando una cita creada por un profesional - esto está permitido
          console.log("Cliente confirmando cita creada por profesional - permitido");
        }
      }
      
      try {
        const updatedAppointment = await storage.updateAppointment(appointmentId, req.body);
        
        // Enviar email de notificación si es necesario
        if (req.body.status && req.body.status !== appointment.status) {
          try {
            const professional = await storage.getUser(appointment.professionalId);
            const client = await storage.getUser(appointment.clientId);
            const horses = await Promise.all(
              (appointment.horseIds || []).map(horseId => storage.getHorse(horseId))
            );
            const horseNames = horses.filter(Boolean).map(horse => horse ? horse.name : "Caballo sin nombre");
            
            if (client && professional) {
              // Si el profesional confirma o rechaza
              if (user.isProfessional && (req.body.status === "confirmed" || req.body.status === "rejected")) {
                await sendAppointmentResponse(
                  client.email,
                  client.fullName || client.username,
                  professional.fullName || professional.username,
                  horseNames,
                  new Date(appointment.date),
                  appointment.serviceType,
                  req.body.status === "confirmed",
                  req.body.alternativeDate ? new Date(req.body.alternativeDate) : undefined
                );
              }
              // Si el cliente confirma una cita creada por un profesional
              else if (!user.isProfessional && req.body.status === "confirmed" && appointment.createdBy === "professional") {
                // Enviar email al profesional informando de la confirmación
                await sendEmail({
                  to: professional.email,
                  from: process.env.EMAIL_FROM || "equigest@example.com",
                  subject: "Cita confirmada",
                  text: `El cliente ${client.fullName || client.username} ha confirmado la cita para ${horseNames.join(", ")} programada para el ${new Date(appointment.date).toLocaleDateString()}.`,
                  html: `
                    <p>Estimado/a ${professional.fullName || professional.username},</p>
                    <p>El cliente ${client.fullName || client.username} ha confirmado la cita para ${horseNames.join(", ")} programada para el ${new Date(appointment.date).toLocaleDateString()}.</p>
                    <p>Servicio: ${appointment.serviceType}</p>
                    <p>Saludos,<br>Equipo de EquiGest</p>
                  `
                });
              }
              // Si el cliente cancela
              else if (!user.isProfessional && req.body.status === "cancelled") {
                // Enviar email al profesional informando de la cancelación
                await sendEmail({
                  to: professional.email,
                  from: process.env.EMAIL_FROM || "equigest@example.com",
                  subject: "Cita cancelada",
                  text: `El cliente ${client.fullName || client.username} ha cancelado la cita para ${horseNames.join(", ")} programada para el ${new Date(appointment.date).toLocaleDateString()}.`,
                  html: `
                    <p>Estimado/a ${professional.fullName || professional.username},</p>
                    <p>El cliente ${client.fullName || client.username} ha cancelado la cita para ${horseNames.join(", ")} programada para el ${new Date(appointment.date).toLocaleDateString()}.</p>
                    <p>Servicio: ${appointment.serviceType}</p>
                    <p>Saludos,<br>Equipo de EquiGest</p>
                  `
                });
              }
            }
          } catch (emailError) {
            console.error("Error al enviar email de actualización de cita:", emailError);
            // No devolvemos error aunque falle el email, la cita ya está actualizada
          }
        }
        
        res.json(updatedAppointment);
      } catch (dbError) {
        console.error("Error al actualizar cita en la base de datos:", dbError);
        res.status(500).json({ message: "Error al actualizar la cita" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      const userId = (req.user as any).id;
      // Only the client can delete appointments
      if (appointment.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Can't delete confirmed appointments, must cancel them
      if (appointment.status === "confirmed") {
        return res.status(400).json({ message: "Cannot delete confirmed appointments, please cancel instead" });
      }
      
      await storage.deleteAppointment(appointmentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Message routes
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messages = await storage.getMessagesForUser(userId);
      
      // Group messages by the other user
      const messagesByUser = messages.reduce((acc, message) => {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        if (!acc[otherUserId]) {
          acc[otherUserId] = [];
        }
        acc[otherUserId].push(message);
        return acc;
      }, {} as Record<number, any[]>);
      
      // Get the latest message for each user
      const messagesLatestList = await Promise.all(
        Object.entries(messagesByUser).map(async ([otherUserId, userMessages]) => {
          const otherUser = await storage.getUser(parseInt(otherUserId));
          const latestMessage = userMessages.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          return {
            otherUser,
            latestMessage,
            unreadCount: userMessages.filter(m => m.receiverId === userId && !m.isRead).length
          };
        })
      );
      
      // Añadir profesionales conectados aunque no tengan mensajes
      // obtener todos los profesionales conectados
      const connections = await storage.getConnectionsByClient(userId);
      const connectedProfessionalIds = connections
        .filter(conn => conn.status === "accepted")
        .map(conn => conn.professionalId);

      // Añadir profesionales sin mensajes a la lista - con typechecking seguro
      const currentMessageUserIds: number[] = [];
      
      // Rellenar la lista con IDs de usuarios ya en las conversaciones existentes
      for (const msgPreview of messagesLatestList) {
        if (msgPreview.otherUser && msgPreview.otherUser.id) {
          currentMessageUserIds.push(msgPreview.otherUser.id);
        }
      }
      const missingProfessionals = await Promise.all(
        connectedProfessionalIds
          .filter(profId => !currentMessageUserIds.includes(profId))
          .map(async (profId) => {
            const professional = await storage.getUser(profId);
            if (professional) {
              // Crear un mensaje "placeholder" para mostrar en la lista
              return {
                otherUser: professional,
                latestMessage: {
                  id: 0,
                  senderId: profId,
                  receiverId: userId,
                  content: "Inicia una conversación...",
                  timestamp: new Date().toISOString(),
                  isRead: true
                },
                unreadCount: 0
              };
            }
            return null;
          })
      );

      // Combinar ambas listas y filtrar nulls
      const finalList = [...messagesLatestList, ...missingProfessionals.filter(item => item !== null)];
      
      res.json(finalList);
    } catch (error) {
      console.error("Error en /api/messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const otherUserId = parseInt(req.params.userId);
      
      // Check if the other user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if users are connected
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let connection;
      if (user.isProfessional && !otherUser.isProfessional) {
        connection = await storage.getConnectionByClientAndProfessional(otherUserId, userId);
      } else if (!user.isProfessional && otherUser.isProfessional) {
        connection = await storage.getConnectionByClientAndProfessional(userId, otherUserId);
      }
      
      if (!connection || connection.status !== "accepted") {
        return res.status(403).json({ message: "No connection between users" });
      }
      
      const messages = await storage.getMessagesBetweenUsers(userId, otherUserId);
      
      // Mark received messages as read
      await Promise.all(
        messages
          .filter(message => message.receiverId === userId && !message.isRead)
          .map(message => storage.markMessageAsRead(message.id))
      );
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { receiverId, content } = req.body;
      
      // Check if receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      // Check if users are connected
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let connection;
      if (user.isProfessional && !receiver.isProfessional) {
        connection = await storage.getConnectionByClientAndProfessional(receiverId, userId);
      } else if (!user.isProfessional && receiver.isProfessional) {
        connection = await storage.getConnectionByClientAndProfessional(userId, receiverId);
      }
      
      if (!connection || connection.status !== "accepted") {
        return res.status(403).json({ message: "No connection between users" });
      }
      
      const messageData = insertMessageSchema.parse({
        senderId: userId,
        receiverId,
        content
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Medical record routes
  app.get("/api/horses/:horseId/medical-records", isAuthenticated, async (req, res) => {
    try {
      const horseId = parseInt(req.params.horseId);
      const horse = await storage.getHorse(horseId);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is the owner or a connected professional
      if (horse.ownerId !== userId) {
        // Check if professional is connected to the owner
        const connection = await storage.getConnectionByClientAndProfessional(horse.ownerId, userId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const records = await storage.getMedicalRecordsByHorse(horseId);
      
      // Enhance records with professional data
      const enhancedRecords = await Promise.all(
        records.map(async (record) => {
          const professional = await storage.getUser(record.professionalId);
          return {
            ...record,
            professional
          };
        })
      );
      
      res.json(enhancedRecords);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/horses/:horseId/medical-records", isAuthenticated, async (req, res) => {
    try {
      const horseId = parseInt(req.params.horseId);
      const horse = await storage.getHorse(horseId);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only professionals can add medical records
      if (!user.isProfessional) {
        return res.status(403).json({ message: "Only professionals can add medical records" });
      }
      
      // Check if professional is connected to the owner
      const connection = await storage.getConnectionByClientAndProfessional(horse.ownerId, userId);
      if (!connection || connection.status !== "accepted") {
        return res.status(403).json({ message: "No connection with horse owner" });
      }
      
      const recordData = insertMedicalRecordSchema.parse({
        ...req.body,
        horseId,
        professionalId: userId
      });
      
      const record = await storage.createMedicalRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Service record routes
  app.get("/api/horses/:horseId/service-records", isAuthenticated, async (req, res) => {
    try {
      const horseId = parseInt(req.params.horseId);
      const horse = await storage.getHorse(horseId);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is the owner or a connected professional
      if (horse.ownerId !== userId) {
        // Check if professional is connected to the owner
        const connection = await storage.getConnectionByClientAndProfessional(horse.ownerId, userId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const records = await storage.getServiceRecordsByHorse(horseId);
      
      // Enhance records with professional data
      const enhancedRecords = await Promise.all(
        records.map(async (record) => {
          const professional = await storage.getUser(record.professionalId);
          return {
            ...record,
            professional
          };
        })
      );
      
      res.json(enhancedRecords);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/horses/:horseId/service-records", isAuthenticated, async (req, res) => {
    try {
      const horseId = parseInt(req.params.horseId);
      const horse = await storage.getHorse(horseId);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only professionals can add service records
      if (!user.isProfessional) {
        return res.status(403).json({ message: "Only professionals can add service records" });
      }
      
      // Check if professional is connected to the owner
      const connection = await storage.getConnectionByClientAndProfessional(horse.ownerId, userId);
      if (!connection || connection.status !== "accepted") {
        return res.status(403).json({ message: "No connection with horse owner" });
      }
      
      const recordData = insertServiceRecordSchema.parse({
        ...req.body,
        horseId,
        professionalId: userId
      });
      
      const record = await storage.createServiceRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Obtener todos los registros médicos de todos los caballos del cliente
  app.get("/api/medical-records", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isProfessional) {
        return res.status(403).json({ message: "Only clients can access this endpoint" });
      }
      
      // Get all horses owned by the client
      const horses = await storage.getHorsesByOwner(userId);
      if (!horses || horses.length === 0) {
        return res.json([]);
      }
      
      // Get all medical records for each horse
      let allMedicalRecords = [];
      for (const horse of horses) {
        const records = await storage.getMedicalRecordsByHorse(horse.id);
        // Add horse information to each record
        const recordsWithHorse = records.map(record => ({
          ...record,
          horse: {
            id: horse.id,
            name: horse.name,
            breed: horse.breed
          }
        }));
        allMedicalRecords = [...allMedicalRecords, ...recordsWithHorse];
      }
      
      res.json(allMedicalRecords);
    } catch (error) {
      console.error('Error getting all medical records:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obtener todos los registros de servicio de todos los caballos del cliente
  app.get("/api/service-records", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isProfessional) {
        return res.status(403).json({ message: "Only clients can access this endpoint" });
      }
      
      // Get all horses owned by the client
      const horses = await storage.getHorsesByOwner(userId);
      if (!horses || horses.length === 0) {
        return res.json([]);
      }
      
      // Get all service records for each horse
      let allServiceRecords = [];
      for (const horse of horses) {
        const records = await storage.getServiceRecordsByHorse(horse.id);
        // Add horse information to each record
        const recordsWithHorse = records.map(record => ({
          ...record,
          horse: {
            id: horse.id,
            name: horse.name,
            breed: horse.breed
          }
        }));
        allServiceRecords = [...allServiceRecords, ...recordsWithHorse];
      }
      
      res.json(allServiceRecords);
    } catch (error) {
      console.error('Error getting all service records:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Review routes
  app.get("/api/professionals/:professionalId/reviews", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.professionalId);
      const professional = await storage.getUser(professionalId);
      
      if (!professional || !professional.isProfessional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      
      const reviews = await storage.getReviewsByProfessional(professionalId);
      
      // Enhance reviews with client data (without sensitive info)
      const enhancedReviews = await Promise.all(
        reviews.map(async (review) => {
          const client = await storage.getUser(review.clientId);
          return {
            ...review,
            client: {
              id: client?.id,
              fullName: client?.fullName,
              profileImage: client?.profileImage
            }
          };
        })
      );
      
      res.json(enhancedReviews);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/professionals/:professionalId/reviews", isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.professionalId);
      const professional = await storage.getUser(professionalId);
      
      if (!professional || !professional.isProfessional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user || user.isProfessional) {
        return res.status(403).json({ message: "Only clients can leave reviews" });
      }
      
      // Check if there was a completed appointment
      const appointments = await storage.getAppointmentsByClient(userId);
      const hasCompletedAppointment = appointments.some(
        appointment => 
          appointment.professionalId === professionalId && 
          appointment.status === "completed"
      );
      
      if (!hasCompletedAppointment) {
        return res.status(403).json({ message: "Cannot review a professional without a completed appointment" });
      }
      
      // Check if already reviewed
      const reviews = await storage.getReviewsByProfessional(professionalId);
      const alreadyReviewed = reviews.some(review => review.clientId === userId);
      
      if (alreadyReviewed) {
        return res.status(400).json({ message: "Already reviewed this professional" });
      }
      
      const appointmentId = req.body.appointmentId ? parseInt(req.body.appointmentId) : null;
      if (appointmentId) {
        const appointment = await storage.getAppointment(appointmentId);
        if (!appointment || 
            appointment.clientId !== userId || 
            appointment.professionalId !== professionalId ||
            appointment.status !== "completed") {
          return res.status(403).json({ message: "Invalid appointment" });
        }
      }
      
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        clientId: userId,
        professionalId,
        appointmentId
      });
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get reviews by client
  app.get("/api/clients/:clientId/reviews", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const userId = (req.user as any).id;

      // Only allow users to see their own reviews or admins
      if (userId !== clientId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const reviews = await storage.getReviewsByClient(clientId);
      
      // Enhance reviews with professional data
      const enhancedReviews = await Promise.all(
        reviews.map(async (review) => {
          const professional = await storage.getUser(review.professionalId);
          return {
            ...review,
            professional: professional ? {
              id: professional.id,
              fullName: professional.fullName,
              userType: professional.userType,
              profileImage: professional.profileImage
            } : null
          };
        })
      );

      res.json(enhancedReviews);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a review
  app.put("/api/reviews/:reviewId", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      const userId = (req.user as any).id;
      const { rating, comment } = req.body;

      // Get existing review
      const existingReview = await storage.getReview(reviewId);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Only allow review owner to update
      if (existingReview.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate input
      const updateData = insertReviewSchema.pick({ rating: true, comment: true }).parse({
        rating,
        comment
      });

      const updatedReview = await storage.updateReview(reviewId, updateData);
      res.json(updatedReview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Delete a review
  app.delete("/api/reviews/:reviewId", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      const userId = (req.user as any).id;

      // Get existing review
      const existingReview = await storage.getReview(reviewId);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Only allow review owner to delete
      if (existingReview.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteReview(reviewId);
      if (deleted) {
        res.json({ message: "Review deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete review" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if appointment can be reviewed
  app.get("/api/appointments/:appointmentId/can-review", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      const userId = (req.user as any).id;

      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Only client can review
      if (appointment.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if appointment is completed
      const canReview = appointment.status === 'completed';
      
      // Check if already reviewed
      const existingReview = await storage.getReviewByAppointment(appointmentId);
      const alreadyReviewed = !!existingReview;

      res.json({ 
        canReview: canReview && !alreadyReviewed,
        alreadyReviewed,
        appointmentStatus: appointment.status
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ruta para el asistente IA contextual (solo para profesionales)
  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Si el usuario es profesional, enriquecer el contexto
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Se requiere un prompt válido" });
      }
      
      let enhancedPrompt = prompt;
      if (user.isProfessional) {
        // Obtener información adicional del profesional
        const connections = await storage.getConnectionsByProfessional(userId);
        const appointments = await storage.getAppointmentsByProfessional(userId);
        
        // Obtener datos de clientes y mensajes
        const clientIdsFromConnections = connections.map(conn => conn.clientId);
        const clients = [];
        
        // Obtener datos de cada cliente
        for (const clientId of clientIdsFromConnections) {
          const client = await storage.getUser(clientId);
          if (client) {
            // Obtener mensajes recientes con este cliente
            const recentMessages = await storage.getMessagesBetweenUsers(userId, clientId);
            // Limitar a los 5 mensajes más recientes
            const limitedMessages = recentMessages.slice(0, 5);
            
            clients.push({
              ...client,
              recentMessages: limitedMessages
            });
          }
        }
        
        // Crear contexto enriquecido
        const context = {
          professional: {
            id: user.id,
            name: user.fullName,
            speciality: user.userType
          },
          connections: connections.length,
          appointments: appointments.slice(0, 5).map(app => ({
            id: app.id,
            date: new Date(app.date).toLocaleString(),
            status: app.status,
            clientId: app.clientId,
            horseId: app.horseId,
            notes: app.notes
          })),
          clients: clients.slice(0, 5).map(client => ({
            id: client.id,
            name: client.fullName,
            messages: client.recentMessages?.map(msg => ({
              content: msg.content,
              date: msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'Sin fecha',
              fromClient: msg.senderId === client.id
            }))
          }))
        };
        
        // Añadir el contexto al prompt si no está ya incluido
        if (!prompt.includes("Información contextual que puedes usar")) {
          enhancedPrompt = `
Como asistente profesional, responde a la siguiente consulta:
"${prompt}"

Información contextual que puedes usar (si es relevante):
- Clientes activos: ${context.clients.length}
- Próximas citas: ${context.appointments.length > 0 ? `${context.appointments.length} citas programadas` : 'No hay citas programadas'}

Información sobre clientes recientes:
${context.clients.map(client => `- Cliente ${client.name} (ID: ${client.id}): ${client.messages?.length || 0} mensajes recientes`).join('\n')}

Responde de manera profesional y específica a la especialidad del profesional. Si la pregunta no se relaciona con el contexto proporcionado, responde con la mejor información disponible.
`;
        } else {
          enhancedPrompt = prompt;
        }
      }
      
      const aiResponse = await getAIResponse(enhancedPrompt, user.userType);
      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Error al obtener respuesta del asistente:", error);
      res.status(500).json({ message: "Error al procesar la solicitud del asistente de IA" });
    }
  });
  
  // Ruta para el asistente IA (solo para profesionales)
  app.post("/api/ai/assistant", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Verificar que el usuario es un profesional
      if (!user.isProfessional) {
        return res.status(403).json({ 
          message: "Acceso denegado. Solo los profesionales pueden usar el asistente de IA."
        });
      }
      
      const { prompt, history } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Se requiere un prompt válido" });
      }
      
      // Validar el historial si está presente
      if (history && (!Array.isArray(history) || !history.every(msg => 
        typeof msg === 'object' && 
        (msg.role === 'user' || msg.role === 'assistant') && 
        typeof msg.content === 'string'
      ))) {
        return res.status(400).json({ message: "Formato de historial inválido" });
      }
      
      // Obtener respuesta de IA
      const aiResponse = await getAIResponse(prompt, user.userType, history || []);
      
      res.json({ 
        response: aiResponse,
        userType: user.userType
      });
    } catch (error) {
      console.error("Error en asistente IA:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas para gestión de suscripciones
  app.post("/api/subscription/create-session", isAuthenticated, async (req, res) => {
    try {
      const { plan, returnUrl, discountCode } = req.body;
      const user = req.user as User;
      
      if (!plan || !["basic", "premium"].includes(plan)) {
        return res.status(400).json({ message: "Plan no válido" });
      }
      
      try {
        const session = await createSubscriptionCheckoutSession(
          user, 
          plan as 'basic' | 'premium', 
          returnUrl || "/profile?tab=subscription",
          discountCode
        );
        res.json(session);
      } catch (stripeError: any) {
        console.error("Error creando sesión de Stripe:", stripeError);
        res.status(400).json({ message: stripeError.message });
      }
    } catch (error) {
      console.error("Error al crear sesión de suscripción:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Actualizar plan (para plan básico que no requiere pago)
  app.post("/api/subscription/update", isAuthenticated, async (req, res) => {
    try {
      const { plan } = req.body;
      const user = req.user as User;
      
      if (!plan || !["basic", "premium"].includes(plan)) {
        return res.status(400).json({ message: "Plan no válido" });
      }
      
      // Solo permitir actualización directa a plan básico
      if (plan !== "basic") {
        return res.status(400).json({ message: "La actualización a este plan requiere pago" });
      }
      
      // Actualizar en la base de datos
      await storage.updateUser(user.id, {
        subscriptionType: "basic",
        subscriptionExpiry: null, // Sin fecha de expiración para el plan básico
      });
      
      res.json({ success: true, message: "Plan actualizado a básico" });
    } catch (error) {
      console.error("Error al actualizar plan:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Cancelar suscripción
  app.post("/api/subscription/cancel", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Verificar que el usuario tenga una suscripción activa
      if (!user.subscriptionType || user.subscriptionType === "basic") {
        return res.status(400).json({ message: "No hay suscripción activa para cancelar" });
      }
      
      try {
        await cancelSubscription(user);
        res.json({ success: true, message: "Suscripción cancelada. Continuará activa hasta el final del período de facturación." });
      } catch (stripeError: any) {
        console.error("Error cancelando suscripción en Stripe:", stripeError);
        res.status(400).json({ message: stripeError.message });
      }
    } catch (error) {
      console.error("Error al cancelar suscripción:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Validar código de descuento
  app.post("/api/subscription/validate-discount", isAuthenticated, async (req, res) => {
    try {
      const { code, plan, userType } = req.body;
      const user = req.user as User;
      
      console.log(`Validando código de descuento: ${code} para plan: ${plan}, usuario tipo: ${userType}`);
      
      if (!code) {
        console.log("Error: Código de descuento no proporcionado");
        return res.status(400).json({ 
          valid: false, 
          message: "Código de descuento no proporcionado" 
        });
      }
      
      // Obtener el monto base según el plan y tipo de usuario
      let amount = 0;
      if (userType === 'client') {
        amount = plan === 'premium' ? 1500 : 0;  // 15€ para premium, 0 para básico
      } else {
        amount = plan === 'premium' ? 4999 : 2500; // 49.99€ para premium, 25€ para básico
      }
      
      console.log(`Monto base: ${amount} céntimos para plan ${plan} y usuario tipo ${userType}`);
      
      // Ver todos los códigos de descuento disponibles
      console.log("Códigos de descuento disponibles:", predefinedDiscountCodes.map(d => ({ 
        code: d.code, 
        active: d.isActive,
        expires: d.expiryDate ? d.expiryDate.toISOString() : 'no expira'
      })));
      
      const validatedDiscount = validateDiscountCode(
        code,
        amount,
        userType as 'client' | 'professional',
        user.id
      );
      
      if (!validatedDiscount) {
        console.log(`Código inválido: ${code}`);
        return res.status(400).json({ 
          valid: false, 
          message: "Código de descuento inválido o expirado" 
        });
      }
      
      console.log(`Código válido: ${validatedDiscount.code}, tipo: ${validatedDiscount.type}, valor: ${validatedDiscount.value}`);
      
      // Si el código es válido, calcular el monto con descuento
      const discountedAmount = applyDiscount(validatedDiscount, amount);
      console.log(`Monto original: ${amount}, monto con descuento: ${discountedAmount}`);
      
      res.json({
        valid: true,
        discountCode: validatedDiscount.code,
        originalAmount: amount,
        discountedAmount,
        discountValue: validatedDiscount.value,
        discountType: validatedDiscount.type,
        description: validatedDiscount.description
      });
    } catch (error) {
      console.error("Error al validar código de descuento:", error);
      res.status(500).json({ 
        valid: false, 
        message: "Error al validar código de descuento" 
      });
    }
  });
  
  // Webhook para recibir eventos de Stripe - Requiere manejo especial para raw body
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'; // Para desarrollo
    
    if (!sig) {
      return res.status(400).json({ message: "Falta firma para verificar webhook" });
    }
    
    let event;
    
    try {
      // Verificar la firma del webhook usando el cuerpo sin procesar
      const payload = req.body;
      event = stripe.webhooks.constructEvent(
        payload,
        sig,
        endpointSecret
      );
      
      // Procesar el evento
      await handleStripeWebhookEvent(event);
      
      res.json({ received: true });
    } catch (err: any) {
      console.error(`Error al procesar webhook: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // WebSocket deshabilitado para evitar errores
  // En su lugar, usamos polling desde el cliente
  
  // STRIPE CONNECT - RUTAS PARA PROFESIONALES
  
  // Crear una cuenta Stripe Connect para profesional
  app.post("/api/connect/create-account", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
      }
      
      // Verificar que el usuario sea un profesional
      if (req.user.userType !== "professional") {
        return res.status(403).json({ message: "Solo los profesionales pueden crear cuentas Connect" });
      }
      
      // Crear la cuenta Connect
      const result = await createConnectAccount(req.user.id);
      
      return res.json(result);
    } catch (error: any) {
      console.error("Error al crear cuenta Connect:", error);
      return res.status(500).json({ message: error.message || "Error al crear cuenta Connect" });
    }
  });
  
  // Verificar estado de cuenta Connect
  app.get("/api/connect/account-status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
      }
      
      // Verificar que el usuario sea un profesional
      if (req.user.userType !== "professional") {
        return res.status(403).json({ message: "Solo los profesionales pueden verificar cuentas Connect" });
      }
      
      // Obtener estado de la cuenta
      const status = await getConnectAccountStatus(req.user.id);
      
      return res.json(status);
    } catch (error: any) {
      console.error("Error al verificar estado de cuenta Connect:", error);
      return res.status(500).json({ message: error.message || "Error al verificar estado de cuenta Connect" });
    }
  });
  
  // Generar nuevo link de onboarding para Connect
  app.get("/api/connect/account-link", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
      }
      
      // Verificar que el usuario sea un profesional
      if (req.user.userType !== "professional") {
        return res.status(403).json({ message: "Solo los profesionales pueden generar links de Connect" });
      }
      
      // Generar link de onboarding
      const link = await createConnectAccountLink(req.user.id);
      
      return res.json(link);
    } catch (error: any) {
      console.error("Error al generar link de Connect:", error);
      return res.status(500).json({ message: error.message || "Error al generar link de Connect" });
    }
  });
  
  // Verificar si el profesional requiere configuración de cuenta bancaria
  app.get("/api/connect/check-requirement", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
      }
      
      // Verificar que el usuario sea un profesional
      if (req.user.userType !== "professional") {
        return res.status(200).json({ required: false });
      }
      
      // Si tiene cuenta verificada, no es necesario configurar
      if (req.user.stripeAccountVerified) {
        return res.status(200).json({ required: false });
      }
      
      // Si tiene cuenta creada pero no verificada, necesita completar onboarding
      if (req.user.stripeAccountId && !req.user.stripeAccountVerified) {
        return res.status(200).json({ 
          required: true,
          status: "incomplete",
          message: "Es necesario completar la configuración de su cuenta bancaria para recibir pagos"
        });
      }
      
      // Si no tiene cuenta, necesita crear una
      return res.status(200).json({ 
        required: true,
        status: "not_created",
        message: "Es necesario configurar su cuenta bancaria para recibir pagos"
      });
      
    } catch (error: any) {
      console.error("Error al verificar requerimiento de Connect:", error);
      return res.status(500).json({ message: error.message || "Error al verificar requerimiento de Connect" });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}
