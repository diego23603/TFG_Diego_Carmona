import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Filter, Check, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Definimos los tipos de registros
export type RecordType = 'medical' | 'dental' | 'farrier' | 'training' | 'cleaning' | 'transport' | 'vaccines' | 'checkup' | 'other';

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  medical: 'Médico',
  dental: 'Dental',
  farrier: 'Herrado',
  training: 'Entrenamiento',
  cleaning: 'Limpieza',
  transport: 'Transporte',
  vaccines: 'Vacunas',
  checkup: 'Revisión',
  other: 'Otro'
};

interface HorseHistoryViewerProps {
  horseId: number;
}

export function HorseHistoryViewer({ horseId }: HorseHistoryViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"todos" | "medicos" | "servicios">("todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch medical records
  const { data: medicalRecords = [], isLoading: isLoadingMedical } = useQuery({
    queryKey: [`/api/horses/${horseId}/medical-records`],
    enabled: !!horseId,
  });

  // Fetch service records
  const { data: serviceRecords = [], isLoading: isLoadingService } = useQuery({
    queryKey: [`/api/horses/${horseId}/service-records`],
    enabled: !!horseId,
  });

  // All available record types
  const allRecordTypes = useMemo(() => {
    const medical = medicalRecords.map((record: any) => record.recordType);
    const service = serviceRecords.map((record: any) => record.serviceType);
    return [...new Set([...medical, ...service])].sort();
  }, [medicalRecords, serviceRecords]);

  // Filtered and combined records
  const filteredRecords = useMemo(() => {
    let records: any[] = [];

    // Combine or filter by tab
    if (activeTab === "todos") {
      records = [
        ...medicalRecords.map((record: any) => ({
          ...record,
          type: "medical",
          typeLabel: record.recordType,
        })),
        ...serviceRecords.map((record: any) => ({
          ...record,
          type: "service",
          typeLabel: record.serviceType,
        })),
      ];
    } else if (activeTab === "medicos") {
      records = medicalRecords.map((record: any) => ({
        ...record,
        type: "medical",
        typeLabel: record.recordType,
      }));
    } else {
      records = serviceRecords.map((record: any) => ({
        ...record,
        type: "service",
        typeLabel: record.serviceType,
      }));
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      records = records.filter(
        (record) =>
          record.title?.toLowerCase().includes(term) ||
          record.description?.toLowerCase().includes(term) ||
          record.typeLabel?.toLowerCase().includes(term) ||
          record.professional?.fullName?.toLowerCase().includes(term)
      );
    }

    // Apply date range filter
    if (dateRange.from) {
      records = records.filter(
        (record) => new Date(record.date) >= dateRange.from!
      );
    }
    if (dateRange.to) {
      records = records.filter(
        (record) => new Date(record.date) <= dateRange.to!
      );
    }

    // Apply type filter
    if (selectedTypes.length > 0) {
      records = records.filter((record) =>
        selectedTypes.includes(record.typeLabel)
      );
    }

    // Sort by date
    records.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return records;
  }, [
    medicalRecords,
    serviceRecords,
    activeTab,
    searchTerm,
    dateRange,
    selectedTypes,
    sortOrder,
  ]);

  const isLoading = isLoadingMedical || isLoadingService;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({});
    setSelectedTypes([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="medicos">Médicos</TabsTrigger>
            <TabsTrigger value="servicios">Servicios</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2">
          {/* Buscador */}
          <div className="relative w-full sm:w-auto">
            <Input
              placeholder="Buscar en registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[200px]"
            />
          </div>

          {/* Filter by date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs h-9 px-2",
                  dateRange.from && "text-equi-green"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} -{" "}
                      {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy")
                  )
                ) : (
                  "Fecha"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={setDateRange}
                locale={es}
                numberOfMonths={1}
                className="rounded-md border"
              />
              <div className="flex items-center justify-between p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({})}
                >
                  Limpiar
                </Button>
                <Button
                  size="sm"
                  onClick={() => document.body.click()}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter by type */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs h-9 px-2",
                  selectedTypes.length > 0 && "text-equi-green"
                )}
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Tipos {selectedTypes.length > 0 && `(${selectedTypes.length})`}
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {allRecordTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => handleTypeToggle(type)}
                >
                  {type in RECORD_TYPE_LABELS
                    ? RECORD_TYPE_LABELS[type as RecordType]
                    : type}
                </DropdownMenuCheckboxItem>
              ))}
              {allRecordTypes.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No hay tipos disponibles
                </div>
              )}
              {selectedTypes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setSelectedTypes([])}
                >
                  Limpiar selección
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Order toggle */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9 px-2"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            {sortOrder === "desc" ? "Más recientes" : "Más antiguos"}
          </Button>

          {/* Clear all filters */}
          {(searchTerm || dateRange.from || selectedTypes.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Lista de registros */}
      <div className="space-y-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <Card key={`${record.type}-${record.id}`} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{record.title}</h3>
                    <Badge
                      variant={record.type === "medical" ? "default" : "outline"}
                      className={cn(
                        record.type === "service" && "bg-equi-green/10 text-equi-green"
                      )}
                    >
                      {record.type === "medical"
                        ? RECORD_TYPE_LABELS[record.typeLabel as RecordType] || record.typeLabel
                        : record.typeLabel}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    {format(new Date(record.date), "d MMM yyyy", { locale: es })}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {record.professional?.fullName || "Profesional"}
                </p>
                
                <p className="text-sm">{record.description}</p>
                
                {record.cost && (
                  <p className="text-sm font-medium text-right mt-2">
                    Coste: {record.cost} €
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              No se encontraron registros con los filtros actuales
            </p>
            {(searchTerm || dateRange.from || selectedTypes.length > 0) && (
              <Button
                variant="ghost"
                className="mt-2"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground flex justify-between items-center pt-2">
        <span>Total: {filteredRecords.length} registros</span>
        {filteredRecords.length > 0 && (
          <span>
            {activeTab === "todos" && (
              <>
                Médicos: {filteredRecords.filter(r => r.type === "medical").length} | 
                Servicios: {filteredRecords.filter(r => r.type === "service").length}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}