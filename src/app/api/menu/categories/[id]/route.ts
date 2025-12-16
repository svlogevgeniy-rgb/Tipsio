export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/menu-validation";
import { updateCategory, deleteCategory, getCategoryById } from "@/lib/menu-service";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/menu/categories/[id] - Get single category
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
    const category = await getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Category not found" },
        { status: 404 }
      );
    }

    // Check access to venue
    const venue = await prisma.venue.findUnique({
      where: { id: category.venueId },
    });

    if (session.user.role !== "ADMIN" && venue?.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/menu/categories/[id] - Update category
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
    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Category not found" },
        { status: 404 }
      );
    }

    // Check access to venue
    const venue = await prisma.venue.findUnique({
      where: { id: existingCategory.venueId },
    });

    if (session.user.role !== "ADMIN" && venue?.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const category = await updateCategory(id, parsed.data);
    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("circular")) {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { code: "CONFLICT", message: "Category with this name already exists" },
          { status: 409 }
        );
      }
    }
    console.error("Update category error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/menu/categories/[id] - Delete category
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
    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Category not found" },
        { status: 404 }
      );
    }

    // Check access to venue
    const venue = await prisma.venue.findUnique({
      where: { id: existingCategory.venueId },
    });

    if (session.user.role !== "ADMIN" && venue?.managerId !== session.user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const strategy = (searchParams.get("strategy") as "cascade" | "move") || "cascade";
    const targetCategoryId = searchParams.get("targetCategoryId") || undefined;

    await deleteCategory(id, strategy, targetCategoryId);
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("last category")) {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes("Target category required")) {
        return NextResponse.json(
          { code: "VALIDATION_ERROR", message: error.message },
          { status: 400 }
        );
      }
    }
    console.error("Delete category error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
