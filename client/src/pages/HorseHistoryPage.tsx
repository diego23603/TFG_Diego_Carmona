import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Filter, Search, Check, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { RecordType, RECORD_TYPE_LABELS } from '@/components/dashboard/HorseHistoryViewer';

type SortField = 'date' | 'type' | 'professional';
type UserType = 'veterinarian' | 'farrier' | 'trainer' | 'dentist' | 'other' | 'groomer' | 'transport';

const USER_TYPE_LABELS: Record<UserType, string> = {
  veterinarian: 'Veterinario',
  farrier: 'Herrador',
  trainer: 'Entrenador',
  dentist: 'Dentista',
  groomer: 'Limpieza',
  transport: 'Transporte',
  other: 'Otro'
};

export default function HorseHistoryPage() {
  return <HorseHistoryContent />;
}

// Componente principal para el contenido del historial de caballos
function HorseHistoryContent() {
  const { user } = useAuth();
  const [selectedHorseId, setSelectedHorseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedProfessionalTypes, setSelectedProfessionalTypes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'todos' | 'medicos' | 'servicios' | 'citas'>('todos');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch all horses for the current user
  const { data: horses = [], isLoading: isLoadingHorses } = useQuery({
    queryKey: ['/api/horses'],
    enabled: !!user,
  });

  // Fetch all medical records
  const { data: allMedicalRecords = [], isLoading: isLoadingMedical } = useQuery({
    queryKey: ['/api/medical-records'],
    enabled: !!user && user.userType === 'client',
  });

  // Fetch all service records
  const { data: allServiceRecords = [], isLoading: isLoadingService } = useQuery({
    queryKey: ['/api/service-records'],
    enabled: !!user && user.userType === 'client',
  });

  // Fetch all appointments
  const { data: allAppointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointments'],
    enabled: !!user && user.userType === 'client',
  });

  // Fetch specific horse medical records if a horse is selected
  const { data: horseMedicalRecords = [], isLoading: isLoadingHorseMedical } = useQuery({
    queryKey: [`/api/horses/${selectedHorseId}/medical-records`],
    enabled: !!selectedHorseId,
  });

  // Fetch specific horse service records if a horse is selected
  const { data: horseServiceRecords = [], isLoading: isLoadingHorseService } = useQuery({
    queryKey: [`/api/horses/${selectedHorseId}/service-records`],
    enabled: !!selectedHorseId,
  });

  // Fetch specific horse appointments if a horse is selected
  const { data: horseAppointments = [], isLoading: isLoadingHorseAppointments } = useQuery({
    queryKey: [`/api/horses/${selectedHorseId}/appointments`],
    enabled: !!selectedHorseId,
  });

  // Decide which records to use
  const medicalRecords = useMemo(() => {
    return selectedHorseId ? horseMedicalRecords : allMedicalRecords;
  }, [selectedHorseId, horseMedicalRecords, allMedicalRecords]);

  const serviceRecords = useMemo(() => {
    return selectedHorseId ? horseServiceRecords : allServiceRecords;
  }, [selectedHorseId, horseServiceRecords, allServiceRecords]);

  const appointments = useMemo(() => {
    const appointmentData = selectedHorseId ? horseAppointments : allAppointments;
    // Filter appointments by selected horse if no specific horse is selected
    if (!selectedHorseId && Array.isArray(appointmentData)) {
      return appointmentData;
    }
    // Filter appointments for the selected horse when viewing all horses
    if (selectedHorseId && Array.isArray(appointmentData)) {
      return appointmentData.filter((appointment: any) => {
        if (appointment.horseIds && Array.isArray(appointment.horseIds)) {
          return appointment.horseIds.includes(selectedHorseId);
        }
        return appointment.horseId === selectedHorseId;
      });
    }
    return appointmentData || [];
  }, [selectedHorseId, horseAppointments, allAppointments]);

  // All available record types
  const allRecordTypes = useMemo(() => {
    const medical = Array.isArray(medicalRecords) ? medicalRecords.map((record: any) => record.recordType) : [];
    const service = Array.isArray(serviceRecords) ? serviceRecords.map((record: any) => record.serviceType) : [];
    const appointmentTypes = Array.isArray(appointments) ? appointments.map((appointment: any) => appointment.serviceType || 'Cita') : [];
    return Array.from(new Set([...medical, ...service, ...appointmentTypes])).filter(Boolean).sort();
  }, [medicalRecords, serviceRecords, appointments]);

  // All available professional types
  const allProfessionalTypes = useMemo(() => {
    const types: string[] = [];
    if (Array.isArray(medicalRecords) && Array.isArray(serviceRecords) && Array.isArray(appointments)) {
      [...medicalRecords, ...serviceRecords, ...appointments].forEach((record: any) => {
        if (record.professional?.userType) {
          types.push(record.professional.userType);
        }
      });
    }
    return Array.from(new Set(types)).filter(Boolean).sort();
  }, [medicalRecords, serviceRecords, appointments]);

  // Filtered and combined records
  const filteredRecords = useMemo(() => {
    let records: any[] = [];

    // Combine or filter by tab
    if (activeTab === 'todos') {
      const medicalArray = Array.isArray(medicalRecords) ? medicalRecords : [];
      const serviceArray = Array.isArray(serviceRecords) ? serviceRecords : [];
      const appointmentArray = Array.isArray(appointments) ? appointments : [];
      
      records = [
        ...medicalArray.map((record: any) => ({
          ...record,
          type: 'medical',
          typeLabel: record.recordType,
        })),
        ...serviceArray.map((record: any) => ({
          ...record,
          type: 'service',
          typeLabel: record.serviceType,
        })),
        ...appointmentArray.map((appointment: any) => ({
          ...appointment,
          type: 'appointment',
          typeLabel: appointment.serviceType || 'Cita',
          title: appointment.title || 'Cita programada',
          description: appointment.notes || appointment.description || '',
        })),
      ];
    } else if (activeTab === 'medicos') {
      const medicalArray = Array.isArray(medicalRecords) ? medicalRecords : [];
      records = medicalArray.map((record: any) => ({
        ...record,
        type: 'medical',
        typeLabel: record.recordType,
      }));
    } else if (activeTab === 'servicios') {
      const serviceArray = Array.isArray(serviceRecords) ? serviceRecords : [];
      records = serviceArray.map((record: any) => ({
        ...record,
        type: 'service',
        typeLabel: record.serviceType,
      }));
    } else if (activeTab === 'citas') {
      const appointmentArray = Array.isArray(appointments) ? appointments : [];
      records = appointmentArray.map((appointment: any) => ({
        ...appointment,
        type: 'appointment',
        typeLabel: appointment.serviceType || 'Cita',
        title: appointment.title || 'Cita programada',
        description: appointment.notes || appointment.description || '',
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
          record.professional?.fullName?.toLowerCase().includes(term) ||
          (record.horse?.name && record.horse.name.toLowerCase().includes(term))
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

    // Apply professional type filter
    if (selectedProfessionalTypes.length > 0) {
      records = records.filter((record) =>
        record.professional?.userType && selectedProfessionalTypes.includes(record.professional.userType)
      );
    }

    // Sort by selected field
    records.sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'type') {
        const typeA = a.typeLabel || '';
        const typeB = b.typeLabel || '';
        return sortOrder === 'asc'
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA);
      } else {
        const profA = a.professional?.fullName || '';
        const profB = b.professional?.fullName || '';
        return sortOrder === 'asc'
          ? profA.localeCompare(profB)
          : profB.localeCompare(profA);
      }
    });

    return records;
  }, [
    medicalRecords,
    serviceRecords,
    activeTab,
    searchTerm,
    dateRange,
    selectedTypes,
    selectedProfessionalTypes,
    sortField,
    sortOrder,
  ]);

  const isLoading = isLoadingHorses || isLoadingMedical || isLoadingService || 
                    (selectedHorseId && (isLoadingHorseMedical || isLoadingHorseService));

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleProfessionalTypeToggle = (type: string) => {
    if (selectedProfessionalTypes.includes(type)) {
      setSelectedProfessionalTypes(selectedProfessionalTypes.filter((t) => t !== type));
    } else {
      setSelectedProfessionalTypes([...selectedProfessionalTypes, type]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange({});
    setSelectedTypes([]);
    setSelectedProfessionalTypes([]);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-3xl font-display font-bold text-equi-charcoal">Historial de Caballos</h1>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecciona y filtra el historial de tus caballos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Horse selector */}
            <div className="w-full md:w-64">
              <Select
                value={selectedHorseId?.toString() || ""}
                onValueChange={(value) => setSelectedHorseId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los caballos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los caballos</SelectItem>
                  {horses.map((horse: any) => (
                    <SelectItem key={horse.id} value={horse.id.toString()}>
                      {horse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative w-full">
              <Input
                placeholder="Buscar en registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="medicos">Médicos</TabsTrigger>
                <TabsTrigger value="servicios">Servicios</TabsTrigger>
                <TabsTrigger value="citas">Citas</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Date range filter */}
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

            {/* Service/Record type filter */}
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

            {/* Professional type filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs h-9 px-2",
                    selectedProfessionalTypes.length > 0 && "text-equi-green"
                  )}
                >
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  Profesionales {selectedProfessionalTypes.length > 0 && `(${selectedProfessionalTypes.length})`}
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {allProfessionalTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedProfessionalTypes.includes(type)}
                    onCheckedChange={() => handleProfessionalTypeToggle(type)}
                  >
                    {type in USER_TYPE_LABELS
                      ? USER_TYPE_LABELS[type as UserType]
                      : type}
                  </DropdownMenuCheckboxItem>
                ))}
                {allProfessionalTypes.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay tipos disponibles
                  </div>
                )}
                {selectedProfessionalTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setSelectedProfessionalTypes([])}
                  >
                    Limpiar selección
                  </Button>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Order toggle */}
            <Select 
              value={sortField} 
              onValueChange={(v) => setSortField(v as SortField)}
            >
              <SelectTrigger className="text-xs h-9 w-auto">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha</SelectItem>
                <SelectItem value="type">Tipo</SelectItem>
                <SelectItem value="professional">Profesional</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-2"
              onClick={toggleSortOrder}
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              {sortOrder === "desc" ? "Descendente" : "Ascendente"}
            </Button>

            {/* Clear all filters */}
            {(searchTerm || dateRange.from || selectedTypes.length > 0 || selectedProfessionalTypes.length > 0) && (
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
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Registros</CardTitle>
          <CardDescription>
            {selectedHorseId 
              ? `Mostrando registros para ${horses.find((h: any) => h.id === selectedHorseId)?.name || 'el caballo seleccionado'}`
              : 'Mostrando registros para todos los caballos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[100px] w-full" />
              <Skeleton className="h-[100px] w-full" />
              <Skeleton className="h-[100px] w-full" />
            </div>
          ) : (
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
                              record.type === "service" && "bg-equi-green/10 text-equi-green",
                              record.type === "appointment" && "bg-blue-100 text-blue-800"
                            )}
                          >
                            {record.type === "medical"
                              ? RECORD_TYPE_LABELS[record.typeLabel as RecordType] || record.typeLabel
                              : record.type === "appointment"
                              ? record.typeLabel
                              : record.typeLabel}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          {format(new Date(record.date), "d MMM yyyy", { locale: es })}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{record.description}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-3">
                        {record.horse && (
                          <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                            <span className="font-medium">Caballo:</span>
                            <span>{record.horse.name}</span>
                          </div>
                        )}
                        {/* Show horse names for appointments that have horseIds */}
                        {record.type === 'appointment' && record.horseIds && Array.isArray(record.horseIds) && horses && (
                          <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                            <span className="font-medium">Caballo(s):</span>
                            <span>
                              {record.horseIds.map((horseId: number) => {
                                const horse = (horses as any[]).find((h: any) => h.id === horseId);
                                return horse?.name;
                              }).filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {record.professional && (
                          <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                            <span className="font-medium">Profesional:</span>
                            <span>{record.professional.fullName}</span>
                            {record.professional.userType && (
                              <span className="italic">
                                ({record.professional.userType in USER_TYPE_LABELS 
                                  ? USER_TYPE_LABELS[record.professional.userType as UserType] 
                                  : record.professional.userType})
                              </span>
                            )}
                          </div>
                        )}
                        {/* Show appointment-specific fields */}
                        {record.type === 'appointment' && record.status && (
                          <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                            <span className="font-medium">Estado:</span>
                            <span className={cn(
                              record.status === 'confirmed' && 'text-green-600',
                              record.status === 'pending' && 'text-yellow-600',
                              record.status === 'cancelled' && 'text-red-600'
                            )}>
                              {record.status === 'confirmed' ? 'Confirmada' : 
                               record.status === 'pending' ? 'Pendiente' : 
                               record.status === 'cancelled' ? 'Cancelada' : record.status}
                            </span>
                          </div>
                        )}
                        {record.type === 'appointment' && record.location && (
                          <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                            <span className="font-medium">Ubicación:</span>
                            <span>{record.location}</span>
                          </div>
                        )}
                        {record.type === 'appointment' && record.price && (
                          <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                            <span className="font-medium">Precio:</span>
                            <span>{(record.price / 100).toFixed(2)}€</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No se encontraron registros con los filtros seleccionados.</p>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground flex justify-between items-center pt-4 mt-4 border-t">
                <span>Total: {filteredRecords.length} registros</span>
                {filteredRecords.length > 0 && (
                  <span>
                    {activeTab === "todos" && (
                      <>
                        Médicos: {filteredRecords.filter(r => r.type === "medical").length} | 
                        Servicios: {filteredRecords.filter(r => r.type === "service").length} | 
                        Citas: {filteredRecords.filter(r => r.type === "appointment").length}
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}