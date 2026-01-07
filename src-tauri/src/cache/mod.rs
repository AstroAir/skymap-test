//! Cache module
//! Provides caching functionality for tiles and network resources
//!
//! Submodules:
//! - `offline`: Offline tile caching for sky surveys
//! - `unified`: Unified network resource caching

pub mod offline;
pub mod unified;

// Re-export types and commands from offline cache
pub use offline::{
    CacheData, CacheRegion, CacheStats, CacheStatus, CreateRegionArgs, SurveyCacheInfo, TileMetadata,
    clear_all_cache, clear_survey_cache, create_cache_region, delete_cache_region,
    get_cache_directory, get_cache_stats, is_tile_cached, list_cache_regions,
    load_cached_tile, save_cached_tile, update_cache_region,
};

// Re-export types and commands from unified cache
pub use unified::{
    CacheEntryMeta, CacheIndex, PrefetchResult, UnifiedCacheResponse, UnifiedCacheStats,
    cleanup_unified_cache, clear_unified_cache, delete_unified_cache_entry,
    get_unified_cache_entry, get_unified_cache_size, get_unified_cache_stats,
    list_unified_cache_keys, prefetch_url, prefetch_urls, put_unified_cache_entry,
};
