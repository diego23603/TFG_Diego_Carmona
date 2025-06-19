import { useQuery, useMutation } from "@tanstack/react-query";
import { Horse } from "@shared/schema";
import { Link } from "wouter";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Edit, Trash } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function MyHorsesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddHorseDialog, setShowAddHorseDialog] = useState(false);
  const [showEditHorseDialog, setShowEditHorseDialog] = useState(false);
  const [currentHorse, setCurrentHorse] = useState<Horse | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
    color: "",
    gender: "male",
    location: "",
    description: "",
    profileImage: ""
  });

  const { data: horses, isLoading } = useQuery<Horse[]>({
    queryKey: ["/api/horses"],
    queryFn: () => 
      apiRequest("GET", `/api/horses`)
        .then(res => res.json()),
    enabled: !!user
  });

  const createHorseMutation = useMutation({
    mutationFn: (horseData: Omit<Horse, "id">) => 
      apiRequest("POST", "/api/horses", horseData)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
      setShowAddHorseDialog(false);
      resetForm();
      toast({
        title: "Caballo añadido",
        description: "El caballo ha sido añadido correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo añadir el caballo. " + error,
        variant: "destructive",
      });
    }
  });

  const updateHorseMutation = useMutation({
    mutationFn: (horseData: Partial<Horse>) => 
      apiRequest("PUT", `/api/horses/${currentHorse?.id}`, horseData)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
      setShowEditHorseDialog(false);
      resetForm();
      toast({
        title: "Caballo actualizado",
        description: "El caballo ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el caballo. " + error,
        variant: "destructive",
      });
    }
  });

  const deleteHorseMutation = useMutation({
    mutationFn: (horseId: number) => 
      apiRequest("DELETE", `/api/horses/${horseId}`)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
      toast({
        title: "Caballo eliminado",
        description: "El caballo ha sido eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el caballo. " + error,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      breed: "",
      age: "",
      color: "",
      gender: "male",
      location: "",
      description: "",
      profileImage: ""
    });
  };

  const openEditDialog = (horse: Horse) => {
    setCurrentHorse(horse);
    setFormData({
      name: horse.name,
      breed: horse.breed,
      age: horse.age.toString(),
      color: horse.color,
      gender: horse.gender,
      location: horse.location,
      description: horse.description || "",
      profileImage: horse.profileImage || ""
    });
    setShowEditHorseDialog(true);
  };

  const handleAddHorse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const horseData = {
      ownerId: user.id,
      name: formData.name,
      breed: formData.breed,
      age: parseInt(formData.age) || 0,
      color: formData.color,
      gender: formData.gender,
      location: formData.location,
      description: formData.description,
      profileImage: formData.profileImage
    };
    
    createHorseMutation.mutate(horseData);
  };

  const handleUpdateHorse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHorse) return;
    
    const horseData = {
      name: formData.name,
      breed: formData.breed,
      age: parseInt(formData.age) || 0,
      color: formData.color,
      gender: formData.gender,
      location: formData.location,
      description: formData.description,
      profileImage: formData.profileImage
    };
    
    updateHorseMutation.mutate(horseData);
  };

  const confirmDeleteHorse = (horseId: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este caballo?")) {
      deleteHorseMutation.mutate(horseId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Caballos</h1>
        <Button onClick={() => setShowAddHorseDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Caballo
        </Button>
      </div>

      {horses && horses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {horses.map((horse) => (
            <Card key={horse.id} className="overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img
                  src={horse.profileImage || "https://images.unsplash.com/photo-1603166868295-7a0e5d942147?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"}
                  alt={horse.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardHeader>
                <CardTitle>{horse.name}</CardTitle>
                <CardDescription>{horse.breed} • {horse.age} años</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Color:</span>
                    <span>{horse.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Género:</span>
                    <span>{horse.gender === 'male' ? 'Macho' : 'Hembra'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Ubicación:</span>
                    <span>{horse.location}</span>
                  </div>
                  {horse.description && (
                    <div className="pt-2">
                      <p className="text-muted-foreground">{horse.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => openEditDialog(horse)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => confirmDeleteHorse(horse.id)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground mb-4">No tienes ningún caballo registrado</p>
          <Button onClick={() => setShowAddHorseDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir mi primer caballo
          </Button>
        </div>
      )}

      {/* Diálogo para añadir caballo */}
      <Dialog open={showAddHorseDialog} onOpenChange={setShowAddHorseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Caballo</DialogTitle>
            <DialogDescription>
              Introduce los detalles de tu caballo. Podrás editar esta información más adelante.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddHorse}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed">Raza</Label>
                  <Input 
                    id="breed" 
                    name="breed" 
                    value={formData.breed} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input 
                    id="age" 
                    name="age" 
                    type="number" 
                    value={formData.age} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input 
                    id="color" 
                    name="color" 
                    value={formData.color} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleSelectChange("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Macho</SelectItem>
                      <SelectItem value="female">Hembra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="resize-none" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileImage">URL de Imagen (opcional)</Label>
                <Input 
                  id="profileImage" 
                  name="profileImage" 
                  value={formData.profileImage} 
                  onChange={handleInputChange} 
                  placeholder="https://..." 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddHorseDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createHorseMutation.isPending}>
                {createHorseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Caballo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar caballo */}
      <Dialog open={showEditHorseDialog} onOpenChange={setShowEditHorseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Caballo</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de tu caballo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateHorse}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input 
                    id="edit-name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-breed">Raza</Label>
                  <Input 
                    id="edit-breed" 
                    name="breed" 
                    value={formData.breed} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-age">Edad</Label>
                  <Input 
                    id="edit-age" 
                    name="age" 
                    type="number" 
                    value={formData.age} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-color">Color</Label>
                  <Input 
                    id="edit-color" 
                    name="color" 
                    value={formData.color} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Género</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleSelectChange("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Macho</SelectItem>
                      <SelectItem value="female">Hembra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Ubicación</Label>
                <Input 
                  id="edit-location" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="resize-none" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-profileImage">URL de Imagen (opcional)</Label>
                <Input 
                  id="edit-profileImage" 
                  name="profileImage" 
                  value={formData.profileImage} 
                  onChange={handleInputChange} 
                  placeholder="https://..." 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditHorseDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateHorseMutation.isPending}>
                {updateHorseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Caballo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}