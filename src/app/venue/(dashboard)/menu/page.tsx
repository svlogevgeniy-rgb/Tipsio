'use client';

import { useEffect, useState } from 'react';
import { MenuManager } from '@/components/venue/menu/MenuManager';

export default function MenuPage() {
  const [venueId, setVenueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get venue ID from session/API
    const fetchVenue = async () => {
      try {
        const res = await fetch('/api/venues/dashboard');
        const data = await res.json();
        if (res.ok && data.venue) {
          setVenueId(data.venue.id);
        }
      } catch (error) {
        console.error('Failed to fetch venue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No venue found. Please complete onboarding first.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <MenuManager venueId={venueId} />
    </div>
  );
}
