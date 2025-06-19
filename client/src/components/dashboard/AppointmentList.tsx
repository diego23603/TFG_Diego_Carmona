import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isThisWeek, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { PlusCircle, Calendar, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { Appointment, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import AppointmentForm from "./AppointmentForm";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentListProps {
  user: User;
  horseId?: number;
}

export default function AppointmentList({ user, horseId }: AppointmentListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/appointments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Cita actualizada",
        description: "El estado de la cita ha sido actualizado correctamente.",
      });
    },
    onError: (error) => {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setIsFormOpen(true);
  };

  const handleAppointmentAction = (action: 'confirm' | 'cancel' | 'complete', appointment: Appointment) => {
    const statusMap = {
      confirm: 'confirmed',
      cancel: 'cancelled',
      complete: 'completed'
    };
    
    updateAppointmentMutation.mutate({ 
      id: appointment.id, 
      status: statusMap[action] 
    });
  };

  // Filter appointments
  const getPendingAppointments = () => {
    return appointments?.filter(app => app.status === 'pending') || [];
  };

  const getUpcomingAppointments = () => {
    return appointments?.filter(app => 
      app.status === 'confirmed' && 
      isAfter(new Date(app.date), new Date())
    ) || [];
  };

  const getTodayAppointments = () => {
    return appointments?.filter(app => 
      app.status === 'confirmed' && 
      isToday(new Date(app.date))
    ) || [];
  };

  const getWeekAppointments = () => {
    return appointments?.filter(app => 
      app.status === 'confirmed' && 
      isThisWeek(new Date(app.date))
    ) || [];
  };

  const getCompletedAppointments = () => {
    return appointments?.filter(app => app.status === 'completed') || [];
  };

  const getCancelledAppointments = () => {
    return appointments?.filter(app => app.status === 'cancelled') || [];
  };

  const getAppointmentsCount = (tab: string): number => {
    switch (tab) {
      case "pending": return getPendingAppointments().length;
      case "upcoming": return getUpcomingAppointments().length;
      case "today": return getTodayAppointments().length;
      case "week": return getWeekAppointments().length;
      case "completed": return getCompletedAppointments().length;
      case "cancelled": return getCancelledAppointments().length;
      default: return 0;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold">Citas</h2>
        {!user.isProfessional && (
          <Button 
            onClick={handleAddAppointment}
            className="bg-equi-green hover:bg-equi-light-green"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="upcoming" className="relative">
            <Calendar className="mr-2 h-4 w-4" />
            Próximas
            {getAppointmentsCount("upcoming") > 0 && (
              <span className="absolute -top-1 -right-1 bg-equi-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getAppointmentsCount("upcoming")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="today" className="relative">
            <Clock className="mr-2 h-4 w-4" />
            Hoy
            {getAppointmentsCount("today") > 0 && (
              <span className="absolute -top-1 -right-1 bg-equi-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getAppointmentsCount("today")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="week" className="relative">
            <CalendarDays className="mr-2 h-4 w-4" />
            Esta semana
            {getAppointmentsCount("week") > 0 && (
              <span className="absolute -top-1 -right-1 bg-equi-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getAppointmentsCount("week")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pendientes
            {getAppointmentsCount("pending") > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getAppointmentsCount("pending")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="upcoming" className="mt-6 space-y-4">
              {getUpcomingAppointments().length === 0 ? (
                <p className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground">
                  No tienes citas próximas confirmadas
                </p>
              ) : (
                getUpcomingAppointments().map(appointment => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment}
                    isProfessional={user.isProfessional}
                    onAction={handleAppointmentAction}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="today" className="mt-6 space-y-4">
              {getTodayAppointments().length === 0 ? (
                <p className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground">
                  No tienes citas programadas para hoy
                </p>
              ) : (
                getTodayAppointments().map(appointment => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment}
                    isProfessional={user.isProfessional}
                    onAction={handleAppointmentAction}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="week" className="mt-6 space-y-4">
              {getWeekAppointments().length === 0 ? (
                <p className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground">
                  No tienes citas programadas para esta semana
                </p>
              ) : (
                getWeekAppointments().map(appointment => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment}
                    isProfessional={user.isProfessional}
                    onAction={handleAppointmentAction}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-6 space-y-4">
              {getPendingAppointments().length === 0 ? (
                <p className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground">
                  No tienes citas pendientes de confirmación
                </p>
              ) : (
                getPendingAppointments().map(appointment => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment}
                    isProfessional={user.isProfessional}
                    onAction={handleAppointmentAction}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6 space-y-4">
              {getCompletedAppointments().length === 0 ? (
                <p className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground">
                  No tienes citas completadas
                </p>
              ) : (
                getCompletedAppointments().map(appointment => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment}
                    isProfessional={user.isProfessional}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6 space-y-4">
              {getCancelledAppointments().length === 0 ? (
                <p className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground">
                  No tienes citas canceladas
                </p>
              ) : (
                getCancelledAppointments().map(appointment => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment}
                    isProfessional={user.isProfessional}
                  />
                ))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Programar Nueva Cita
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm 
            onCloseDialog={() => setIsFormOpen(false)}
            userId={user.id} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
