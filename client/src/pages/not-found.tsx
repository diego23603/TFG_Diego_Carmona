import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-equi-cream to-white">
      <Card className="w-full max-w-md mx-4 border-none shadow-lg overflow-hidden">
        <div className="h-2 bg-equi-green" />
        <CardContent className="pt-8 pb-8 px-6">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-red-50 p-4 mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            
            <h1 className="text-3xl font-display font-bold text-equi-charcoal mb-2">
              Página no encontrada
            </h1>
            
            <p className="text-muted-foreground max-w-xs mb-6">
              Lo sentimos, la página que estás buscando no existe o ha sido trasladada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Link>
              </Button>
              
              <Button 
                className="flex-1 bg-equi-green hover:bg-equi-light-green"
                asChild
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Inicio
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 w-full">
              <div className="flex items-center justify-center gap-6">
                <div className="bg-equi-brown/10 h-px flex-1" />
                <span className="text-xs text-muted-foreground">EQUICARE</span>
                <div className="bg-equi-brown/10 h-px flex-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
