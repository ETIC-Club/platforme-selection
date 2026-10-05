import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * SEED V2 - ETIC Platform Selection
 *
 * This script seeds:
 * 1. Admin account: admaneo99@gmail.com (Super Admin) + existing admins
 * 2. Dedicated RH & Technique Selectors
 * 3. Training Camp XIII Event with rich candidates, assignments & evaluations
 * 4. Completed History Events: Event 1, Event 2, Event 3, Event 4 with realistic candidates & metrics
 */
async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  console.log("🌱 Starting Seed v2...");

  // =========================================================================
  // 1. ADMINS
  // =========================================================================
  const primaryAdmin = await prisma.user.upsert({
    where: { email: "admaneo99@gmail.com" },
    update: {
      fullName: "Admane Oussama",
      isSuperAdmin: true,
    },
    create: {
      googleId: "google-admane-99",
      email: "admaneo99@gmail.com",
      fullName: "Admane Oussama",
      isSuperAdmin: true,
    },
  });

  const eticAdmin = await prisma.user.upsert({
    where: { email: "admin@etic-club.net" },
    update: {
      fullName: "Admin ETIC",
      isSuperAdmin: true,
    },
    create: {
      googleId: "google-admin-etic",
      email: "admin@etic-club.net",
      fullName: "Admin ETIC",
      isSuperAdmin: true,
    },
  });

  const esiAdmin = await prisma.user.upsert({
    where: { email: "om_admane@esi.dz" },
    update: {
      fullName: "Admane Oussama (ESI)",
      isSuperAdmin: true,
    },
    create: {
      googleId: "google-admane-esi",
      email: "om_admane@esi.dz",
      fullName: "Admane Oussama (ESI)",
      isSuperAdmin: true,
    },
  });

  console.log(`✅ Admins ready: ${primaryAdmin.email}, ${eticAdmin.email}, ${esiAdmin.email}`);

  // Ensure admins NEVER have event selector assignments ("the admin doesn't do selection")
  await prisma.eventSelector.deleteMany({
    where: {
      userId: { in: [primaryAdmin.id, eticAdmin.id, esiAdmin.id] },
    },
  });
  // 2. SELECTORS
  // =========================================================================
  const rhSelector1 = await prisma.user.upsert({
    where: { email: "rh@etic-club.net" },
    update: { fullName: "Sarah Amrani", isSuperAdmin: false },
    create: {
      googleId: "google-sel-rh-1",
      email: "rh@etic-club.net",
      fullName: "Sarah Amrani",
      isSuperAdmin: false,
    },
  });

  const rhSelector2 = await prisma.user.upsert({
    where: { email: "lina.rh@etic-club.net" },
    update: { fullName: "Lina Kaci", isSuperAdmin: false },
    create: {
      googleId: "google-sel-rh-2",
      email: "lina.rh@etic-club.net",
      fullName: "Lina Kaci",
      isSuperAdmin: false,
    },
  });

  const techSelector1 = await prisma.user.upsert({
    where: { email: "dev@etic-club.net" },
    update: { fullName: "Mehdi Benali", isSuperAdmin: false },
    create: {
      googleId: "google-sel-tech-1",
      email: "dev@etic-club.net",
      fullName: "Mehdi Benali",
      isSuperAdmin: false,
    },
  });

  const techSelector2 = await prisma.user.upsert({
    where: { email: "yacine.dev@etic-club.net" },
    update: { fullName: "Yacine Mansouri", isSuperAdmin: false },
    create: {
      googleId: "google-sel-tech-2",
      email: "yacine.dev@etic-club.net",
      fullName: "Yacine Mansouri",
      isSuperAdmin: false,
    },
  });

  console.log("✅ Selectors ready (Sarah, Lina, Mehdi, Yacine).");

  // =========================================================================
  // 3. ACTIVE EVENT: TRAINING CAMP XIII
  // =========================================================================
  let trainingCamp = await prisma.event.findFirst({
    where: { name: { contains: "TRAINING CAMP", mode: "insensitive" } },
  });

  if (!trainingCamp) {
    trainingCamp = await prisma.event.create({
      data: {
        name: "TRAINING CAMP XIII",
        description: "Hackathon et camp de sélection intensif annuel du Club ETIC.",
        quotaParticipants: 50,
        nbEvalRh: 1,
        nbEvalTechnique: 1,
        status: "en_cours",
        createdBy: primaryAdmin.id,
      },
    });
  } else {
    trainingCamp = await prisma.event.update({
      where: { id: trainingCamp.id },
      data: {
        status: "en_cours",
        quotaParticipants: 50,
        nbEvalRh: 1,
        nbEvalTechnique: 1,
      },
    });
  }

  // Assign selectors to Training Camp XIII
  const tcRhEventSelector = await prisma.eventSelector.upsert({
    where: {
      eventId_userId_selectorType: {
        eventId: trainingCamp.id,
        userId: rhSelector1.id,
        selectorType: "RH",
      },
    },
    update: { isActive: true },
    create: {
      eventId: trainingCamp.id,
      userId: rhSelector1.id,
      selectorType: "RH",
      addedBy: primaryAdmin.id,
      isActive: true,
    },
  });

  const tcTechEventSelector = await prisma.eventSelector.upsert({
    where: {
      eventId_userId_selectorType: {
        eventId: trainingCamp.id,
        userId: techSelector1.id,
        selectorType: "Technique",
      },
    },
    update: { isActive: true },
    create: {
      eventId: trainingCamp.id,
      userId: techSelector1.id,
      selectorType: "Technique",
      addedBy: primaryAdmin.id,
      isActive: true,
    },
  });

  // Candidate dataset for Training Camp
  const trainingCampCandidates = [
    {
      prenom: "Ines",
      nom: "Moktefi",
      email: "oi_moktefi@esi.dz",
      telephone: "+213 555 12 34 56",
      education: "ESI (Ex-INI) - 1CS Ingénierie Logicielle",
      bio: "Passionnée par l'architecture logicielle, le clean code et les technologies cloud. Expérience pratique en Next.js et Postgres.",
      cvUrl: "https://example.com/cv-ines-moktefi.pdf",
      githubUrl: "https://github.com/ines-mktf",
      competences: ["TypeScript", "Next.js", "React", "PostgreSQL", "Prisma", "Docker", "Git"],
      projets: [
        {
          title: "Plateforme Club Selection",
          description: "Application de gestion de candidatures et évaluations en temps réel pour associations.",
          tags: ["Next.js", "PostgreSQL", "CSS Modules"],
        },
      ],
      finalStatus: "accepte" as const,
      rhDecision: "accepter" as const,
      rhComment: "Profil exemplaire, communication fluide, grande motivation pour l'équipe.",
      techDecision: "accepter" as const,
      techComment: "Excellentes bases sur Next.js et PostgreSQL, code propre et réfléchi.",
    },
    {
      prenom: "Karim",
      nom: "Belaid",
      email: "kb_belaid@esi.dz",
      telephone: "+213 550 23 45 67",
      education: "ESI - 2CS Systèmes Informatiques",
      bio: "Développeur backend expérimenté, passionné par les systèmes distribués, le Go et Docker.",
      cvUrl: "https://example.com/cv-karim-belaid.pdf",
      githubUrl: "https://github.com/karim-belaid",
      competences: ["Go", "Node.js", "Docker", "Kubernetes", "PostgreSQL", "Microservices"],
      projets: [
        {
          title: "FastQueue",
          description: "Système de file de messages asynchrone haute performance.",
          tags: ["Go", "Redis", "Docker"],
        },
      ],
      finalStatus: "accepte" as const,
      rhDecision: "accepter" as const,
      rhComment: "Esprit d'équipe remarquable et grande maturité dans les réponses.",
      techDecision: "accepter" as const,
      techComment: "Niveau backend au-dessus de la moyenne. Maîtrise solide du multithreading.",
    },
    {
      prenom: "Sara",
      nom: "Haddad",
      email: "sh_haddad@esi.dz",
      telephone: "+213 551 34 56 78",
      education: "ESI - 1CS Système d'Information",
      bio: "Designer UI/UX et intégratrice front-end. Passionnée par l'accessibilité et la psychologie cognitive.",
      cvUrl: "https://example.com/cv-sara-haddad.pdf",
      githubUrl: "https://github.com/sara-haddad",
      competences: ["Figma", "UI/UX", "TailwindCSS", "React", "Design Systems"],
      projets: [
        {
          title: "CampusConnect",
          description: "Maquettes UI complètes et prototype interactif pour réseau étudiant.",
          tags: ["Figma", "UI/UX"],
        },
      ],
      finalStatus: "en_attente" as const,
      rhDecision: "accepter" as const,
      rhComment: "Très communicative et passionnée par l'expérience utilisateur.",
      techDecision: "en_attente" as const,
      techComment: "Très bon profil design, à valider sur l'intégration React autonome.",
    },
    {
      prenom: "Walid",
      nom: "Amir",
      email: "mw_amir@usthb.dz",
      telephone: "+213 552 45 67 89",
      education: "USTHB - L3 Informatique",
      bio: "Développeur mobile Flutter et passionné d'intelligence artificielle appliquée.",
      cvUrl: "https://example.com/cv-walid-amir.pdf",
      githubUrl: "https://github.com/walid-amir",
      competences: ["Flutter", "Dart", "Firebase", "Python", "REST API"],
      projets: [
        {
          title: "DzTransport",
          description: "Application mobile de suivi des transports urbains.",
          tags: ["Flutter", "Firebase"],
        },
      ],
      finalStatus: "en_attente" as const,
      rhDecision: "en_attente" as const,
      rhComment: "Bonne motivation mais disponibilité à confirmer pour les week-ends.",
      techDecision: "accepter" as const,
      techComment: "Bonnes bases en mobile et intégration API.",
    },
    {
      prenom: "Rayan",
      nom: "Bennacer",
      email: "mr_bennacer@esi.dz",
      telephone: "+213 553 56 78 90",
      education: "ESI - 2CP Classe Préparatoire",
      bio: "Étudiant curieux, s'intéresse à la programmation compétitive et aux algorithmes.",
      cvUrl: "https://example.com/cv-rayan-bennacer.pdf",
      githubUrl: "https://github.com/rayan-bennacer",
      competences: ["C++", "Python", "Data Structures", "Algorithms"],
      projets: [],
      finalStatus: "refuse" as const,
      rhDecision: "rejeter" as const,
      rhComment: "Profil encore hésitant sur son engagement associatif cette année.",
      techDecision: "rejeter" as const,
      techComment: "Bonne logique algorithmique mais manque d'expérience pratique en dev web/mobile.",
    },
    {
      prenom: "Yasmine",
      nom: "Ziani",
      email: "iy_ziani@enp.edu.dz",
      telephone: "+213 554 67 89 01",
      education: "ENP - 2ème Année Génie Logiciel",
      bio: "Passionnée par le DevOps, l'automatisation CI/CD et l'administration Linux.",
      cvUrl: "https://example.com/cv-yasmine-ziani.pdf",
      githubUrl: "https://github.com/yasmine-ziani",
      competences: ["Linux", "Bash", "GitHub Actions", "Docker", "Python", "Terraform"],
      projets: [
        {
          title: "DeployBot",
          description: "Script d'orchestration CI/CD pour déploiement zero-downtime.",
          tags: ["Bash", "Docker", "CI/CD"],
        },
      ],
      finalStatus: "accepte" as const,
      rhDecision: "accepter" as const,
      rhComment: "Dynamique, enthousiaste et proactive. Parfaite pour animer des ateliers.",
      techDecision: "accepter" as const,
      techComment: "Excellentes compétences DevOps, un atout majeur pour l'infrastructure.",
    },
    {
      prenom: "Sofiane",
      nom: "Feghouli",
      email: "sf_feghouli@univ-alger.dz",
      telephone: "+213 555 78 90 12",
      education: "Univ Alger 1 - Master 1 Informatique",
      bio: "Développeur Fullstack passionné par Vue.js, Laravel et le design ergonomique.",
      cvUrl: "https://example.com/cv-sofiane-feghouli.pdf",
      githubUrl: "https://github.com/sofiane-feghouli",
      competences: ["Vue.js", "Laravel", "PHP", "MySQL", "TailwindCSS"],
      projets: [],
      finalStatus: "en_attente" as const,
      rhDecision: "accepter" as const,
      rhComment: "Bonne écoute, personnalité calme et organisée.",
      techDecision: "en_attente" as const,
      techComment: "Solide en PHP/Vue. À tester sur l'écosystème React/Next.",
    },
    {
      prenom: "Islam",
      nom: "Slimani",
      email: "is_slimani@esi.dz",
      telephone: "+213 556 89 01 23",
      education: "ESI - 1CS Réseaux et Sécurité",
      bio: "Passionné de cybersécurité, tests d'intrusion éthiques et sécurité applicative web.",
      cvUrl: "https://example.com/cv-islam-slimani.pdf",
      githubUrl: "https://github.com/islam-slimani",
      competences: ["Cybersecurity", "Network Security", "Python", "Linux", "Burp Suite"],
      projets: [],
      finalStatus: "accepte" as const,
      rhDecision: "accepter" as const,
      rhComment: "Très sérieux et structuré, bonne vision d'ensemble.",
      techDecision: "accepter" as const,
      techComment: "Sens aigu de la sécurité, connaissances précieuses.",
    },
    {
      prenom: "Amine",
      nom: "Gouiri",
      email: "ag_gouiri@usthb.dz",
      telephone: "+213 557 90 12 34",
      education: "USTHB - L2 Mathématiques & Informatique",
      bio: "Développeur JavaScript curieux, débutant en React mais très motivé pour progresser.",
      cvUrl: "https://example.com/cv-amine-gouiri.pdf",
      githubUrl: "https://github.com/amine-gouiri",
      competences: ["JavaScript", "HTML/CSS", "Git", "React Basics"],
      projets: [],
      finalStatus: "en_attente" as const,
      rhDecision: "accepter" as const,
      rhComment: "Grande soif d'apprendre et état d'esprit positif.",
      techDecision: null,
      techComment: null,
    },
    {
      prenom: "Rayan",
      nom: "Ait Nouri",
      email: "rn_aitnouri@esi.dz",
      telephone: "+213 558 01 23 45",
      education: "ESI - 1CS Génie Informatique",
      bio: "Développeur frontend passionné par Three.js, animations web et design créatif.",
      cvUrl: "https://example.com/cv-rayan-aitnouri.pdf",
      githubUrl: "https://github.com/rayan-aitnouri",
      competences: ["Three.js", "React", "GSAP", "CSS Animations", "WebGL"],
      projets: [
        {
          title: "3D Portfolio Showcase",
          description: "Site interactif avec scènes 3D immersives et shaders personnalisés.",
          tags: ["Three.js", "WebGL", "React"],
        },
      ],
      finalStatus: "accepte" as const,
      rhDecision: "accepter" as const,
      rhComment: "Créativité impressionnante et belle présentation.",
      techDecision: "accepter" as const,
      techComment: "Capacité graphique et technique rare à ce stade d'études.",
    },
  ];

  // Insert Training Camp Candidates
  let rowNumber = 1;
  for (const candData of trainingCampCandidates) {
    const candidate = await prisma.candidate.upsert({
      where: {
        eventId_csvRowNumber: {
          eventId: trainingCamp.id,
          csvRowNumber: rowNumber,
        },
      },
      update: {
        nom: candData.nom,
        prenom: candData.prenom,
        email: candData.email,
        telephone: candData.telephone,
        finalStatus: candData.finalStatus,
        extraData: {
          education: candData.education,
          bio: candData.bio,
          cvUrl: candData.cvUrl,
          githubUrl: candData.githubUrl,
          competences: candData.competences,
          projets: candData.projets,
        },
      },
      create: {
        eventId: trainingCamp.id,
        csvRowNumber: rowNumber,
        nom: candData.nom,
        prenom: candData.prenom,
        email: candData.email,
        telephone: candData.telephone,
        finalStatus: candData.finalStatus,
        extraData: {
          education: candData.education,
          bio: candData.bio,
          cvUrl: candData.cvUrl,
          githubUrl: candData.githubUrl,
          competences: candData.competences,
          projets: candData.projets,
        },
      },
    });

    // Create RH Evaluation if present
    if (candData.rhDecision) {
      const rhAssign = await prisma.assignment.upsert({
        where: {
          candidateId_eventSelectorId: {
            candidateId: candidate.id,
            eventSelectorId: tcRhEventSelector.id,
          },
        },
        update: {},
        create: {
          candidateId: candidate.id,
          eventSelectorId: tcRhEventSelector.id,
          assignedBy: primaryAdmin.id,
        },
      });

      await prisma.evaluation.upsert({
        where: { assignmentId: rhAssign.id },
        update: {
          decision: candData.rhDecision,
          comment: candData.rhComment || "",
          evaluatedAt: new Date(Date.now() - 3600000 * 24),
        },
        create: {
          assignmentId: rhAssign.id,
          decision: candData.rhDecision,
          comment: candData.rhComment || "",
          evaluatedAt: new Date(Date.now() - 3600000 * 24),
        },
      });
    }

    // Create Tech Evaluation if present
    if (candData.techDecision) {
      const techAssign = await prisma.assignment.upsert({
        where: {
          candidateId_eventSelectorId: {
            candidateId: candidate.id,
            eventSelectorId: tcTechEventSelector.id,
          },
        },
        update: {},
        create: {
          candidateId: candidate.id,
          eventSelectorId: tcTechEventSelector.id,
          assignedBy: primaryAdmin.id,
        },
      });

      await prisma.evaluation.upsert({
        where: { assignmentId: techAssign.id },
        update: {
          decision: candData.techDecision,
          comment: candData.techComment || "",
          evaluatedAt: new Date(Date.now() - 3600000 * 12),
        },
        create: {
          assignmentId: techAssign.id,
          decision: candData.techDecision,
          comment: candData.techComment || "",
          evaluatedAt: new Date(Date.now() - 3600000 * 12),
        },
      });
    }

    rowNumber++;
  }

  console.log(`✅ Training Camp XIII seeded with ${trainingCampCandidates.length} candidates and evaluations.`);

  // =========================================================================
  // 4. HISTORY EVENTS ("event1 event2 ect")
  // =========================================================================
  const historyEventsData = [
    {
      name: "Event 1 - Winter Hackathon 2026",
      description: "Hackathon intensif de 48h axé sur les technologies web, cloud et IA.",
      quotaParticipants: 50,
      status: "termine" as const,
      createdAt: new Date("2026-01-10T09:00:00Z"),
      closedAt: new Date("2026-01-12T18:00:00Z"),
      candidates: [
        { prenom: "Nabil", nom: "Bentaleb", email: "nb_bentaleb@esi.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Excellente prestation." },
        { prenom: "Youcef", nom: "Atal", email: "ya_atal@usthb.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Projet très complet." },
        { prenom: "Baghdad", nom: "Bounedjah", email: "bb_bounedjah@esi.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Bonne présentation orale." },
        { prenom: "Aissa", nom: "Mandi", email: "am_mandi@univ-blida.dz", finalStatus: "refuse" as const, decision: "rejeter" as const, comment: "Projet inachevé." },
      ],
    },
    {
      name: "Event 2 - Tech Bootcamp 2025",
      description: "Bootcamp et sélection pour la formation avancée Fullstack et DevOps.",
      quotaParticipants: 40,
      status: "termine" as const,
      createdAt: new Date("2025-11-05T09:00:00Z"),
      closedAt: new Date("2025-11-08T18:00:00Z"),
      candidates: [
        { prenom: "Riyad", nom: "Mahrez", email: "mr_mahrez@usthb.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Leader technique naturel." },
        { prenom: "Ismael", nom: "Bennacer", email: "ib_bennacer@esi.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Code très structuré." },
        { prenom: "Adam", nom: "Ounas", email: "ao_ounas@enp.edu.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Créatif et rapide." },
        { prenom: "Faouzi", nom: "Ghoulam", email: "fg_ghoulam@enp.edu.dz", finalStatus: "refuse" as const, decision: "rejeter" as const, comment: "Absence lors du pitch final." },
      ],
    },
    {
      name: "Event 3 - Spring Challenge 2025",
      description: "Compétition de design d'interfaces, ergonomie logicielle et pitch d'idées.",
      quotaParticipants: 35,
      status: "termine" as const,
      createdAt: new Date("2025-05-02T09:00:00Z"),
      closedAt: new Date("2025-05-04T18:00:00Z"),
      candidates: [
        { prenom: "Yacine", nom: "Brahimi", email: "yb_brahimi@esi.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Design exceptionnel." },
        { prenom: "Houssem", nom: "Aouar", email: "ha_aouar@esi.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Excellente ergonomie." },
        { prenom: "Carl", nom: "Medjani", email: "cm_medjani@usthb.dz", finalStatus: "refuse" as const, decision: "rejeter" as const, comment: "Hors sujet sur la thématique." },
      ],
    },
    {
      name: "Event 4 - ETIC Selection Days 2024",
      description: "Journées annuelles de sélection des nouveaux membres actifs du club.",
      quotaParticipants: 60,
      status: "termine" as const,
      createdAt: new Date("2024-10-01T09:00:00Z"),
      closedAt: new Date("2024-10-03T18:00:00Z"),
      candidates: [
        { prenom: "Hicham", nom: "Boudaoui", email: "hb_boudaoui@usthb.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Très motivé et impliqué." },
        { prenom: "Farid", nom: "Boulaya", email: "fb_boulaya@enp.edu.dz", finalStatus: "accepte" as const, decision: "accepter" as const, comment: "Bon esprit d'équipe." },
        { prenom: "Rachid", nom: "Ghezzal", email: "rg_ghezzal@univ-blida.dz", finalStatus: "refuse" as const, decision: "rejeter" as const, comment: "Disponibilité insuffisante." },
      ],
    },
  ];

  for (const hEvent of historyEventsData) {
    let eventRec = await prisma.event.findFirst({
      where: { name: hEvent.name },
    });

    if (!eventRec) {
      eventRec = await prisma.event.create({
        data: {
          name: hEvent.name,
          description: hEvent.description,
          quotaParticipants: hEvent.quotaParticipants,
          status: hEvent.status,
          createdAt: hEvent.createdAt,
          closedAt: hEvent.closedAt,
          createdBy: primaryAdmin.id,
        },
      });
    } else {
      eventRec = await prisma.event.update({
        where: { id: eventRec.id },
        data: {
          description: hEvent.description,
          quotaParticipants: hEvent.quotaParticipants,
          status: hEvent.status,
          closedAt: hEvent.closedAt,
        },
      });
    }

    // Add a selector assignment for history stats
    const sel = await prisma.eventSelector.upsert({
      where: {
        eventId_userId_selectorType: {
          eventId: eventRec.id,
          userId: rhSelector1.id,
          selectorType: "RH",
        },
      },
      update: {},
      create: {
        eventId: eventRec.id,
        userId: rhSelector1.id,
        selectorType: "RH",
        addedBy: primaryAdmin.id,
      },
    });

    // Add candidates and evaluations
    let hRow = 1;
    for (const cand of hEvent.candidates) {
      const cRec = await prisma.candidate.upsert({
        where: {
          eventId_csvRowNumber: {
            eventId: eventRec.id,
            csvRowNumber: hRow,
          },
        },
        update: {
          nom: cand.nom,
          prenom: cand.prenom,
          email: cand.email,
          finalStatus: cand.finalStatus,
        },
        create: {
          eventId: eventRec.id,
          csvRowNumber: hRow,
          nom: cand.nom,
          prenom: cand.prenom,
          email: cand.email,
          finalStatus: cand.finalStatus,
          extraData: {
            education: "Université Algérienne",
          },
        },
      });

      const assign = await prisma.assignment.upsert({
        where: {
          candidateId_eventSelectorId: {
            candidateId: cRec.id,
            eventSelectorId: sel.id,
          },
        },
        update: {},
        create: {
          candidateId: cRec.id,
          eventSelectorId: sel.id,
          assignedBy: primaryAdmin.id,
        },
      });

      await prisma.evaluation.upsert({
        where: { assignmentId: assign.id },
        update: {
          decision: cand.decision,
          comment: cand.comment,
          evaluatedAt: hEvent.closedAt,
        },
        create: {
          assignmentId: assign.id,
          decision: cand.decision,
          comment: cand.comment,
          evaluatedAt: hEvent.closedAt,
        },
      });

      hRow++;
    }
  }

  console.log(`✅ History events (Event 1, Event 2, Event 3, Event 4) created with candidates and evaluations.`);
  console.log("\n🎉 Seed v2 finished successfully!");
  console.log("-------------------------------------------------------");
  console.log(`Admin email: admaneo99@gmail.com (Super Admin)`);
  console.log(`Training Camp: ${trainingCamp.name} (Active, status: en_cours)`);
  console.log(`History Events: Event 1, Event 2, Event 3, Event 4 (status: termine)`);
  console.log("-------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed v2 error:", e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
