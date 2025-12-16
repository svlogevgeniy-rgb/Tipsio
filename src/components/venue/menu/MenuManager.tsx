'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryForm } from './CategoryForm';
import { ItemForm } from './ItemForm';
import { ItemCard } from './ItemCard';
import type { CategoryTree, MenuItem } from '@/types/menu';

interface MenuManagerProps {
  venueId: string;
}

export function MenuManager({ venueId }: MenuManagerProps) {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTree | undefined>();
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu/categories?venueId=${venueId}`);
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        // Expand all by default
        const allIds = new Set<string>();
        const collectIds = (cats: CategoryTree[]) => {
          cats.forEach(c => {
            allIds.add(c.id);
            collectIds(c.children);
          });
        };
        collectIds(data.categories);
        setExpandedCategories(allIds);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpanded = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Category handlers
  const handleCreateCategory = async (data: { name: string; description?: string; parentId?: string }) => {
    const res = await fetch('/api/menu/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    setCategoryDialogOpen(false);
    fetchCategories();
  };

  const handleUpdateCategory = async (data: { name: string; description?: string; parentId?: string }) => {
    if (!editingCategory) return;
    const res = await fetch(`/api/menu/categories/${editingCategory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    setCategoryDialogOpen(false);
    setEditingCategory(undefined);
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    const res = await fetch(`/api/menu/categories/${id}?strategy=cascade`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.message);
      return;
    }
    fetchCategories();
  };

  // Item handlers
  const handleCreateItem = async (data: { name: string; description?: string; price?: number; imageUrl?: string; isAvailable?: boolean }) => {
    const res = await fetch('/api/menu/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: selectedCategoryId, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    setItemDialogOpen(false);
    fetchCategories();
  };

  const handleUpdateItem = async (data: { name: string; description?: string; price?: number; imageUrl?: string; isAvailable?: boolean; categoryId?: string }) => {
    if (!editingItem) return;
    const res = await fetch(`/api/menu/items/${editingItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    setItemDialogOpen(false);
    setEditingItem(undefined);
    fetchCategories();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`/api/menu/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.message);
      return;
    }
    fetchCategories();
  };

  const handleToggleAvailability = async (id: string) => {
    await fetch(`/api/menu/items/${id}`, { method: 'PATCH' });
    fetchCategories();
  };

  // Render category tree
  const renderCategory = (category: CategoryTree, depth: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children.length > 0 || category.items.length > 0;

    return (
      <div key={category.id} className="border rounded-lg mb-2" style={{ marginLeft: depth * 16 }}>
        <div className="flex items-center gap-2 p-3 bg-muted/50">
          <button
            onClick={() => toggleExpanded(category.id)}
            className="p-1 hover:bg-muted rounded"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="w-4" />
            )}
          </button>
          
          <div className="flex-1">
            <h3 className="font-medium">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-muted-foreground">{category.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategoryId(category.id);
                setEditingItem(undefined);
                setItemDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Item
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingCategory(category);
                setCategoryDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteCategory(category.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 space-y-2">
            {category.items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={() => {
                  setSelectedCategoryId(category.id);
                  setEditingItem(item);
                  setItemDialogOpen(true);
                }}
                onDelete={() => handleDeleteItem(item.id)}
                onToggleAvailability={() => handleToggleAvailability(item.id)}
              />
            ))}
            {category.children.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Loading menu...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu</h2>
        <Button
          onClick={() => {
            setEditingCategory(undefined);
            setCategoryDialogOpen(true);
          }}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No menu categories yet.</p>
          <p className="text-sm">Create your first category to start building your menu.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => renderCategory(cat))}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            categories={categories}
            onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            onCancel={() => {
              setCategoryDialogOpen(false);
              setEditingCategory(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'New Item'}</DialogTitle>
          </DialogHeader>
          <ItemForm
            item={editingItem}
            categories={categories}
            categoryId={selectedCategoryId}
            onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
            onCancel={() => {
              setItemDialogOpen(false);
              setEditingItem(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
