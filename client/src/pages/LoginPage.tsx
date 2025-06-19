import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirección usando useEffect en lugar de hacerlo en render
  useEffect(() => {
    if (user) {
      // Si es un profesional sin suscripción, redirigir a la página de suscripción
      if (user.isProfessional && (!user.subscriptionType || user.subscriptionType === "")) {
        console.log("LoginPage: Profesional sin suscripción, redirigiendo a checkout");
        navigate("/subscription-checkout?plan=basic");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username, password });
      // La navegación ahora se maneja a través de useEffect cuando user se actualiza
    } catch (err: any) {
      console.error("Login submission error:", err);
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-center">
        <div className="bg-background rounded-lg border shadow-sm p-8 md:p-12">
          <div className="flex flex-col items-center space-y-2 mb-8">
            <h1 className="text-2xl font-bold text-primary">Equestrian Hub</h1>
            <p className="text-muted-foreground text-sm text-center">
              La plataforma integral para la gestión equina
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Iniciar sesión</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para acceder a tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link href="/forgot-password">
                      <span className="text-xs text-primary hover:underline cursor-pointer">
                        ¿Olvidaste tu contraseña?
                      </span>
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link href="/register">
                  <span className="text-primary hover:underline cursor-pointer font-medium">
                    Regístrate
                  </span>
                </Link>
              </p>
            </CardFooter>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/">
              <Button variant="link" className="text-muted-foreground">
                ← Volver a la página principal
              </Button>
            </Link>
          </div>
        </div>

        <div className="hidden md:block relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg" />
          <div className="relative text-white p-12 space-y-6">
            <h2 className="text-3xl font-bold mb-4">
              Bienvenido a Equestrian Hub
            </h2>
            <p className="text-lg opacity-90">
              La plataforma que conecta a propietarios de caballos con los mejores profesionales del sector ecuestre.
            </p>
            <div className="space-y-4 mt-8">
              <div className="flex items-start">
                <div className="rounded-full bg-white/10 p-2 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Gestión centralizada</h3>
                  <p className="text-sm opacity-80">
                    Todos tus servicios ecuestres en un solo lugar
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="rounded-full bg-white/10 p-2 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Profesionales verificados</h3>
                  <p className="text-sm opacity-80">
                    Conecta con expertos especializados en cuidado equino
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="rounded-full bg-white/10 p-2 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Historial completo</h3>
                  <p className="text-sm opacity-80">
                    Mantén un registro detallado de la salud y cuidados de tus caballos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}