import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HorseCard } from "@/components/ui/horse-card";
import { Horse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import HorseForm from "./HorseForm";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { SkeletonCard } from "@/components/ui/skeleton";

interface HorseListProps {
  userId: number;
}

export default function HorseList({ userId }: HorseListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);

  const { data: horses, isLoading } = useQuery<Horse[]>({
    queryKey: ['/api/horses'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createHorseMutation = useMutation({
    mutationFn: async (horseData: Omit<Horse, 'id'>) => {
      const res = await apiRequest("POST", "/api/horses", horseData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
      toast({
        title: "Caballo creado",
        description: "El caballo ha sido añadido correctamente.",
      });
      setIsFormOpen(false);
      setSelectedHorse(null);
    },
    onError: (error) => {
      console.error("Error creating horse:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el caballo. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  const updateHorseMutation = useMutation({
    mutationFn: async (horseData: Horse) => {
      const { id, ...data } = horseData;
      const res = await apiRequest("PUT", `/api/horses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
      toast({
        title: "Caballo actualizado",
        description: "Los datos del caballo han sido actualizados correctamente.",
      });
      setIsFormOpen(false);
      setSelectedHorse(null);
    },
    onError: (error) => {
      console.error("Error updating horse:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el caballo. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleAddHorse = () => {
    setSelectedHorse(null);
    setIsFormOpen(true);
  };

  const handleEditHorse = (horse: Horse) => {
    setSelectedHorse(horse);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (selectedHorse) {
      updateHorseMutation.mutate({ ...selectedHorse, ...data });
    } else {
      createHorseMutation.mutate({ ...data, ownerId: userId });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold">Mis Caballos</h2>
        <Button 
          onClick={handleAddHorse}
          className="bg-equi-green hover:bg-equi-light-green"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Caballo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : horses?.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-medium mb-2">No tienes caballos registrados</h3>
          <p className="text-muted-foreground mb-4">Comienza añadiendo tu primer caballo</p>
          <Button 
            onClick={handleAddHorse}
            className="bg-equi-green hover:bg-equi-light-green"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir mi primer caballo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {horses?.map((horse) => (
            <HorseCard 
              key={horse.id} 
              horse={horse} 
              onEdit={() => handleEditHorse(horse)}
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedHorse ? "Editar Caballo" : "Añadir Nuevo Caballo"}
            </DialogTitle>
          </DialogHeader>
          <HorseForm 
            onSubmit={handleFormSubmit} 
            initialData={selectedHorse || undefined}
            isLoading={createHorseMutation.isPending || updateHorseMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
