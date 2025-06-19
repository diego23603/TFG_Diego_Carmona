import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addHours } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  SERVICE_TYPE_LABELS, 
  ServiceType, 
  User, 
  Horse 
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema
const appointmentSchema = z.object({
  horseId: z.coerce.number({
    required_error: "Debes seleccionar un caballo",
  }),
  professionalId: z.coerce.number({
    required_error: "Debes seleccionar un profesional",
  }),
  serviceType: z.string({
    required_error: "Debes seleccionar un tipo de servicio",
  }),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  date: z.date({
    required_error: "Debes seleccionar una fecha",
  }),
  time: z.string({
    required_error: "Debes seleccionar una hora",
  }),
  duration: z.coerce.number().min(10, "La duración mínima es de 10 minutos"),
  location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  onCloseDialog: () => void;
  userId: number;
}

export default function AppointmentForm({ onCloseDialog, userId }: AppointmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");

  // Get horses owned by the user
  const { data: horses } = useQuery<Horse[]>({
    queryKey: ['/api/horses'],
  });

  // Get connections (to filter professionals by connection status)
  const { data: connections } = useQuery<any[]>({
    queryKey: ['/api/connections'],
  });

  // Get all professionals user is connected with
  const { data: professionals } = useQuery<User[]>({
    queryKey: ['/api/users/professionals'],
  });

  // Filter professionals by connection status and selected service type
  const connectedProfessionals = professionals?.filter(pro => {
    // Check if there's an accepted connection with this professional
    const isConnected = connections?.some(
      conn => conn.professionalId === pro.id && conn.status === 'accepted'
    );
    
    // Filter by service type if selected
    const matchesServiceType = !selectedServiceType || pro.userType === selectedServiceType;
    
    return isConnected && matchesServiceType;
  });

  // Form definition
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: "",
      duration: 60,
      location: "",
      notes: "",
      time: "10:00",
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      // Asegurarnos de incluir todos los campos necesarios
      const appointmentData = {
        ...data,
        status: "pending",
        createdBy: "client",
        paymentStatus: "pending",
        paymentMethod: null,
        paymentId: null,
        reminderSent: false,
        reportSent: false,
        hasAlternative: false,
        originalAppointmentId: null,
        invoiceUrl: null,
        commission: Math.round((data.price || 0) * 0.05) // 5% de comisión
      };
      
      const res = await apiRequest("POST", "/api/appointments", appointmentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Cita creada",
        description: "La cita ha sido programada correctamente.",
      });
      onCloseDialog();
    },
    onError: (error) => {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "No se pudo programar la cita. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Watch para professionalId pero usando una manera correcta
  const professionalId = form.watch("professionalId");
  
  // Update serviceType based on selected professional (solo una vez al seleccionar)
  useEffect(() => {
    if (professionalId) {
      const professional = professionals?.find(p => p.id === parseInt(professionalId));
      if (professional) {
        form.setValue("serviceType", professional.userType as string);
      }
    }
  }, [professionalId, professionals]);

  // Helper function to convert form data to appointment data
  const formatAppointmentData = (data: AppointmentFormValues) => {
    // Combine date and time
    const dateTime = new Date(data.date);
    const [hours, minutes] = data.time.split(":").map(Number);
    dateTime.setHours(hours, minutes);
    
    return {
      horseId: data.horseId, // Campo requerido por la BD
      horseIds: [data.horseId], // Array para procesar múltiples caballos en el futuro
      professionalId: data.professionalId,
      serviceType: data.serviceType,
      title: data.title,
      date: dateTime.toISOString(),
      duration: data.duration,
      location: data.location,
      notes: data.notes,
      status: "pending",
      clientId: userId,
      createdBy: "client", // Añadir campo requerido
      paymentStatus: "pending",
      reminderSent: false,
      reportSent: false,
      hasAlternative: false
    };
  };

  // Submit handler
  async function onSubmit(data: AppointmentFormValues) {
    const appointmentData = formatAppointmentData(data);
    createAppointmentMutation.mutate(appointmentData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="horseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caballo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un caballo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {horses?.map((horse) => (
                      <SelectItem key={horse.id} value={horse.id.toString()}>
                        {horse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="professionalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profesional</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const professional = professionals?.find(p => p.id === parseInt(value));
                    if (professional) {
                      form.setValue("serviceType", professional.userType as string);
                    }
                  }}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un profesional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {connectedProfessionals?.length ? (
                      connectedProfessionals.map((pro) => (
                        <SelectItem key={pro.id} value={pro.id.toString()}>
                          {pro.fullName} ({SERVICE_TYPE_LABELS[pro.userType as ServiceType]})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No tienes conexiones con profesionales
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la cita</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Revisión de herraduras" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de servicio</FormLabel>
              <Select
                onValueChange={(value) => {
                  // Solo cambiamos el valor del campo sin más efectos secundarios
                  field.onChange(value);
                  // No se actualiza el profesional ni filtra nada
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de servicio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vet_visit">Visita Veterinaria</SelectItem>
                  <SelectItem value="farrier">Herrado</SelectItem>
                  <SelectItem value="dental">Revisión Dental</SelectItem>
                  <SelectItem value="physio">Fisioterapia</SelectItem>
                  <SelectItem value="training">Entrenamiento</SelectItem>
                  <SelectItem value="cleaning">Limpieza</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "P")
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora</FormLabel>
                <div className="flex">
                  <FormControl>
                    <div className="relative w-full">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración (minutos)</FormLabel>
                <FormControl>
                  <Input type="number" min="10" step="5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Club Hípico Andaluz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Instrucciones o información adicional para el profesional"
                  className="resize-none h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCloseDialog}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-equi-green hover:bg-equi-light-green"
            disabled={createAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending ? "Programando..." : "Programar Cita"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
