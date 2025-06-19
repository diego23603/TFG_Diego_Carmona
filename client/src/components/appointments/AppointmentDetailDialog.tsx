import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Appointment, APPOINTMENT_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Check, X, MapPin, Clock, User, Bookmark, CreditCard, 
  AlertCircle, Calendar, Repeat, FileText 
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentAlternativeForm } from "./AppointmentAlternativeForm";
import { ProfessionalResponseForm } from "./ProfessionalResponseForm";
import { loadStripe } from '@stripe/stripe-js';
import { StripePaymentForm } from '../payment/StripePaymentForm';
import { useToast } from "@/hooks/use-toast";

interface AppointmentDetailDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (action: 'confirm' | 'cancel' | 'complete' | 'propose_alternative' | 'pay', appointment: Appointment) => void;
}

// Carga Stripe fuera del componente para evitar recargas
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Missing Stripe public key');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : 
  null;



export function AppointmentDetailDialog({ 
  appointment, 
  open, 
  onOpenChange,
  onAction
}: AppointmentDetailDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("details");
  const [showAlternativeForm, setShowAlternativeForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  
  if (!appointment) return null;
  
  const appointmentDate = new Date(appointment.date);
  const formattedDate = format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedTime = format(appointmentDate, "HH:mm", { locale: es });
  
  // Determinar si se muestra información del profesional o del cliente
  const isProfessional = user?.isProfessional;
  const isCreatedByViewer = 
    (isProfessional && appointment.createdBy === "professional") || 
    (!isProfessional && appointment.createdBy === "client");
  
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    completed: "bg-blue-100 text-blue-800 border-blue-300",
    rejected: "bg-red-100 text-red-800 border-red-300"
  };
  
  // Determinar si puede confirmar la cita 
  // Si es profesional: puede confirmar solo las citas que no creó
  // Si es cliente: puede confirmar tanto las que creó como las que no, pero sólo si tienen precio
  const canConfirm = 
    appointment.status === "pending" && 
    (
      (isProfessional && !isCreatedByViewer) || 
      (!isProfessional && appointment.price)
    );
    
  // Determinar si el profesional debe responder con precio/duración
  const needsProfessionalResponse = 
    isProfessional && 
    appointment.status === "pending" && 
    !isCreatedByViewer && 
    (!appointment.price || !appointment.duration);
  
  // Determinar si se muestra la sección de pago
  const showPayment = !isProfessional && 
    appointment.status === "confirmed" && 
    (!appointment.paymentStatus || appointment.paymentStatus === "pending") &&
    appointment.price && Number(appointment.price) > 0;

  // Manejar propuesta de alternativa
  const handleProposeAlternative = () => {
    if (showAlternativeForm) {
      setShowAlternativeForm(false);
    } else {
      setShowAlternativeForm(true);
    }
  };

  // Manejar éxito en formulario alternativo
  const handleAlternativeSuccess = () => {
    setShowAlternativeForm(false);
    if (onAction) {
      onAction('propose_alternative', appointment);
    }
  };

  // Preparar listado de caballos
  let horseNames: string[] = ['Sin caballo asignado'];
  
  // Primero intentar obtener el nombre del caballo principal
  if (appointment.horse && appointment.horse.name) {
    horseNames = [appointment.horse.name];
  } 
  // Luego intentar con el array de nombres si existe
  else if (Array.isArray(appointment.horseNames) && appointment.horseNames.length > 0) {
    horseNames = appointment.horseNames;
  } 
  // Intentar con la propiedad 'horses' si existe (aunque no está en el tipo)
  else if (Array.isArray((appointment as any).horses) && (appointment as any).horses.length > 0) {
    horseNames = (appointment as any).horses.map((h: any) => h.name);
  }
  
  // SOLUCIÓN DEFINITIVA DEL PROBLEMA DE PRECIO - Versión 3.0 - CÉNTIMOS
  
  // El precio se almacena como un entero en céntimos en la base de datos
  // Esta función lo convierte a euros para mostrarlo
  const findAndParsePrice = (): number | null => {
    console.log(`PRECIO-V3: Procesando cita ${appointment.id}:`, {
      precioCrudo: appointment.price,
      tipo: typeof appointment.price
    });
    
    // Verificar si existe un precio
    if (appointment.price !== undefined && appointment.price !== null) {
      // Siempre convertir a número para asegurar compatibilidad
      const precioCentimos = Number(appointment.price);
      
      // Verificar que es un número válido
      if (!isNaN(precioCentimos) && precioCentimos > 0) {
        // Convertir de céntimos a euros
        const precioEuros = precioCentimos / 100;
        console.log(`PRECIO-V3: Éxito - Cita ${appointment.id}: ${precioCentimos} céntimos = ${precioEuros} euros`);
        return precioEuros;
      } else {
        console.error(`PRECIO-V3: Error - Cita ${appointment.id}: Valor inválido "${appointment.price}"`);
      }
    } else {
      console.log(`PRECIO-V3: Sin precio - Cita ${appointment.id}`);
    }
    
    return null;
  };
  
  // Extraer y formatear el precio
  const priceValue = findAndParsePrice();
  
  // Formatear para visualización con seguridad adicional
  const formattedPrice = (() => {
    if (priceValue === null || priceValue === undefined || isNaN(priceValue) || priceValue <= 0) {
      return 'No especificado';
    }
    
    try {
      return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(priceValue);
    } catch (error) {
      console.error('Error al formatear precio:', error);
      return `${priceValue} €`;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <div>{appointment.title}</div>
            <Badge className={statusColors[appointment.status]}>
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {isProfessional ? 'Detalles de la cita con el cliente' : 'Detalles de tu cita'}
          </DialogDescription>
        </DialogHeader>
        
        {showAlternativeForm ? (
          <AppointmentAlternativeForm 
            appointment={appointment} 
            onSuccess={handleAlternativeSuccess}
            onCancel={() => setShowAlternativeForm(false)}
          />
        ) : showResponseForm ? (
          <ProfessionalResponseForm
            appointment={appointment}
            onSuccess={() => {
              setShowResponseForm(false);
              // Invalidar cache y cerrar diálogo
              onAction && onAction("confirm", appointment);
            }}
            onCancel={() => setShowResponseForm(false)}
          />
        ) : (
          <Tabs 
            defaultValue="details" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full py-4"
          >
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              {showPayment && <TabsTrigger value="payment">Pago</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="details">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formattedDate}</p>
                    <p className="text-sm text-muted-foreground">
                      {formattedTime} ({appointment.duration} minutos)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">{appointment.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Bookmark className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Caballos</p>
                    <div className="text-sm text-muted-foreground">
                      {horseNames.map((name, index) => (
                        <div key={index}>{name}</div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Mostrar información del cliente o profesional según corresponda */}
                {(isProfessional ? appointment.client : appointment.professional) && (
                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{isProfessional ? "Cliente" : "Profesional"}</p>
                      <p className="text-sm text-muted-foreground">
                        {isProfessional 
                          ? (appointment.client?.fullName || appointment.client?.username) 
                          : (appointment.professional?.fullName || appointment.professional?.username)}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Servicio</p>
                    <p className="text-sm text-muted-foreground">
                      {SERVICE_TYPE_LABELS[appointment.serviceType] || appointment.serviceType}
                    </p>
                  </div>
                </div>
                
                {appointment.isPeriodic && (
                  <div className="flex items-start gap-2">
                    <Repeat className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Periodicidad</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.frequency === 'weekly' ? 'Semanal' : 
                         appointment.frequency === 'biweekly' ? 'Quincenal' : 
                         appointment.frequency === 'monthly' ? 'Mensual' : 'No especificada'}
                        {appointment.endDate && ` hasta ${format(new Date(appointment.endDate), "d MMM yyyy", { locale: es })}`}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <CreditCard className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="w-full">
                    <div className="flex justify-between items-center w-full">
                      <p className="font-medium">Precio</p>
                      <p className={`text-sm font-bold ${priceValue ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {formattedPrice}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-muted-foreground">Estado de pago</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        appointment.paymentStatus === 'paid_complete' 
                          ? 'bg-green-100 text-green-800' 
                          : appointment.paymentStatus === 'paid_advance'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.paymentStatus === 'paid_complete' 
                          ? 'Pagado' 
                          : appointment.paymentStatus === 'paid_advance' 
                            ? 'Adelanto pagado' 
                            : 'Pendiente de pago'}
                      </span>
                    </div>
                    
                    {/* Botón de pago para citas confirmadas con precio establecido y pendientes de pago */}
                    {appointment.status === 'confirmed' && 
                     priceValue !== null && 
                     priceValue > 0 && 
                     (!appointment.paymentStatus || appointment.paymentStatus === 'pending') && 
                     !user?.isProfessional && (
                      <Button 
                        variant="default" 
                        className="w-full mt-2 bg-green-600 hover:bg-green-700"
                        onClick={() => window.location.href = `/payment/${appointment.id}`}
                      >
                        Realizar Pago
                      </Button>
                    )}
                  </div>
                </div>
                
                {appointment.notes && (
                  <div className="bg-muted p-3 rounded-md mt-2">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="font-medium">Notas</p>
                    </div>
                    <p className="text-sm mt-1">{appointment.notes}</p>
                  </div>
                )}
                
                {appointment.invoiceUrl && (
                  <div className="flex items-center mt-2">
                    <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                    <a 
                      href={appointment.invoiceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-equi-green hover:text-equi-light-green underline"
                    >
                      Descargar factura
                    </a>
                  </div>
                )}
              </div>
              
              {/* Botones de acción */}
              {onAction && appointment.status === "pending" && (
                <div className="flex justify-end gap-2 mt-6">
                  {isProfessional && (
                    <Button 
                      variant="outline" 
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={handleProposeAlternative}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Proponer alternativa
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => onAction("cancel", appointment)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  
                  {canConfirm && !needsProfessionalResponse && (
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-600 hover:bg-green-50"
                      onClick={() => onAction("confirm", appointment)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Confirmar
                    </Button>
                  )}
                  
                  {needsProfessionalResponse && (
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-600 hover:bg-green-50"
                      onClick={() => setShowResponseForm(true)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Responder
                    </Button>
                  )}
                </div>
              )}
              
              {onAction && appointment.status === "confirmed" && (
                <div className="flex justify-end gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => onAction("cancel", appointment)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  
                  {isProfessional && (
                    <Button 
                      variant="outline" 
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={() => onAction("complete", appointment)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Completar
                    </Button>
                  )}
                  
                  {!isProfessional && showPayment && (
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-600 hover:bg-green-50"
                      onClick={() => {
                        // Usar el valor de precio que ya hemos procesado
                        if (priceValue === null || priceValue <= 0) {
                          toast({
                            title: "Pago no disponible",
                            description: "Esta cita no tiene un precio definido o válido. El profesional debe establecer el precio antes de poder realizar el pago.",
                            variant: "destructive"
                          });
                          return;
                        }
                        setActiveTab("payment");
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pagar
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            {showPayment && (
              <TabsContent value="payment">
                {stripePromise ? (
                  <StripePaymentForm 
                    appointmentId={appointment.id}
                    amount={priceValue !== null ? priceValue : 0}
                    onPaymentSuccess={() => {
                      if (onAction) onAction('pay', appointment);
                      setActiveTab('details');
                    }}
                    onCancel={() => setActiveTab('details')}
                  />
                ) : (
                  <div className="text-center p-4">
                    <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                    <p className="text-red-500">Configuración de pagos no disponible</p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}