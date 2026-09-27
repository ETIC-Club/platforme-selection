import { prisma } from "@/lib/prisma";

export interface SelectorDisplay {
  id: number;
  userId: number;
  name: string;
  email: string;
  type: "RH" | "Technique";
  status: "en_cours" | "termine";
  assignedCount: number;
  evaluatedCount: number;
  lastActive: string;
}

export interface HistoryEventItem {
  id: number;
  name: string;
  category: string;
  closedDate: string;
  totalCandidates: number;
  selectedCount: number;
  acceptanceRate: string;
  gradientIndex: number;
}

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

// Fallback in-memory data
const MOCK_SELECTORS: Record<number, SelectorDisplay[]> = {
  1: [
    {
      id: 1,
      userId: 2,
      name: "Sarah Amrani",
      email: "rh@etic-club.net",
      type: "RH",
      status: "en_cours",
      assignedCount: 15,
      evaluatedCount: 12,
      lastActive: "Il y a 25 min",
    },
    {
      id: 2,
      userId: 3,
      name: "Mehdi Benali",
      email: "dev@etic-club.net",
      type: "Technique",
      status: "termine",
      assignedCount: 15,
      evaluatedCount: 15,
      lastActive: "Aujourd'hui, 14:30",
    },
    {
      id: 3,
      userId: 4,
      name: "Lina Kaci",
      email: "rh2@etic-club.net",
      type: "RH",
      status: "en_cours",
      assignedCount: 10,
      evaluatedCount: 4,
      lastActive: "Hier",
    },
    {
      id: 4,
      userId: 5,
      name: "Yacine Mansouri",
      email: "dev2@etic-club.net",
      type: "Technique",
      status: "en_cours",
      assignedCount: 12,
      evaluatedCount: 8,
      lastActive: "Il y a 2h",
    },
  ],
};

const MOCK_HISTORY_EVENTS: HistoryEventItem[] = [
  {
    id: 101,
    name: "HACKATHON ETIC XII",
    category: "HACKATHON",
    closedDate: "15 Jan 2026",
    totalCandidates: 120,
    selectedCount: 36,
    acceptanceRate: "30%",
    gradientIndex: 0,
  },
  {
    id: 102,
    name: "DESIGN SPRINT BOOTCAMP",
    category: "FORMATION",
    closedDate: "20 Nov 2025",
    totalCandidates: 80,
    selectedCount: 24,
    acceptanceRate: "30%",
    gradientIndex: 1,
  },
  {
    id: 103,
    name: "SELECTION CAMP 2024",
    category: "RECRUTEMENT",
    closedDate: "10 Sep 2024",
    totalCandidates: 210,
    selectedCount: 45,
    acceptanceRate: "21%",
    gradientIndex: 2,
  },
];

const MOCK_LOGS: LogItem[] = [
  {
    id: 1,
    action: "Évaluation soumise",
    actorName: "Mehdi Benali",
    actorRole: "Sélecteur Dev",
    entityType: "Candidat",
    entityName: "Ines Moktefi",
    details: "Validation technique : profil solide, projets pertinents, recommandation favorable.",
    timestamp: "Aujourd'hui à 15:42",
    badgeType: "evaluate",
  },
  {
    id: 2,
    action: "Évaluation soumise",
    actorName: "Sarah Amrani",
    actorRole: "Sélecteur RH",
    entityType: "Candidat",
    entityName: "Ines Moktefi",
    details: "Soft skills validés : excellente motivation et esprit d'équipe.",
    timestamp: "Aujourd'hui à 14:18",
    badgeType: "evaluate",
  },
  {
    id: 3,
    action: "Assignation sélecteur",
    actorName: "Admin ETIC",
    actorRole: "Super Admin",
    entityType: "Événement",
    entityName: "TRAINING CAMP XIII",
    details: "Assignation de Mehdi Benali (Sélecteur Dev) au pôle technique de l'événement.",
    timestamp: "Hier à 18:30",
    badgeType: "assign",
  },
  {
    id: 4,
    action: "Assignation sélecteur",
    actorName: "Admin ETIC",
    actorRole: "Super Admin",
    entityType: "Événement",
    entityName: "TRAINING CAMP XIII",
    details: "Assignation de Sarah Amrani (Sélecteur RH) au pôle RH de l'événement.",
    timestamp: "Hier à 18:25",
    badgeType: "assign",
  },
  {
    id: 5,
    action: "Création d'événement",
    actorName: "Admin ETIC",
    actorRole: "Super Admin",
    entityType: "Événement",
    entityName: "TRAINING CAMP XIII",
    details: "Création de l'événement avec un quota de 60 participants requis.",
    timestamp: "21 Déc à 10:00",
    badgeType: "create",
  },
  {
    id: 6,
    action: "Clôture d'événement",
    actorName: "Admin ETIC",
    actorRole: "Super Admin",
    entityType: "Historique",
    entityName: "HACKATHON ETIC XII",
    details: "Clôture des candidatures et archivage avec 36 candidats retenus.",
    timestamp: "15 Jan à 23:59",
    badgeType: "update",
  },
];

export async function getSelectorsForEvent(eventId: number): Promise<SelectorDisplay[]> {
  if (prisma) {
    try {
      const records = await prisma.eventSelector.findMany({
        where: { eventId },
        include: {
          user: true,
          assignments: {
            include: {
              evaluation: true,
            },
          },
        },
      });

      if (records && records.length > 0) {
        return records.map((r) => {
          const totalAssigned = r.assignments.length;
          const completedCount = r.assignments.filter((a) => a.evaluation !== null).length;
          const isFinished = totalAssigned > 0 && completedCount === totalAssigned;

          return {
            id: r.id,
            userId: r.userId,
            name: r.user.fullName || r.user.email.split("@")[0],
            email: r.user.email,
            type: r.selectorType as "RH" | "Technique",
            status: isFinished ? "termine" : "en_cours",
            assignedCount: totalAssigned,
            evaluatedCount: completedCount,
            lastActive: "Récemment",
          };
        });
      }
    } catch (e) {
      console.warn("Prisma query failed, falling back to mock selectors:", e);
    }
  }

  return MOCK_SELECTORS[eventId] || MOCK_SELECTORS[1];
}

export async function getHistoryEvents(): Promise<HistoryEventItem[]> {
  if (prisma) {
    try {
      const events = await prisma.event.findMany({
        where: { status: "termine" },
        include: {
          candidates: true,
        },
        orderBy: { closedAt: "desc" },
      });

      if (events && events.length > 0) {
        return events.map((ev, idx) => {
          const total = ev.candidates.length;
          const accepted = ev.candidates.filter((c) => c.finalStatus === "accepte").length;
          const rate = total > 0 ? Math.round((accepted / total) * 100) + "%" : "0%";

          return {
            id: ev.id,
            name: ev.name,
            category: "ÉVÉNEMENT",
            closedDate: ev.closedAt ? new Date(ev.closedAt).toLocaleDateString("fr-FR") : "Terminé",
            totalCandidates: total,
            selectedCount: accepted,
            acceptanceRate: rate,
            gradientIndex: idx % 3,
          };
        });
      }
    } catch (e) {
      console.warn("Prisma history query failed, falling back to mock history:", e);
    }
  }

  return MOCK_HISTORY_EVENTS;
}

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
      console.warn("Prisma logs query failed, falling back to mock logs:", e);
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
