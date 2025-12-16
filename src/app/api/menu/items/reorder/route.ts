export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { reorderSchema } from "@/lib/menu-validation";
import { reorderItems } from "@/lib/menu-service";

// PUT /api/menu/items/reorder - Reorder items within category
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
    const { categoryId, ...reorderData } = body;

    if (!categoryId) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "categoryId is required" },
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

    // Check category exists and access
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

    await reorderItems(categoryId, parsed.data.orderedIds);
    return NextResponse.json({ message: "Items reordered successfully" });
  } catch (error) {
    console.error("Reorder items error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
