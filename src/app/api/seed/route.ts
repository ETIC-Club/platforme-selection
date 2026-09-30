import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!prisma) {
    return NextResponse.json({
      success: true,
      mode: "in_memory_fallback",
      message: "Prisma client not connected to PostgreSQL, using memory fallback with complete dataset (Selectors, Events, History, Logs).",
    });
  }

  try {
    // 1. Create or upsert Users (Admin + Selectors)
    const admin = await prisma.user.upsert({
      where: { email: "admin@etic-club.net" },
      update: { fullName: "Admin ETIC", isSuperAdmin: true },
      create: {
        googleId: "admin-google-id",
        email: "admin@etic-club.net",
        fullName: "Admin ETIC",
        isSuperAdmin: true,
      },
    });

    const rh1 = await prisma.user.upsert({
      where: { email: "rh@etic-club.net" },
      update: { fullName: "Sarah Amrani" },
      create: {
        googleId: "rh-google-1",
        email: "rh@etic-club.net",
        fullName: "Sarah Amrani",
      },
    });

    const rh2 = await prisma.user.upsert({
      where: { email: "rh2@etic-club.net" },
      update: { fullName: "Lina Kaci" },
      create: {
        googleId: "rh-google-2",
        email: "rh2@etic-club.net",
        fullName: "Lina Kaci",
      },
    });

    const dev1 = await prisma.user.upsert({
      where: { email: "dev@etic-club.net" },
      update: { fullName: "Mehdi Benali" },
      create: {
        googleId: "dev-google-1",
        email: "dev@etic-club.net",
        fullName: "Mehdi Benali",
      },
    });

    const dev2 = await prisma.user.upsert({
      where: { email: "dev2@etic-club.net" },
      update: { fullName: "Yacine Mansouri" },
      create: {
        googleId: "dev-google-2",
        email: "dev2@etic-club.net",
        fullName: "Yacine Mansouri",
      },
    });

    // 2. Create Active Event
    const activeEvent = await prisma.event.upsert({
      where: { id: 1 },
      update: {
        name: "TRAINING CAMP XIII",
        description: "Hackathon et camp de sélection annuel du Club ETIC",
        quotaParticipants: 60,
        status: "en_cours",
        createdBy: admin.id,
      },
      create: {
        id: 1,
        name: "TRAINING CAMP XIII",
        description: "Hackathon et camp de sélection annuel du Club ETIC",
        quotaParticipants: 60,
        status: "en_cours",
        createdBy: admin.id,
      },
    });

    // 3. Create History Events (status: termine)
    await prisma.event.upsert({
      where: { id: 101 },
      update: {
        name: "HACKATHON ETIC XII",
        description: "Édition précédente du hackathon national ETIC",
        quotaParticipants: 50,
        status: "termine",
        closedAt: new Date("2026-01-15T23:59:59Z"),
        createdBy: admin.id,
      },
      create: {
        id: 101,
        name: "HACKATHON ETIC XII",
        description: "Édition précédente du hackathon national ETIC",
        quotaParticipants: 50,
        status: "termine",
        closedAt: new Date("2026-01-15T23:59:59Z"),
        createdBy: admin.id,
      },
    });

    await prisma.event.upsert({
      where: { id: 102 },
      update: {
        name: "DESIGN SPRINT BOOTCAMP",
        description: "Camp intensif de formation et sélection UI/UX",
        quotaParticipants: 30,
        status: "termine",
        closedAt: new Date("2025-11-20T18:00:00Z"),
        createdBy: admin.id,
      },
      create: {
        id: 102,
        name: "DESIGN SPRINT BOOTCAMP",
        description: "Camp intensif de formation et sélection UI/UX",
        quotaParticipants: 30,
        status: "termine",
        closedAt: new Date("2025-11-20T18:00:00Z"),
        createdBy: admin.id,
      },
    });

    await prisma.event.upsert({
      where: { id: 103 },
      update: {
        name: "SELECTION CAMP 2024",
        description: "Recrutement des nouveaux membres ETIC 2024",
        quotaParticipants: 45,
        status: "termine",
        closedAt: new Date("2024-09-10T18:00:00Z"),
        createdBy: admin.id,
      },
      create: {
        id: 103,
        name: "SELECTION CAMP 2024",
        description: "Recrutement des nouveaux membres ETIC 2024",
        quotaParticipants: 45,
        status: "termine",
        closedAt: new Date("2024-09-10T18:00:00Z"),
        createdBy: admin.id,
      },
    });

    // 4. Assign Selectors to Event 1
    const selectorsToAssign = [
      { userId: rh1.id, selectorType: "RH" as const },
      { userId: rh2.id, selectorType: "RH" as const },
      { userId: dev1.id, selectorType: "Technique" as const },
      { userId: dev2.id, selectorType: "Technique" as const },
    ];

    for (const sel of selectorsToAssign) {
      await prisma.eventSelector.upsert({
        where: {
          eventId_userId_selectorType: {
            eventId: activeEvent.id,
            userId: sel.userId,
            selectorType: sel.selectorType,
          },
        },
        update: { isActive: true },
        create: {
          eventId: activeEvent.id,
          userId: sel.userId,
          selectorType: sel.selectorType,
          addedBy: admin.id,
          isActive: true,
        },
      });
    }

    // 5. Create Candidate & Assignment
    const candidate = await prisma.candidate.upsert({
      where: {
        eventId_csvRowNumber: {
          eventId: activeEvent.id,
          csvRowNumber: 1,
        },
      },
      update: {
        nom: "Moktefi",
        prenom: "Ines",
        email: "oi_moktefi@esi.dz",
        telephone: "+213 555 12 34 56",
        finalStatus: "accepte",
      },
      create: {
        eventId: activeEvent.id,
        csvRowNumber: 1,
        nom: "Moktefi",
        prenom: "Ines",
        email: "oi_moktefi@esi.dz",
        telephone: "+213 555 12 34 56",
        finalStatus: "accepte",
      },
    });

    // 6. Insert Logs
    const sampleLogs = [
      {
        userId: admin.id,
        action: "Création d'événement",
        entityType: "Event",
        entityId: activeEvent.id,
        details: "Création de l'événement TRAINING CAMP XIII (quota: 60)",
      },
      {
        userId: admin.id,
        action: "Assignation sélecteur",
        entityType: "EventSelector",
        entityId: rh1.id,
        details: "Sarah Amrani assignée en tant que Sélecteur RH à l'événement #1",
      },
      {
        userId: admin.id,
        action: "Assignation sélecteur",
        entityType: "EventSelector",
        entityId: dev1.id,
        details: "Mehdi Benali assigné en tant que Sélecteur Technique à l'événement #1",
      },
      {
        userId: rh1.id,
        action: "Évaluation soumise",
        entityType: "Evaluation",
        entityId: candidate.id,
        details: "Avis favorable : soft skills et esprit d'équipe validés pour Ines Moktefi",
      },
      {
        userId: dev1.id,
        action: "Évaluation soumise",
        entityType: "Evaluation",
        entityId: candidate.id,
        details: "Validation technique : stack maîtrisée (TypeScript, Next.js, Postgres)",
      },
      {
        userId: admin.id,
        action: "Clôture d'événement",
        entityType: "Event",
        entityId: 101,
        details: "Clôture et archivage de l'événement HACKATHON ETIC XII",
      },
    ];

    for (const log of sampleLogs) {
      await prisma.log.create({ data: log });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with Users, Selectors, Events, History, Assignments, and Logs!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database connection or seeding error";
    return NextResponse.json({
      success: false,
      error: message,
      note: "If PostgreSQL is offline, the app continues to display the full dataset via memory fallback.",
    });
  }
}
