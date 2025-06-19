// Servicio de notificaciones simplificado
// En producción, esto se reemplazaría con SendGrid o similar

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Función para enviar emails (simulada)
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log('Enviando email:', {
      to: options.to,
      from: options.from,
      subject: options.subject,
      content: options.text || options.html
    });
    
    // Simular retraso de envío de email
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // En un entorno real, aquí se enviaría el email con SendGrid
    return true;
  } catch (error) {
    console.error('Error al enviar email:', error);
    return false;
  }
}

// Enviar recordatorio de cita
export async function sendAppointmentReminder(
  email: string, 
  name: string, 
  date: Date, 
  location: string, 
  service: string
): Promise<boolean> {
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
  
  return await sendEmail({
    to: email,
    from: 'notificaciones@equigest.com',
    subject: `Recordatorio: Cita de ${service} el ${formattedDate}`,
    html: `
      <h1>Recordatorio de cita</h1>
      <p>Hola ${name},</p>
      <p>Le recordamos que tiene una cita programada para ${service} el <strong>${formattedDate}</strong> en <strong>${location}</strong>.</p>
      <p>Si necesita reprogramar o cancelar, por favor hágalo con al menos 24 horas de anticipación.</p>
      <p>Saludos,<br>El equipo de EquiGest</p>
    `
  });
}

// Enviar notificación de solicitud de cita
export async function sendAppointmentRequest(
  email: string,
  name: string,
  requesterName: string,
  date: Date,
  service: string,
  horseNames: string[],
  price: number,
  isClientRequest: boolean
): Promise<boolean> {
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
  
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price / 100);
  
  const horsesText = horseNames.length > 1 
    ? `para los caballos ${horseNames.join(', ')}` 
    : `para el caballo ${horseNames[0]}`;
  
  const subject = isClientRequest 
    ? `Nueva solicitud de cita de ${requesterName}` 
    : `${requesterName} propone una cita`;
  
  return await sendEmail({
    to: email,
    from: 'notificaciones@equigest.com',
    subject,
    html: `
      <h1>${isClientRequest ? 'Solicitud de cita' : 'Propuesta de cita'}</h1>
      <p>Hola ${name},</p>
      <p>${requesterName} ha ${isClientRequest ? 'solicitado' : 'propuesto'} una cita de <strong>${service}</strong> ${horsesText} para el <strong>${formattedDate}</strong>.</p>
      <p>Precio propuesto: <strong>${formattedPrice}</strong></p>
      <p>Por favor, ingrese a la plataforma para aceptar, rechazar o proponer una alternativa.</p>
      <p>Saludos,<br>El equipo de EquiGest</p>
    `
  });
}

// Enviar notificación de respuesta a solicitud
export async function sendAppointmentResponse(
  email: string,
  name: string,
  responderName: string,
  date: Date,
  service: string,
  horseNames: string[],
  status: 'accepted' | 'rejected' | 'alternative_proposed',
  alternativeDate?: Date
): Promise<boolean> {
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
  
  let statusText = '';
  if (status === 'accepted') {
    statusText = 'aceptado';
  } else if (status === 'rejected') {
    statusText = 'rechazado';
  } else {
    statusText = 'propuesto una alternativa para';
    if (alternativeDate) {
      const formattedAltDate = new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(alternativeDate);
      statusText += ` el ${formattedAltDate}`;
    }
  }
  
  const horsesText = horseNames.length > 1 
    ? `para los caballos ${horseNames.join(', ')}` 
    : `para el caballo ${horseNames[0]}`;
  
  return await sendEmail({
    to: email,
    from: 'notificaciones@equigest.com',
    subject: `Respuesta a su solicitud de cita del ${formattedDate}`,
    html: `
      <h1>Respuesta a solicitud de cita</h1>
      <p>Hola ${name},</p>
      <p>${responderName} ha ${statusText} su solicitud de cita de <strong>${service}</strong> ${horsesText} del <strong>${formattedDate}</strong>.</p>
      <p>Por favor, ingrese a la plataforma para ver los detalles.</p>
      <p>Saludos,<br>El equipo de EquiGest</p>
    `
  });
}

// Enviar factura
export async function sendInvoice(
  email: string,
  name: string,
  invoiceNumber: string,
  invoiceUrl: string,
  serviceName: string,
  amount: number
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount / 100);
  
  return await sendEmail({
    to: email,
    from: 'facturas@equigest.com',
    subject: `Factura #${invoiceNumber} por servicio de ${serviceName}`,
    html: `
      <h1>Factura de servicio</h1>
      <p>Hola ${name},</p>
      <p>Adjuntamos la factura #${invoiceNumber} por el servicio de <strong>${serviceName}</strong> por un importe de <strong>${formattedAmount}</strong>.</p>
      <p><a href="${invoiceUrl}" target="_blank">Haga clic aquí para descargar su factura</a></p>
      <p>Gracias por confiar en EquiGest.</p>
      <p>Saludos,<br>El equipo de EquiGest</p>
    `
  });
}