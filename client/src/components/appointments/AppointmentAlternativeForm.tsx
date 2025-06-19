import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Appointment } from '@/lib/types';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Loader2 } from 'lucide-react';

const alternativeSchema = z.object({
  alternativeDate: z.date({ required_error: 'Debes seleccionar una fecha alternativa' }),
  alternativeTime: z.string().refine(val => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), {
    message: 'Formato de hora inválido (HH:MM)'
  }),
  notes: z.string().optional(),
  price: z.string().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
    message: "El precio debe ser un número (con hasta 2 decimales)"
  }).transform(val => val ? parseFloat(val) : undefined),
});

type AlternativeFormData = z.infer<typeof alternativeSchema>;

interface AppointmentAlternativeFormProps {
  appointment: Appointment;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AppointmentAlternativeForm({ 
  appointment, 
  onSuccess, 
  onCancel 
}: AppointmentAlternativeFormProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<AlternativeFormData>({
    resolver: zodResolver(alternativeSchema),
    defaultValues: {
      alternativeDate: new Date(),
      alternativeTime: '10:00',
      notes: '',
      price: undefined,
    }
  });

  // Mutación para proponer alternativa
  const proposeAlternativeMutation = useMutation({
    mutationFn: async (data: AlternativeFormData) => {
      // Combinar fecha y hora
      const combinedDate = new Date(data.alternativeDate);
      const [hours, minutes] = data.alternativeTime.split(':').map(Number);
      combinedDate.setHours(hours, minutes, 0, 0);
      
      const response = await apiRequest('PUT', `/api/appointments/${appointment.id}`, {
        status: 'rejected',
        alternativeDate: combinedDate.toISOString(),
        notes: data.notes,
        price: data.price,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al proponer fecha alternativa');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Alternativa propuesta",
        description: "Se ha propuesto una fecha alternativa para la cita",
        variant: "default"
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo proponer la alternativa: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = form.handleSubmit((data) => {
    setLoading(true);
    proposeAlternativeMutation.mutate(data, {
      onSettled: () => setLoading(false)
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-equi-charcoal">Proponer fecha alternativa</h2>
          <p className="text-sm text-muted-foreground">
            Sugiere otra fecha y hora para la cita solicitada
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="alternativeDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha alternativa</FormLabel>
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
          
          <FormField
            control={form.control}
            name="alternativeTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora alternativa</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
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
              <FormLabel>Precio estimado (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0" 
                  min="0"
                  step="0.01"
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  value={field.value === undefined ? '' : field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo del cambio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Explica brevemente por qué propones esta alternativa..." 
                  className="min-h-[80px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancelar
          </Button>
          
          <Button 
            type="submit"
            disabled={loading}
            className="bg-equi-green hover:bg-equi-light-green text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Proponer alternativa
          </Button>
        </div>
      </form>
    </Form>
  );
}