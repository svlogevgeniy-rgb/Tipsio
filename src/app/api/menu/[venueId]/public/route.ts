export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPublicMenu } from "@/lib/menu-service";

type RouteParams = { params: Promise<{ venueId: string }> };

// GET /api/menu/[venueId]/public - Get public menu for guests (no auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { venueId } = await params;

    // Check venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, status: true },
    });

    if (!venue) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Venue not found" },
        { status: 404 }
      );
    }

    // Only show menu for active venues
    if (venue.status !== "ACTIVE") {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Venue not found" },
        { status: 404 }
      );
    }

    const menu = await getPublicMenu(venueId);
    return NextResponse.json({ menu });
  } catch (error) {
    console.error("Get public menu error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
