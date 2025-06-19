import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { User } from "@/lib/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User as UserIcon, LogOut, Settings } from "lucide-react";

// Componente de enlace estilizado para evitar anidamiento de <a> dentro de <a>
function StyledLink({ href, className, children }: { href: string, className?: string, children: React.ReactNode }) {
  return (
    <Link href={href}>
      <div className={cn("cursor-pointer", className)}>
        {children}
      </div>
    </Link>
  );
}

interface HeaderProps {
  user: User | null;
  transparent?: boolean;
  logout?: () => Promise<{ success: boolean; error?: any }>;
}

export default function Header({ user, transparent = false, logout }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    if (logout) {
      await logout();
      window.location.href = "/";
    }
  };

  return (
    <header className={cn(
      "w-full z-30",
      transparent 
        ? "absolute top-0 left-0 bg-transparent" 
        : "bg-white shadow-md"
    )}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <StyledLink href="/" className="text-equi-green text-3xl font-display font-bold">
            EquiGest
          </StyledLink>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <StyledLink 
            href="/"
            className={cn(
              "nav-item-hover px-1 py-2 font-medium transition",
              transparent ? "text-white hover:text-white" : "text-equi-charcoal hover:text-equi-green",
              location === "/" && "border-b-2 border-equi-gold"
            )}
          >
            Inicio
          </StyledLink>
          <StyledLink 
            href="/#services"
            className={cn(
              "nav-item-hover px-1 py-2 font-medium transition",
              transparent ? "text-white hover:text-white" : "text-equi-charcoal hover:text-equi-green"
            )}
          >
            Servicios
          </StyledLink>
          <StyledLink 
            href="/#professionals"
            className={cn(
              "nav-item-hover px-1 py-2 font-medium transition",
              transparent ? "text-white hover:text-white" : "text-equi-charcoal hover:text-equi-green"
            )}
          >
            Profesionales
          </StyledLink>
          <StyledLink 
            href="/#pricing"
            className={cn(
              "nav-item-hover px-1 py-2 font-medium transition",
              transparent ? "text-white hover:text-white" : "text-equi-charcoal hover:text-equi-green"
            )}
          >
            Precios
          </StyledLink>
          <StyledLink 
            href="/#contact"
            className={cn(
              "nav-item-hover px-1 py-2 font-medium transition",
              transparent ? "text-white hover:text-white" : "text-equi-charcoal hover:text-equi-green"
            )}
          >
            Contacto
          </StyledLink>
        </nav>
        
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <StyledLink 
                href="/dashboard"
                className={cn(
                  "hidden md:inline-block transition font-medium",
                  transparent ? "text-white" : "text-equi-charcoal hover:text-equi-green"
                )}
              >
                Panel
              </StyledLink>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "p-0 h-10 w-10 rounded-full",
                      transparent && "text-white hover:text-white hover:bg-white/20"
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={user.profileImage || ""} />
                      <AvatarFallback className="bg-equi-green text-white">
                        {user.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.fullName}
                  </div>
                  <DropdownMenuSeparator />
                  <StyledLink href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Panel</span>
                    </DropdownMenuItem>
                  </StyledLink>
                  <StyledLink href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                  </StyledLink>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <StyledLink 
                href="/login"
                className={cn(
                  "hidden md:inline-block transition font-medium",
                  transparent ? "text-white" : "text-equi-charcoal hover:text-equi-green"
                )}
              >
                Iniciar Sesión
              </StyledLink>
              <StyledLink 
                href="/register"
                className="bg-equi-green hover:bg-equi-light-green text-white font-medium py-2 px-4 rounded-md transition"
              >
                Registro
              </StyledLink>
            </>
          )}
          <button 
            className="md:hidden text-equi-charcoal focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <X className={cn("text-xl", transparent && "text-white")} />
            ) : (
              <Menu className={cn("text-xl", transparent && "text-white")} />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-2">
            <StyledLink href="/" className="block py-2 text-equi-charcoal hover:text-equi-green transition">
              Inicio
            </StyledLink>
            <StyledLink href="/#services" className="block py-2 text-equi-charcoal hover:text-equi-green transition">
              Servicios
            </StyledLink>
            <StyledLink href="/#professionals" className="block py-2 text-equi-charcoal hover:text-equi-green transition">
              Profesionales
            </StyledLink>
            <StyledLink href="/#pricing" className="block py-2 text-equi-charcoal hover:text-equi-green transition">
              Precios
            </StyledLink>
            <StyledLink href="/#contact" className="block py-2 text-equi-charcoal hover:text-equi-green transition">
              Contacto
            </StyledLink>
            {user ? (
              <>
                <StyledLink href="/dashboard" className="block py-2 text-equi-charcoal hover:text-equi-green transition">
                  Panel
                </StyledLink>
                <StyledLink href="/profile" className="block py-2 text-equi-charcoal hover:text-equi-green transition">
                  Perfil
                </StyledLink>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-equi-charcoal hover:text-equi-green transition"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <StyledLink href="/login" className="block py-2 text-equi-charcoal hover:text-equi-green transition">
                Iniciar Sesión
              </StyledLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
