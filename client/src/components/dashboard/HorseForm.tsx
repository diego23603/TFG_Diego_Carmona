import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { Horse } from "@/lib/types";

// Form schema
const horseSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  breed: z.string().min(2, "La raza debe tener al menos 2 caracteres"),
  age: z.coerce.number().min(0, "La edad debe ser un número positivo"),
  color: z.string().min(2, "El color debe tener al menos 2 caracteres"),
  gender: z.enum(["male", "female"]),
  location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  profileImage: z.string().optional(),
});

type HorseFormValues = z.infer<typeof horseSchema>;

interface HorseFormProps {
  onSubmit: (data: HorseFormValues) => void;
  initialData?: Partial<Horse>;
  isLoading?: boolean;
}

export default function HorseForm({ onSubmit, initialData, isLoading = false }: HorseFormProps) {
  // Form definition
  const form = useForm<HorseFormValues>({
    resolver: zodResolver(horseSchema),
    defaultValues: {
      name: initialData?.name || "",
      breed: initialData?.breed || "",
      age: initialData?.age || 0,
      color: initialData?.color || "",
      gender: initialData?.gender || "male",
      location: initialData?.location || "",
      description: initialData?.description || "",
      profileImage: initialData?.profileImage || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del caballo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Raza</FormLabel>
                <FormControl>
                  <Input placeholder="Raza del caballo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Edad</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="Color del caballo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Hembra</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Ubicación actual del caballo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profileImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen del caballo (opcional)</FormLabel>
              <FormControl>
                <ImageUpload 
                  value={field.value || ''}
                  onChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <FormDescription className="text-xs mt-1">
                Puedes arrastrar y soltar una imagen o hacer clic para seleccionarla desde tu dispositivo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Características, temperamento, historial, etc."
                  className="resize-none h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="bg-equi-green hover:bg-equi-light-green"
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
