export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { reorderSchema } from "@/lib/menu-validation";
import { reorderCategories } from "@/lib/menu-service";

// PUT /api/menu/categories/reorder - Reorder categories
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: "AUTH_REQUIRED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { venueId, ...reorderData } = body;

    if (!venueId) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "venueId is required" },
        { status: 400 }
      );
    }

    const parsed = reorderSchema.safeParse(reorderData);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check access to venue
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Venue not found" },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && venue.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    await reorderCategories(venueId, parsed.data.orderedIds);
    return NextResponse.json({ message: "Categories reordered successfully" });
  } catch (error) {
    console.error("Reorder categories error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
