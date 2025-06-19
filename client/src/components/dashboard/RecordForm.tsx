import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecordType, RECORD_TYPE_LABELS, ServiceType, SERVICE_TYPE_LABELS } from "@/lib/types";

interface RecordFormProps {
  onSubmit: (data: any) => void;
  recordType: "medical" | "service";
  isLoading: boolean;
}

export default function RecordForm({ onSubmit, recordType, isLoading }: RecordFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<string>(
    recordType === "medical" ? "medical" : "farrier"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      title,
      description,
      date: new Date(),
      ...(recordType === "medical" 
        ? { recordType: selectedType as RecordType } 
        : { serviceType: selectedType as ServiceType })
    };
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select 
          value={selectedType} 
          onValueChange={setSelectedType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            {recordType === "medical" ? (
              Object.entries(RECORD_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))
            ) : (
              Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-equi-green hover:bg-equi-light-green"
          disabled={isLoading}
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}