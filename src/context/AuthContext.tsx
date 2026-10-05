"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "SUPER_ADMIN" | "SELECTOR_RH" | "SELECTOR_TECHNIQUE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  roleSubtitle: string;
  badgeLabel: string;
}

export const MOCK_PROFILES: Record<UserRole, AuthUser> = {
  SUPER_ADMIN: {
    id: "admin-1",
    name: "Admane Oussama",
    email: "om_admane@esi.dz",
    role: "SUPER_ADMIN",
    roleTitle: "Admin",
    roleSubtitle: "Supervision globale & Gestion des événements",
    badgeLabel: "Admin",
  },
  SELECTOR_RH: {
    id: "rh-1",
    name: "Sélecteur RH",
    email: "rh@etic-club.net",
    role: "SELECTOR_RH",
    roleTitle: "Sélecteur RH",
    roleSubtitle: "Évaluation des profils & soft skills",
    badgeLabel: "Sélecteur RH",
  },
  SELECTOR_TECHNIQUE: {
    id: "dev-1",
    name: "Sélecteur Dev",
    email: "dev@etic-club.net",
    role: "SELECTOR_TECHNIQUE",
    roleTitle: "Sélecteur Dev",
    roleSubtitle: "Évaluation technique & compétences",
    badgeLabel: "Sélecteur Dev",
  },
};

const STORAGE_KEY = "etic_platform_role";

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  loginAs: (role: UserRole, redirectTo?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.user) {
            setUser(data.user);
            return;
          }
        }

        const savedRole = localStorage.getItem(STORAGE_KEY) as UserRole | null;
        if (!cancelled && savedRole && MOCK_PROFILES[savedRole]) {
          setUser(MOCK_PROFILES[savedRole]);
        } else if (!cancelled) {
          setUser(null);
        }
      } catch (e) {
        console.error("Failed to check server session", e);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginAs = (selectedRole: UserRole, redirectTo: string = "/") => {
    const profile = MOCK_PROFILES[selectedRole];
    if (profile) {
      setUser(profile);
      try {
        localStorage.setItem(STORAGE_KEY, selectedRole);
      } catch (e) {
        console.error("Failed to save auth state to localStorage", e);
      }
      router.push(redirectTo);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to logout", e);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isLoading,
        loginAs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
