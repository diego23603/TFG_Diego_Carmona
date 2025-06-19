import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { Appointment, APPOINTMENT_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, X } from "lucide-react";
import { Button } from "./button";
import { cn, formatPriceFromCents } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  isProfessional?: boolean;
  onAction?: (action: 'confirm' | 'cancel' | 'complete', appointment: Appointment) => void;
}

export function AppointmentCard({ appointment, isProfessional = false, onAction }: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.date);
  
  // Format date display
  const getDateDisplay = () => {
    if (isToday(appointmentDate)) {
      return "Hoy";
    } else if (isTomorrow(appointmentDate)) {
      return "Mañana";
    } else {
      return format(appointmentDate, "d MMM", { locale: es });
    }
  };
  
  const time = format(appointmentDate, "HH:mm");
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    completed: "bg-blue-100 text-blue-800 border-blue-300"
  };
  
  const borderColors: Record<string, string> = {
    pending: "border-l-yellow-500",
    confirmed: "border-l-green-500",
    cancelled: "border-l-red-500",
    completed: "border-l-blue-500"
  };
  
  const otherParty = isProfessional ? appointment.client : appointment.professional;
  const otherPartyName = otherParty?.fullName || "Usuario";
  
  return (
    <Card className={cn(
      "border-l-4 hover:shadow-md transition-all duration-200",
      borderColors[appointment.status]
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{appointment.title}</h3>
              <Badge variant="outline" className={cn(statusColors[appointment.status])}>
                {APPOINTMENT_STATUS_LABELS[appointment.status]}
              </Badge>
            </div>
            
            <div className="mt-1 text-sm text-muted-foreground">
              <p>{SERVICE_TYPE_LABELS[appointment.serviceType] || appointment.serviceType}</p>
              <p><span className="font-medium">Caballo:</span> {appointment.horse?.name || "No especificado"}</p>
              <p>
                <span className="font-medium">{isProfessional ? "Cliente" : "Profesional"}:</span> {otherPartyName}
              </p>
              <p><span className="font-medium">Lugar:</span> {appointment.location}</p>
              {/* SOLUCIÓN DEFINITIVA: Mostrar precio en céntimos convertido a euros */}
              <p>
                <span className="font-medium">Precio:</span> {' '}
                {appointment.price !== undefined && appointment.price !== null 
                  ? formatPriceFromCents(appointment.price)
                  : "Pendiente de confirmación"
                }
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">
              {getDateDisplay()}
            </div>
            <div className="text-lg font-semibold">
              {time}
            </div>
            <div className="text-xs text-muted-foreground">
              {appointment.duration} min.
            </div>
          </div>
        </div>
        
        {appointment.notes && (
          <div className="mt-2 text-sm bg-muted/50 p-2 rounded">
            <span className="font-medium">Notas:</span> {appointment.notes}
          </div>
        )}
        
        {onAction && appointment.status === 'pending' && (
          <div className="mt-3 flex gap-2 justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => onAction('cancel', appointment)}
            >
              <X className="mr-1 h-4 w-4" />
              Rechazar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 border-green-300 text-green-600 hover:bg-green-50"
              onClick={() => onAction('confirm', appointment)}
            >
              <Check className="mr-1 h-4 w-4" />
              Confirmar
            </Button>
          </div>
        )}
        
        {onAction && appointment.status === 'confirmed' && (
          <div className="mt-3 flex gap-2 justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => onAction('cancel', appointment)}
            >
              <X className="mr-1 h-4 w-4" />
              Cancelar
            </Button>
            {isProfessional && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => onAction('complete', appointment)}
              >
                <Check className="mr-1 h-4 w-4" />
                Completar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
