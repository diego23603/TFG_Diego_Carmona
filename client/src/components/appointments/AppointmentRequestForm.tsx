import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Horse, ServiceType, SERVICE_TYPE_LABELS, User } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Esquema base común para ambos tipos de usuarios
const baseAppointmentSchema = {
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres' }),
  horseIds: z.array(z.number()).min(1, { message: 'Debes seleccionar al menos un caballo' }),
  serviceType: z.enum(['vet_visit', 'farrier', 'dental', 'physio', 'training', 'cleaning'] as const),
  date: z.date({ required_error: 'Debes seleccionar una fecha' }),
  location: z.string().min(3, { message: 'Debes indicar una ubicación válida' }),
  notes: z.string().optional(),
  isPeriodic: z.boolean().default(false),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  endDate: z.date().optional(),
};

// Esquema específico para profesionales: incluye price y duration obligatorios
const professionalAppointmentSchema = z.object({
  ...baseAppointmentSchema,
  time: z.string().refine(val => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), {
    message: 'Formato de hora inválido (HH:MM)'
  }),
  duration: z.number().min(15, { message: 'La duración mínima es de 15 minutos' }).max(480, { message: 'La duración máxima es de 8 horas' }),
  price: z.number().min(0, { message: 'El precio no puede ser negativo' }),
  clientId: z.number(), // Obligatorio para profesionales
  professionalId: z.number().optional(),
});

// Esquema específico para clientes: no incluye duración y el precio es opcional
const clientAppointmentSchema = z.object({
  ...baseAppointmentSchema,
  time: z.string().refine(val => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), {
    message: 'Formato de hora inválido (HH:MM)'
  }),
  duration: z.number().optional(), // Opcional para clientes
  price: z.number().optional(), // Opcional para clientes
  professionalId: z.number(), // Obligatorio para clientes
  clientId: z.number().optional(),
});

// Selecciona el esquema apropiado dependiendo de si el usuario es profesional o no
const appointmentSchema = z.union([professionalAppointmentSchema, clientAppointmentSchema]);

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentRequestFormProps {
  onSuccess?: () => void;
  initialProfessionalId?: number;
  initialClientId?: number;
  onCancel?: () => void;
}

export function AppointmentRequestForm({ 
  onSuccess, 
  initialProfessionalId,
  initialClientId,
  onCancel 
}: AppointmentRequestFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Formulario
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(user?.isProfessional ? professionalAppointmentSchema : clientAppointmentSchema),
    defaultValues: {
      title: '',
      horseIds: [],
      serviceType: user?.isProfessional ? 
        (user.userType === 'vet' ? 'vet_visit' : 
         user.userType === 'farrier' ? 'farrier' : 
         user.userType === 'dentist' ? 'dental' : 
         user.userType === 'physio' ? 'physio' : 
         user.userType === 'trainer' ? 'training' : 
         user.userType === 'cleaner' ? 'cleaning' : 'vet_visit') : 
        'vet_visit',
      date: new Date(),
      time: '10:00',
      duration: user?.isProfessional ? 60 : undefined,
      location: '',
      notes: '',
      isPeriodic: false,
      price: user?.isProfessional ? 0 : undefined,
      professionalId: initialProfessionalId,
      clientId: initialClientId
    }
  });

  const isPeriodic = form.watch('isPeriodic');
  const selectedHorses = form.watch('horseIds');
  
  // Estado para ID de cliente seleccionado
  const selectedClientId = form.watch('clientId');
  
  // Consultar caballos según el contexto:
  // - Si es cliente: sus propios caballos
  // - Si es profesional: caballos del cliente seleccionado
  const { data: horses, isLoading: horsesLoading } = useQuery<Horse[]>({
    queryKey: [user?.isProfessional ? `/api/users/${selectedClientId || initialClientId}/horses` : '/api/horses'],
    enabled: !user?.isProfessional || !!initialClientId || !!selectedClientId
  });

  // Consultar profesionales si el usuario es cliente y no hay uno preseleccionado
  const { data: professionals, isLoading: professionalsLoading } = useQuery<User[]>({
    queryKey: ['/api/users/professionals'],
    enabled: !user?.isProfessional && !initialProfessionalId
  });

  // Consultar clientes si el usuario es profesional y no hay uno preseleccionado
  const { data: clients, isLoading: clientsLoading } = useQuery<User[]>({
    queryKey: ['/api/users/clients'],
    enabled: !!user?.isProfessional && !initialClientId
  });

  // Mutación para crear cita
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const response = await apiRequest('POST', '/api/appointments', {
        ...data,
        // Combinamos fecha y hora
        date: combinarFechaHora(data.date, data.time)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la cita');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Cita solicitada",
        description: "La solicitud de cita se ha enviado correctamente",
        variant: "default"
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo crear la cita: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Función para combinar fecha y hora
  function combinarFechaHora(fecha: Date, hora: string): string {
    const [horas, minutos] = hora.split(':').map(Number);
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setHours(horas, minutos, 0, 0);
    return nuevaFecha.toISOString();
  }

  // Función para avanzar al siguiente paso
  const nextStep = async () => {
    let result = false;
    
    // Validación específica para cada paso
    if (step === 1) {
      // Validar campos básicos comunes
      const baseFields = ['title', 'horseIds', 'serviceType', 'date', 'time'];
      
      // Para profesionales validar también precio y duración
      if (user?.isProfessional) {
        baseFields.push('duration', 'price');
      }
      
      // Validaciones específicas para profesional o cliente
      if (!user?.isProfessional && !initialProfessionalId) {
        baseFields.push('professionalId');
      }
      
      if (user?.isProfessional && !initialClientId) {
        baseFields.push('clientId');
      }
      
      result = await form.trigger(baseFields as any);
    } 
    else if (step === 2) {
      // Validación para ubicación y periodicidad
      const locationFields = ['location', 'isPeriodic'];
      
      if (isPeriodic) {
        locationFields.push('frequency', 'endDate');
      }
      
      result = await form.trigger(locationFields as any);
    }
    else {
      // Último paso, validar todo el formulario
      result = await form.trigger();
    }
    
    if (result) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        // Último paso: enviar formulario
        handleSubmit();
      }
    }
  };

  // Función para volver al paso anterior
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  // Manejar envío del formulario
  const handleSubmit = () => {
    setLoading(true);
    createAppointmentMutation.mutate(form.getValues(), {
      onSettled: () => setLoading(false)
    });
  };

  if (horsesLoading || professionalsLoading || clientsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-equi-green" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Pasos del formulario */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-equi-green' : 'bg-gray-200'}`}></div>
          <div className="w-4"></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-equi-green' : 'bg-gray-200'}`}></div>
          <div className="w-4"></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-equi-green' : 'bg-gray-200'}`}></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <div className={step >= 1 ? 'text-equi-charcoal font-medium' : ''}>Información básica</div>
          <div className={step >= 2 ? 'text-equi-charcoal font-medium' : ''}>Ubicación y periodicidad</div>
          <div className={step >= 3 ? 'text-equi-charcoal font-medium' : ''}>Revisión y confirmación</div>
        </div>
      </div>
      
      <Form {...form}>
        <form className="space-y-6">
          {/* PASO 1: Información básica */}
          {step === 1 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título de la cita</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Revisión dental rutinaria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Selección de profesional (si es cliente) */}
              {!user?.isProfessional && !initialProfessionalId && (
                <FormField
                  control={form.control}
                  name="professionalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profesional</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un profesional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {professionals?.map((professional) => (
                            <SelectItem key={professional.id} value={professional.id.toString()}>
                              {professional.fullName} ({professional.userType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Selección de cliente (si es profesional) */}
              {user?.isProfessional && !initialClientId && (
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Selección múltiple de caballos */}
              <FormField
                control={form.control}
                name="horseIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Caballos</FormLabel>
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        Selecciona uno o varios caballos para esta cita
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {horses?.map((horse) => (
                          <FormField
                            key={horse.id}
                            control={form.control}
                            name="horseIds"
                            render={({ field }) => {
                              return (
                                <FormItem key={horse.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(horse.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, horse.id])
                                          : field.onChange(field.value?.filter((value) => value !== horse.id));
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-normal">
                                      {horse.name}
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                      {horse.breed}, {horse.age} años
                                    </p>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Tipo de servicio */}
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
                        {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Fecha */}
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
                            className="pl-3 text-left font-normal"
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Hora y duración */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* El campo de duración solo se muestra para profesionales */}
                {user?.isProfessional && (
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (min)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || "60"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Duración" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="45">45 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="90">1 hora 30 minutos</SelectItem>
                            <SelectItem value="120">2 horas</SelectItem>
                            <SelectItem value="180">3 horas</SelectItem>
                            <SelectItem value="240">4 horas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Indica cuánto tiempo llevará el servicio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* PASO 2: Ubicación y periodicidad */}
          {step === 2 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa" {...field} />
                    </FormControl>
                    <FormDescription>
                      Indica la dirección exacta donde se realizará el servicio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Precio - solo visible para profesionales */}
              {user?.isProfessional && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ej: 50" 
                          min="0"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Establece el precio para este servicio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas adicionales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Instrucciones especiales, detalles adicionales..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium leading-6">Cita periódica</h3>
                    <p className="text-sm text-muted-foreground">
                      Establece esta cita como un evento recurrente
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="isPeriodic"
                    render={({ field }) => (
                      <FormItem className="flex-1 flex items-center justify-end space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {isPeriodic && (
                  <div className="pt-2 space-y-4">
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una frecuencia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="biweekly">Quincenal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
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
                          <FormLabel>Fecha de finalización</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="pl-3 text-left font-normal"
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
                                disabled={(date) => date <= form.getValues().date}
                                initialFocus
                                locale={es}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* PASO 3: Revisión y confirmación */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-equi-charcoal">Resumen de la solicitud</h2>
                <p className="text-muted-foreground">
                  Revisa los detalles antes de confirmar
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Detalles básicos</h3>
                    <div className="mt-2 text-equi-charcoal">
                      <p className="text-lg font-medium">{form.getValues().title}</p>
                      <p className="text-sm">
                        {SERVICE_TYPE_LABELS[form.getValues().serviceType as ServiceType]}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(form.getValues().date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues().time}
                        {/* Solo mostrar duración si es profesional */}
                        {user?.isProfessional && form.getValues().duration ? 
                          ` (${form.getValues().duration} minutos)` : ''}
                      </p>
                      {isPeriodic && (
                        <div className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Cita periódica ({form.getValues().frequency === 'weekly' ? 'Semanal' : 
                                         form.getValues().frequency === 'biweekly' ? 'Quincenal' : 'Mensual'})
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues().location}
                      </p>
                    </div>
                  </div>
                  
                  {/* Mostrar precio si es profesional */}
                  {user?.isProfessional && form.getValues().price !== undefined && (
                    <div className="flex items-start space-x-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">Precio</p>
                        <p className="text-sm text-muted-foreground">
                          {form.getValues().price} €
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar información para clientes */}
                  {!user?.isProfessional && (
                    <div className="flex items-start space-x-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">Información importante</p>
                        <p className="text-sm text-muted-foreground">
                          El profesional determinará el precio y la duración estimada para este servicio.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Caballos seleccionados</h3>
                    <div className="mt-2 space-y-2">
                      {horses?.filter(horse => selectedHorses.includes(horse.id)).map(horse => (
                        <div key={horse.id} className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-equi-beige flex items-center justify-center text-equi-charcoal font-medium">
                            {horse.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{horse.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {horse.breed}, {horse.age} años
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {form.getValues().notes && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Notas adicionales</h3>
                      <div className="mt-2 bg-muted p-3 rounded-md">
                        <p className="text-sm">{form.getValues().notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      {user?.isProfessional 
                        ? "Esta solicitud será enviada al cliente para su aprobación. Solo el cliente podrá confirmar, rechazar o proponer una fecha alternativa."
                        : "Esta solicitud será enviada al profesional para su aprobación. Solo el profesional podrá confirmar, rechazar o proponer una fecha alternativa."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Botones de navegación */}
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
            >
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>
            
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={loading}
              className="bg-equi-green hover:bg-equi-light-green text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step < 3 ? 'Continuar' : 'Solicitar cita'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}