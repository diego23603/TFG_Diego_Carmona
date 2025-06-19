import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MessagePreviewCard } from "@/components/ui/message-card";
import { User, MessagePreview } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  onSelectUser: (userId: number) => void;
  selectedUserId?: number;
  currentUser: User;
}

export default function MessageList({ onSelectUser, selectedUserId, currentUser }: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: messages, isLoading } = useQuery<MessagePreview[]>({
    queryKey: ['/api/messages'],
    staleTime: 1000 * 10, // 10 segundos
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  const filteredMessages = messages?.filter(msg => 
    msg.otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array(5).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))
        ) : filteredMessages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground">No hay conversaciones que coincidan con tu búsqueda</p>
            {!messages || messages.length === 0 ? (
              <p className="text-sm mt-2">Aún no has iniciado ninguna conversación</p>
            ) : (
              <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
            )}
          </div>
        ) : (
          filteredMessages?.map((msgPreview, index) => (
            <div 
              key={`preview-${msgPreview.otherUser.id}-${index}`}
              className={`${selectedUserId === msgPreview.otherUser.id ? 'ring-2 ring-equi-green rounded-lg' : ''}`}
              onClick={() => {
                console.log("Seleccionando usuario:", msgPreview.otherUser.id);
                onSelectUser(msgPreview.otherUser.id);
              }}
            >
              <MessagePreviewCard
                user={msgPreview.otherUser}
                message={msgPreview.latestMessage}
                unreadCount={msgPreview.unreadCount}
                onClick={() => {
                  console.log("Click en tarjeta, seleccionando usuario:", msgPreview.otherUser.id);
                  onSelectUser(msgPreview.otherUser.id);
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
