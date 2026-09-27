import { prisma } from "@/lib/prisma";

export interface LogItem {
  id: number;
  action: string;
  actorName: string;
  actorRole: string;
  entityType: string;
  entityName: string;
  details: string;
  timestamp: string;
  badgeType: "create" | "assign" | "evaluate" | "auth" | "update";
}

const MOCK_LOGS: LogItem[] = [];

export async function getSystemLogs(): Promise<LogItem[]> {
  if (prisma) {
    try {
      const logs = await prisma.log.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      if (logs && logs.length > 0) {
        return logs.map((l) => {
          let badgeType: LogItem["badgeType"] = "update";
          if (l.action.toLowerCase().includes("créa")) badgeType = "create";
          else if (l.action.toLowerCase().includes("assign")) badgeType = "assign";
          else if (l.action.toLowerCase().includes("éval")) badgeType = "evaluate";

          const detailsStr = typeof l.details === "string" ? l.details : JSON.stringify(l.details || "");

          return {
            id: l.id,
            action: l.action,
            actorName: l.user?.fullName || "Système",
            actorRole: l.user?.isSuperAdmin ? "Super Admin" : "Sélecteur",
            entityType: l.entityType || "Général",
            entityName: `${l.entityType || "Entité"} #${l.entityId || ""}`,
            details: detailsStr,
            timestamp: new Date(l.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            badgeType,
          };
        });
      }
    } catch (e) {
      console.warn("Prisma logs query failed:", e);
    }
  }

  return MOCK_LOGS;
}

export interface ActiveEventItem {
  id: number;
  name: string;
  category: string;
  dateSubtitle: string;
  requiredParticipants: number;
  selectedParticipants: number;
  deadlineDate: string;
  gradientIndex: number;
}

export async function getActiveEvents(): Promise<ActiveEventItem[]> {
  if (prisma) {
    try {
      const events = await prisma.event.findMany({
        where: { status: "en_cours" },
        include: {
          candidates: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (events && events.length > 0) {
        return events.map((ev, idx) => {
          const selected = ev.candidates.filter((c) => c.finalStatus === "accepte").length;
          const createdDate = new Date(ev.createdAt);
          const dateStr = createdDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          });

          let category = "HACKATHON";
          const desc = (ev.description || "").toUpperCase();
          const name = ev.name.toUpperCase();
          if (desc.includes("FORMATION") || name.includes("FORMATION")) {
            category = "FORMATION";
          } else if (desc.includes("RECRUTEMENT") || name.includes("CAMP")) {
            category = "CAMP";
          } else if (desc.includes("HACKATHON") || name.includes("HACKATHON")) {
            category = "HACKATHON";
          } else {
            category = "ÉVÉNEMENT";
          }

          return {
            id: ev.id,
            name: ev.name,
            category,
            dateSubtitle: dateStr,
            requiredParticipants: ev.quotaParticipants ?? 0,
            selectedParticipants: selected,
            deadlineDate: dateStr,
            gradientIndex: idx % 3,
          };
        });
      }
    } catch (e) {
      console.warn("Prisma active events query failed:", e);
    }
  }

  return [];
}
