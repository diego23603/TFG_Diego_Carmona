import { useState } from "react";

import ConnectionRequests from "@/components/dashboard/ConnectionRequests";
import ClientList from "@/components/dashboard/ClientList";
import ProfessionalList from "@/components/dashboard/ProfessionalList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/lib/types";

interface ConnectionsPageProps {
  user: User;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

export default function ConnectionsPage({ user, logout }: ConnectionsPageProps) {
  const [activeTab, setActiveTab] = useState("connections");
  
  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-display font-bold text-equi-charcoal">
            Conexiones
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="connections">
              {user.isProfessional ? "Mis Clientes" : "Mis Profesionales"}
            </TabsTrigger>
            <TabsTrigger value="requests">Solicitudes</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="mt-6">
            {user.isProfessional ? (
              <ClientList user={user} />
            ) : (
              <ProfessionalList user={user} />
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <ConnectionRequests user={user} />
          </TabsContent>
        </Tabs>
      </div>
  );
}