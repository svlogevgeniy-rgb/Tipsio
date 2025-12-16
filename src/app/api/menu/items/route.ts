export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createItemSchema } from "@/lib/menu-validation";
import { createItem } from "@/lib/menu-service";

// GET /api/menu/items - List items for venue
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: "AUTH_REQUIRED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const categoryId = searchParams.get("categoryId");

    if (!venueId) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "venueId is required" },
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

    const items = await prisma.menuItem.findMany({
      where: {
        category: { venueId },
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("List items error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/menu/items - Create item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: "AUTH_REQUIRED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { categoryId, ...itemData } = body;

    if (!categoryId) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "categoryId is required" },
        { status: 400 }
      );
    }

    const parsed = createItemSchema.safeParse(itemData);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check category exists and get venue
    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: { venue: true },
    });

    if (!category) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Category not found" },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && category.venue.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    const item = await createItem(categoryId, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
