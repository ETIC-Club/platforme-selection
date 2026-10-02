import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 }
      );
    }

    const users = await prisma.user.findMany({
      include: {
        eventSelectors: {
          include: {
            event: true,
            assignments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers = users.map((user) => {
      const events = user.eventSelectors.length;

      const candidates = user.eventSelectors.reduce(
        (total, selector) =>
          total + selector.assignments.length,
        0
      );

      const selectorType =
        user.eventSelectors[0]?.selectorType;

      const isSelector =
        selectorType === "RH" ||
        selectorType === "Technique";

      let role = "Sélecteur Dev";
      let roleType = "selector_dev";

      if (user.isSuperAdmin) {
        role = "Admin";
        roleType = "admin";
      } else if (selectorType === "RH") {
        role = "Sélecteur RH";
        roleType = "selector_rh";
      } else {
        role = "Sélecteur Dev";
        roleType = "selector_dev";
      }

      return {
        id: user.id,
        name: user.fullName ?? "",
        email: user.email,
        joined: user.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        events: user.isSuperAdmin ? 0 : events,
        candidates: user.isSuperAdmin ? 0 : candidates,
        role,
        roleType,
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("GET /api/users error:", error);

    return NextResponse.json(
      { error: "Unable to load users." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      role,
      event,
    } = body;

    if (!firstName?.trim()) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }

    if (!lastName?.trim()) {
      return NextResponse.json(
        { error: "Last name is required." },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: "Role is required." },
        { status: 400 }
      );
    }

    const selectorType =
      role === "Sélecteur RH" || role === "Selector RH"
        ? "RH"
        : role === "Sélecteur Dev" || role === "Selector Technique"
          ? "Technique"
          : null;

    if (selectorType && !event) {
      return NextResponse.json(
        { error: "Event is required for selectors." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.trim(),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    let eventRecord = null;

    if (selectorType) {
      eventRecord = await prisma.event.findFirst({
        where: {
          name: event.trim(),
        },
      });

      if (!eventRecord) {
        return NextResponse.json(
          { error: "Event not found." },
          { status: 404 }
        );
      }
    }

    const isSuperAdmin = role === "Admin";

    const newUser = await prisma.user.create({
      data: {
        googleId: `manual-${crypto.randomUUID()}`,
        email: email.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        isSuperAdmin,

        ...(selectorType && eventRecord
          ? {
              eventSelectors: {
                create: {
                  eventId: eventRecord.id,
                  selectorType,
                  isActive: true,
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully.",
        id: newUser.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/users error:", error);

    return NextResponse.json(
      { error: "Unable to create user." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "User id is required." },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: {
        eventSelectors: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const updateData: {
      fullName?: string;
      email?: string;
      isSuperAdmin?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim()
      ) {
        return NextResponse.json(
          { error: "Name cannot be empty." },
          { status: 400 }
        );
      }

      updateData.fullName = body.name.trim();
    }

    if (body.email !== undefined) {
      if (
        typeof body.email !== "string" ||
        !body.email.trim()
      ) {
        return NextResponse.json(
          { error: "Email cannot be empty." },
          { status: 400 }
        );
      }

      updateData.email = body.email.trim();
    }

    if (
      updateData.email &&
      updateData.email !== currentUser.email
    ) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: updateData.email,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "A user with this email already exists." },
          { status: 409 }
        );
      }
    }

    const role = body.role;

    if (role !== undefined) {
      const validRoles = [
        "Admin",
        "Sélecteur RH",
        "Sélecteur Dev",
        "Selector RH",
        "Selector Technique",
        "DEV",
      ];

      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role." },
          { status: 400 }
        );
      }

      if (role === "Admin") {
        updateData.isSuperAdmin = true;
        if (currentUser.eventSelectors.length > 0) {
          await prisma.eventSelector.deleteMany({
            where: {
              userId: id,
            },
          });
        }
      } else {
        updateData.isSuperAdmin = false;
      }

      const selectorType =
        role === "Sélecteur RH" || role === "Selector RH"
          ? "RH"
          : role === "Sélecteur Dev" || role === "Selector Technique" || role === "DEV"
            ? "Technique"
            : null;

      /*
       * DEV
       * ----
       * No selector assignment is needed.
       */
      if (role === "DEV") {
        if (currentUser.eventSelectors.length > 0) {
          await prisma.eventSelector.deleteMany({
            where: {
              userId: id,
            },
          });
        }
      }

      /*
       * SELECTOR
       * --------
       * A selector must have an event.
       */
      if (selectorType) {
        if (
          typeof body.event !== "string" ||
          !body.event.trim()
        ) {
          return NextResponse.json(
            {
              error:
                "An event is required for selector roles.",
            },
            { status: 400 }
          );
        }

        const eventRecord = await prisma.event.findFirst({
          where: {
            name: body.event.trim(),
          },
        });

        if (!eventRecord) {
          return NextResponse.json(
            { error: "Event not found." },
            { status: 404 }
          );
        }

        const existingSelector =
          currentUser.eventSelectors[0];

        if (existingSelector) {
          await prisma.eventSelector.update({
            where: {
              id: existingSelector.id,
            },
            data: {
              eventId: eventRecord.id,
              selectorType,
              isActive: true,
            },
          });
        } else {
          await prisma.eventSelector.create({
            data: {
              userId: id,
              eventId: eventRecord.id,
              selectorType,
              isActive: true,
            },
          });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.fullName ?? "",
      email: updatedUser.email,
    });
  } catch (error) {
    console.error("PATCH /api/users error:", error);

    return NextResponse.json(
      { error: "Unable to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "User id is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Remove nullable references to this user first.
      await tx.event.updateMany({
        where: { createdBy: id },
        data: { createdBy: null },
      });

      await tx.eventSelector.updateMany({
        where: { addedBy: id },
        data: { addedBy: null },
      });

      await tx.assignment.updateMany({
        where: { assignedBy: id },
        data: { assignedBy: null },
      });

      await tx.evaluationHistory.updateMany({
        where: { modifiedBy: id },
        data: { modifiedBy: null },
      });

      await tx.export.updateMany({
        where: { exportedBy: id },
        data: { exportedBy: null },
      });

      await tx.log.updateMany({
        where: { userId: id },
        data: { userId: null },
      });

      // A selector belongs to a user, so remove the user's
      // event selectors and their assignments.
      await tx.eventSelector.deleteMany({
        where: { userId: id },
      });

      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: "User deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("DELETE /api/users error:", error);

    return NextResponse.json(
      { error: "Unable to delete user." },
      { status: 500 }
    );
  }
}