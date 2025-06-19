import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { User, USER_TYPE_LABELS, SubscriptionType, UserType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, MapPin, Phone, Mail, Edit, Save, Info, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { ImageUpload } from "@/components/ui/image-upload";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import ConnectAccountStatus from "@/components/stripe/ConnectAccountStatus";
import { format } from "date-fns";

interface ProfilePageProps {
  user: User;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

export default function ProfilePage({ user, logout }: ProfilePageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  
  // Para depurar userType e isProfessional
  console.log("User Details:", {
    userType: user.userType,
    isProfessional: user.isProfessional,
    fullUserObject: user
  });
  
  // Para profesionales, mostramos la pestaña de información bancaria por defecto
  const [activeTab, setActiveTab] = useState(
    (user.userType === "professional" || user.isProfessional) ? "banking" : "profile"
  );
  
  // Local state for form data
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address || "",
    description: user.description || "",
    profileImage: user.profileImage || "",
    // Campos para información fiscal y bancaria
    taxId: user.taxId || "",
    businessName: user.businessName || "",
    businessAddress: user.businessAddress || "",
    accountNumber: user.accountNumber || "",
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Añadir logs para depuración
        console.log("Datos para actualizar:", data);
        
        const res = await apiRequest("PUT", `/api/users/${user.id}`, data, {
          headers: { "Accept": "application/json" },
          timeout: 20000, // 20 segundos para permitir imágenes grandes
        });
        
        // Comprobar si la respuesta es JSON válido antes de procesarla
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await res.json();
          console.log("Respuesta de actualización:", result);
          return result;
        } else {
          const text = await res.text();
          console.error("Respuesta no JSON:", text);
          throw new Error("La respuesta del servidor no es un JSON válido");
        }
      } catch (err) {
        console.error("Error en la mutación:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Perfil actualizado con éxito:", data);
      
      // Forzar actualización de la caché del usuario actual
      queryClient.setQueryData([`/api/users/${user.id}`], data);
      
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado correctamente.",
      });
      
      // Actualizar también los datos de formulario locales
      setFormData({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        description: data.description || "",
        profileImage: data.profileImage || "",
        taxId: data.taxId || "",
        businessName: data.businessName || "",
        businessAddress: data.businessAddress || "",
        accountNumber: data.accountNumber || "",
      });
      
      setEditMode(false);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSubscriptionLabel = (type: SubscriptionType | undefined) => {
    if (!type) return "Básica";
    return type === "premium" ? "Premium" : "Básica";
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-3xl font-display font-bold text-equi-charcoal">Mi Perfil</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="profile">Información Personal</TabsTrigger>
            {(user.userType === "professional" || user.isProfessional) && (
              <TabsTrigger value="banking">Información Bancaria y Pagos</TabsTrigger>
            )}
            <TabsTrigger value="subscription">Suscripción</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>
                      Gestiona tu información personal
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditMode(!editMode)}
                    size="sm"
                  >
                    {editMode ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Cancelar
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left column - Avatar and basic info */}
                  <div className="flex flex-col items-center space-y-4">
                    {editMode ? (
                      <div className="w-32">
                        <ImageUpload
                          value={formData.profileImage}
                          onChange={(value) => setFormData(prev => ({ ...prev, profileImage: value }))}
                          className="mt-1 w-32 h-32 rounded-full"
                        />
                      </div>
                    ) : (
                      <Avatar className="w-32 h-32">
                        <AvatarImage src={formData.profileImage} />
                        <AvatarFallback className="text-2xl bg-equi-green">
                          {user.fullName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className="text-center">
                      <h3 className="font-semibold text-xl">{user.fullName}</h3>
                      <Badge variant="outline">
                        {user.isProfessional 
                          ? USER_TYPE_LABELS[user.userType as UserType] 
                          : "Cliente"
                        }
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-2 w-full">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{user.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right column - Form */}
                  <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Nombre completo</Label>
                          <Input 
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleFieldChange}
                            disabled={!editMode}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleFieldChange}
                            disabled={!editMode}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input 
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleFieldChange}
                            disabled={!editMode}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address">Dirección</Label>
                          <Input 
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleFieldChange}
                            disabled={!editMode}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea 
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleFieldChange}
                          disabled={!editMode}
                          rows={4}
                        />
                      </div>
                      
                      {editMode && (
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            className="bg-equi-green hover:bg-equi-light-green"
                            disabled={updateProfileMutation.isPending}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                          </Button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {(user.userType === "professional" || user.isProfessional) && (
            <TabsContent value="banking" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle>Información Bancaria y Pagos</CardTitle>
                    <CardDescription>
                      Configura tu cuenta bancaria para recibir pagos directamente de los clientes
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-equi-charcoal">Configuración de Pagos</h3>
                      
                      <Alert className="bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          <AlertTitle>Sistema de pagos</AlertTitle>
                        </div>
                        <AlertDescription className="mt-2">
                          <ul className="list-disc list-inside space-y-2 text-sm">
                            <li>Los clientes realizan pagos a través de nuestra plataforma</li>
                            <li>El dinero se transfiere directamente a tu cuenta bancaria</li>
                            <li>La plataforma cobra una comisión fija de 0,99€ por transacción</li>
                            <li>Se generan facturas automáticamente para ti y tus clientes</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                      
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Información para facturación</h4>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="taxId">NIF/CIF</Label>
                              <Input
                                id="taxId"
                                name="taxId"
                                value={formData.taxId || ''}
                                onChange={handleFieldChange}
                                disabled={!editMode}
                                placeholder="Ej: B12345678"
                              />
                            </div>
                            <div>
                              <Label htmlFor="businessName">Nombre fiscal</Label>
                              <Input
                                id="businessName"
                                name="businessName"
                                value={formData.businessName || ''}
                                onChange={handleFieldChange}
                                disabled={!editMode}
                                placeholder="Nombre comercial o razón social"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="businessAddress">Dirección fiscal</Label>
                            <Textarea
                              id="businessAddress"
                              name="businessAddress"
                              value={formData.businessAddress || ''}
                              onChange={handleFieldChange}
                              disabled={!editMode}
                              placeholder="Dirección completa para facturación"
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label htmlFor="accountNumber">Número de cuenta bancaria (IBAN)</Label>
                            <Input
                              id="accountNumber"
                              name="accountNumber"
                              value={formData.accountNumber || ''}
                              onChange={handleFieldChange}
                              disabled={!editMode}
                              placeholder={editMode ? "ES00 0000 0000 0000 0000 0000" : ""}
                              className={!editMode && !formData.accountNumber ? "italic text-muted-foreground" : ""}
                            />
                            {!formData.accountNumber && !editMode && (
                              <p className="text-xs text-muted-foreground mt-1">
                                No has configurado tu cuenta bancaria aún. Haz clic en "Editar" para añadirla.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                      <h3 className="text-lg font-semibold text-equi-charcoal mb-4">Conecta tu cuenta bancaria</h3>
                      
                      <ConnectAccountStatus />
                      
                      <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-md">
                        <h4 className="font-medium text-sm mb-2">Proceso de facturación</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex gap-2">
                            <div className="bg-equi-light-green text-equi-green w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs">1</span>
                            </div>
                            <span>Cliente realiza el pago por el servicio</span>
                          </li>
                          <li className="flex gap-2">
                            <div className="bg-equi-light-green text-equi-green w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs">2</span>
                            </div>
                            <span>El sistema transfiere el pago a tu cuenta (menos 0,99€ de comisión)</span>
                          </li>
                          <li className="flex gap-2">
                            <div className="bg-equi-light-green text-equi-green w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs">3</span>
                            </div>
                            <span>Se generan facturas automáticas para ti y el cliente</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
                {editMode && (
                  <CardFooter>
                    <Button 
                      type="submit" 
                      onClick={handleSubmit}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar cambios
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="subscription" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Suscripción</CardTitle>
                <CardDescription>
                  Gestiona tu suscripción y plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Componente de Stripe Connect para profesionales */}
                {user.userType === "professional" && (
                  <div className="mb-8">
                    <ConnectAccountStatus />
                  </div>
                )}
                
                {/* Componente de planes de suscripción */}
                <SubscriptionPlans />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>
                  Gestiona la configuración de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Preferencias</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notificaciones por correo</p>
                          <p className="text-sm text-muted-foreground">
                            Recibe alertas y novedades en tu correo electrónico
                          </p>
                        </div>
                        <Button variant="outline">Configurar</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Seguridad</p>
                          <p className="text-sm text-muted-foreground">
                            Cambia tu contraseña y configura opciones de seguridad
                          </p>
                        </div>
                        <Button variant="outline">Configurar</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-red-600">Opciones avanzadas</h3>
                    
                    <div className="space-y-2">
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          if (confirm("¿Estás seguro de que quieres cerrar tu cuenta? Esta acción no se puede deshacer.")) {
                            // Lógica para eliminar cuenta
                            toast({
                              title: "Cuenta eliminada",
                              description: "Tu cuenta ha sido eliminada correctamente.",
                            });
                          }
                        }}
                      >
                        Cerrar cuenta
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Al cerrar tu cuenta, todos tus datos serán eliminados permanentemente
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}