"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  UsersIcon,
  UserCheckIcon,
  HistoryIcon,
  LogsIcon,
  LogoutIcon,
  ArrowLeftIcon,
  ClipboardIcon,
} from "./Icons";
import styles from "./dashboard.module.css";
import { ASSETS } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";

export interface EventContext {
  id: number;
  name: string;
}

interface SidebarProps {
  isSuperAdmin: boolean;
  eventContext?: EventContext | null;
}

export function Sidebar({ isSuperAdmin, eventContext }: SidebarProps) {
  const pathname = usePathname();
  const [isCandidatureOpen, setIsCandidatureOpen] = useState(true);

  // Navigation items when outside an event
  const globalNavItems = [
    {
      name: "EVENTS",
      href: "/",
      icon: CalendarIcon,
      active: pathname === "/",
      rolesAllowed: "all" as const,
    },
    {
      name: "USERS",
      href: "/users",
      icon: UsersIcon,
      active: pathname === "/users",
      rolesAllowed: "admin_only" as const,
    },
    {
      name: "SELECTEURS",
      href: "/selectors",
      icon: UserCheckIcon,
      active: pathname.startsWith("/selectors"),
      rolesAllowed: "admin_only" as const,
    },
    {
      name: "HISTORY",
      href: "/history",
      icon: HistoryIcon,
      active: pathname === "/history",
      rolesAllowed: "admin_only" as const,
    },
    {
      name: "LOGS",
      href: "/logs",
      icon: LogsIcon,
      active: pathname === "/logs",
      rolesAllowed: "super_admin_only" as const,
    },
  ];

  // Navigation items when inside an event (matching Figma node 183:413, 108:58, 116:64, 119:489)
  const eventId = eventContext?.id ?? 1;
  const eventNavItems = [
    {
      name: "Dashboard",
      href: `/events/${eventId}`,
      icon: CalendarIcon,
      active: pathname === `/events/${eventId}`,
      rolesAllowed: "all" as const,
    },
    {
      name: "Selectors",
      href: `/events/${eventId}/selectors`,
      icon: UsersIcon,
      active: pathname === `/events/${eventId}/selectors`,
      rolesAllowed: "admin_only" as const,
    },
    {
      name: "Condidature",
      href: `/events/${eventId}/candidatures`,
      icon: UsersIcon,
      active: pathname.includes(`/events/${eventId}/candidatures`),
      rolesAllowed: "all" as const,
      subItems: isSuperAdmin ? [
        { name: "To be reviewed", href: `/events/${eventId}/candidatures/to-review` },
        { name: "Decision status", href: `/events/${eventId}/candidatures/decisions` },
      ] : []
    },
  ];

  const currentNavItems = eventContext ? eventNavItems : globalNavItems;

  const { logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.logoArea}>
          <Image
            src={ASSETS.logo}
            alt="Club ETIC Logo"
            width={44}
            height={38}
            style={{ objectFit: "contain" }}
            priority
          />
          <span className={styles.brandTitle}>PLATFORM SELECTION</span>
        </div>

        {eventContext && (
          <div className={styles.eventContextSection}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeftIcon />
              <span>Back to all events</span>
            </Link>
            <h2 className={styles.eventContextTitle}>{eventContext.name}</h2>
          </div>
        )}

        <nav className={styles.navSection}>
          <div className={styles.sectionHeader}>MENU</div>
          <ul className={styles.navList}>
            {currentNavItems.map((item) => {
              if (item.rolesAllowed === "super_admin_only" && !isSuperAdmin) {
                return null;
              }
              if (item.rolesAllowed === "admin_only" && !isSuperAdmin) {
                // Non-admins see Candidatures & Dashboard, but Selectors is restricted
                return null;
              }

              const Icon = item.icon;
              const itemWithSub = item as any;
              const hasSubItems = itemWithSub.subItems && itemWithSub.subItems.length > 0;
              
              if (hasSubItems) {
                return (
                  <li key={item.name}>
                    <div
                      className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
                      onClick={() => setIsCandidatureOpen(!isCandidatureOpen)}
                      style={{ cursor: "pointer" }}
                    >
                      {item.active && <span className={styles.activeIndicator} />}
                      <Icon className={item.active ? styles.activeIcon : ""} />
                      <span>{item.name}</span>
                      <span style={{ marginLeft: "auto", transform: isCandidatureOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '10px', color: item.active ? 'var(--color-primary-teal)' : 'inherit' }}>▼</span>
                    </div>
                    {isCandidatureOpen && (
                      <div className={styles.subMenuContainer}>
                        {itemWithSub.subItems?.map((sub: any) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link 
                              key={sub.name}
                              href={sub.href} 
                              className={`${styles.subMenuItem} ${isSubActive ? styles.subMenuItemActive : ""}`}
                            >
                              <div className={`${styles.subMenuDot} ${isSubActive ? styles.subMenuDotActive : ""}`} />
                              <span>{sub.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
                  >
                    {item.active && <span className={styles.activeIndicator} />}
                    <Icon className={item.active ? styles.activeIcon : ""} />
                    <span>{item.name}</span>
                    {item.rolesAllowed !== "all" && (
                      <span className={styles.badgeRole}>Admin</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div>
        <div className={styles.extraHeader}>EXTRA</div>
        <ul className={styles.navList}>
          <li>
            <button
              type="button"
              onClick={logout}
              className={styles.navItem}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                fontSize: "inherit",
              }}
            >
              <LogoutIcon />
              <span>LOGOUT</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
