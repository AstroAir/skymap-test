# catalogs Module

[Root](../../CLAUDE.md) > [lib](../) > **catalogs**

> **Last Updated:** 2025-01-31
> **Module Type:** TypeScript

---

## Breadcrumb

`[Root](../../CLAUDE.md) > [lib](../) > **catalogs**`

---

## Module Responsibility

The `catalogs` module provides astronomical catalog data and type definitions. It includes object type classifications, catalog information, and utilities for working with astronomical objects.

---

## Files

| File | Purpose |
|------|---------|
| `types.ts` | Catalog type definitions |
| `catalog-data.ts` | Catalog data and metadata |
| `nighttime-calculator.ts` | Night time calculations |

---

## Key Types

### Object Types

```typescript
export enum ObjectType {
  // Solar System
  Star = 'star',
  Planet = 'planet',
  Moon = 'moon',
  Asteroid = 'asteroid',
  Comet = 'comet',
  DwarfPlanet = 'dwarf-planet',

  // Deep Sky
  Galaxy = 'galaxy',
  Nebula = 'nebula',
  Cluster = 'cluster',
  OpenCluster = 'open-cluster',
  GlobularCluster = 'globular-cluster',
  PlanetaryNebula = 'planetary-nebula',
  SupernovaRemnant = 'supernova-remnant',

  // Other
  Constellation = 'constellation',
  Asterism = 'asterism',
  Other = 'other',
}
```

### Catalog Types

```typescript
export interface CatalogInfo {
  id: string;
  name: string;
  description: string;
  objectCount: number;
  coverage: string;
}

export interface CatalogObject {
  id: string;
  name: string;
  catalog: string;
  ra: number;
  dec: number;
  magnitude: number;
  objectType: ObjectType;
  size?: number;
  constellation?: string;
}
```

---

## Available Catalogs

| ID | Name | Objects |
|----|------|---------|
| `messier` | Messier Catalog | 110 |
| `ngc` | New General Catalog | ~8,000 |
| `ic` | Index Catalog | ~5,000 |
| `bright-stars` | Bright Star Catalog | ~9,000 |
| `hipparcos` | Hipparcos Catalog | ~120,000 |
| `tycho` | Tycho Catalog | ~2.5 million |

---

## Usage Examples

### Get Object Type

```typescript
import { getObjectType, ObjectType } from '@/lib/catalogs';

const type = getObjectType('M31');
console.log(type); // ObjectType.Galaxy
```

### Get Catalog Info

```typescript
import { getCatalogInfo } from '@/lib/catalogs';

const info = getCatalogInfo('messier');
console.log(info.objectCount); // 110
```

---

## Related Files

- [`types.ts`](./types.ts) - Type definitions
- [`catalog-data.ts`](./catalog-data.ts) - Catalog data
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
