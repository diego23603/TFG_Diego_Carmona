import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Appointment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Esquema de validación para la respuesta del profesional
const responseSchema = z.object({
  price: z.number().min(0, { message: "El precio no puede ser negativo" }),
  duration: z.number().min(15, { message: "La duración mínima es de 15 minutos" }).max(480, { message: "La duración máxima es de 8 horas" }),
});

type ResponseFormData = z.infer<typeof responseSchema>;

interface ProfessionalResponseFormProps {
  appointment: Appointment;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProfessionalResponseForm({
  appointment,
  onSuccess,
  onCancel,
}: ProfessionalResponseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      price: appointment.price || 0,
      duration: appointment.duration || 60,
    },
  });

  const onSubmit = async (data: ResponseFormData) => {
    setIsSubmitting(true);
    try {
      // SOLUCIÓN DEFINITIVA - VERSIÓN 3.0: Conversión a céntimos para almacenamiento en la BD
      let precioEuros: number;
      
      // 1. Obtener el precio en euros
      const precioRaw = data.price;
      console.log("PROFESIONAL-FORM: Precio introducido:", {
        valor: precioRaw,
        tipo: typeof precioRaw
      });
      
      // 2. Conversión segura a número (euros con decimales)
      if (typeof precioRaw === 'string') {
        // Limpiar la cadena y convertir a número (formato europeo)
        const precioStr = String(precioRaw);
        const precioLimpio = precioStr.replace(/[^\d.,]/g, '').replace(',', '.');
        precioEuros = parseFloat(precioLimpio);
        console.log("PROFESIONAL-FORM: String convertido a euros:", precioEuros);
      } else if (typeof precioRaw === 'number') {
        precioEuros = precioRaw;
        console.log("PROFESIONAL-FORM: Ya es número (euros):", precioEuros);
      } else {
        try {
          precioEuros = Number(precioRaw);
          console.log("PROFESIONAL-FORM: Conversión forzada a euros:", precioEuros);
        } catch (err) {
          precioEuros = 0;
          console.error("PROFESIONAL-FORM: Error convirtiendo a euros:", err);
        }
      }
      
      // 3. Validación
      if (isNaN(precioEuros) || precioEuros <= 0) {
        toast({
          title: "Error de precio",
          description: "El precio debe ser un número mayor que cero. Por favor, introduce un precio válido.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // 4. Redondear a 2 decimales y convertir a céntimos para BD
      // Primero aseguramos que tenemos sólo 2 decimales máximo
      const precioEurosRedondeado = Math.round(precioEuros * 100) / 100;
      // Luego convertimos a céntimos (entero)
      const precioCentimos = Math.round(precioEurosRedondeado * 100);
      
      console.log("PROFESIONAL-FORM: CONVERSIÓN COMPLETA:", {
        precioOriginal: data.price,
        precioEuros: precioEurosRedondeado,
        precioCentimos: precioCentimos
      });
      
      // SOLUCIÓN DEFINITIVA - VERSIÓN 3.0: Enviar precio en céntimos para el almacenamiento en BD
      const requestData = {
        action: "accept",
        price: precioCentimos,      // Precio en CÉNTIMOS para la base de datos
        duration: Number(data.duration) // Duración convertida explícitamente a número
      };
      
      // JSON.stringify para asegurar que vemos exactamente lo que se envía al servidor
      console.log("PROFESIONAL-FORM: DATOS FINALES A ENVIAR:", JSON.stringify(requestData));
      
      // Verificación adicional del objeto a enviar
      if (typeof requestData.price !== 'number' || isNaN(requestData.price)) {
        console.error("PROFESIONAL-FORM: ERROR CRÍTICO - El precio no es un número válido después del procesamiento");
        toast({
          title: "Error de formato",
          description: "Error interno al procesar el precio. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiRequest("POST", `/api/appointments/${appointment.id}/respond`, requestData);

      if (response.ok) {
        const updatedAppointment = await response.json();
        console.log("FORMULARIO - Respuesta del servidor:", updatedAppointment);
        
        // SOLUCIÓN DEFINITIVA VERSIÓN 3.0: Verificación del precio guardado en céntimos
        // Obtener el precio recibido en céntimos
        const precioCentimosRecibido = typeof updatedAppointment.price === 'string' 
          ? parseInt(updatedAppointment.price) 
          : Number(updatedAppointment.price);
          
        console.log("FORMULARIO - Verificación de precio:", {
          centimosEnviados: precioCentimos,
          centimosRecibidos: precioCentimosRecibido,
          tipoPrecioRecibido: typeof updatedAppointment.price,
          coinciden: precioCentimos === precioCentimosRecibido
        });
        
        // Alerta si hay discrepancia
        if (precioCentimos !== precioCentimosRecibido) {
          console.warn("⚠️ ADVERTENCIA: Discrepancia de precio detectada:", {
            centimosEnviados: precioCentimos,
            centimosRecibidos: precioCentimosRecibido
          });
        }
        
        // Formatear precio para mostrar (convertir céntimos a euros para visualización)
        const precioFormateado = new Intl.NumberFormat('es-ES', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(precioEurosRedondeado);
        
        toast({
          title: "Cita confirmada con éxito",
          description: `Has fijado el precio en ${precioFormateado} y duración en ${data.duration} minutos`,
        });
        
        // Redirigir/actualizar
        onSuccess();
      } else {
        // Manejo mejorado de errores
        let errorMsg = "Ha ocurrido un error al responder a la cita";
        
        try {
          const errorData = await response.json();
          console.error("FORMULARIO - Error del servidor:", errorData);
          errorMsg = errorData.message || errorMsg;
        } catch (parseError) {
          console.error("FORMULARIO - Error al procesar respuesta de error:", parseError);
        }
        
        toast({
          title: "Error al confirmar cita",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al procesar la respuesta:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al responder a la cita",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Como profesional, debes especificar el precio y la duración estimada para este servicio antes de confirmar la cita.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (€)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                      €
                    </span>
                    <Input
                      type="number"
                      placeholder="200"
                      min="1"
                      step="0.01"
                      required
                      className="pl-8 font-semibold"
                      onChange={(e) => {
                        console.log("PRECIO - Valor introducido:", e.target.value);
                        
                        // Valor por defecto en caso de vacío o no válido
                        if (e.target.value === "") {
                          field.onChange("");
                          return;
                        }
                        
                        // Intentar convertir a número
                        const numValue = parseFloat(e.target.value);
                        console.log("PRECIO - Convertido a número:", numValue);
                        
                        if (!isNaN(numValue)) {
                          // Limitar a 2 decimales para evitar problemas de precisión
                          const formattedValue = Math.round(numValue * 100) / 100;
                          field.onChange(formattedValue);
                          console.log("PRECIO - Valor registrado:", formattedValue);
                        }
                      }}
                      value={field.value === 0 ? "" : field.value}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Establece el precio para este servicio
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar cita
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}