import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { StarRating } from "@/components/reviews/StarRating";
import { ReviewCard, type ReviewData } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ArrowLeft, Star } from "lucide-react";
import { Link } from "wouter";

export default function ReviewsPage() {
  const { professionalId } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewData | null>(null);

  // Obtener información del profesional
  const { data: professional, isLoading: professionalLoading } = useQuery({
    queryKey: ["/api/users", professionalId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${professionalId}`);
      return response.json();
    },
    enabled: !!professionalId
  });

  // Obtener reseñas del profesional
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/professionals", professionalId, "reviews"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/professionals/${professionalId}/reviews`);
      return response.json();
    },
    enabled: !!professionalId
  });

  // Mutation para eliminar reseña
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      await apiRequest("DELETE", `/api/reviews/${reviewId}`);
    },
    onSuccess: () => {
      toast({
        title: "Reseña eliminada",
        description: "La reseña ha sido eliminada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalId, "reviews"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la reseña",
        variant: "destructive",
      });
    }
  });

  if (professionalLoading || reviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profesional no encontrado</h1>
          <p className="text-muted-foreground mb-4">No se pudo encontrar el profesional solicitado.</p>
          <Link href="/dashboard">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calcular estadísticas de reseñas
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((acc: number, review: ReviewData) => acc + review.rating, 0) / reviews.length 
    : 0;

  const handleEditReview = (review: ReviewData) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = (reviewId: number) => {
    deleteMutation.mutate(reviewId);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  // Verificar si el usuario actual ya ha reseñado este profesional
  const userHasReviewed = currentUser && reviews.some((review: ReviewData) => review.clientId === currentUser.id);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Reseñas de {professional.fullName}</h1>
          <p className="text-muted-foreground">{professional.userType}</p>
        </div>
      </div>

      {/* Resumen de calificaciones */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            Resumen de Calificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews && reviews.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                <StarRating rating={Math.round(averageRating)} size="md" />
              </div>
              <div className="text-muted-foreground">
                Basado en {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Este profesional aún no tiene reseñas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón para agregar reseña */}
      {currentUser && !currentUser.isProfessional && !userHasReviewed && (
        <div className="mb-6">
          <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
            <DialogTrigger asChild>
              <Button className="bg-equi-green hover:bg-equi-light-green">
                <Plus className="h-4 w-4 mr-2" />
                Escribir Reseña
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva Reseña para {professional.fullName}</DialogTitle>
              </DialogHeader>
              <ReviewForm
                professionalId={parseInt(professionalId as string)}
                existingReview={editingReview || undefined}
                onSuccess={handleReviewSuccess}
                onCancel={() => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Lista de reseñas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Reseñas ({reviews?.length || 0})
        </h2>
        
        {reviews && reviews.length > 0 ? (
          reviews.map((review: ReviewData) => (
            <ReviewCard
              key={review.id}
              review={review}
              canEdit={currentUser?.id === review.clientId}
              canDelete={currentUser?.id === review.clientId}
              onEdit={handleEditReview}
              onDelete={(reviewId) => {
                // Mostrar confirmación antes de eliminar
                if (window.confirm("¿Estás seguro de que quieres eliminar esta reseña?")) {
                  handleDeleteReview(reviewId);
                }
              }}
            />
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay reseñas aún</h3>
              <p className="text-muted-foreground mb-4">
                Sé el primero en compartir tu experiencia con {professional.fullName}
              </p>
              {currentUser && !currentUser.isProfessional && (
                <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-equi-green hover:bg-equi-light-green">
                      <Plus className="h-4 w-4 mr-2" />
                      Escribir Primera Reseña
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nueva Reseña para {professional.fullName}</DialogTitle>
                    </DialogHeader>
                    <ReviewForm
                      professionalId={parseInt(professionalId as string)}
                      onSuccess={handleReviewSuccess}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}