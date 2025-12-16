'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { PublicMenu, PublicCategory, PublicMenuItem } from '@/types/menu';

interface PublicMenuViewProps {
  menu: PublicMenu;
  currency?: string;
}

export function PublicMenuView({ menu, currency = 'IDR' }: PublicMenuViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    // Expand first category by default
    const first = menu.categories[0];
    return first ? new Set([first.id]) : new Set();
  });

  const toggleCategory = (id: string) => {
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

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price / 100);
  };

  const renderItem = (item: PublicMenuItem) => (
    <div
      key={item.id}
      className={`flex gap-3 p-3 ${!item.isAvailable ? 'opacity-50' : ''}`}
    >
      {item.imageUrl && (
        <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium leading-tight">
              {item.name}
              {!item.isAvailable && (
                <span className="ml-2 text-xs text-muted-foreground">(Unavailable)</span>
              )}
            </h4>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          {item.price !== null && (
            <span className="font-medium text-primary whitespace-nowrap">
              {formatPrice(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderCategory = (category: PublicCategory, depth: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasContent = category.items.length > 0 || category.children.length > 0;

    return (
      <div key={category.id} className={depth > 0 ? 'ml-4' : ''}>
        <button
          onClick={() => toggleCategory(category.id)}
          className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg transition-colors"
          disabled={!hasContent}
        >
          {hasContent ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}
          <span className="font-semibold">{category.name}</span>
          {category.description && (
            <span className="text-sm text-muted-foreground ml-2">
              — {category.description}
            </span>
          )}
        </button>

        {isExpanded && hasContent && (
          <div className="border-l-2 border-muted ml-2">
            {category.items.map(renderItem)}
            {category.children.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (menu.categories.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-lg">Menu</h3>
      </div>
      <div className="divide-y">
        {menu.categories.map(cat => renderCategory(cat))}
      </div>
    </div>
  );
}
