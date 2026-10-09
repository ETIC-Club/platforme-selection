"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderIcon,
  UsersIcon,
  UserSingleIcon,
  LogoutIcon,
} from "./Icons";
import { useAuth } from "@/context/AuthContext";
import styles from "./BottomNav.module.css";

interface BottomNavProps {
  eventId?: number | null;
}

export function BottomNav({ eventId = 1 }: BottomNavProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const currentEventId = eventId || 1;

  const isDashboardActive =
    pathname === `/events/${currentEventId}` || pathname === "/";
  const isSelectorsActive = pathname.includes(`/events/${currentEventId}/selectors`) || pathname.includes("/selectors");
  const isCandidaturesActive = pathname.includes(`/events/${currentEventId}/candidatures`) || pathname.includes("/candidatures");

  return (
    <nav className={styles.bottomNav} aria-label="Mobile Navigation">
      <Link
        href={`/events/${currentEventId}`}
        className={`${styles.navItem} ${isDashboardActive ? styles.navItemActive : ""}`}
      >
        <div className={styles.navIcon}>
          <FolderIcon width={20} height={20} />
        </div>
        <span className={styles.navLabel}>Dashboard</span>
      </Link>

      <Link
        href={`/events/${currentEventId}/selectors`}
        className={`${styles.navItem} ${isSelectorsActive ? styles.navItemActive : ""}`}
      >
        <div className={styles.navIcon}>
          <UsersIcon width={20} height={20} />
        </div>
        <span className={styles.navLabel}>Sélecteur</span>
      </Link>

      <Link
        href={`/events/${currentEventId}/candidatures`}
        className={`${styles.navItem} ${isCandidaturesActive ? styles.navItemActive : ""}`}
      >
        <div className={styles.navIcon}>
          <UserSingleIcon width={20} height={20} />
        </div>
        <span className={styles.navLabel}>Candidature</span>
      </Link>

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
