import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAIAssistant } from '@/hooks/use-ai-assistant';
import { Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAssistantProps {
  onSelectResponse: (response: string) => void;
  defaultPrompt?: string;
  className?: string;
}

export function AIAssistant({ onSelectResponse, defaultPrompt = '', className }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const { askAssistant, isLoading, history } = useAIAssistant();
  
  const handlePromptSubmit = async () => {
    const promptToUse = prompt || defaultPrompt;
    if (!promptToUse.trim()) return;
    
    const response = await askAssistant(promptToUse);
    if (response) {
      setIsOpen(false);
    }
  };
  
  const getLastResponse = () => {
    // Encuentra la última respuesta del asistente
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'assistant') {
        return history[i].content;
      }
    }
    return null;
  };
  
  const handleSelectResponse = () => {
    const response = getLastResponse();
    if (response) {
      onSelectResponse(response);
      setIsOpen(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "text-xs gap-1.5 text-muted-foreground hover:text-equi-green hover:border-equi-green transition-colors",
            className
          )}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Asistente IA
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Asistente Inteligente</h4>
            <p className="text-xs text-muted-foreground">
              {defaultPrompt ? 'Selecciona una sugerencia o escribe tu pregunta:' : 'Escribe tu pregunta para obtener ayuda:'}
            </p>
          </div>
          
          {defaultPrompt && (
            <div className="bg-muted p-2 rounded-md text-xs">
              {defaultPrompt}
              <Button
                variant="link"
                size="sm"
                className="text-xs p-0 h-auto mt-1 text-equi-green"
                onClick={() => setPrompt(defaultPrompt)}
              >
                Usar sugerencia
              </Button>
            </div>
          )}
          
          <div>
            <textarea
              className="w-full h-20 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-equi-green"
              placeholder="Describe lo que necesitas..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-equi-green" />
            </div>
          ) : (
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              
              <div className="space-x-2">
                {getLastResponse() && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={handleSelectResponse}
                  >
                    Usar respuesta
                  </Button>
                )}
                
                <Button
                  size="sm"
                  className="text-xs bg-equi-green hover:bg-equi-light-green"
                  onClick={handlePromptSubmit}
                  disabled={(!prompt && !defaultPrompt) || isLoading}
                >
                  Consultar
                </Button>
              </div>
            </div>
          )}
          
          {/* Historial reciente */}
          {history.length > 0 && (
            <div className="mt-4 border-t pt-2">
              <h5 className="text-xs font-medium mb-2">Respuesta:</h5>
              <div className="max-h-40 overflow-y-auto text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                {getLastResponse() || 'No hay respuestas aún.'}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}