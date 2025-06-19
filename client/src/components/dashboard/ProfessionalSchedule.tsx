import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Appointment, User } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfessionalScheduleProps {
  user: User;
}

export default function ProfessionalSchedule({ user }: ProfessionalScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Calculate the start and end of the current week
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 }); // End on Sunday
  
  // Generate an array of days in the current week
  const weekDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Format week range for display
  const weekRangeText = `${format(startDate, "d", { locale: es })} - ${format(endDate, "d MMMM yyyy", { locale: es })}`;
  
  // Fetch appointments for this professional
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };
  
  // Reset to current week
  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };
  
  // Filter appointments for each day of the week
  const getAppointmentsForDay = (day: Date) => {
    if (!appointments) return [];
    
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.date), day) &&
      appointment.status !== 'cancelled'
    );
  };
  
  // Format appointment time
  const formatAppointmentTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };
  
  // Get color for appointment status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 border-green-300 text-green-800';
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'completed': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agenda Semanal</CardTitle>
            <CardDescription>
              {weekRangeText}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {weekDays.map((day, index) => (
            <div 
              key={`header-${index}`} 
              className={cn(
                "text-center font-medium py-2",
                isToday(day) && "bg-equi-cream rounded-t-md"
              )}
            >
              <div className="text-xs uppercase text-muted-foreground">
                {format(day, "EEE", { locale: es })}
              </div>
              <div className={cn(
                "text-lg",
                isToday(day) && "text-equi-green font-bold"
              )}>
                {format(day, "d", { locale: es })}
              </div>
            </div>
          ))}
          
          {/* Appointment cells */}
          {isLoading ? (
            // Skeleton loading state
            <>
              {[...Array(7)].map((_, dayIndex) => (
                <div 
                  key={`skeleton-${dayIndex}`} 
                  className="min-h-[200px] border rounded-b-md p-1"
                >
                  {[...Array(3)].map((_, appointmentIndex) => (
                    <Skeleton 
                      key={`skeleton-appointment-${dayIndex}-${appointmentIndex}`}
                      className="h-12 w-full mb-1"
                    />
                  ))}
                </div>
              ))}
            </>
          ) : (
            // Appointments by day
            weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDay(day);
              
              return (
                <div 
                  key={`day-${dayIndex}`} 
                  className={cn(
                    "min-h-[200px] border rounded-b-md p-1 overflow-y-auto",
                    isToday(day) && "bg-equi-cream/30 border-equi-green"
                  )}
                >
                  {dayAppointments.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground text-center">
                        Sin citas
                      </p>
                    </div>
                  ) : (
                    dayAppointments
                      .sort((a, b) => 
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                      )
                      .map(appointment => (
                        <div 
                          key={appointment.id}
                          className={cn(
                            "text-xs p-1 mb-1 rounded border",
                            getStatusColor(appointment.status)
                          )}
                        >
                          <div className="font-medium">
                            {formatAppointmentTime(appointment.date)} 
                            {appointment.duration && ` (${appointment.duration} min)`}
                          </div>
                          <div className="truncate">{appointment.title}</div>
                          <div className="truncate">
                            {appointment.horse?.name || "Caballo"} - 
                            {appointment.client?.fullName || "Cliente"}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
