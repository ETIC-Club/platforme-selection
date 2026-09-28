import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ============================================================================
// ⚙️ CONFIGURATION : PERSONNALISEZ VOS EMAILS ET NOMS ICI
// Vous pouvez modifier librement les valeurs ci-dessous avant d'exécuter le script :
// ============================================================================
export const SEED_CONFIG = {
  // 1. Administrateur (Super Admin)
  ADMIN_EMAIL: "om_admane@esi.dz",
  ADMIN_NAME: "Admane Oussama",

  // 2. Sélecteur RH
  SELECTOR_RH_EMAIL: "rh@etic-club.net",
  SELECTOR_RH_NAME: "Sarah Amrani",

  // 3. Sélecteur Dev (Technique)
  SELECTOR_DEV_EMAIL: "dev@etic-club.net",
  SELECTOR_DEV_NAME: "Mehdi Benali",

  // Paramètres de l'événement
  EVENT_NAME: "TRAINING CAMP XIII",
  EVENT_DESCRIPTION: "Hackathon et camp de sélection annuel des membres du Club ETIC",
  EVENT_QUOTA: 60,
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("======================================================");
  console.log("🚀 Démarrage du Seeding de la base de données...");
  console.log("======================================================");

  // --------------------------------------------------------------------------
  // 1. CRÉATION DES 3 UTILISATEURS (1 Admin, 1 Sélecteur RH, 1 Sélecteur Dev)
  // --------------------------------------------------------------------------
  console.log("\n👤 1. Création / Mise à jour des 3 utilisateurs configurés...");

  const admin = await prisma.user.upsert({
    where: { email: SEED_CONFIG.ADMIN_EMAIL },
    update: {
      fullName: SEED_CONFIG.ADMIN_NAME,
      isSuperAdmin: true,
    },
    create: {
      googleId: `google-admin-${Date.now()}`,
      email: SEED_CONFIG.ADMIN_EMAIL,
      fullName: SEED_CONFIG.ADMIN_NAME,
      isSuperAdmin: true,
    },
  });
  console.log(`   ✓ Admin : ${admin.fullName} (${admin.email}) [ID: ${admin.id}]`);

  const selectorRh = await prisma.user.upsert({
    where: { email: SEED_CONFIG.SELECTOR_RH_EMAIL },
    update: {
      fullName: SEED_CONFIG.SELECTOR_RH_NAME,
      isSuperAdmin: false,
    },
    create: {
      googleId: `google-rh-${Date.now()}`,
      email: SEED_CONFIG.SELECTOR_RH_EMAIL,
      fullName: SEED_CONFIG.SELECTOR_RH_NAME,
      isSuperAdmin: false,
    },
  });
  console.log(`   ✓ Sélecteur RH : ${selectorRh.fullName} (${selectorRh.email}) [ID: ${selectorRh.id}]`);

  const selectorDev = await prisma.user.upsert({
    where: { email: SEED_CONFIG.SELECTOR_DEV_EMAIL },
    update: {
      fullName: SEED_CONFIG.SELECTOR_DEV_NAME,
      isSuperAdmin: false,
    },
    create: {
      googleId: `google-dev-${Date.now()}`,
      email: SEED_CONFIG.SELECTOR_DEV_EMAIL,
      fullName: SEED_CONFIG.SELECTOR_DEV_NAME,
      isSuperAdmin: false,
    },
  });
  console.log(`   ✓ Sélecteur Dev : ${selectorDev.fullName} (${selectorDev.email}) [ID: ${selectorDev.id}]`);

  // --------------------------------------------------------------------------
  // 2. CRÉATION DE L'ÉVÉNEMENT DANS LA DB
  // --------------------------------------------------------------------------
  console.log("\n📅 2. Création de l'événement principal...");

  const event = await prisma.event.upsert({
    where: { id: 1 },
    update: {
      name: SEED_CONFIG.EVENT_NAME,
      description: SEED_CONFIG.EVENT_DESCRIPTION,
      quotaParticipants: SEED_CONFIG.EVENT_QUOTA,
      status: "en_cours",
      createdBy: admin.id,
    },
    create: {
      id: 1,
      name: SEED_CONFIG.EVENT_NAME,
      description: SEED_CONFIG.EVENT_DESCRIPTION,
      quotaParticipants: SEED_CONFIG.EVENT_QUOTA,
      status: "en_cours",
      createdBy: admin.id,
    },
  });
  console.log(`   ✓ Événement : "${event.name}" [ID: ${event.id}, Quota: ${event.quotaParticipants}]`);

  // --------------------------------------------------------------------------
  // 3. ASSIGNATION DES 2 SÉLECTEURS À L'ÉVÉNEMENT (EventSelector)
  // --------------------------------------------------------------------------
  console.log("\n🔗 3. Assignation des sélecteurs RH et Dev à l'événement...");

  const eventSelectorRh = await prisma.eventSelector.upsert({
    where: {
      eventId_userId_selectorType: {
        eventId: event.id,
        userId: selectorRh.id,
        selectorType: "RH",
      },
    },
    update: { isActive: true },
    create: {
      eventId: event.id,
      userId: selectorRh.id,
      selectorType: "RH",
      addedBy: admin.id,
      isActive: true,
    },
  });
  console.log(`   ✓ ${selectorRh.fullName} assigné(e) comme Sélecteur RH à l'événement #${event.id}`);

  const eventSelectorDev = await prisma.eventSelector.upsert({
    where: {
      eventId_userId_selectorType: {
        eventId: event.id,
        userId: selectorDev.id,
        selectorType: "Technique",
      },
    },
    update: { isActive: true },
    create: {
      eventId: event.id,
      userId: selectorDev.id,
      selectorType: "Technique",
      addedBy: admin.id,
      isActive: true,
    },
  });
  console.log(`   ✓ ${selectorDev.fullName} assigné(e) comme Sélecteur Dev à l'événement #${event.id}`);

  // --------------------------------------------------------------------------
  // 4. CRÉATION DES CANDIDATURES
  // --------------------------------------------------------------------------
  console.log("\n📋 4. Insertion des candidatures pour l'événement...");

  const candidateData = [
    {
      csvRowNumber: 1,
      nom: "Moktefi",
      prenom: "Ines",
      email: "oi_moktefi@esi.dz",
      telephone: "+213 555 12 34 56",
      finalStatus: "accepte" as const,
      extraData: {
        education: "ESI (Ex-INI) - 1CS Ingénierie Logicielle",
        bio: "Étudiante passionnée par l'architecture logicielle, le clean code et les technologies cloud. Actuellement à la recherche d'un défi stimulant au sein du hackathon ETIC.",
        cvUrl: "https://example.com/cv-ines.pdf",
        githubUrl: "https://github.com/ines-mktf",
        competences: ["TypeScript", "Next.js", "React", "PostgreSQL", "Docker", "UI/UX", "Git"],
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
            tags: ["React Native", "Node.js"],
            link: "https://github.com/ines-mktf/taskflow",
          },
        ],
      },
    },
    {
      csvRowNumber: 2,
      nom: "Belkacem",
      prenom: "Rayane",
      email: "or_belkacem@esi.dz",
      telephone: "+213 555 98 76 54",
      finalStatus: "en_attente" as const,
      extraData: {
        education: "ESI - 2CP Préparatoire",
        bio: "Développeur full-stack curieux et dynamique. Très impliqué dans le monde associatif et les projets open-source.",
        cvUrl: "https://example.com/cv-rayane.pdf",
        githubUrl: "https://github.com/rayane-blk",
        competences: ["Python", "FastAPI", "React", "TailwindCSS", "SQL"],
        projets: [
          {
            title: "ETIC Portal",
            description: "Portail associatif pour la gestion des événements et ateliers.",
            tags: ["FastAPI", "React"],
            link: "https://github.com/rayane-blk/portal",
          },
        ],
      },
    },
    {
      csvRowNumber: 3,
      nom: "Cherif",
      prenom: "Amina",
      email: "oa_cherif@esi.dz",
      telephone: "+213 555 45 67 89",
      finalStatus: "en_attente" as const,
      extraData: {
        education: "USTHB - M1 Data Science & IA",
        bio: "Passionnée par le machine learning, la visualisation de données et l'impact social de l'intelligence artificielle.",
        cvUrl: "https://example.com/cv-amina.pdf",
        githubUrl: "https://github.com/amina-data",
        competences: ["Python", "PyTorch", "Pandas", "Scikit-Learn", "FastAPI"],
        projets: [
          {
            title: "Algeria Housing Predictor",
            description: "Modèle prédictif des prix immobiliers utilisant le scraping et XGBoost.",
            tags: ["Python", "Machine Learning"],
          },
        ],
      },
    },
  ];

  const createdCandidates = [];
  for (const c of candidateData) {
    const candidate = await prisma.candidate.upsert({
      where: {
        eventId_csvRowNumber: {
          eventId: event.id,
          csvRowNumber: c.csvRowNumber,
        },
      },
      update: {
        nom: c.nom,
        prenom: c.prenom,
        email: c.email,
        telephone: c.telephone,
        finalStatus: c.finalStatus,
        extraData: c.extraData,
      },
      create: {
        eventId: event.id,
        csvRowNumber: c.csvRowNumber,
        nom: c.nom,
        prenom: c.prenom,
        email: c.email,
        telephone: c.telephone,
        finalStatus: c.finalStatus,
        extraData: c.extraData,
      },
    });
    createdCandidates.push(candidate);
    console.log(`   ✓ Candidat : ${candidate.prenom} ${candidate.nom} (${candidate.email}) [ID: ${candidate.id}]`);
  }

  // --------------------------------------------------------------------------
  // 5. CRÉATION DES ASSIGNATIONS (ASSIGNMENTS) & ÉVALUATIONS
  // --------------------------------------------------------------------------
  console.log("\n📝 5. Assignation des candidats aux sélecteurs et soumission d'évaluations...");

  // Assignation Candidat 1 (Ines) -> Sélecteur RH
  const assign1Rh = await prisma.assignment.upsert({
    where: {
      candidateId_eventSelectorId: {
        candidateId: createdCandidates[0].id,
        eventSelectorId: eventSelectorRh.id,
      },
    },
    update: {},
    create: {
      candidateId: createdCandidates[0].id,
      eventSelectorId: eventSelectorRh.id,
      assignedBy: admin.id,
    },
  });

  await prisma.evaluation.upsert({
    where: { assignmentId: assign1Rh.id },
    update: {
      decision: "accepter",
      comment: "Profil exemplaire, excellente aisance relationnelle et motivation confirmée.",
      evaluatedAt: new Date(),
    },
    create: {
      assignmentId: assign1Rh.id,
      decision: "accepter",
      comment: "Profil exemplaire, excellente aisance relationnelle et motivation confirmée.",
      evaluatedAt: new Date(),
    },
  });
  console.log("   ✓ Évaluation RH soumise pour Ines Moktefi -> [ACCEPTER]");

  // Assignation Candidat 1 (Ines) -> Sélecteur Dev
  const assign1Dev = await prisma.assignment.upsert({
    where: {
      candidateId_eventSelectorId: {
        candidateId: createdCandidates[0].id,
        eventSelectorId: eventSelectorDev.id,
      },
    },
    update: {},
    create: {
      candidateId: createdCandidates[0].id,
      eventSelectorId: eventSelectorDev.id,
      assignedBy: admin.id,
    },
  });

  await prisma.evaluation.upsert({
    where: { assignmentId: assign1Dev.id },
    update: {
      decision: "accepter",
      comment: "Validation technique : Excellente maîtrise de Next.js et de TypeScript. Projets GitHub soignés.",
      evaluatedAt: new Date(),
    },
    create: {
      assignmentId: assign1Dev.id,
      decision: "accepter",
      comment: "Validation technique : Excellente maîtrise de Next.js et de TypeScript. Projets GitHub soignés.",
      evaluatedAt: new Date(),
    },
  });
  console.log("   ✓ Évaluation Dev soumise pour Ines Moktefi -> [ACCEPTER]");

  // Assignation Candidat 2 (Rayane) -> Sélecteur RH & Dev
  const assign2Rh = await prisma.assignment.upsert({
    where: {
      candidateId_eventSelectorId: {
        candidateId: createdCandidates[1].id,
        eventSelectorId: eventSelectorRh.id,
      },
    },
    update: {},
    create: {
      candidateId: createdCandidates[1].id,
      eventSelectorId: eventSelectorRh.id,
      assignedBy: admin.id,
    },
  });

  await prisma.evaluation.upsert({
    where: { assignmentId: assign2Rh.id },
    update: {
      decision: "en_attente",
      comment: "Motivation intéressante, points à clarifier lors de l'entretien physique.",
      evaluatedAt: new Date(),
    },
    create: {
      assignmentId: assign2Rh.id,
      decision: "en_attente",
      comment: "Motivation intéressante, points à clarifier lors de l'entretien physique.",
      evaluatedAt: new Date(),
    },
  });
  console.log("   ✓ Évaluation RH soumise pour Rayane Belkacem -> [EN ATTENTE]");

  const assign2Dev = await prisma.assignment.upsert({
    where: {
      candidateId_eventSelectorId: {
        candidateId: createdCandidates[1].id,
        eventSelectorId: eventSelectorDev.id,
      },
    },
    update: {},
    create: {
      candidateId: createdCandidates[1].id,
      eventSelectorId: eventSelectorDev.id,
      assignedBy: admin.id,
    },
  });

  await prisma.evaluation.upsert({
    where: { assignmentId: assign2Dev.id },
    update: {
      decision: "accepter",
      comment: "Bon niveau technique en Python et bonnes capacités de résolution de problèmes.",
      evaluatedAt: new Date(),
    },
    create: {
      assignmentId: assign2Dev.id,
      decision: "accepter",
      comment: "Bon niveau technique en Python et bonnes capacités de résolution de problèmes.",
      evaluatedAt: new Date(),
    },
  });
  console.log("   ✓ Évaluation Dev soumise pour Rayane Belkacem -> [ACCEPTER]");

  // Assignation Candidat 3 (Amina) -> Assignée, en attente d'évaluation
  await prisma.assignment.upsert({
    where: {
      candidateId_eventSelectorId: {
        candidateId: createdCandidates[2].id,
        eventSelectorId: eventSelectorRh.id,
      },
    },
    update: {},
    create: {
      candidateId: createdCandidates[2].id,
      eventSelectorId: eventSelectorRh.id,
      assignedBy: admin.id,
    },
  });

  await prisma.assignment.upsert({
    where: {
      candidateId_eventSelectorId: {
        candidateId: createdCandidates[2].id,
        eventSelectorId: eventSelectorDev.id,
      },
    },
    update: {},
    create: {
      candidateId: createdCandidates[2].id,
      eventSelectorId: eventSelectorDev.id,
      assignedBy: admin.id,
    },
  });
  console.log("   ✓ Amina Cherif assignée aux sélecteurs RH et Dev (En cours d'évaluation)");

  // --------------------------------------------------------------------------
  // 6. LOGS D'ACTIVITÉ (Table Log)
  // --------------------------------------------------------------------------
  console.log("\n📜 6. Enregistrement des logs d'audit...");

  await prisma.log.createMany({
    data: [
      {
        userId: admin.id,
        action: "Création d'événement",
        entityType: "Event",
        entityId: event.id,
        details: `Création de l'événement ${event.name} avec quota de ${event.quotaParticipants} participants.`,
      },
      {
        userId: admin.id,
        action: "Assignation sélecteur",
        entityType: "EventSelector",
        entityId: eventSelectorRh.id,
        details: `${selectorRh.fullName} assigné(e) au rôle Sélecteur RH pour l'événement #${event.id}`,
      },
      {
        userId: admin.id,
        action: "Assignation sélecteur",
        entityType: "EventSelector",
        entityId: eventSelectorDev.id,
        details: `${selectorDev.fullName} assigné(e) au rôle Sélecteur Dev pour l'événement #${event.id}`,
      },
      {
        userId: selectorRh.id,
        action: "Évaluation soumise",
        entityType: "Evaluation",
        entityId: createdCandidates[0].id,
        details: `Avis favorable (Accepter) soumis pour Ines Moktefi`,
      },
      {
        userId: selectorDev.id,
        action: "Évaluation soumise",
        entityType: "Evaluation",
        entityId: createdCandidates[0].id,
        details: `Validation technique (Accepter) soumise pour Ines Moktefi`,
      },
    ],
  });
  console.log("   ✓ 5 Entrées de log d'audit insérées avec succès.");

  console.log("\n======================================================");
  console.log("🎉 SEEDING TERMINÉ AVEC SUCCÈS !");
  console.log("======================================================");
  console.log("Vous pouvez maintenant ouvrir Prisma Studio pour vérifier vos tables :");
  console.log("👉 npx prisma studio");
  console.log("======================================================\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Erreur lors de l'exécution du seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
