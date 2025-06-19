import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Loader2 } from "lucide-react";
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Appointment } from '@/lib/types';
import { AppointmentDetailDialog } from '@/components/appointments/AppointmentDetailDialog';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Componente simplificado del calendario
const CalendarPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Consultar citas reales desde el backend
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Mutación para actualizar el estado de una cita
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest('PUT', `/api/appointments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      // Invalidar la caché para refrescar la lista de citas
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la cita: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Función para manejar las acciones de la cita
  const handleAppointmentAction = (
    action: 'confirm' | 'cancel' | 'complete' | 'propose_alternative' | 'pay', 
    appointment: Appointment
  ) => {
    const statusMap = {
      confirm: 'confirmed',
      cancel: 'cancelled',
      complete: 'completed',
      propose_alternative: 'pending',
      pay: 'confirmed'
    };
    
    updateAppointmentMutation.mutate({ 
      id: appointment.id, 
      status: statusMap[action] 
    }, {
      onSuccess: () => {
        const messages = {
          confirm: 'Cita confirmada correctamente',
          cancel: 'Cita cancelada correctamente',
          complete: 'Cita marcada como completada',
          propose_alternative: 'Alternativa propuesta correctamente',
          pay: 'Pago realizado correctamente'
        };
        
        toast({
          title: "Éxito",
          description: messages[action],
          variant: "default"
        });
        
        setDialogOpen(false);
      }
    });
  };
  
  // Función para abrir el diálogo con los detalles de la cita
  const openAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-equi-green" />
        <p>Cargando calendario...</p>
      </div>
    );
  }

  // Colores para distinguir los tipos de profesionales
  const professionalColors = {
    vet: '#C8553D',      // Veterinario - rojo
    farrier: '#f5bd41',  // Herrador - amarillo 
    dentist: '#845EC2',  // Dentista - púrpura
    physio: '#4A6670',   // Fisioterapeuta - azul
    trainer: '#85B09A',  // Entrenador - verde
    cleaner: '#FF8066'   // Limpieza - naranja
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-equi-charcoal mb-2">Calendario</h1>
          <p className="text-gray-600">
            Gestiona tus citas y eventos programados
          </p>
        </div>
        <Button 
          className="bg-equi-green hover:bg-equi-light-green text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel lateral */}
        <div className="lg:col-span-1">
          <Card className="bg-white mb-6">
            <CardHeader>
              <CardTitle>Próximas citas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {!appointments || appointments.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No tienes citas programadas próximamente
                  </div>
                ) : (
                  appointments
                    .filter(app => {
                      // Only show pending or confirmed appointments
                      if (app.status !== 'pending' && app.status !== 'confirmed') return false;
                      
                      // Only show future appointments
                      const appointmentDate = new Date(app.date);
                      const now = new Date();
                      return appointmentDate > now;
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5).map((appointment) => {
                    // Determinar el color según el tipo de servicio
                    let colorType = 'vet';
                    if (appointment.serviceType === 'vet_visit') colorType = 'vet';
                    else if (appointment.serviceType === 'farrier') colorType = 'farrier';
                    else if (appointment.serviceType === 'dental') colorType = 'dentist';
                    else if (appointment.serviceType === 'physio') colorType = 'physio';
                    else if (appointment.serviceType === 'training') colorType = 'trainer';
                    else if (appointment.serviceType === 'cleaning') colorType = 'cleaner';
                    
                    // Formatear fecha
                    const date = new Date(appointment.date);
                    const formattedDate = date.toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    });
                    
                    // Formatear hora
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    
                    return (
                      <div 
                        key={appointment.id} 
                        className="border-l-4 pl-3 py-2"
                        style={{ borderColor: professionalColors[colorType as keyof typeof professionalColors] }}
                      >
                        <div className="font-medium">{appointment.title}</div>
                        <div className="text-sm text-gray-600">
                          {formattedDate} • {hours}:{minutes}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {appointment.horse?.name || 'Caballo'} • {appointment.otherUser?.fullName || 'Cliente'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Leyenda</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: professionalColors.vet }}></div>
                  <span>Veterinario</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: professionalColors.farrier }}></div>
                  <span>Herrador</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: professionalColors.dentist }}></div>
                  <span>Dentista</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: professionalColors.physio }}></div>
                  <span>Fisioterapeuta</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: professionalColors.trainer }}></div>
                  <span>Entrenador</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: professionalColors.cleaner }}></div>
                  <span>Limpieza</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Calendario principal */}
        <div className="lg:col-span-3">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="h-[700px] flex flex-col">
                <div className="grid grid-cols-7 gap-1 mb-4">
                  <div className="text-center text-sm font-medium">Lun</div>
                  <div className="text-center text-sm font-medium">Mar</div>
                  <div className="text-center text-sm font-medium">Mié</div>
                  <div className="text-center text-sm font-medium">Jue</div>
                  <div className="text-center text-sm font-medium">Vie</div>
                  <div className="text-center text-sm font-medium">Sáb</div>
                  <div className="text-center text-sm font-medium">Dom</div>
                </div>
                <div className="grid grid-cols-7 gap-1 flex-grow">
                  {/* Generar los días del mes actual */}
                  {(() => {
                    // Obtener el mes actual
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();
                    
                    // Obtener el primer día del mes
                    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                    const firstDayWeekday = firstDayOfMonth.getDay() || 7; // 0 = Domingo, 1 = Lunes, etc. Convertir 0 a 7 para Domingo
                    
                    // Número de días en el mes actual
                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    
                    // Helper function to check if two dates are the same day
                    const isSameDay = (date1: Date, date2: Date) => {
                      return date1.getFullYear() === date2.getFullYear() &&
                             date1.getMonth() === date2.getMonth() &&
                             date1.getDate() === date2.getDate();
                    };

                    // Generar array con los 35 días del calendario (5 semanas)
                    const calendarDays = Array.from({ length: 35 }).map((_, i) => {
                      const dayOfMonth = i - (firstDayWeekday - 2) + 1; // Ajuste para que lunes sea el primer día
                      const isCurrentMonth = dayOfMonth > 0 && dayOfMonth <= daysInMonth;
                      const date = isCurrentMonth ? new Date(currentYear, currentMonth, dayOfMonth) : null;
                      
                      // Encontrar citas para este día (solo pendientes y confirmadas y futuras)
                      const dayAppointments = appointments?.filter(appointment => {
                        if (!date) return false;
                        // Filtrar por estado - solo mostrar pendientes y confirmadas
                        if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
                          return false;
                        }
                        const appointmentDate = new Date(appointment.date);
                        const now = new Date();
                        
                        // Solo mostrar citas futuras o del día actual
                        if (appointmentDate < now && !isSameDay(appointmentDate, now)) {
                          return false;
                        }
                        
                        return (
                          appointmentDate.getFullYear() === date.getFullYear() &&
                          appointmentDate.getMonth() === date.getMonth() &&
                          appointmentDate.getDate() === date.getDate()
                        );
                      }) || [];
                      
                      return (
                        <div 
                          key={i} 
                          className={`border rounded-md p-1 min-h-[100px] relative hover:bg-gray-50 transition-colors ${
                            !isCurrentMonth ? 'bg-gray-50' : ''
                          } ${
                            date && date.getDate() === today.getDate() && date.getMonth() === today.getMonth() 
                              ? 'border-equi-green' : ''
                          }`}
                        >
                          <div className={`text-right text-xs ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'} mb-1`}>
                            {isCurrentMonth ? dayOfMonth : ''}
                          </div>
                          
                          {/* Mostrar citas para este día */}
                          {dayAppointments.map(appointment => {
                            // Determinar el color según el tipo de servicio
                            let colorType = 'vet';
                            if (appointment.serviceType === 'vet_visit') colorType = 'vet';
                            else if (appointment.serviceType === 'farrier') colorType = 'farrier';
                            else if (appointment.serviceType === 'dental') colorType = 'dentist';
                            else if (appointment.serviceType === 'physio') colorType = 'physio';
                            else if (appointment.serviceType === 'training') colorType = 'trainer';
                            else if (appointment.serviceType === 'cleaning') colorType = 'cleaner';
                            
                            // Formatear hora
                            const appointmentDate = new Date(appointment.date);
                            const hours = appointmentDate.getHours().toString().padStart(2, '0');
                            const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
                            
                            return (
                              <div 
                                key={appointment.id} 
                                className="rounded px-2 py-1 text-white text-sm overflow-hidden cursor-pointer mb-1"
                                style={{ backgroundColor: professionalColors[colorType as keyof typeof professionalColors] }}
                                onClick={() => openAppointmentDetails(appointment)}
                              >
                                <div className="font-semibold truncate">{appointment.title}</div>
                                <div className="text-xs truncate">
                                  {appointment.horse?.name || 'Caballo'} • {hours}:{minutes}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                    
                    return calendarDays;
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Diálogo de detalles de cita */}
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAction={handleAppointmentAction}
      />
    </div>
  );
};

export default CalendarPage;