import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { USER_TYPE_LABELS, UserType } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema
const registerSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
  fullName: z.string().min(3, "El nombre completo debe tener al menos 3 caracteres"),
  phone: z.string().min(9, "El número de teléfono debe tener al menos 9 dígitos"),
  address: z.string().optional(),
  userType: z.string(),
  description: z.string().optional(),
  isProfessional: z.boolean(),
  subscriptionType: z.string().nullable().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: (data: any) => void;
  defaultUserType?: UserType;
  defaultIsProfessional?: boolean;
  defaultSubscriptionType?: string | null;
}

export default function RegisterForm({
  onSuccess,
  defaultUserType = "client",
  defaultIsProfessional = false,
  defaultSubscriptionType = null,
}: RegisterFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  // Form definition
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      address: "",
      userType: defaultUserType,
      description: "",
      isProfessional: defaultIsProfessional,
      subscriptionType: defaultSubscriptionType,
    },
  });

  const professionalTypes = [
    { value: "vet", label: "Veterinario" },
    { value: "farrier", label: "Herrador" },
    { value: "dentist", label: "Dentista Equino" },
    { value: "physio", label: "Fisioterapeuta" },
    { value: "trainer", label: "Entrenador" },
    { value: "cleaner", label: "Limpieza de Vehículos" },
  ];

  // Submit handler
  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      // Remove confirmPassword as it's not needed for the API
      const { confirmPassword, ...registerData } = data;
      
      const response = await apiRequest("POST", "/api/users", registerData);
      const user = await response.json();
      
      toast({
        title: "Registro exitoso",
        description: "Has creado tu cuenta correctamente",
      });
      
      if (onSuccess) {
        onSuccess(user);
      } else {
        // Auto login and redirect to dashboard
        const loginResponse = await apiRequest("POST", "/api/auth/login", {
          username: data.username,
          password: data.password,
        });
        
        if (loginResponse.ok) {
          setLocation("/dashboard");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error de registro",
        description: "No se pudo completar el registro. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isProfessional = form.watch("isProfessional");

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Registro en EquiGest</CardTitle>
        <CardDescription>
          {isProfessional 
            ? "Crea tu cuenta como profesional para ofrecer tus servicios" 
            : "Crea tu cuenta para gestionar tus caballos y servicios"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre Apellidos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+34 000 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección completa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isProfessional && (
              <>
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de profesional</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu especialidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {professionalTypes.map((type) => (
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción profesional</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe tus servicios y experiencia..."
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-4 mt-6">
              <Button 
                type="submit" 
                className="w-full bg-equi-green hover:bg-equi-light-green"
                disabled={isLoading}
              >
                {isLoading ? "Registrando..." : "Registrarse"}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <span 
                  className="text-equi-green hover:underline cursor-pointer"
                  onClick={() => window.location.href = "/login"}
                >
                  Inicia sesión
                </span>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
