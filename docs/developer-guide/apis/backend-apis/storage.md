# 存储 API

本文档介绍 SkyMap Test 后端的数据存储 API。

## 概览

存储模块提供本地数据持久化功能，使用 SQLite 数据库。

## 数据库结构

### 主要表

| 表名 | 用途 |
|-----|------|
| `stores` | 通用键值存储 |
| `equipment` | 设备配置 |
| `targets` | 目标列表 |
| `markers` | 用户标记 |
| `cache` | 缓存数据 |

## Store 命令

### save_store_data

保存数据到指定存储。

```typescript
await invoke('save_store_data', {
  storeName: 'settings',
  data: JSON.stringify(settingsObject)
});
```

**参数**：
- `storeName: string` - 存储名称
- `data: string` - JSON 字符串数据

**返回**：`Result<(), String>`

### load_store_data

从存储加载数据。

```typescript
const data = await invoke<string | null>('load_store_data', {
  storeName: 'settings'
});
const settings = data ? JSON.parse(data) : defaultSettings;
```

**参数**：
- `storeName: string` - 存储名称

**返回**：`Result<Option<String>, String>`

### delete_store_data

删除指定存储的数据。

```typescript
await invoke('delete_store_data', {
  storeName: 'temporary-data'
});
```

**参数**：
- `storeName: string` - 存储名称

**返回**：`Result<(), String>`

### get_storage_stats

获取存储统计信息。

```typescript
interface StorageStats {
  total_size: number;
  store_count: number;
  stores: StoreInfo[];
  directory: string;
}

const stats = await invoke<StorageStats>('get_storage_stats');
```

**返回**：`Result<StorageStats, String>`

## 缓存命令

### get_unified_cache_entry

从缓存获取数据。

```typescript
const cached = await invoke<string | null>('get_unified_cache_entry', {
  key: 'object-info-M31'
});
```

### put_unified_cache_entry

存储数据到缓存。

```typescript
await invoke('put_unified_cache_entry', {
  key: 'object-info-M31',
  value: JSON.stringify(objectInfo),
  ttlSeconds: 3600  // 1小时过期
});
```

### cleanup_unified_cache

清理过期缓存。

```typescript
const removedCount = await invoke<number>('cleanup_unified_cache');
```

## 使用示例

### 设备数据存储

```typescript
// 保存设备配置
async function saveEquipment(equipment: Equipment) {
  await invoke('save_store_data', {
    storeName: 'equipment',
    data: JSON.stringify(equipment)
  });
}

// 加载设备配置
async function loadEquipment(): Promise<Equipment> {
  const data = await invoke<string | null>('load_store_data', {
    storeName: 'equipment'
  });
  return data ? JSON.parse(data) : { telescopes: [], cameras: [] };
}
```

### 带缓存的数据获取

```typescript
async function getObjectInfo(objectId: string): Promise<ObjectInfo> {
  const cacheKey = `object-info-${objectId}`;
  
  // 先检查缓存
  const cached = await invoke<string | null>('get_unified_cache_entry', {
    key: cacheKey
  });
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 从API获取
  const info = await fetchFromApi(objectId);
  
  // 存入缓存
  await invoke('put_unified_cache_entry', {
    key: cacheKey,
    value: JSON.stringify(info),
    ttlSeconds: 3600
  });
  
  return info;
}
```

## 错误处理

所有存储命令返回 `Result` 类型：

```typescript
try {
  await invoke('save_store_data', { storeName, data });
} catch (error) {
  console.error('保存失败:', error);
  toast.error('数据保存失败');
}
```

## 最佳实践

1. **使用有意义的存储名称**
2. **数据序列化前验证**
3. **设置合理的缓存 TTL**
4. **定期清理过期缓存**
5. **处理存储错误**

## 相关文档

- [Tauri 命令](tauri-commands.md)
- [Stores API](../frontend-apis/stores.md)
