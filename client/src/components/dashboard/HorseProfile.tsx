import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Horse,
  MedicalRecord,
  ServiceRecord,
  User,
  RECORD_TYPE_LABELS,
  RecordType
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, Stethoscope, Calendar } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { HorseHistoryViewer } from "@/components/dashboard/HorseHistoryViewer";
import AppointmentList from "@/components/dashboard/AppointmentList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface HorseProfileProps {
  horseId: number;
  user: User;
}

export default function HorseProfile({ horseId, user }: HorseProfileProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [recordType, setRecordType] = useState<"medical" | "service">("medical");
  
  const isProfessional = user.isProfessional;

  // Fetch horse details
  const { data: horse, isLoading: isLoadingHorse } = useQuery<Horse>({
    queryKey: [`/api/horses/${horseId}`],
  });

  // Fetch medical records
  const { data: medicalRecords, isLoading: isLoadingMedical } = useQuery<MedicalRecord[]>({
    queryKey: [`/api/horses/${horseId}/medical-records`],
    enabled: !!horseId,
  });

  // Fetch service records
  const { data: serviceRecords, isLoading: isLoadingService } = useQuery<ServiceRecord[]>({
    queryKey: [`/api/horses/${horseId}/service-records`],
    enabled: !!horseId,
  });

  // Add medical record mutation
  const addMedicalRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/horses/${horseId}/medical-records`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/horses/${horseId}/medical-records`] });
      toast({
        title: "Registro médico añadido",
        description: "El registro médico ha sido añadido correctamente.",
      });
      setIsRecordFormOpen(false);
    },
    onError: (error) => {
      console.error("Error adding medical record:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir el registro médico. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Add service record mutation
  const addServiceRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/horses/${horseId}/service-records`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/horses/${horseId}/service-records`] });
      toast({
        title: "Registro de servicio añadido",
        description: "El registro de servicio ha sido añadido correctamente.",
      });
      setIsRecordFormOpen(false);
    },
    onError: (error) => {
      console.error("Error adding service record:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir el registro de servicio. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleAddRecord = (type: "medical" | "service") => {
    setRecordType(type);
    setIsRecordFormOpen(true);
  };

  const handleRecordSubmit = (data: any) => {
    const recordData = {
      ...data,
      horseId,
      date: data.date.toISOString(),
    };

    if (recordType === "medical") {
      addMedicalRecordMutation.mutate(recordData);
    } else {
      addServiceRecordMutation.mutate(recordData);
    }
  };

  const isLoading = isLoadingHorse || isLoadingMedical || isLoadingService;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!horse) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Caballo no encontrado</h3>
        <p className="text-muted-foreground">
          No se pudo encontrar la información del caballo solicitado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-equi-cream rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1 p-6 bg-cover bg-center relative" 
            style={{ 
              backgroundImage: horse.profileImage
                ? `url(${horse.profileImage})`
                : "url('https://images.unsplash.com/photo-1598974357809-112c788e7f76?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')"
            }}>
            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-lg">
              <h3 className="text-2xl font-display font-bold mb-2">{horse.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">Raza:</span>
                  <span>{horse.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Edad:</span>
                  <span>{horse.age} años</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Sexo:</span>
                  <span>{horse.gender === 'male' ? 'Macho' : 'Hembra'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Color:</span>
                  <span>{horse.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Ubicación:</span>
                  <span>{horse.location}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="details">
                  <FileText className="mr-2 h-4 w-4" />
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="medical">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Historial Médico
                </TabsTrigger>
                <TabsTrigger value="services">
                  <FileText className="mr-2 h-4 w-4" />
                  Servicios
                </TabsTrigger>
                <TabsTrigger value="appointments">
                  <Calendar className="mr-2 h-4 w-4" />
                  Citas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Descripción</h4>
                    <p className="text-muted-foreground">
                      {horse.description || "No hay descripción disponible para este caballo."}
                    </p>
                  </div>
                  
                  {horse.description && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Características</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Raza: {horse.breed}</li>
                        <li>Edad: {horse.age} años</li>
                        <li>Color: {horse.color}</li>
                        <li>Sexo: {horse.gender === 'male' ? 'Macho' : 'Hembra'}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="medical">
                <HorseHistoryViewer horseId={horseId} />
              </TabsContent>
              
              <TabsContent value="services">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xl font-display font-semibold">Historial de Servicios</h4>
                    {isProfessional && (
                      <Button 
                        onClick={() => handleAddRecord("service")}
                        className="bg-equi-green hover:bg-equi-light-green"
                        size="sm"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir
                      </Button>
                    )}
                  </div>
                  
                  {serviceRecords && serviceRecords.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {serviceRecords.map((record) => (
                        <Card key={record.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between mb-1">
                              <p className="font-semibold">{record.serviceType}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(record.date), "d MMM yyyy", { locale: es })}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {record.professional?.fullName || "Profesional"}
                            </p>
                            <p className="text-sm">{record.description}</p>
                            {record.cost && (
                              <p className="text-sm font-medium text-right mt-2">
                                Coste: {record.cost} €
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground">
                      No hay registros de servicios disponibles
                    </p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="appointments">
                <AppointmentList user={user} horseId={horseId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={isRecordFormOpen} onOpenChange={setIsRecordFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {recordType === "medical" ? "Añadir Registro Médico" : "Añadir Registro de Servicio"}
            </DialogTitle>
          </DialogHeader>
          <SimpleRecordForm 
            onSubmit={handleRecordSubmit} 
            recordType={recordType}
            isLoading={addMedicalRecordMutation.isPending || addServiceRecordMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SimpleRecordFormProps {
  onSubmit: (data: any) => void;
  recordType: "medical" | "service";
  isLoading: boolean;
}

function SimpleRecordForm({ onSubmit, recordType, isLoading }: SimpleRecordFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedType, setSelectedType] = useState<string>(recordType === "medical" ? "medical" : "farrier");
  const [cost, setCost] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      title,
      description,
      date: selectedDate,
    };
    
    if (recordType === "medical") {
      data.recordType = selectedType;
    } else {
      data.serviceType = selectedType;
      if (cost) {
        data.cost = parseFloat(cost);
      }
    }
    
    onSubmit(data);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Título
        </label>
        <input
          id="title"
          className="w-full px-3 py-2 border rounded-md"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Fecha
        </label>
        <input
          type="date"
          className="w-full px-3 py-2 border rounded-md"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {recordType === "medical" ? "Tipo de registro" : "Tipo de servicio"}
        </label>
        <select
          className="w-full px-3 py-2 border rounded-md"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          required
        >
          {recordType === "medical" ? (
            <>
              <option value="medical">Médico</option>
              <option value="dental">Dental</option>
              <option value="farrier">Herraje</option>
              <option value="training">Entrenamiento</option>
            </>
          ) : (
            <>
              <option value="farrier">Herraje</option>
              <option value="dental">Dental</option>
              <option value="training">Entrenamiento</option>
              <option value="cleaning">Limpieza</option>
              <option value="transport">Transporte</option>
              <option value="other">Otro</option>
            </>
          )}
        </select>
      </div>
      
      {recordType === "service" && (
        <div className="space-y-2">
          <label htmlFor="cost" className="text-sm font-medium">
            Coste (€)
          </label>
          <input
            id="cost"
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border rounded-md"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Opcional"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit"
          className="bg-equi-green hover:bg-equi-light-green"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
