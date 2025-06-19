import { ReactNode } from "react";
import { User } from "@/lib/types";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  user: User;
  children: ReactNode;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

export default function DashboardLayout({ user, children, logout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="lg:pl-[256px] min-h-screen">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
