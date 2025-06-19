import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Message, User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessagePreviewCardProps {
  user: User;
  message: Message;
  unreadCount?: number;
  onClick?: () => void;
}

export function MessagePreviewCard({ user, message, unreadCount = 0, onClick }: MessagePreviewCardProps) {
  const messageDate = new Date(message.timestamp);
  
  // Format the timestamp
  const getTimeDisplay = () => {
    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm");
    } else if (isYesterday(messageDate)) {
      return "Ayer";
    } else {
      return format(messageDate, "d MMM", { locale: es });
    }
  };
  
  // Obtener iniciales para el avatar fallback
  const initials = user.fullName ? user.fullName.substring(0, 2).toUpperCase() : "??";
  
  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        unreadCount > 0 && "bg-blue-50/50 border-blue-200"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImage || ""} alt={user.fullName} />
            <AvatarFallback className="bg-equi-green text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="ml-3 flex-grow">
            <div className="flex justify-between">
              <p className="font-semibold">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{getTimeDisplay()}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground truncate pr-2 max-w-[200px]">
                {message.content}
              </p>
              {unreadCount > 0 && (
                <span className="bg-equi-green text-white text-xs font-semibold h-5 w-5 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  user?: User;
}

export function MessageBubble({ message, isOwn, showAvatar = true, user }: MessageBubbleProps) {
  const messageDate = new Date(message.timestamp);
  const time = format(messageDate, "HH:mm");
  
  // Obtener iniciales para el avatar fallback
  const userInitials = user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "??";
  
  return (
    <div className={cn(
      "flex mb-4",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {!isOwn && showAvatar && user && (
        <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
          <AvatarImage src={user.profileImage || ""} alt={user.fullName} />
          <AvatarFallback className="bg-equi-brown text-white text-xs">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] rounded-lg px-3 py-2",
        isOwn 
          ? "bg-equi-green text-white rounded-br-none" 
          : "bg-gray-100 text-gray-800 rounded-bl-none"
      )}>
        <p className="text-sm mb-3">{message.content}</p>
        <div className="text-xs text-right mt-1">
          <span className={cn(
            isOwn ? "text-white/80" : "text-gray-500"
          )}>
            {time}
          </span>
        </div>
      </div>
      
      {isOwn && showAvatar && user && (
        <Avatar className="h-8 w-8 ml-2 mt-1 flex-shrink-0">
          <AvatarImage src={user.profileImage || ""} alt={user.fullName} />
          <AvatarFallback className="bg-equi-green text-white text-xs">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
