"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, EventContext } from "./Sidebar";
import { TopBar, RolePreview } from "./TopBar";
import { useAuth } from "@/context/AuthContext";
import styles from "./dashboard.module.css";

interface DashboardLayoutProps {
  eventContext?: EventContext | null;
  children: (props: { searchQuery: string; role: RolePreview }) => React.ReactNode;
}

export function DashboardLayout({ eventContext, children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div
        className={styles.dashboardWrapper}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center", fontFamily: "var(--font-primary)" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              border: "3px solid #E5E7EB",
              borderTopColor: "var(--color-primary-teal)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px auto",
            }}
          />
          <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500 }}>
            Chargement de la session...
          </p>
        </div>
      </div>
    );
  }

  const activeRole: RolePreview = user.role;
  const isSuperAdmin = activeRole === "SUPER_ADMIN";

  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar isSuperAdmin={isSuperAdmin} eventContext={eventContext} />

      <div className={styles.contentWrapper}>
        <TopBar
          currentRole={activeRole}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userName={user.name}
          userEmail={user.email}
        />

        <main className={styles.mainContainer}>
          {children({ searchQuery, role: activeRole })}
        </main>
      </div>
    </div>
  );
}
