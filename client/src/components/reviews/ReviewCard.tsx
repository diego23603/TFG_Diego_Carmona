import { StarRating } from "./StarRating";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2 } from "lucide-react";

export interface ReviewData {
  id: number;
  rating: number;
  comment: string | null;
  date: string;
  clientId: number;
  professionalId: number;
  appointmentId?: number | null;
  client?: {
    id: number;
    fullName: string;
    profileImage?: string | null;
  };
  professional?: {
    id: number;
    fullName: string;
    userType: string;
    profileImage?: string | null;
  };
}

interface ReviewCardProps {
  review: ReviewData;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (review: ReviewData) => void;
  onDelete?: (reviewId: number) => void;
}

export function ReviewCard({ 
  review, 
  canEdit = false, 
  canDelete = false,
  onEdit,
  onDelete 
}: ReviewCardProps) {
  const reviewer = review.client || review.professional;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={reviewer?.profileImage ?? undefined} />
              <AvatarFallback className="bg-equi-green text-white">
                {reviewer?.fullName?.substring(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{reviewer?.fullName || 'Usuario'}</h4>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {new Date(review.date).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
          
          {(canEdit || canDelete) && (
            <div className="flex gap-1">
              {canEdit && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(review)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(review.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      {review.comment && (
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.comment}
          </p>
        </CardContent>
      )}
    </Card>
  );
}