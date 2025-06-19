import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const reviewSchema = z.object({
  rating: z.number().min(1, "Debes seleccionar una calificación").max(5),
  comment: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  professionalId: number;
  appointmentId?: number;
  existingReview?: {
    id: number;
    rating: number;
    comment: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ 
  professionalId, 
  appointmentId,
  existingReview,
  onSuccess,
  onCancel 
}: ReviewFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      comment: existingReview?.comment || "",
    }
  });

  // Mutation para crear reseña
  const createMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/reviews", {
        ...data,
        professionalId,
        appointmentId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reseña creada",
        description: "Tu reseña ha sido publicada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalId, "reviews"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la reseña",
        variant: "destructive",
      });
    }
  });

  // Mutation para actualizar reseña
  const updateMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("PUT", `/api/reviews/${existingReview?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reseña actualizada",
        description: "Tu reseña ha sido actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalId, "reviews"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la reseña",
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (existingReview) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setValue("rating", newRating);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {existingReview ? "Editar reseña" : "Escribir reseña"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Calificación *</Label>
            <div className="flex items-center gap-2">
              <StarRating 
                rating={rating} 
                interactive 
                onRatingChange={handleRatingChange}
                size="lg"
              />
              <span className="text-sm text-muted-foreground">
                ({rating} de 5 estrellas)
              </span>
            </div>
            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Comparte tu experiencia con este profesional..."
              className="min-h-[100px]"
              {...register("comment")}
            />
          </div>

          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || rating === 0}
              className="bg-equi-green hover:bg-equi-light-green"
            >
              {isLoading 
                ? "Guardando..." 
                : existingReview 
                  ? "Actualizar reseña" 
                  : "Publicar reseña"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}