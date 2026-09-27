"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EventCard, EventItem } from "@/components/EventCard";
import { PlusIcon } from "@/components/Icons";
import styles from "@/components/dashboard.module.css";

export default function OutsideAnEventPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.events) {
            setEvents(data.events);
          }
        }
      } catch (err) {
        console.error("Failed to load events from DB:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      {({ searchQuery, role }) => {
        const isAdmin = role === "SUPER_ADMIN";

        const filteredEvents = events.filter((ev) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            ev.name.toLowerCase().includes(query) ||
            ev.category.toLowerCase().includes(query)
          );
        });

        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <h1 className={styles.pageTitle}>NEXT EVENTS</h1>

              {isAdmin && (
                <button
                  type="button"
                  className={styles.addEventBtn}
                  onClick={() => alert("Ajout d'événement (Bientôt disponible)")}
                >
                  <PlusIcon />
                  <span>ADD EVENT</span>
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid #E5E7EB",
                    borderTopColor: "var(--color-primary-teal)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 12px auto",
                  }}
                />
                <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500 }}>
                  Chargement des événements depuis la base de données...
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#F9FAFB",
                  borderRadius: "16px",
                  border: "1px dashed #E5E7EB",
                  margin: "20px 0",
                }}
              >
                <p style={{ color: "#4B5563", fontSize: "16px", fontWeight: 600 }}>
                  {searchQuery
                    ? "Aucun événement ne correspond à votre recherche."
                    : "Aucun événement actif dans la base de données."}
                </p>
                <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "6px" }}>
                  {searchQuery
                    ? "Essayez un autre mot-clé dans la barre de recherche."
                    : "Exécutez 'npm run db:seed' dans votre terminal pour insérer vos événements et candidatures."}
                </p>
              </div>
            ) : (
              <div className={styles.eventsList}>
                {filteredEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
