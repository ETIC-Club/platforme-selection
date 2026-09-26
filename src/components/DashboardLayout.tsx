"use client";

import React, { useState } from "react";
import { Sidebar, EventContext } from "./Sidebar";
import { TopBar, RolePreview } from "./TopBar";
import styles from "./dashboard.module.css";

interface DashboardLayoutProps {
  eventContext?: EventContext | null;
  children: (props: { searchQuery: string; role: RolePreview }) => React.ReactNode;
}

export function DashboardLayout({ eventContext, children }: DashboardLayoutProps) {
  const [role, setRole] = useState<RolePreview>("SUPER_ADMIN");
  const [searchQuery, setSearchQuery] = useState("");

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar isSuperAdmin={isSuperAdmin} eventContext={eventContext} />

      <div className={styles.contentWrapper}>
        <TopBar
          currentRole={role}
          onRoleChange={setRole}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className={styles.mainContainer}>
          {children({ searchQuery, role })}
        </main>
      </div>
    </div>
  );
}
