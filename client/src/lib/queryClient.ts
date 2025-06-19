import { QueryClient, QueryFunction, QueryCache, Query, QueryKey } from "@tanstack/react-query";

// Tipos de error que pueden ocurrir en la API
export type ApiErrorType = 
  | "unauthorized" 
  | "not_found" 
  | "validation_error" 
  | "server_error"
  | "connection_error"
  | "unknown";

// Estructura de error de la API
export interface ApiError {
  type: ApiErrorType;
  message: string;
  status: number;
  details?: any;
  timestamp?: string;
}

// Función para procesar errores de la API
export function processApiError(error: any): ApiError {
  // Si ya es un ApiError, retornarlo tal cual
  if (error && error.type && error.message && error.status) {
    return error as ApiError;
  }
  
  // Si es un error de red (sin conexión)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: "connection_error",
      message: "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
      status: 0
    };
  }
  
  // Para errores con mensaje específico
  const errorMessage = error?.message || "Error desconocido";
  
  // Tratar de extraer el código de estado si existe
  let status = 500;
  const statusMatch = errorMessage.match(/^(\d{3}):/);
  if (statusMatch) {
    status = parseInt(statusMatch[1]);
  }
  
  // Mapear código de estado HTTP a tipo de error
  let type: ApiErrorType = "unknown";
  if (status === 401) type = "unauthorized";
  else if (status === 404) type = "not_found";
  else if (status === 400) type = "validation_error";
  else if (status >= 500) type = "server_error";
  
  return {
    type,
    message: errorMessage.replace(/^\d{3}: /, ''),
    status,
    timestamp: new Date().toISOString()
  };
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData: any = {};
    
    try {
      // Intentar parsear el cuerpo como JSON
      errorData = await res.json();
    } catch (e) {
      // Si no es JSON, usar el texto como mensaje
      const text = await res.text() || res.statusText;
      errorData = { message: text };
    }
    
    const error: ApiError = {
      type: res.status === 401 ? "unauthorized" : 
            res.status === 404 ? "not_found" :
            res.status === 400 ? "validation_error" :
            res.status >= 500 ? "server_error" : "unknown",
      message: errorData.message || `Error: ${res.statusText}`,
      status: res.status,
      details: errorData.details || undefined,
      timestamp: new Date().toISOString()
    };
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    signal?: AbortSignal;
    headers?: Record<string, string>;
    timeout?: number;
  }
): Promise<Response> {
  // Si se especificó un timeout pero no un signal, creamos uno
  let timeoutId: NodeJS.Timeout | undefined;
  let controller: AbortController | undefined;
  
  if (options?.timeout && !options.signal) {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), options.timeout);
  }
  
  try {
    console.log(`Enviando solicitud ${method} a ${url}${data ? ' con datos' : ''}`);
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(options?.headers || {})
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: options?.signal || controller?.signal
    });

    console.log(`Respuesta recibida de ${url}, status: ${res.status}`);
    
    // Limpiar timeout si lo creamos
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Limpiar timeout en caso de error también
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Si es un error de tiempo de espera, personalizar el mensaje
    if (error instanceof DOMException && error.name === 'AbortError') {
      const abortError: ApiError = {
        type: "connection_error",
        message: "La solicitud ha excedido el tiempo de espera. Por favor, inténtalo de nuevo.",
        status: 0,
        timestamp: new Date().toISOString()
      };
      throw abortError;
    }
    
    // Si el error ya está procesado, simplemente relanzarlo
    if (error && (error as any).type) {
      throw error;
    }
    
    // De lo contrario, procesarlo y lanzarlo
    throw processApiError(error);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      console.log(`Ejecutando consulta para ${queryKey[0]}`);
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      console.log(`Respuesta de consulta ${queryKey[0]}, status: ${res.status}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Recibido 401 con comportamiento returnNull para ${queryKey[0]}`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`Datos recibidos para ${queryKey[0]}:`, data ? "Datos presentes" : "Sin datos");
      return data;
    } catch (error) {
      console.error(`Error en consulta ${queryKey[0]}:`, error);
      // Si el error ya está procesado, simplemente relanzarlo
      if (error && (error as any).type) {
        throw error;
      }
      
      // De lo contrario, procesarlo y lanzarlo
      throw processApiError(error);
    }
  };

// Crear un queryClient simple con configuración básica para evitar errores de tipo
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Cambiar a returnNull para evitar errores
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false
    },
    mutations: {
      retry: false
    },
  }
});
