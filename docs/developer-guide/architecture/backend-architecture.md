# 后端架构

本文档详细介绍 SkyMap Test 的 Tauri/Rust 后端架构设计。

## 技术栈

### 核心框架

- **Tauri 2.9**：桌面应用框架
- **Rust**：系统编程语言
- **Tokio**：异步运行时

### 数据存储

- **JSON 文件存储**：本地持久化存储
- **Serde**：序列化/反序列化 (JSON)

## 目录结构

```
src-tauri/
├── src/
│   ├── main.rs              # 主入口
│   ├── lib.rs               # 库入口，命令注册
│   ├── storage.rs           # 数据存储 (JSON)
│   ├── equipment.rs         # 设备管理
│   ├── locations.rs         # 位置管理
│   ├── astronomy.rs         # 天文计算
│   ├── astro_events.rs      # 天文事件
│   ├── target_list.rs       # 目标列表
│   ├── target_io.rs         # 目标导入/导出
│   ├── markers.rs           # 标记管理
│   ├── observation_log.rs   # 观测日志
│   ├── offline_cache.rs     # 离线缓存
│   ├── unified_cache.rs     # 统一缓存
│   ├── http_client.rs       # HTTP 客户端
│   ├── security.rs          # 安全模块
│   ├── rate_limiter.rs      # 速率限制
│   ├── security_tests.rs    # 安全测试
│   ├── updater.rs           # 自动更新
│   ├── app_control.rs       # 应用控制
│   ├── app_settings.rs      # 应用设置
│   └── utils.rs             # 工具函数
├── Cargo.toml               # Rust 依赖
└── tauri.conf.json          # Tauri 配置
```

## 命令注册

### lib.rs 结构

```rust
// src-tauri/src/lib.rs
mod storage;
mod equipment;
mod astronomy;
mod security;
mod rate_limiter;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            storage::save_store_data,
            storage::load_store_data,
            equipment::load_equipment,
            astronomy::equatorial_to_horizontal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 核心模块

### 存储模块

所有数据以 JSON 格式存储在应用程序数据目录中：

```rust
// src-tauri/src/storage.rs
use std::fs;
use serde_json;
use crate::security;

#[tauri::command]
pub async fn save_store_data(
    app: AppHandle,
    store_name: String,
    data: String,
) -> Result<(), StorageError> {
    // 安全：验证数据大小
    security::validate_size(&data, security::limits::MAX_JSON_SIZE)?;

    let path = get_store_path(&app, &store_name)?;
    fs::write(&path, &data).map_err(|e| StorageError::Io(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn load_store_data(
    app: AppHandle,
    store_name: String,
) -> Result<Option<String>, StorageError> {
    let path = get_store_path(&app, &store_name)?;
    if path.exists() {
        let data = fs::read_to_string(&path)
            .map_err(|e| StorageError::Io(e.to_string()))?;
        Ok(Some(data))
    } else {
        Ok(None)
    }
}
```

### 安全模块

```rust
// src-tauri/src/security.rs
pub mod limits {
    pub const MAX_JSON_SIZE: usize = 10 * 1024 * 1024;  // 10 MB
    pub const MAX_CSV_SIZE: usize = 50 * 1024 * 1024;   // 50 MB
    pub const MAX_TILE_SIZE: usize = 5 * 1024 * 1024;   // 5 MB
}

pub fn validate_size(data: &str, max_size: usize) -> Result<(), SecurityError> {
    if data.len() > max_size {
        Err(SecurityError::SizeExceeded(data.len(), max_size))
    } else {
        Ok(())
    }
}

pub fn validate_url(url: &str, allow_http: bool, allowlist: Option<&[&str]>)
    -> Result<url::Url, SecurityError> {
    // URL 验证逻辑：阻止私有 IP、localhost、危险协议
    // ...
}
```

### 速率限制模块

```rust
// src-tauri/src/rate_limiter.rs
use std::collections::HashMap;
use std::sync::Mutex;

pub struct RateLimiter {
    requests: Mutex<HashMap<String, Vec<std::time::Instant>>>,
}

impl RateLimiter {
    pub fn check(&self, command: &str, config: RateLimitConfig) -> RateLimitResult {
        // 滑动窗口速率限制算法
        // ...
    }
}
```

### 天文计算模块

```rust
// src-tauri/src/astronomy.rs
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AltAz {
    pub alt: f64,
    pub az: f64,
}

#[tauri::command]
pub async fn equatorial_to_horizontal(
    ra: f64, dec: f64, lat: f64, lon: f64,
) -> Result<AltAz, String> {
    // 坐标转换计算
    let lst = calculate_lst(lon);
    let ha = lst - ra;
    
    let alt = (dec.sin() * lat.sin() + dec.cos() * lat.cos() * ha.cos()).asin();
    let az = (dec.sin() - alt.sin() * lat.sin()) / (alt.cos() * lat.cos());
    
    Ok(AltAz { alt: alt.to_degrees(), az: az.to_degrees() })
}
```

### 设备管理模块

```rust
// src-tauri/src/equipment.rs
#[derive(Serialize, Deserialize)]
pub struct Telescope {
    pub id: String,
    pub name: String,
    pub aperture: f64,
    pub focal_length: f64,
}

#[tauri::command]
pub async fn load_equipment(app: AppHandle) -> Result<Equipment, String> {
    let data = storage::load_store_data(app, "equipment".to_string()).await?;
    match data {
        Some(json) => serde_json::from_str(&json).map_err(|e| e.to_string()),
        None => Ok(Equipment::default()),
    }
}
```

## 错误处理

所有命令返回 `Result<T, String>`：

```rust
#[tauri::command]
pub async fn some_command() -> Result<Data, String> {
    let result = operation().map_err(|e| e.to_string())?;
    Ok(result)
}
```

## 安全考虑

SkyMap 后端实现了多层安全防护：

### 速率限制

- **滑动窗口算法**：防止 API 滥用
- **分级限制**：保守（10/分钟）、中等（100/分钟）、宽松（1000/分钟）、只读（10000/分钟）
- **自动封禁**：敏感操作超限后临时封禁

### 输入验证

- **大小限制**：JSON (10MB)、CSV (50MB)、瓦片 (5MB)
- **URL 验证**：阻止私有 IP、localhost、危险协议
- **路径安全**：防止路径遍历攻击

### 存储安全

- **路径沙箱**：仅允许访问应用数据目录
- **JSON 校验**：写入前验证数据格式

详细信息请参考[安全特性文档](../../security/security-features.md)。

## 相关文档

- [系统架构](overview.md)
- [前端架构](frontend-architecture.md)
- [Tauri Commands API](../apis/backend-apis/tauri-commands.md)
