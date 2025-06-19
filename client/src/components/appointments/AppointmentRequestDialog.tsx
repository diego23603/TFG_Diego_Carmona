import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema de validación
const appointmentSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres" }),
  serviceType: z.string().min(1, { message: "Selecciona un tipo de servicio" }),
  horseIds: z.array(z.number()).min(1, { message: "Selecciona al menos un caballo" }),
  date: z.date({ required_error: "Selecciona una fecha" }),
  time: z.string().min(1, { message: "Selecciona una hora" }),
  duration: z.coerce.number().min(15, { message: "La duración mínima es de 15 minutos" }),
  location: z.string().min(1, { message: "La ubicación es requerida" }),
  price: z.coerce.number().optional().default(0),
  notes: z.string().optional().default(""),
  isPeriodic: z.boolean().default(false),
  frequency: z.string().optional(),
  endDate: z.date().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

// Opciones de servicios
const serviceTypes = [
  { value: "vet_visit", label: "Visita veterinaria" },
  { value: "farrier", label: "Herrador" },
  { value: "dental", label: "Revisión dental" },
  { value: "physio", label: "Fisioterapia" },
  { value: "training", label: "Entrenamiento" },
  { value: "transport", label: "Transporte" },
  { value: "competition", label: "Competición" },
];

// Opciones de duración
const durationOptions = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 hora 30 minutos" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
];

// Opciones de frecuencia
const frequencyOptions = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quincenal" },
  { value: "monthly", label: "Mensual" },
];

// Horas disponibles (en un sistema real se consultarían al servidor)
const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return [
    { value: `${hour}:00`, label: `${hour}:00` },
    { value: `${hour}:30`, label: `${hour}:30` },
  ];
}).flat();

interface AppointmentRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  horses: Array<{ id: number; name: string }>;
  professional: {
    id: number;
    username: string;
    fullName?: string;
    userType: string;
  };
  clientId: number;
  onSuccess?: () => void;
}

export function AppointmentRequestDialog({
  isOpen,
  onClose,
  horses,
  professional,
  clientId,
  onSuccess,
}: AppointmentRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Inicializar formulario
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: "",
      serviceType: "",
      horseIds: [],
      date: undefined,
      time: "",
      duration: 60,
      location: "",
      price: 0,
      notes: "",
      isPeriodic: false,
      frequency: undefined,
      endDate: undefined,
    },
  });

  const isPeriodic = form.watch("isPeriodic");

  // Manejar envío del formulario
  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);

    try {
      // Combinar fecha y hora
      const [hours, minutes] = data.time.split(":").map(Number);
      const appointmentDate = new Date(data.date);
      appointmentDate.setHours(hours, minutes);

      // Preparar datos para envío - usando exactamente los campos requeridos por el esquema
      const appointmentData = {
        title: data.title,
        serviceType: data.serviceType,
        horseIds: data.horseIds,
        clientId: clientId,
        professionalId: professional.id,
        date: appointmentDate.toISOString(),
        duration: data.duration,
        location: data.location,
        price: Math.round(data.price * 100), // Convertir a centavos para Stripe
        notes: data.notes || null,
        isPeriodic: Boolean(data.isPeriodic),
        frequency: data.isPeriodic ? data.frequency : null,
        endDate: data.isPeriodic && data.endDate ? data.endDate.toISOString() : null,
        createdBy: "client", // Campo requerido por el backend
        status: "pending", // Estado inicial obligatorio
        paymentStatus: "pending", // Valor por defecto
        paymentMethod: null,
        paymentId: null,
        reminderSent: false,
        reportSent: false,
        hasAlternative: false,
        originalAppointmentId: null,
        invoiceUrl: null,
        commission: Math.round((data.price * 100) * 0.05) // 5% de comisión
      };

      // Enviar solicitud a la ruta correcta
      const response = await apiRequest("POST", "/api/appointments", appointmentData);

      if (response.ok) {
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud de cita ha sido enviada con éxito",
        });
        
        // Invalidar caché para actualizar la lista de citas
        queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
        
        if (onSuccess) {
          onSuccess();
        }
        
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Ha ocurrido un error al solicitar la cita",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al solicitar la cita",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar cita con {professional.fullName || professional.username}</DialogTitle>
          <DialogDescription>
            Completa los detalles para solicitar una cita con este profesional.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título de la cita</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Revisión rutinaria" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo de servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="horseIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Caballos</FormLabel>
                    <FormDescription>
                      Selecciona los caballos para esta cita
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {horses.map((horse) => (
                      <FormField
                        key={horse.id}
                        control={form.control}
                        name="horseIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={horse.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(horse.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, horse.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== horse.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {horse.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                              format(field.value, "PPP", { locale: es })
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
                          locale={es}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una hora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="max-h-[200px] overflow-y-auto">
                          {timeOptions.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la duración" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Centro ecuestre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio propuesto (EUR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Se aplicará una comisión del 5% para la plataforma.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPeriodic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Cita periódica</FormLabel>
                    <FormDescription>
                      Marcar si esta cita se repetirá periódicamente
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {isPeriodic && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la frecuencia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {frequencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha final</FormLabel>
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
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona fecha final</span>
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
                              form.getValues("date") &&
                              date <= form.getValues("date")
                            }
                            locale={es}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cualquier detalle importante que deba saber el profesional"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Solicitar cita"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}