import { prisma } from "@/lib/prisma";

export interface CandidateDetail {
  id: number;
  eventId: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  education: string;
  bio: string;
  cvUrl: string;
  githubUrl: string;
  competences: string[];
  projets: Array<{
    title: string;
    description: string;
    tags: string[];
    link?: string;
  }>;
  finalStatus: "en_attente" | "accepte" | "refuse";
  evaluations: Array<{
    id: number;
    selectorName: string;
    selectorType: "RH" | "Technique";
    decision: "accepter" | "rejeter" | "en_attente";
    comment: string;
    evaluatedAt: string;
  }>;
}

// In-memory persistent seed for testing and fallback when Postgres is not running
const MEMORY_CANDIDATES: CandidateDetail[] = [
  {
    id: 1,
    eventId: 1,
    nom: "Moktefi",
    prenom: "Ines",
    email: "oi_moktefi@esi.dz",
    telephone: "+213 555 12 34 56",
    education: "ESI (Ex-INI) - 1CS Ingénierie Logicielle",
    bio: "Étudiante passionnée par l'architecture logicielle, le clean code et les technologies cloud. Actuellement à la recherche d'un défi stimulant au sein du hackathon ETIC.",
    cvUrl: "https://example.com/cv-ines-moktefi.pdf",
    githubUrl: "https://github.com/ines-mktf",
    competences: ["TypeScript", "Next.js", "React", "PostgreSQL", "Prisma", "Docker", "UI/UX", "Git"],
    projets: [
      {
        title: "Plateforme Club Selection",
        description: "Application de gestion de candidatures et évaluations en temps réel pour associations étudiantes.",
        tags: ["Next.js", "PostgreSQL", "CSS Modules"],
        link: "https://github.com/ines-mktf/platforme-selection",
      },
      {
        title: "TaskFlow Mobile",
        description: "Application cross-platform de productivité pour équipes distribuées.",
        tags: ["React Native", "TailwindCSS", "Node.js"],
        link: "https://github.com/ines-mktf/taskflow",
      },
    ],
    finalStatus: "en_attente",
    evaluations: [
      {
        id: 101,
        selectorName: "Rayane Khelifi",
        selectorType: "Technique",
        decision: "accepter",
        comment: "Excellente maîtrise de TypeScript et des architectures Next.js modernes.",
        evaluatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 2,
    eventId: 1,
    nom: "Benali",
    prenom: "Youcef",
    email: "y_benali@esi.dz",
    telephone: "+213 661 78 90 12",
    education: "ESI - 2CS Systèmes Informatiques",
    bio: "Développeur Full-Stack et passionné d'intelligence artificielle appliquée. Vainqueur du Hackathon National 2024.",
    cvUrl: "https://example.com/cv-youcef-benali.pdf",
    githubUrl: "https://github.com/y-benali",
    competences: ["Python", "FastAPI", "React", "PyTorch", "Kubernetes", "Redis", "TypeScript"],
    projets: [
      {
        title: "AI Document Summarizer",
        description: "Outil d'analyse sémantique et résumé automatique de documents PDF.",
        tags: ["Python", "FastAPI", "LangChain"],
      },
    ],
    finalStatus: "accepte",
    evaluations: [
      {
        id: 102,
        selectorName: "Lina Boukhalfa",
        selectorType: "RH",
        decision: "accepter",
        comment: "Profil communicatif, très bon esprit d'équipe et motivation démontrée.",
        evaluatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
  },
  {
    id: 3,
    eventId: 1,
    nom: "Cherif",
    prenom: "Amine",
    email: "a_cherif@esi.dz",
    telephone: "+213 770 45 67 89",
    education: "ESI - 1CS Cyber-Sécurité",
    bio: "Intéressé par la sécurité offensive et le pentesting web. Toujours curieux de décortiquer les vulnérabilités de code.",
    cvUrl: "https://example.com/cv-amine-cherif.pdf",
    githubUrl: "https://github.com/amine-cherif",
    competences: ["Go", "C/C++", "Linux", "OWASP", "Python", "Bash"],
    projets: [
      {
        title: "VulnScanner CLI",
        description: "Scanner léger de configurations SSL et failles HTTP pour infrastructures locales.",
        tags: ["Go", "Bash"],
      },
    ],
    finalStatus: "refuse",
    evaluations: [
      {
        id: 103,
        selectorName: "Karim Saidi",
        selectorType: "Technique",
        decision: "rejeter",
        comment: "Compétences axées exclusivement réseau/sécurité, pas adapté au développement web du hackathon.",
        evaluatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ],
  },
  {
    id: 4,
    eventId: 1,
    nom: "Zouari",
    prenom: "Sarah",
    email: "s_zouari@esi.dz",
    telephone: "+213 550 99 88 77",
    education: "ESI - 2CP Classe Préparatoire",
    bio: "En deuxième année préparatoire, curieuse d'apprendre et dynamique. Expérience dans la création d'interfaces graphiques.",
    cvUrl: "https://example.com/cv-sarah-zouari.pdf",
    githubUrl: "https://github.com/sarah-zouari",
    competences: ["Figma", "HTML/CSS", "JavaScript", "React", "Git"],
    projets: [
      {
        title: "Club Showcase UI",
        description: "Refonte ergonomique du portail d'accueil des clubs étudiants.",
        tags: ["Figma", "React"],
      },
    ],
    finalStatus: "en_attente",
    evaluations: [],
  },
];

export async function getCandidatesByEvent(eventId: number): Promise<CandidateDetail[]> {
  if (prisma) {
    try {
      const dbCandidates = await prisma.candidate.findMany({
        where: { eventId },
        include: {
          assignments: {
            include: {
              evaluation: true,
              eventSelector: {
                include: { user: true },
              },
            },
          },
        },
      });

      if (dbCandidates && dbCandidates.length > 0) {
        return dbCandidates.map((c) => {
          const extra = (c.extraData as Record<string, unknown>) || {};
          return {
            id: c.id,
            eventId: c.eventId,
            nom: c.nom || "",
            prenom: c.prenom || "",
            email: c.email || "",
            telephone: c.telephone || "",
            education: (extra.education as string) || "ESI",
            bio: (extra.bio as string) || "",
            cvUrl: (extra.cvUrl as string) || "",
            githubUrl: (extra.githubUrl as string) || "",
            competences: (extra.competences as string[]) || [],
            projets: (extra.projets as CandidateDetail["projets"]) || [],
            finalStatus: c.finalStatus as CandidateDetail["finalStatus"],
            evaluations: c.assignments
              .filter((a) => a.evaluation)
              .map((a) => ({
                id: a.evaluation!.id,
                selectorName: a.eventSelector.user.fullName || "Sélecteur",
                selectorType: a.eventSelector.selectorType as "RH" | "Technique",
                decision: (a.evaluation!.decision as "accepter" | "rejeter" | "en_attente") || "en_attente",
                comment: a.evaluation!.comment || "",
                evaluatedAt: a.evaluation!.evaluatedAt?.toISOString() || new Date().toISOString(),
              })),
          };
        });
      }
    } catch {
      // Database offline or unseeded; proceed with fault-tolerant memory store
    }
  }

  return MEMORY_CANDIDATES.filter((c) => c.eventId === eventId);
}


export async function submitCandidateEvaluation(data: {
  candidateId: number;
  selectorName: string;
  selectorType: "RH" | "Technique";
  decision: "accepter" | "rejeter" | "en_attente";
  comment: string;
  userRole?: string;
}): Promise<{ success: boolean; candidate: CandidateDetail }> {
  if (data.userRole === "STANDARD_USER") {
    throw new Error("Action non autorisée: les utilisateurs standard sont en lecture seule.");
  }

  const evaluatedAt = new Date().toISOString();

  // Update memory store
  const target = MEMORY_CANDIDATES.find((c) => c.id === data.candidateId);
  if (target) {
    // Update or add evaluation
    const existingIndex = target.evaluations.findIndex((e) => e.selectorType === data.selectorType);
    if (existingIndex >= 0) {
      target.evaluations[existingIndex] = {
        ...target.evaluations[existingIndex],
        selectorName: data.selectorName,
        decision: data.decision,
        comment: data.comment,
        evaluatedAt,
      };
    } else {
      target.evaluations.push({
        id: Date.now(),
        selectorName: data.selectorName,
        selectorType: data.selectorType,
        decision: data.decision,
        comment: data.comment,
        evaluatedAt,
      });
    }

    // Update overall candidate finalStatus
    if (data.decision === "accepter") target.finalStatus = "accepte";
    else if (data.decision === "rejeter") target.finalStatus = "refuse";
    else target.finalStatus = "en_attente";

    return { success: true, candidate: { ...target } };
  }

  throw new Error("Candidate not found");
}
