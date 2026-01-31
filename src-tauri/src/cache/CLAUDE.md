# rust-cache Module

[Root](../../../CLAUDE.md) > [src-tauri/src](../) > **cache**

> **Last Updated:** 2025-01-31
> **Module Type:** Rust (Caching)

---

## Breadcrumb

`[Root](../../../CLAUDE.md) > [src-tauri/src](../) > **cache**`

---

## Module Responsibility

The `cache` module provides offline caching functionality for sky survey tiles and general-purpose network caching. It enables offline operation and improves performance.

**Design Principle:** Cache first, then network. Cache entries have configurable TTL and size limits.

---

## Files

| File | Purpose |
|------|---------|
| `mod.rs` | Module exports |
| `offline.rs` | Offline tile caching for sky surveys |
| `unified.rs` | General-purpose network cache |

---

## Tauri Commands

### Offline Cache Commands

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `get_cache_stats` | - | `CacheStats` | Get cache statistics |
| `list_cache_regions` | - | `Vec<CacheRegion>` | List regions |
| `create_cache_region` | region | `String` (id) | Create region |
| `update_cache_region` | id, data | `()` | Update region |
| `delete_cache_region` | id | `()` | Delete region |
| `save_cached_tile` | region, x, y, level, data | `()` | Save tile |
| `load_cached_tile` | region, x, y, level | `Option<Vec<u8>>` | Load tile |
| `is_tile_cached` | region, x, y, level | `bool` | Check cached |
| `clear_survey_cache` | region | `usize` | Clear region |
| `clear_all_cache` | - | `()` | Clear all |
| `get_cache_directory` | - | `String` | Get cache path |

### Unified Cache Commands

| Command | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `get_unified_cache_entry` | key | `Option<String>` | Get entry |
| `put_unified_cache_entry` | key, value, ttl | `()` | Put entry |
| `delete_unified_cache_entry` | key | `bool` | Delete entry |
| `clear_unified_cache` | - | `()` | Clear all |
| `get_unified_cache_size` | - | `u64` | Get size |
| `list_unified_cache_keys` | pattern | `Vec<String>` | List keys |
| `get_unified_cache_stats` | - | `CacheStats` | Get stats |
| `cleanup_unified_cache` | max_size | `usize` | Cleanup old |
| `prefetch_url` | url, ttl | `()` | Prefetch one |
| `prefetch_urls` | urls, ttl | `PrefetchResult` | Prefetch many |

---

## Data Types

### Cache Types

```rust
pub struct CacheRegion {
    pub id: String,
    pub name: String,
    pub survey_url: String,
    pub min_level: u32,
    pub max_level: u32,
    pub tile_count: usize,
    pub total_size: u64,
}

pub struct CacheStats {
    pub total_size: u64,
    pub tile_count: usize,
    pub region_count: usize,
    pub cache_directory: String,
}

pub struct CacheEntry {
    pub key: String,
    pub value: String,
    pub created_at: i64,
    pub expires_at: i64,
    pub size: u64,
}
```

---

## Cache Directory

Caches are stored in:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\skymap\cache\` |
| macOS | `~/Library/Caches/skymap/` |
| Linux | `~/.cache/skymap/` |

Subdirectories:
- `tiles/` - Sky survey tiles
- `network/` - Unified cache

---

## Tile Cache Key Format

```
{region}/{level}/{x}/{y}.png
```

Example: `dss/12/3456/2101.png`

---

## TTL Management

Default TTLs:
- Sky survey tiles: Never expire (manual management)
- Network cache: 7 days
- Prefetched data: 30 days

---

## Related Files

- [`mod.rs`](./mod.rs) - Module exports
- [`offline.rs`](./offline.rs) - Tile cache
- [`unified.rs`](./unified.rs) - Network cache
- [../CLAUDE.md](../CLAUDE.md) - Backend documentation
