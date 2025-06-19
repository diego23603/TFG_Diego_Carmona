import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import MessageList from "@/components/dashboard/MessageList";
import MessagingPanel from "@/components/dashboard/MessagingPanel";
import { User } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

interface MessagesPageProps {
  user: User;
  otherUserId?: number;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

export default function MessagesPage({ user, otherUserId, logout }: MessagesPageProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(otherUserId);
  // WebSocket completamente eliminado
  const [, setLocation] = useLocation();

  // WebSocket completamente eliminado en favor de un enfoque REST clásico

  // Update URL when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      setLocation(`/messages/${selectedUserId}`);
    } else {
      setLocation('/messages');
    }
  }, [selectedUserId, setLocation]);
  
  // Si llega con un otherUserId definido, utilízalo como selección inicial
  useEffect(() => {
    if (otherUserId && !selectedUserId) {
      setSelectedUserId(otherUserId);
      console.log("Estableciendo usuario inicial:", otherUserId);
    }
  }, [otherUserId, selectedUserId]);

  // Handle user selection from the sidebar
  const handleSelectUser = (userId: number) => {
    console.log("MessagesPage: Seleccionando usuario:", userId);
    // Forzar actualización incluso si se selecciona el mismo usuario
    setSelectedUserId(undefined);
    // Uso de setTimeout para asegurar que el estado se actualice adecuadamente
    setTimeout(() => {
      setSelectedUserId(userId);
    }, 50);
  };

  return (
    <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-bold text-equi-charcoal">
            Mensajes
          </h1>
        </div>

        <div className="border rounded-lg overflow-hidden h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversation list */}
            <div className="border-r h-full">
              <MessageList 
                onSelectUser={handleSelectUser} 
                selectedUserId={selectedUserId}
                currentUser={user}
              />
            </div>
            
            {/* Messages panel */}
            <div className="col-span-2 h-full flex flex-col">
              {selectedUserId ? (
                <MessagingPanel 
                  currentUser={user} 
                  otherUserId={selectedUserId}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-2">Selecciona una conversación para empezar a chatear</p>
                    <p className="text-sm">o busca un profesional para iniciar una nueva conversación</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
