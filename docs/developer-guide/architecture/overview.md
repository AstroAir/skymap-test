# 系统架构

本文档从宏观角度介绍 SkyMap Test 的整体系统架构设计。

## 架构概览

SkyMap Test 采用前后端分离的架构，通过 Tauri 框架将 Web 技术栈与原生桌面能力结合。

## 整体架构图

```mermaid
graph TB
    subgraph 用户界面层
        A1[React Components<br/>组件层]
        A2[UI Components<br/>UI组件库]
        A3[Business Logic<br/>业务逻辑]
        A4[State Management<br/>状态管理]
    end

    subgraph API层
        B1[Frontend APIs<br/>前端API]
        B2[Tauri IPC<br/>进程间通信]
        B3[Backend APIs<br/>后端API]
    end

    subgraph 后端服务层
        C1[Astronomy Engine<br/>天文计算]
        C2[Data Storage<br/>数据存储]
        C3[Cache System<br/>缓存系统]
        C4[Device Management<br/>设备管理]
    end

    subgraph 数据层
        D1[(JSON Stores)]
        D2[File System Cache]
        D3[Star Catalog Data]
        D4[User Settings]
    end

    A1 --> A2
    A1 --> A3
    A3 --> A4
    A3 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C1
    B3 --> C2
    B3 --> C3
    B3 --> C4
    C2 --> D1
    C3 --> D2
    C1 --> D3
    C4 --> D4
```

## 前端架构

### 技术栈

- **框架**: Next.js 16 (App Router)
- **UI库**: React 19
- **样式**: Tailwind CSS v4
- **组件**: shadcn/ui + Radix UI
- **状态**: Zustand
- **国际化**: next-intl

### 前端分层结构

```mermaid
graph TD
    subgraph 展示层
        P1[Pages<br/>页面]
        P2[Components<br/>组件]
        P3[UI Library<br/>UI库]
    end

    subgraph 业务逻辑层
        L1[Services<br/>服务]
        L2[Hooks<br/>钩子]
        L3[Utils<br/>工具]
    end

    subgraph 状态管理层
        S1[StellariumStore<br/>星图状态]
        S2[EquipmentStore<br/>设备状态]
        S3[TargetStore<br/>目标状态]
    end

    subgraph 数据访问层
        D1[Astronomy<br/>天文计算]
        D2[Catalogs<br/>星表数据]
        D3[Tauri API<br/>后端API]
    end

    P1 --> P2
    P2 --> P3
    P2 --> L1
    L1 --> L2
    L1 --> L3
    L1 --> S1
    L1 --> S2
    L1 --> S3
    L2 --> D1
    L2 --> D2
    L2 --> D3
```

### 前端核心模块

#### 1. 星图渲染模块

**位置**: `components/starmap/core/`

**职责**:
- Canvas/WebGL 星图渲染
- 天体位置计算与投影
- 交互事件处理
- 性能优化

**关键组件**:
- `StellariumCanvas` - 主渲染组件
- `StellariumView` - 视图控制
- `StellariumMount` - 赤道仪模拟
- `ZoomControls` - 缩放控制

#### 2. 业务逻辑模块

**位置**: `lib/services/`

**职责**:
- 封装业务逻辑
- 协调多个组件
- 处理数据转换

**关键服务**:
- `hips-service` - HiPS图像服务
- `object-info-service` - 天体信息查询
- `astro-events-service` - 天文事件计算
- `satellite-service` - 卫星跟踪

#### 3. 状态管理模块

**位置**: `lib/stores/`

**职责**:
- 全局状态管理
- 跨组件通信
- 持久化状态

**关键Store**:
- `stellarium-store` - 星图状态
- `equipment-store` - 设备状态
- `target-list-store` - 目标列表
- `settings-store` - 应用设置

## 后端架构

### 技术栈

- **框架**: Tauri 2.9
- **语言**: Rust
- **存储**: JSON File Storage
- **序列化**: Serde

### 后端模块组织

```mermaid
graph TD
    subgraph 命令层
        M1[main.rs<br/>主入口]
        M2[lib.rs<br/>命令注册]
    end

    subgraph 业务逻辑层
        B1[astronomy.rs<br/>天文计算]
        B2[storage.rs<br/>数据存储]
        B3[equipment.rs<br/>设备管理]
        B4[cache.rs<br/>缓存管理]
    end

    subgraph 数据访问层
        A1[JSON<br/>文件存储]
        A2[File System<br/>文件系统]
        A3[Network<br/>网络请求]
    end

    M1 --> M2
    M2 --> B1
    M2 --> B2
    M2 --> B3
    M2 --> B4
    B2 --> A1
    B4 --> A2
    B1 --> A3
```

### 后端核心模块

#### 1. 数据存储模块

**文件**: `storage.rs`

**职责**:
- JSON 文件存储管理
- CRUD操作
- 数据持久化

**主要功能**:
- 观测日志CRUD
- 设备配置管理
- 用户设置存储
- 目标列表管理

#### 2. 离线缓存模块

**文件**: `offline_cache.rs`, `unified_cache.rs`

**职责**:
- 星表数据缓存
- HiPS瓦片缓存
- 缓存策略管理
- 存储空间管理

**缓存层次**:

```mermaid
graph LR
    A[请求] --> B{内存缓存?}
    B -->|命中| C[返回数据]
    B -->|未命中| D{磁盘缓存?}
    D -->|命中| E[加载到内存]
    D -->|未命中| F[网络获取]
    F --> G[保存到磁盘]
    G --> E
    E --> C
```

#### 3. 天文计算模块

**文件**: `astronomy.rs`

**职责**:
- 天体位置计算
- 坐标转换
- 升落时间计算
- 可见性判断

## 前后端通信

### Tauri IPC机制

```mermaid
sequenceDiagram
    participant F as 前端React
    participant I as Tauri IPC
    participant B as Rust后端
    participant D as 数据层

    F->>I: invoke('command_name', params)
    I->>B: 调用Rust函数
    B->>D: 执行操作
    D-->>B: 返回结果
    B-->>I: 序列化结果
    I-->>F: 返回JSON
    F->>F: 更新状态/UI
```

### API调用示例

**前端调用**:

```typescript
import { invoke } from '@tauri-apps/api/core';

// 调用后端命令
const result = await invoke('get_object_info', {
  objectId: 'M31'
});
```

**后端定义**:

```rust
#[tauri::command]
async fn get_object_info(object_id: String) -> Result<ObjectInfo, String> {
    // 实现逻辑
    Ok(object_info)
}
```

## 数据流设计

### 典型数据流

#### 场景1: 星图渲染

```mermaid
sequenceDiagram
    participant U as 用户
    participant C as 组件
    participant S as Store
    participant R as 渲染器

    U->>C: 拖动星图
    C->>S: 更新视角状态
    S->>S: 触发重渲染
    S->>R: 请求重绘
    R->>R: 计算天体位置
    R->>R: Canvas绘制
    R-->>U: 显示结果
```

#### 场景2: 搜索天体

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant T as Tauri
    participant B as 后端
    participant D as 数据库

    U->>F: 输入"M31"
    F->>F: 本地索引搜索
    alt 本地找到
        F->>U: 显示结果
    else 本地未找到
        F->>T: invoke('search_object')
        T->>B: 执行搜索
        B->>D: 查询数据库
        D-->>B: 返回结果
        B-->>T: 返回数据
        T-->>F: JSON结果
        F->>U: 显示结果
    end
```

#### 场景3: 观测规划

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant A as 天文计算
    participant T as Tauri
    participant S as 存储

    U->>F: 选择天体
    F->>A: 计算可见性
    A->>A: 计算升落时间
    A->>A: 检查曙暮光
    A-->>F: 返回可见时段
    F->>U: 显示预测
    U->>F: 添加到列表
    F->>T: invoke('save_target')
    T->>S: 保存到数据库
    S-->>F: 确认保存
    F->>U: 更新列表显示
```

## 状态管理

### Zustand Store架构

```mermaid
graph TD
    A[Root Store] --> B[StellariumStore<br/>星图状态]
    A --> C[EquipmentStore<br/>设备状态]
    A --> D[TargetListStore<br/>目标列表]
    A --> E[SettingsStore<br/>设置]

    B --> B1[视角]
    B --> B2[时间]
    B --> B3[图层]

    C --> C1[望远镜]
    C --> C2[相机]
    C --> C3[配置]

    D --> D1[目标]
    D --> D2[状态]
    D --> D3[优先级]
```

### 状态同步策略

1. **单向数据流**: 用户操作 → 状态更新 → UI渲染
2. **乐观更新**: 前端先更新，后端异步确认
3. **最终一致性**: 允许短暂的UI与数据不一致
4. **错误回滚**: 后端失败时恢复前端状态

## 架构优势

### 1. 模块化设计

- 前后端清晰分离
- 功能模块独立
- 便于并行开发

### 2. 性能优化

- 前端虚拟化渲染
- 后端异步处理
- 多层缓存策略

### 3. 可维护性

- TypeScript类型安全
- Rust内存安全
- 清晰的模块边界

### 4. 可扩展性

- 插件化架构
- 服务层抽象
- 易于添加新功能

## 技术决策理由

### 为什么选择 Next.js?

- 优秀的开发体验
- App Router支持
- 服务端渲染能力（预留）
- 丰富的生态系统

### 为什么选择 Tauri?

- 更小的安装包
- 更好的性能
- Rust的安全性和性能
- 原生API访问

### 为什么选择 Zustand?

- 轻量级
- 简单的API
- 无需Provider包裹
- 良好的TypeScript支持

### 为什么选择 JSON 存储?

- 零配置
- 轻量级
- 易于调试和人工检查数据
- 适合桌面应用配置与轻量级数据存储
- 跨平台
- 适合桌面应用

## 性能考虑

### 前端性能

- **虚拟化**: 长列表虚拟化
- **懒加载**: 组件和路由懒加载
- **memoization**: React.memo、useMemo
- **Web Workers**: 耗时计算移到Worker

### 后端性能

- **异步处理**: tokio异步运行时
- **缓存策略**: 多级缓存
- **批量操作**: 减少IO次数
- **索引优化**: 数据库索引

## 未来架构演进

### 短期计划

- [ ] 增加后台任务队列
- [ ] 实现插件系统
- [ ] 优化缓存策略

### 长期计划

- [ ] 支持云同步
- [ ] 多设备协作
- [ ] AI辅助观测规划

## 相关文档

- [前端架构详解](frontend-architecture.md)
- [后端架构详解](backend-architecture.md)
- [数据流设计](data-flow.md)
- [状态管理](../project-structure/index.md)
