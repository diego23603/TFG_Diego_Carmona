import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RegisterForm from "@/components/auth/RegisterForm";
import UserTypeSelection from "@/components/auth/UserTypeSelection";
import { User, UserType } from "@/lib/types";

interface RegisterPageProps {
  user: User | null;
}

export default function RegisterPage({ user }: RegisterPageProps) {
  const [location, setLocation] = useLocation();
  const [userType, setUserType] = useState<string | null>(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const specialty = params.get("specialty");
    const plan = params.get("plan");

    console.log("URL params:", { type, specialty, plan });

    if (type === "professional" || specialty) {
      setIsProfessional(true);
      
      if (specialty) {
        setUserType(specialty);
      } else {
        // Si no hay especialidad pero es profesional, establecemos un valor predeterminado
        setUserType("professional");
      }
      
      if (plan) {
        setSubscriptionType(plan);
      }
    } else if (type === "client") {
      setUserType("client");
      setIsProfessional(false);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleUserTypeSelection = (type: UserType, professional: boolean) => {
    setUserType(type);
    setIsProfessional(professional);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-grow py-12 px-4">
        {userType ? (
          <RegisterForm 
            defaultUserType={userType as UserType}
            defaultIsProfessional={isProfessional}
            defaultSubscriptionType={subscriptionType}
          />
        ) : (
          <UserTypeSelection />
        )}
      </main>
      
      <Footer />
    </div>
  );
}
