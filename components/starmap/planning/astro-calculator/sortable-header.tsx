'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
}) {
  const isActive = currentSort.key === sortKey;
  return (
    <TableHead
      className="cursor-pointer hover:bg-accent/50 select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          currentSort.direction === 'asc' 
            ? <ChevronUp className="h-3 w-3" /> 
            : <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </TableHead>
  );
}
