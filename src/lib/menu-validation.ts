import { z } from 'zod';

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  parentId: z.string().cuid('Invalid parent category ID').optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().nullable(),
  parentId: z.string().cuid('Invalid parent category ID').optional().nullable(),
});

// Item schemas
export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  price: z.number().int('Price must be an integer').min(0, 'Price cannot be negative').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  isAvailable: z.boolean().optional().default(true),
});

export const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less').optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().nullable(),
  price: z.number().int('Price must be an integer').min(0, 'Price cannot be negative').optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  isAvailable: z.boolean().optional(),
  categoryId: z.string().cuid('Invalid category ID').optional(),
});

// Reorder schema
export const reorderSchema = z.object({
  orderedIds: z.array(z.string().cuid('Invalid ID')).min(1, 'At least one ID is required'),
});

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
