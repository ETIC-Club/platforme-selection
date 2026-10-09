"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  UsersIcon,
  HistoryIcon,
  LogsIcon,
  FolderIcon,
  UserSingleIcon,
  LogoutIcon,
} from "./Icons";
import { useAuth } from "@/context/AuthContext";
import styles from "./BottomNav.module.css";

interface BottomNavProps {
  eventId?: number | null;
}

export function BottomNav({ eventId }: BottomNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Derive if we are inside an event
  const match = pathname.match(/\/events\/(\d+)/);
  const currentEventId = eventId || (match ? parseInt(match[1], 10) : null);
  const isInsideEvent = Boolean(currentEventId || pathname.startsWith("/events/"));

  // Navigation items when outside an event (mirrors Sidebar.tsx)
  const globalNavItems = [
    {
      name: "Events",
      href: "/",
      icon: CalendarIcon,
      active: pathname === "/",
      rolesAllowed: "all" as const,
    },
    {
      name: "Users",
      href: "/users",
      icon: UsersIcon,
      active: pathname.startsWith("/users") || pathname.startsWith("/selectors"),
      rolesAllowed: "admin_only" as const,
    },
    {
      name: "History",
      href: "/history",
      icon: HistoryIcon,
      active: pathname === "/history",
      rolesAllowed: "admin_only" as const,
    },
    {
      name: "Logs",
      href: "/logs",
      icon: LogsIcon,
      active: pathname === "/logs",
      rolesAllowed: "super_admin_only" as const,
    },
  ];

  // Navigation items when inside an event (mirrors Sidebar.tsx)
  const activeEventId = currentEventId || 1;
  const eventNavItems = [
    {
      name: "Dashboard",
      href: `/events/${activeEventId}`,
      icon: FolderIcon,
      active: pathname === `/events/${activeEventId}`,
      rolesAllowed: "all" as const,
    },
    {
      name: "Sélecteur",
      href: `/events/${activeEventId}/selectors`,
      icon: UsersIcon,
      active: pathname.includes(`/events/${activeEventId}/selectors`),
      rolesAllowed: "admin_only" as const,
    },
    {
      name: isSuperAdmin ? "Candidature" : "Mes candidatures",
      href: `/events/${activeEventId}/candidatures`,
      icon: UserSingleIcon,
      active: pathname.includes(`/events/${activeEventId}/candidatures`),
      rolesAllowed: "all" as const,
    },
  ];

  const currentNavItems = isInsideEvent ? eventNavItems : globalNavItems;

  return (
    <nav className={styles.bottomNav} aria-label="Mobile Navigation">
      {currentNavItems.map((item) => {
        if (item.rolesAllowed === "super_admin_only" && !isSuperAdmin) {
          return null;
        }
        if (item.rolesAllowed === "admin_only" && !isSuperAdmin) {
          return null;
        }

        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
          >
            <div className={styles.navIcon}>
              <Icon width={20} height={20} />
            </div>
            <span className={styles.navLabel}>{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => logout()}
        className={`${styles.navItem} ${styles.navItemLogout}`}
        aria-label="Déconnexion"
      >
        <div className={styles.navIcon}>
          <LogoutIcon width={20} height={20} />
        </div>
        <span className={styles.navLabel}>Logout</span>
      </button>
    </nav>
  );
}
