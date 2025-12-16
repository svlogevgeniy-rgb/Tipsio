export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateItemSchema } from "@/lib/menu-validation";
import { updateItem, deleteItem, toggleItemAvailability } from "@/lib/menu-service";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/menu/items/[id] - Get single item
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: "AUTH_REQUIRED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          include: { venue: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Item not found" },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && item.category.venue.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Get item error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/menu/items/[id] - Update item
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: "AUTH_REQUIRED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          include: { venue: true },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Item not found" },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && existingItem.category.venue.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const item = await updateItem(id, parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Update item error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/menu/items/[id] - Delete item
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: "AUTH_REQUIRED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          include: { venue: true },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Item not found" },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && existingItem.category.venue.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    await deleteItem(id);
    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete item error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/menu/items/[id] - Toggle availability
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: "AUTH_REQUIRED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          include: { venue: true },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Item not found" },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && existingItem.category.venue.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    const item = await toggleItemAvailability(id);
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Toggle availability error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
