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
│   ├── storage.rs           # 数据存储
│   ├── equipment.rs         # 设备管理
│   ├── astronomy.rs         # 天文计算
│   ├── astro_events.rs      # 天文事件
│   ├── target_list.rs       # 目标列表
│   ├── markers.rs           # 标记管理
│   ├── offline_cache.rs     # 离线缓存
│   ├── unified_cache.rs     # 统一缓存
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

```rust
// src-tauri/src/storage.rs
use std::fs;
use serde_json;

#[tauri::command]
pub async fn save_store_data(
    app: AppHandle,
    store_name: String,
    data: String,
) -> Result<(), String> {
    let conn = open_database(&app)?;
    conn.execute(
        "INSERT OR REPLACE INTO stores (name, data) VALUES (?1, ?2)",
        params![store_name, data],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn load_store_data(
    app: AppHandle,
    store_name: String,
) -> Result<Option<String>, String> {
    let conn = open_database(&app)?;
    let mut stmt = conn.prepare("SELECT data FROM stores WHERE name = ?1")
        .map_err(|e| e.to_string())?;
    stmt.query_row(params![store_name], |row| row.get(0))
        .optional()
        .map_err(|e| e.to_string())
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

- **参数化查询**：防止 SQL 注入
- **输入验证**：验证所有用户输入
- **路径安全**：防止路径遍历攻击

## 相关文档

- [系统架构](overview.md)
- [前端架构](frontend-architecture.md)
- [Tauri Commands API](../apis/backend-apis/tauri-commands.md)
