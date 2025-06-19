import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "./queryClient";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}

export function useAuthProvider() {
  // Función separada para evitar errores de tipo en queryFn
  const fetchSession = async (): Promise<User | null> => {
    try {
      console.log("Verificando sesión de usuario...");
      const response = await fetch("/api/auth/session", {
        credentials: "include"
      });
      
      console.log("Respuesta de sesión:", response.status, response.statusText);
      
      if (response.status === 401) {
        console.log("Usuario no autenticado (401)");
        return null;
      }
      
      if (!response.ok) {
        console.error("Error de sesión:", response.statusText);
        return null;
      }
      
      const userData = await response.json();
      console.log("Sesión de usuario recuperada correctamente:", userData.id);
      return userData;
    } catch (error) {
      console.error("Error fetching session:", error);
      return null;
    }
  };
  
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/session"],
    queryFn: fetchSession,
    retry: 1, // Intentar al menos una vez en caso de error
    retryOnMount: true, // Reintentar al montar el componente
    // No lanzar errores durante errores de red o 401
    // en su lugar retornar null que es un valor válido
    refetchOnWindowFocus: true, // Refrescar al volver a la ventana
    staleTime: 60000 // Consideramos los datos "frescos" por 1 minuto
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error de inicio de sesión");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/session"], data);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error de registro");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/session"], data);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/session"], null);
    }
  });

  const login = async (credentials: { username: string; password: string }) => {
    try {
      await loginMutation.mutateAsync(credentials);
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    }
  };

  const register = async (userData: any) => {
    try {
      await registerMutation.mutateAsync(userData);
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout error:", error);
      // No re-lanzamos el error en logout para evitar problemas al cerrar sesión
    }
  };

  return {
    user: user || null,
    isLoading,
    error: error as Error,
    login,
    register,
    logout
  };
}