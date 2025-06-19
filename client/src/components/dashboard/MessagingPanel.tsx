import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/ui/message-card";
import { AIAssistant } from "@/components/ui/ai-assistant";
import { User, Message, USER_TYPE_LABELS } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MessagingPanelProps {
  currentUser: User;
  otherUserId: number;
}

export default function MessagingPanel({ currentUser, otherUserId }: MessagingPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch other user details
  const { data: otherUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${otherUserId}`],
    // Using the default queryFn from queryClient
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1000 * 60, // 1 minuto
  });
  
  // Fetch message history
  const { 
    data: messages, 
    isLoading: isLoadingMessages,
    refetch: refetchMessages 
  } = useQuery<Message[]>({
    queryKey: [`/api/messages/${otherUserId}`],
    refetchInterval: 3000, // Poll every 3 seconds to update messages automatically
    staleTime: 2000, // Consider data stale after 2 seconds
    refetchOnWindowFocus: true, // Refresh when user focuses the window
  });
  
  // Create message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", {
        receiverId: otherUserId,
        content
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${otherUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setMessageText("");
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error al enviar mensaje",
        description: "No se pudo enviar el mensaje. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });
  
  // Send message handler
  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    // Usar siempre API REST para mayor estabilidad
    console.log('Sending message via API');
    sendMessageMutation.mutate(messageText);
  };
  
  // Handle key press to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // WebSocket desactivado para evitar errores
  // No se necesita un efecto adicional ya que usamos refetchInterval en la consulta
  
  const isLoading = isLoadingUser || isLoadingMessages;
  
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-16 border-b px-4 flex items-center">
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-16 w-3/4" />
          ))}
        </div>
        <div className="h-16 border-t p-2">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  
  if (!otherUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-16 border-b px-4 flex items-center">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={otherUser.profileImage ? otherUser.profileImage : undefined} />
          <AvatarFallback className="bg-equi-brown text-white">
            {otherUser.fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{otherUser.fullName}</h3>
          <p className="text-xs text-muted-foreground">
            {otherUser.isProfessional 
              ? `Profesional - ${otherUser.userType}` 
              : "Cliente"
            }
          </p>
        </div>
      </div>
      
      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto"
      >
        {messages && messages.length > 0 ? (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUser.id;
            
            // Determine if we should show avatar based on message grouping
            const showAvatar = index === 0 || 
              messages[index - 1].senderId !== message.senderId;
            
            return (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isOwn={isOwn}
                showAvatar={showAvatar}
                user={isOwn ? currentUser : otherUser}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-lg font-medium text-equi-charcoal mb-2">
              No hay mensajes con {otherUser.fullName}
            </p>
            <p className="text-muted-foreground text-center mb-6">
              {otherUser.isProfessional 
                ? `Este es un profesional de tipo: ${otherUser.userType === 'vet' ? 'Veterinario' :
                   otherUser.userType === 'farrier' ? 'Herrador' :
                   otherUser.userType === 'physio' ? 'Fisioterapeuta' :
                   otherUser.userType === 'dentist' ? 'Dentista Equino' :
                   otherUser.userType === 'trainer' ? 'Entrenador' :
                   otherUser.userType === 'cleaner' ? 'Limpieza de Vehículos' :
                   otherUser.userType}`
                : "Este usuario es un cliente de la plataforma"}
            </p>
            <p className="px-8 py-3 text-white rounded-md bg-equi-green shadow-sm">
              ¡Escribe un mensaje para comenzar la conversación!
            </p>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-2 border-t">
        {currentUser.isProfessional && (
          <div className="pb-2 border-b mb-2 flex justify-end">
            <AIAssistant 
              onSelectResponse={(response) => {
                setMessageText(response);
              }} 
              defaultPrompt={`Responder a pregunta sobre ${currentUser.userType === 'vet' ? 'salud equina' : 
                currentUser.userType === 'farrier' ? 'herraje y cascos' :
                currentUser.userType === 'physio' ? 'fisioterapia equina' :
                currentUser.userType === 'dentist' ? 'cuidado dental equino' :
                currentUser.userType === 'trainer' ? 'entrenamiento equino' :
                currentUser.userType === 'cleaner' ? 'mantenimiento de vehículos' :
                'cuidado equino'}`}
            />
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="bg-equi-green hover:bg-equi-light-green"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
