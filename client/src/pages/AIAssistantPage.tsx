import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAIAssistant } from "@/hooks/use-ai-assistant";

import { Calendar, MessageSquare, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { User, Appointment, Message } from "@/lib/types";

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("appointments");
  
  // AI Assistant hook
  const { askAssistant, isLoading: isAILoading, history, clearHistory } = useAIAssistant();
  
  // Solo profesionales pueden acceder a esta página
  if (!user || !user.isProfessional) {
    return <Redirect to="/" />;
  }
  
  // Fetch clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5,
  });
  
  // Fetch appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    staleTime: 1000 * 60 * 5,
  });
  
  // Fetch recent messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<any[]>({
    queryKey: ['/api/messages'],
    staleTime: 1000 * 60,
  });
  
  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    
    await askAssistant(prompt);
    setPrompt("");
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };
  
  // Sugerencias de preguntas para el asistente según especialidad
  const getSuggestions = () => {
    switch (user?.userType) {
      case 'vet':
        return [
          "¿Cuáles son los signos más comunes de cólico en caballos?",
          "¿Qué vacunas son esenciales para un caballo de competición?",
          "¿Cómo puedo explicar a un cliente los cuidados post-operatorios para su caballo?"
        ];
      case 'farrier':
        return [
          "¿Qué signos indican un problema en el casco que requiere atención urgente?",
          "¿Cómo explico a un cliente la importancia del equilibrio en el herraje?",
          "Consejos para tratar cascos agrietados en caballos"
        ];
      case 'physio':
        return [
          "Ejercicios de rehabilitación para un caballo con lesión en el tendón",
          "¿Cómo evaluar la movilidad de las articulaciones de un caballo?",
          "Técnicas de masaje para aliviar la tensión muscular en caballos"
        ];
      case 'dentist':
        return [
          "Signos de problemas dentales en caballos",
          "¿Con qué frecuencia se recomienda revisar la dentición de un caballo?",
          "Cuidados post-tratamiento dental para caballos"
        ];
      case 'trainer':
        return [
          "Técnicas para caballos que tienen miedo al transporte",
          "Ejercicios para mejorar la flexibilidad lateral",
          "¿Cómo establecer una rutina de entrenamiento progresiva?"
        ];
      case 'cleaner':
        return [
          "Productos recomendados para la limpieza de remolques equinos",
          "Cómo eliminar olores persistentes en vehículos de transporte",
          "Mantenimiento preventivo para vehículos de transporte equino"
        ];
      default:
        return [
          "¿Cómo puedo mejorar la comunicación con mis clientes?",
          "Recomendaciones para el cuidado general de caballos",
          "¿Cuáles son las mejores prácticas en mi especialidad?"
        ];
    }
  };
  
  const suggestions = getSuggestions();
  const isLoading = isLoadingClients || isLoadingAppointments || isLoadingMessages;
  
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-equi-charcoal">Asistente de IA para Profesionales</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-[600px]">
        {/* Panel Principal - Asistente IA */}
        <div className="xl:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-equi-green text-white p-1 rounded">IA</span>
                Asistente Inteligente - Especialista en {user?.userType === 'vet' ? 'Veterinaria' : 
                  user?.userType === 'farrier' ? 'Herraje' :
                  user?.userType === 'physio' ? 'Fisioterapia' :
                  user?.userType === 'dentist' ? 'Odontología' :
                  user?.userType === 'trainer' ? 'Entrenamiento' :
                  user?.userType === 'cleaner' ? 'Limpieza' : 
                  'Cuidados'} Equina
              </CardTitle>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="flex-1 flex flex-col pt-6">
              <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-lg bg-gray-50/30 min-h-[300px]">
                {history.length === 0 ? (
                  <div className="text-center space-y-4 py-12">
                    <p className="text-lg text-muted-foreground">
                      Haz una pregunta a tu asistente especializado en equinos
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto mt-6">
                      {suggestions.map((suggestion, i) => (
                        <Button 
                          key={i} 
                          variant="outline" 
                          className="text-left justify-start h-auto py-3 px-4 whitespace-normal"
                          onClick={() => setPrompt(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "p-4 rounded-lg",
                          item.role === "user" 
                            ? "bg-blue-50 border border-blue-100 ml-8" 
                            : "bg-green-50 border border-green-100 mr-8"
                        )}
                      >
                        <p className="text-xs font-semibold mb-2 text-gray-600">
                          {item.role === "user" ? "Tu consulta:" : "Respuesta del asistente:"}
                        </p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
                      </div>
                    ))}
                    
                    {isAILoading && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-equi-green border-solid rounded-full"></div>
                        <span className="text-sm text-gray-600">Generando respuesta...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="mt-auto border-t pt-4">
              {history.length > 0 && (
                <div className="w-full mb-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearHistory} 
                    className="float-right"
                  >
                    Limpiar conversación
                  </Button>
                  <div className="clear-both"></div>
                </div>
              )}
              
              <div className="flex w-full gap-2">
                <Input
                  placeholder="Escribe tu consulta o pregunta profesional..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim() || isAILoading}
                  className="bg-equi-green hover:bg-equi-light-green text-white"
                >
                  Enviar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Panel Lateral - Información de Contexto */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Información de Contexto</CardTitle>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="pt-4">
              <Tabs defaultValue="appointments" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="appointments" className="text-xs sm:text-sm">
                    <Calendar className="h-4 w-4 mr-1 hidden sm:inline" />
                    Citas
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="text-xs sm:text-sm">
                    <Users className="h-4 w-4 mr-1 hidden sm:inline" />
                    Clientes
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="text-xs sm:text-sm">
                    <MessageSquare className="h-4 w-4 mr-1 hidden sm:inline" />
                    Mensajes
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="appointments" className="h-[340px] overflow-y-auto">
                  {isLoadingAppointments ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : appointments && appointments.length > 0 ? (
                    <div className="space-y-3">
                      {appointments.slice(0, 10).map((appointment) => (
                        <div key={appointment.id} className="p-3 border rounded-lg bg-white">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Cliente {appointment.clientId}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(appointment.date).toLocaleDateString('es-ES', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {appointment.notes && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No hay citas programadas</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="clients" className="h-[340px] overflow-y-auto">
                  {isLoadingClients ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : clients && clients.length > 0 ? (
                    <div className="space-y-3">
                      {clients.filter(c => !c.isProfessional).slice(0, 10).map((client) => (
                        <div key={client.id} className="p-3 border rounded-lg bg-white">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{client.fullName || client.username}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              Cliente
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{client.email}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No hay clientes registrados</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="messages" className="h-[340px] overflow-y-auto">
                  {isLoadingMessages ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.slice(0, 10).map((message, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-white">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {message.otherUser?.fullName || message.otherUser?.username || 'Cliente'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {message.lastMessage?.isRead ? '✓' : '●'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {message.lastMessage?.content || 'Sin mensajes'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No hay mensajes recientes</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}