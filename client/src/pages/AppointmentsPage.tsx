import { useQuery, useMutation } from "@tanstack/react-query";
import { Appointment } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Check, X, Loader2, Plus, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPriceFromCents } from "@/lib/utils";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    queryFn: () => 
      apiRequest("GET", "/api/appointments")
        .then(res => res.json()),
    enabled: !!user
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: (data: { id: number, status: string }) => 
      apiRequest("PUT", `/api/appointments/${data.id}`, { status: data.status })
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Cita actualizada",
        description: "El estado de la cita ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita. " + error,
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (appointmentId: number, newStatus: string) => {
    updateAppointmentMutation.mutate({ id: appointmentId, status: newStatus });
  };

  const filterAppointments = () => {
    if (!appointments) return [];

    let filtered = [...appointments];

    // Filtrar por fecha si hay un filtro activo
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= filterDate && appointmentDate < nextDay;
      });
      return filtered;
    }

    // Filtrar por pestaña activa
    if (activeTab === "upcoming") {
      return filtered.filter(appointment => 
        isAfter(new Date(appointment.date), new Date()) && 
        appointment.status !== "cancelled"
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (activeTab === "past") {
      return filtered.filter(appointment => 
        isBefore(new Date(appointment.date), new Date())
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (activeTab === "cancelled") {
      return filtered.filter(appointment => 
        appointment.status === "cancelled"
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default" className="bg-green-500">Confirmada</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pendiente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Utilizamos los datos del caballo obtenidos por la referencia ID
  const { data: horses } = useQuery({
    queryKey: ["/api/horses"],
    queryFn: () => apiRequest("GET", "/api/horses").then(res => res.json()),
    enabled: !!user && !user.isProfessional
  });

  // Utilizamos los datos de profesionales obtenidos por la referencia ID
  const { data: professionals } = useQuery({
    queryKey: ["/api/professionals"],
    queryFn: () => apiRequest("GET", "/api/professionals").then(res => res.json()),
    enabled: !!user
  });

  const renderHorseInfo = (appointment: Appointment) => {
    if (!horses) return null;
    
    let horseIds: number[] = [];
    
    // Usar horseIds si está disponible, sino usar horseId como fallback
    if (appointment.horseIds && appointment.horseIds.length > 0) {
      horseIds = appointment.horseIds;
    } else if (appointment.horseId) {
      horseIds = [appointment.horseId];
    }
    
    if (horseIds.length === 0) return null;
    
    const appointmentHorses = horses.filter((h: any) => horseIds.includes(h.id));
    if (appointmentHorses.length === 0) return null;
    
    return (
      <div className="mt-2 pt-2 border-t">
        <p className="text-sm font-semibold mb-1">Caballo{appointmentHorses.length > 1 ? 's' : ''}:</p>
        {appointmentHorses.map((horse: any) => (
          <div key={horse.id} className="flex items-center mb-1 last:mb-0">
            <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
              <img
                src={horse.profileImage || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"}
                alt={horse.name}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-sm font-medium">{horse.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderProfessionalInfo = (appointment: Appointment) => {
    if (!professionals) return null;
    
    const professional = professionals.find((p: any) => p.id === appointment.professionalId);
    if (!professional) return null;
    
    return (
      <div className="flex items-center mt-2">
        <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
          <img
            src={professional.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
            alt={professional.fullName}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{professional.fullName}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {professional.userType === "vet" ? "Veterinario" :
             professional.userType === "farrier" ? "Herrador" :
             professional.userType === "trainer" ? "Entrenador" :
             professional.userType === "dentist" ? "Dentista" :
             professional.userType === "physio" ? "Fisioterapeuta" :
             professional.userType}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const filteredAppointments = filterAppointments();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Citas</h1>
        <div className="flex items-center gap-4">
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Filtrar por fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={(date) => {
                  setDateFilter(date);
                  setShowCalendar(false);
                }}
                initialFocus
              />
              {dateFilter && (
                <div className="p-3 border-t flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFilter(undefined);
                      setShowCalendar(false);
                    }}
                  >
                    Quitar filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Button onClick={() => window.location.href = "/appointments/new"}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="upcoming" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past">Pasadas</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{appointment.title}</CardTitle>
                  {getStatusBadge(appointment.status)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {appointment.serviceType === "vet_visit" ? "Veterinario" :
                    appointment.serviceType === "farrier" ? "Herrador" :
                    appointment.serviceType === "training" ? "Entrenamiento" :
                    appointment.serviceType === "dental" ? "Dentista" :
                    appointment.serviceType === "physio" ? "Fisioterapia" :
                    appointment.serviceType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-3">
                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(appointment.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(appointment.date), "HH:mm", { locale: es })} ({appointment.duration} min)</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{appointment.location}</span>
                </div>
                
                {/* Información del caballo o profesional según corresponda */}
                {user?.isProfessional ? renderHorseInfo(appointment) : renderProfessionalInfo(appointment)}
                
                {/* Mostrar precio si existe o mensaje apropiado */}
                <div className="mt-2 pt-2 border-t text-sm flex justify-between items-center">
                  <p className="font-semibold">Precio:</p>
                  {appointment.price !== undefined && appointment.price !== null && Number(appointment.price) > 0 ? (
                    <p className="text-green-600 font-bold">
                      {formatPriceFromCents(appointment.price)}
                    </p>
                  ) : (
                    <p className="text-amber-500 italic">
                      {appointment.status === 'pending' 
                        ? 'Pendiente de confirmación' 
                        : 'No especificado'}
                    </p>
                  )}
                </div>
                
                {/* Mostrar estado de pago si el precio está definido y la cita está confirmada */}
                {appointment.price && Number(appointment.price) > 0 && appointment.status === 'confirmed' && (
                  <div className="mt-1 text-sm flex justify-between items-center">
                    <p className="font-semibold">Estado de pago:</p>
                    <Badge className={
                      appointment.paymentStatus === 'paid_complete' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : appointment.paymentStatus === 'paid_advance'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }>
                      {appointment.paymentStatus === 'paid_complete' 
                        ? 'Pagado' 
                        : appointment.paymentStatus === 'paid_advance'
                          ? 'Adelanto' 
                          : 'Pendiente de pago'}
                    </Badge>
                  </div>
                )}
                
                {appointment.notes && (
                  <div className="mt-2 pt-2 border-t text-sm">
                    <p className="text-muted-foreground">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-3 pb-3 flex justify-between">
                {appointment.status !== "cancelled" && isAfter(new Date(appointment.date), new Date()) && (
                  <>
                    {appointment.status === "pending" ? (
                      <>
                        {/* Solo quien recibe la solicitud puede confirmarla */}
                        {((user?.isProfessional && appointment.createdBy === "client") || 
                           (!user?.isProfessional && appointment.createdBy === "professional")) && (
                          <Button 
                            variant="outline" 
                            className="text-green-500 border-green-500 hover:bg-green-50"
                            size="sm"
                            onClick={() => handleStatusChange(appointment.id, "confirmed")}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Confirmar
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className="text-destructive border-destructive hover:bg-red-50"
                          size="sm"
                          onClick={() => handleStatusChange(appointment.id, "cancelled")}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Mostrar botón de pago para citas confirmadas con precio para clientes */}
                        {appointment.status === "confirmed" && 
                         appointment.price !== undefined && 
                         appointment.price !== null && 
                         Number(appointment.price) > 0 && 
                         appointment.paymentStatus !== 'paid_complete' && 
                         !user?.isProfessional ? (
                          <Button 
                            variant="default" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            onClick={() => setLocation(`/payment/${appointment.id}`)}
                          >
                            <CreditCard className="mr-1 h-4 w-4" />
                            Pagar {formatPriceFromCents(appointment.price)}
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              Reprogramar
                            </Button>
                            <Button 
                              variant="outline" 
                              className="text-destructive border-destructive hover:bg-red-50"
                              size="sm"
                              onClick={() => handleStatusChange(appointment.id, "cancelled")}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground mb-4">
            {activeTab === "upcoming" 
              ? "No tienes citas próximas" 
              : activeTab === "past" 
                ? "No tienes citas pasadas" 
                : "No tienes citas canceladas"}
          </p>
          {activeTab === "upcoming" && (
            <Button onClick={() => window.location.href = "/appointments/new"}>
              <Plus className="mr-2 h-4 w-4" />
              Programar Nueva Cita
            </Button>
          )}
        </div>
      )}
    </div>
  );
}