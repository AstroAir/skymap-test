# 星图核心模块

本文档描述当前实现（Next.js 16 + Stellarium Web Engine JS/WASM + Tauri）。

## 模块结构

- `components/starmap/canvas/sky-map-canvas.tsx`
  - 引擎切换包装层（Stellarium / Aladin）
- `components/starmap/canvas/stellarium-canvas.tsx`
  - Stellarium 画布组件与 `ref` 能力暴露
- `lib/hooks/stellarium/*`
  - 引擎加载、缩放、设置同步、坐标换算、事件桥接、高级 API Hook
- `lib/stores/stellarium-store.ts`
  - Stellarium/Aladin 引擎实例、核心映射、视角辅助函数
- `lib/stores/settings-store.ts`
  - 用户设置持久化（含 Stellarium 显示配置）

## StellariumCanvas Ref API（当前实现）

`SkyMapCanvasRef` 基础能力：

- `zoomIn() / zoomOut()`
- `setFov(fov) / getFov()`
- `getClickCoordinates(clientX, clientY)`
- `reloadEngine()`
- `getEngineStatus()`

Stellarium 扩展能力（可选）：

- `getEngine()`：返回当前 `StellariumEngine | null`
- `onEngineEvent('click' | 'rectSelection', cb)`：事件订阅，返回解除函数
- `setEngineFont('regular' | 'bold', url)`：动态注入字体
- `runCalendar({ start, end })`：运行 calendar 事件计算

## 核心设置映射

`lib/stores/stellarium-store.ts` 中 `updateStellariumCore` 已拆分为原子能力函数：

- `applyCoreRendering`
- `applyConstellations`
- `applyGridLines`
- `applyLandscapeAndFog`
- `applySurvey`
- `applyLocalization`

所有字段写入采用“能力探测 + 安全赋值”策略：

- 目标路径存在才写入
- 不存在仅记录一次 `debug` 诊断
- 不抛异常，不中断其他字段应用

## 投影与坐标链路

- 共享投影工具：`lib/core/stellarium-projection.ts`
- 正向（RA/Dec -> 屏幕）用于覆盖层：`lib/hooks/use-coordinate-projection.ts`
- 反向（屏幕 -> RA/Dec）用于右键坐标：`lib/hooks/stellarium/use-click-coordinates.ts`

已覆盖投影值：`0,1,2,3,4,5,7,8,9,10`。

## 高级能力 Hook

- `useStellariumCalendar`
- `useStellariumFonts`
- `useStellariumLayerApi`
- `useStellariumValueWatch`

这些 Hook 封装 `calendar / setFont / createLayer-createObj-geojson / onValueChanged`。

## 双引擎边界

- Stellarium：完整能力优先实现。
- Aladin：保持最小共享交集，不强行模拟 Stellarium 专有行为。
