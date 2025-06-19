import { Link } from "wouter";
import { Horse } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Pencil } from "lucide-react";

interface HorseCardProps {
  horse: Horse;
  showActions?: boolean;
  onEdit?: (horse: Horse) => void;
}

export function HorseCard({ horse, showActions = true, onEdit }: HorseCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <div 
        className="h-40 bg-cover bg-center"
        style={{ 
          backgroundImage: horse.profileImage 
            ? `url(${horse.profileImage})` 
            : "url('https://images.unsplash.com/photo-1553284965-99ba659f48c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')" 
        }}
      />
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{horse.name}</h3>
            <p className="text-sm text-muted-foreground">
              {horse.breed} • {horse.age} años • {horse.gender === 'male' ? 'Macho' : 'Hembra'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">Ubicación:</span> {horse.location}
            </p>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => onEdit(horse)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Link href={`/horses/${horse.id}`}>
                <Button 
                  variant="default" 
                  size="icon"
                  className="h-8 w-8 bg-equi-green hover:bg-equi-light-green"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
