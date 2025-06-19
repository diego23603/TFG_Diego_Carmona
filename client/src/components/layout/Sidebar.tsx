import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home,
  Calendar, 
  Users, 
  MessageSquare, 
  User, 
  LogOut, 
  Menu, 
  X,
  BarChart,
  CircleDashed,
  Lightbulb
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-3 right-3 z-50 lg:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleMobileMenu} 
          className="bg-background shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-background transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and User Info */}
          <div className="p-3 border-b">
            <div className="flex items-center justify-center mb-3">
              <h1 className="text-lg font-bold text-primary">Equestrian Hub</h1>
            </div>
            {user && (
              <div className="flex items-center p-2 rounded-md">
                <Avatar className="h-9 w-9 mr-2">
                  <AvatarImage src={user.profileImage || ""} alt={user.fullName} />
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {user.userType === "client" ? "Cliente" :
                     user.userType === "vet" ? "Veterinario" :
                     user.userType === "farrier" ? "Herrador" :
                     user.userType === "trainer" ? "Entrenador" :
                     user.userType === "dentist" ? "Dentista" :
                     user.userType === "physio" ? "Fisioterapeuta" :
                     user.userType}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <Link href="/dashboard" onClick={closeMobileMenu}>
              <Button 
                variant={isActive("/dashboard") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Inicio
              </Button>
            </Link>
            {user && !user.isProfessional && (
              <>
                <Link href="/horses" onClick={closeMobileMenu}>
                  <Button 
                    variant={isActive("/horses") ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <CircleDashed className="mr-2 h-4 w-4" />
                    Mis Caballos
                  </Button>
                </Link>
                <Link href="/horse-history" onClick={closeMobileMenu}>
                  <Button 
                    variant={isActive("/horse-history") ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Historial de Caballos
                  </Button>
                </Link>
              </>
            )}
            {user && user.isProfessional && (
              <>
                <Link href="/statistics" onClick={closeMobileMenu}>
                  <Button 
                    variant={isActive("/statistics") ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <BarChart className="mr-2 h-4 w-4" />
                    Estadísticas
                  </Button>
                </Link>
                <Link href="/ai-assistant" onClick={closeMobileMenu}>
                  <Button 
                    variant={isActive("/ai-assistant") ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Asistente IA
                  </Button>
                </Link>
              </>
            )}
            
            {user && user.userType === 'admin' && (
              <Link href="/admin/statistics" onClick={closeMobileMenu}>
                <Button 
                  variant={isActive("/admin/statistics") ? "default" : "ghost"} 
                  className="w-full justify-start"
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Estadísticas Admin
                </Button>
              </Link>
            )}
            <Link href="/appointments" onClick={closeMobileMenu}>
              <Button 
                variant={isActive("/appointments") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Citas
              </Button>
            </Link>
            <Link href="/calendar" onClick={closeMobileMenu}>
              <Button 
                variant={isActive("/calendar") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calendario
              </Button>
            </Link>
            <Link href="/professionals" onClick={closeMobileMenu}>
              <Button 
                variant={isActive("/professionals") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Profesionales
              </Button>
            </Link>
            <Link href="/messages" onClick={closeMobileMenu}>
              <Button 
                variant={isActive("/messages") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Mensajes
              </Button>
            </Link>
            <Link href="/connections" onClick={closeMobileMenu}>
              <Button 
                variant={isActive("/connections") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Conexiones
              </Button>
            </Link>
          </nav>

          {/* User actions */}
          <div className="p-3 border-t">
            <Link href="/profile" onClick={closeMobileMenu}>
              <Button 
                variant="ghost" 
                className="w-full justify-start mb-1"
              >
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => {
                logout();
                closeMobileMenu();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
          onClick={closeMobileMenu}
        />
      )}
    </>
  );
}