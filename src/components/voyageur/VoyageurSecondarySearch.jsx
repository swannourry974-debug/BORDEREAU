import React from 'react';
import StickySearchBar from '@/components/shared/StickySearchBar';

export default function VoyageurSecondarySearch({ query, onQueryChange }) {
  return <StickySearchBar value={query} onChange={onQueryChange} placeholder="Rechercher une mission, un livre, une destination…" />;
}