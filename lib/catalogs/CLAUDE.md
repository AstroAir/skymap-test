# catalogs Module

[Root](../../CLAUDE.md) > [lib](../) > **catalogs**

> **Last Updated:** 2026-02-14
> **Module Type:** TypeScript

---

## Module Responsibility

Comprehensive DSO catalog, search, recommendation, and filtering system ported from N.I.N.A.
Provides local astronomical object data, fuzzy search, advanced scoring, and recommendation engines.

---

## Files

| File | Purpose | Used By |
|------|---------|---------|
| `types.ts` | DeepSkyObject, NighttimeData, filter types | All catalog modules |
| `catalog-data.ts` | DSO_CATALOG (~260 objects), getDSOById, getMessierObjects, getDSOsByConstellation, getDSOsByType | search hooks, sky-atlas-store |
| `nighttime-calculator.ts` | Sun/Moon rise-set, twilight, nighttime data | tonight-recommendations, sky-atlas-store |
| `deep-sky-object.ts` | enrichDeepSkyObject (altitude, transit, moon distance, imaging score) | tonight-recommendations, search hooks |
| `search-engine.ts` | searchDeepSkyObjects, enhancedSearch, enhancedQuickSearch, searchWithFuzzyName, getTonightsBest | search hooks, sky-atlas-store |
| `fuzzy-search.ts` | Levenshtein, Jaro-Winkler, parseCatalogId, COMMON_NAME_TO_CATALOG, buildSearchIndex | search-engine, local-resolve-service |
| `scoring-algorithms.ts` | calculateComprehensiveImagingScore, airmass, meridian, moon impact, seasonal scoring | tonight-recommendations |
| `advanced-recommendation-engine.ts` | AdvancedRecommendationEngine (equipment-aware), getQuickRecommendations | tonight-recommendations |
| `dso-filters.ts` | applyDSOFilters (NINA-style), checkAltitudeDuration, enrichDSOWithCalculations | Available for advanced filtering |
| `celestial-search-data.ts` | CELESTIAL_BODIES, POPULAR_DSOS, MESSIER_CATALOG, DSO_NAME_INDEX, fuzzyMatch | search hooks |
| `sky-atlas-store.ts` | Zustand store for Sky Atlas panel (filters, search, pagination) | sky-atlas-panel, wut-tab, positions-tab |
| `index.ts` | Re-exports all public APIs | All consumers |

---

## Integration Status

| Feature | Status | Consumer |
|---------|--------|----------|
| Local catalog ID search | ✅ Active | `use-object-search.ts` |
| Fuzzy search (enhancedQuickSearch) | ✅ Active | `use-object-search.ts` |
| Sky Atlas panel + store | ✅ Active | `sky-atlas-panel.tsx` |
| Tonight's recommendations | ✅ Active | `tonight-recommendations.tsx` |
| AdvancedRecommendationEngine | ✅ Active | `use-tonight-recommendations.ts` (equipment-aware) |
| Local name resolution fallback | ✅ Active | `local-resolve-service.ts` → `use-object-search.ts` |
| Search result enrichment | ✅ Active | `use-object-search.ts` (altitude, visibility, moon distance) |
| Messier quick category | ✅ Active | `use-object-search.ts` quickCategories |
| searchWithFuzzyName in Sky Atlas | ✅ Active | `sky-atlas-store.ts` search() |
| FITS header parsing | ✅ Active | `image-capture.tsx` |
| applyDSOFilters (NINA-style) | ⚠️ Available | Exported but not yet wired to UI |

---

## Key Exports

```typescript
// Catalog data
import { DSO_CATALOG, getDSOById, getMessierObjects, getDSOsByConstellation, getDSOsByType } from '@/lib/catalogs';

// Search
import { enhancedQuickSearch, searchDeepSkyObjects, searchWithFuzzyName } from '@/lib/catalogs';

// Fuzzy search utilities
import { parseCatalogId, COMMON_NAME_TO_CATALOG, fuzzySearch } from '@/lib/catalogs';

// Scoring & enrichment
import { enrichDeepSkyObject, calculateAltitude, calculateMoonDistance } from '@/lib/catalogs';
import { calculateComprehensiveImagingScore, calculateAirmass } from '@/lib/catalogs';

// Advanced recommendations
import { AdvancedRecommendationEngine, getQuickRecommendations } from '@/lib/catalogs';

// Local name resolution (separate service)
import { resolveObjectNameLocally, searchLocalCatalog } from '@/lib/services/local-resolve-service';
```

---

## Related Files

- [`lib/services/local-resolve-service.ts`](../services/local-resolve-service.ts) - Local name resolution service
- [`lib/hooks/use-object-search.ts`](../hooks/use-object-search.ts) - Main search hook
- [`lib/hooks/use-tonight-recommendations.ts`](../hooks/use-tonight-recommendations.ts) - Tonight recommendations hook
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
