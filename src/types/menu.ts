/**
 * Menu Types for Venue Menu Feature
 */

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  parentId: string | null;
  venueId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
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
}

export interface CategoryTree extends MenuCategory {
  children: CategoryTree[];
  items: MenuItem[];
}

export interface PublicMenu {
  categories: PublicCategory[];
}

export interface PublicCategory {
  id: string;
  name: string;
  description: string | null;
  children: PublicCategory[];
  items: PublicMenuItem[];
}

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
}

// Input types for validation
export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  parentId?: string | null;
}

export interface CreateItemInput {
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface UpdateItemInput {
  name?: string;
  description?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  isAvailable?: boolean;
  categoryId?: string;
}
