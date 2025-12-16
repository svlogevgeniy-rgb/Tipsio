'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { MenuItem } from '@/types/menu';

interface ItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => Promise<void>;
}

export function ItemCard({ item, onEdit, onDelete, onToggleAvailability }: ItemCardProps) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggleAvailability();
    } finally {
      setToggling(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${!item.isAvailable ? 'opacity-60' : ''}`}>
      <div className="cursor-grab text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      {item.imageUrl && (
        <div className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{item.name}</h4>
          {!item.isAvailable && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Unavailable</span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        )}
      </div>

      <div className="text-right font-medium whitespace-nowrap">
        {formatPrice(item.price)}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={item.isAvailable}
          onCheckedChange={handleToggle}
          disabled={toggling}
        />
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
