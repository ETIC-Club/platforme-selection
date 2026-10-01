import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get("search")?.trim().toLowerCase() || "";

    const category =
      searchParams.get("category")?.toLowerCase() || "all";

    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const createdAtFilter: {
      gte?: Date;
      lte?: Date;
    } = {};

    if (startDate) {
      createdAtFilter.gte = new Date(
        `${startDate}T00:00:00`
      );
    }

    if (endDate) {
      createdAtFilter.lte = new Date(
        `${endDate}T23:59:59.999`
      );
    }

    const events = await prisma.event.findMany({
      where: {
        status: "termine",

        ...(startDate || endDate
          ? {
              createdAt: createdAtFilter,
            }
          : {}),
      },

      include: {
        candidates: {
          include: {
            assignments: {
              include: {
                evaluation: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedEvents = events
      .map((event) => {
        /*
         * Category is derived from the event name/description
         * because the current Event model doesn't have a
         * dedicated category field.
         */
        const eventText = `${event.name} ${
          event.description || ""
        }`.toLowerCase();

        const isHackathon =
          eventText.includes("hackathon") ||
          eventText.includes("camp");

        const eventCategory = isHackathon
          ? "hackathons"
          : "workshops";

        /*
         * Required participants.
         */
        const required = event.quotaParticipants ?? 0;

        /*
         * Get all evaluations for this event.
         */
        const evaluations = event.candidates.flatMap(
          (candidate) =>
            candidate.assignments
              .map((assignment) => assignment.evaluation)
              .filter(
                (
                  evaluation
                ): evaluation is NonNullable<
                  typeof evaluation
                > => evaluation !== null
              )
        );

        /*
         * Evaluation statistics.
         */
        const acceptedCount = evaluations.filter(
          (evaluation) =>
            evaluation.decision === "accepter"
        ).length;

        const rejectedCount = evaluations.filter(
          (evaluation) =>
            evaluation.decision === "rejeter"
        ).length;

        /*
         * Satisfaction.
         *
         * accepted evaluations / all evaluations * 100
         */
        const satisfaction =
          evaluations.length > 0
            ? Math.round(
                (acceptedCount / evaluations.length) * 100
              )
            : 0;

        const date = event.createdAt
          .toISOString()
          .split("T")[0];

        const formattedDate =
          event.createdAt.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          });

        return {
          id: event.id,
          title: event.name,

          subtitle: `${
            eventCategory === "hackathons"
              ? "HACKATHON"
              : "WORKSHOP"
          } - ${formattedDate}`,

          date,
          required,
          satisfaction,
          category: eventCategory,

          /*
           * Extra details used by the History details modal.
           */
          candidatesCount: event.candidates.length,
          evaluationsCount: evaluations.length,
          acceptedCount,
          rejectedCount,
        };
      })
      .filter((event) => {
        /*
         * Search filter.
         */
        if (
          search &&
          !event.title.toLowerCase().includes(search) &&
          !event.subtitle.toLowerCase().includes(search) &&
          !event.category.toLowerCase().includes(search) &&
          !event.date.toLowerCase().includes(search)
        ) {
          return false;
        }

        /*
         * Category filter.
         */
        if (
          category !== "all" &&
          event.category.toLowerCase() !== category
        ) {
          return false;
        }

        return true;
      });

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("GET /api/history error:", error);

    return NextResponse.json(
      { error: "Unable to load history events." },
      { status: 500 }
    );
  }
}