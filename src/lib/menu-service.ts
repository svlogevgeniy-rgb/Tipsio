import { prisma } from './prisma';
import type { CategoryTree, PublicMenu, PublicCategory } from '@/types/menu';
import type { CreateCategoryInput, UpdateCategoryInput, CreateItemInput, UpdateItemInput } from './menu-validation';

// ==================== CATEGORY OPERATIONS ====================

export async function createCategory(venueId: string, data: CreateCategoryInput) {
  // Get current max displayOrder for this venue
  const maxOrder = await prisma.menuCategory.aggregate({
    where: { venueId, parentId: data.parentId ?? null },
    _max: { displayOrder: true },
  });

  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  return prisma.menuCategory.create({
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      venueId,
      displayOrder,
    },
  });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  // If changing parent, check for circular reference
  if (data.parentId !== undefined) {
    const isCircular = await checkCircularReference(id, data.parentId);
    if (isCircular) {
      throw new Error('Cannot create circular category reference');
    }
  }

  return prisma.menuCategory.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId,
    },
  });
}

export async function deleteCategory(
  id: string, 
  strategy: 'cascade' | 'move' = 'cascade',
  targetCategoryId?: string
) {
  const category = await prisma.menuCategory.findUnique({
    where: { id },
    include: { items: true, children: true },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Check if this is the last category
  const categoryCount = await prisma.menuCategory.count({
    where: { venueId: category.venueId },
  });

  if (categoryCount === 1) {
    throw new Error('Cannot delete the last category');
  }

  if (strategy === 'move' && (category.items.length > 0 || category.children.length > 0)) {
    if (!targetCategoryId) {
      throw new Error('Target category required for move strategy');
    }

    // Move items to target category
    await prisma.menuItem.updateMany({
      where: { categoryId: id },
      data: { categoryId: targetCategoryId },
    });

    // Move children to target category (or root)
    await prisma.menuCategory.updateMany({
      where: { parentId: id },
      data: { parentId: targetCategoryId },
    });
  }

  // Delete category (cascade will handle items if not moved)
  await prisma.menuCategory.delete({ where: { id } });

  // Reorder remaining categories
  await reorderAfterDelete(category.venueId, category.parentId, category.displayOrder);
}

export async function reorderCategories(venueId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    prisma.menuCategory.update({
      where: { id },
      data: { displayOrder: index },
    })
  );

  await prisma.$transaction(updates);
}

export async function getCategoriesTree(venueId: string): Promise<CategoryTree[]> {
  const categories = await prisma.menuCategory.findMany({
    where: { venueId },
    include: { items: { orderBy: { displayOrder: 'asc' } } },
    orderBy: { displayOrder: 'asc' },
  });

  return buildCategoryTree(categories);
}

export async function getCategoryById(id: string) {
  return prisma.menuCategory.findUnique({
    where: { id },
    include: { items: { orderBy: { displayOrder: 'asc' } } },
  });
}


// ==================== ITEM OPERATIONS ====================

export async function createItem(categoryId: string, data: CreateItemInput) {
  // Get current max displayOrder for this category
  const maxOrder = await prisma.menuItem.aggregate({
    where: { categoryId },
    _max: { displayOrder: true },
  });

  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  return prisma.menuItem.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable ?? true,
      categoryId,
      displayOrder,
    },
  });
}

export async function updateItem(id: string, data: UpdateItemInput) {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) {
    throw new Error('Item not found');
  }

  // If moving to different category, assign new displayOrder
  let displayOrder = item.displayOrder;
  if (data.categoryId && data.categoryId !== item.categoryId) {
    const maxOrder = await prisma.menuItem.aggregate({
      where: { categoryId: data.categoryId },
      _max: { displayOrder: true },
    });
    displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    // Reorder items in old category
    await reorderItemsAfterDelete(item.categoryId, item.displayOrder);
  }

  return prisma.menuItem.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable,
      categoryId: data.categoryId,
      displayOrder: data.categoryId ? displayOrder : undefined,
    },
  });
}

export async function deleteItem(id: string) {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) {
    throw new Error('Item not found');
  }

  await prisma.menuItem.delete({ where: { id } });
  await reorderItemsAfterDelete(item.categoryId, item.displayOrder);
}

export async function reorderItems(categoryId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    prisma.menuItem.update({
      where: { id },
      data: { displayOrder: index },
    })
  );

  await prisma.$transaction(updates);
}

export async function toggleItemAvailability(id: string) {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) {
    throw new Error('Item not found');
  }

  return prisma.menuItem.update({
    where: { id },
    data: { isAvailable: !item.isAvailable },
  });
}

export async function getItemById(id: string) {
  return prisma.menuItem.findUnique({ where: { id } });
}

// ==================== PUBLIC MENU ====================

export async function getPublicMenu(venueId: string): Promise<PublicMenu> {
  const categories = await prisma.menuCategory.findMany({
    where: { venueId },
    include: {
      items: {
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  const publicCategories = buildPublicCategoryTree(categories);

  return { categories: publicCategories };
}


// ==================== HELPER FUNCTIONS ====================

async function checkCircularReference(categoryId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId) return false;
  if (categoryId === newParentId) return true;

  // Check if newParentId is a descendant of categoryId
  const descendants = await getDescendantIds(categoryId);
  return descendants.includes(newParentId);
}

async function getDescendantIds(categoryId: string): Promise<string[]> {
  const children = await prisma.menuCategory.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });

  const childIds = children.map(c => c.id);
  const descendantIds: string[] = [...childIds];

  for (const childId of childIds) {
    const grandchildren = await getDescendantIds(childId);
    descendantIds.push(...grandchildren);
  }

  return descendantIds;
}

async function reorderAfterDelete(venueId: string, parentId: string | null, deletedOrder: number) {
  await prisma.menuCategory.updateMany({
    where: {
      venueId,
      parentId,
      displayOrder: { gt: deletedOrder },
    },
    data: {
      displayOrder: { decrement: 1 },
    },
  });
}

async function reorderItemsAfterDelete(categoryId: string, deletedOrder: number) {
  await prisma.menuItem.updateMany({
    where: {
      categoryId,
      displayOrder: { gt: deletedOrder },
    },
    data: {
      displayOrder: { decrement: 1 },
    },
  });
}

type CategoryWithItems = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  parentId: string | null;
  venueId: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    imageUrl: string | null;
    isAvailable: boolean;
    displayOrder: number;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

function buildCategoryTree(categories: CategoryWithItems[]): CategoryTree[] {
  const categoryMap = new Map<string, CategoryTree>();
  const rootCategories: CategoryTree[] = [];

  // First pass: create all category nodes
  for (const cat of categories) {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      items: cat.items,
    });
  }

  // Second pass: build tree structure
  for (const cat of categories) {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId)!.children.push(node);
    } else {
      rootCategories.push(node);
    }
  }

  return rootCategories;
}

function buildPublicCategoryTree(categories: CategoryWithItems[]): PublicCategory[] {
  const categoryMap = new Map<string, PublicCategory>();
  const rootCategories: PublicCategory[] = [];

  // First pass: create all category nodes
  for (const cat of categories) {
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      children: [],
      items: cat.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      })),
    });
  }

  // Second pass: build tree structure
  for (const cat of categories) {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId)!.children.push(node);
    } else {
      rootCategories.push(node);
    }
  }

  return rootCategories;
}
