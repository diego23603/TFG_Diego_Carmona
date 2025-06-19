import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import HorseProfile from "@/components/dashboard/HorseProfile";
import { Horse, User } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HorseDetailPageProps {
  user: User;
  horseId: number;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

export default function HorseDetailPage({ user, horseId, logout }: HorseDetailPageProps) {
  const [, setLocation] = useLocation();
  
  // Fetch horse details
  const { data: horse, isLoading, error } = useQuery<Horse>({
    queryKey: [`/api/horses/${horseId}`],
  });

  // Check if user has access to this horse
  useEffect(() => {
    if (error) {
      // Redirect if there's an error (likely 403 or 404)
      setLocation("/horses");
    }
  }, [error, setLocation]);

  return (
    <DashboardLayout user={user} logout={logout}>
      <div>
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          
          {isLoading ? (
            <Skeleton className="h-10 w-64" />
          ) : (
            <h1 className="text-3xl font-display font-bold text-equi-charcoal">
              {horse?.name || "Caballo"}
            </h1>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : horse ? (
          <HorseProfile horseId={horseId} user={user} />
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Caballo no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              No se pudo encontrar la información del caballo solicitado
            </p>
            <Button 
              onClick={() => setLocation("/dashboard")}
              className="bg-equi-green hover:bg-equi-light-green"
            >
              Volver al panel
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
