import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type MessageRole = 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

export function useAIAssistant() {
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const askAssistant = useCallback(async (prompt: string) => {
    try {
      setIsLoading(true);
      
      // Añadir la pregunta del usuario al historial
      setHistory(prev => [...prev, { role: 'user', content: prompt }]);
      
      // Llamada a la API
      const response = await apiRequest('POST', '/api/ai/chat', { prompt });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Añadir la respuesta al historial
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      return data.response;
    } catch (error) {
      console.error('Error al solicitar respuesta del asistente:', error);
      toast({
        title: 'Error',
        description: 'No se pudo obtener respuesta del asistente. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
      
      // Añadir un mensaje de error al historial
      setHistory(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Lo siento, no pude procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.' 
        }
      ]);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { askAssistant, isLoading, history, clearHistory };
}