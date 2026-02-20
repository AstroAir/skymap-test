# Stellarium 能力矩阵（JS 层）

基线来源：Stellarium Web Engine 官方 JS API（`README.md`、`src/js/pre.js`、`src/js/obj.js`、`src/js/geojson.js`、`apps/simple-html/stellarium-web-engine.html`）。

## 矩阵

| 官方能力 | 本项目实现 | 自动化测试 | 文档 | 状态 |
| --- | --- | --- | --- | --- |
| `core.*` 可配置项（渲染/星座/线层/天空层） | `lib/stores/stellarium-store.ts` `applyCoreRendering/applyConstellations/applyGridLines` | `lib/stores/__tests__/stellarium-store.test.ts` | `docs/user-guide/starmap/display-settings.md` `docs/developer-guide/apis/frontend-apis/stores.md` | done |
| 新增 `tonemapper_p/mount_frame/y_offset` 映射 | `lib/stores/stellarium-store.ts` | `lib/stores/__tests__/stellarium-store.test.ts` | `docs/user-guide/starmap/display-settings.md` | done |
| 新增 `constellations.boundaries_visible` | `lib/stores/stellarium-store.ts` | `lib/stores/__tests__/stellarium-store.test.ts` | `docs/user-guide/starmap/display-settings.md` | done |
| 新增 `equatorial_jnow/horizon/galactic` 线层 | `lib/stores/stellarium-store.ts` | `lib/stores/__tests__/stellarium-store.test.ts` | `docs/user-guide/starmap/display-settings.md` | done |
| `createObj` / `createLayer` | `lib/hooks/stellarium/use-stellarium-layer-api.ts` | `lib/hooks/stellarium/__tests__/advanced-capabilities.test.tsx` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| `addDataSource`（survey/landscape 侧） | `lib/stores/stellarium-store.ts` | `lib/stores/__tests__/stellarium-store.test.ts` | `docs/developer-guide/apis/frontend-apis/stores.md` | done |
| `change` / `onValueChanged` | `lib/hooks/stellarium/use-stellarium-value-watch.ts` | `lib/hooks/stellarium/__tests__/advanced-capabilities.test.tsx` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| `pointAndLock`（目标跳转） | `lib/hooks/stellarium/target-object-pool.ts` `lib/hooks/use-select-target.ts` `lib/hooks/stellarium/use-stellarium-loader.ts` | `lib/hooks/__tests__/use-select-target.test.ts` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| `zoomTo` / `lookAt`（引擎视角控制） | `lib/hooks/stellarium/use-stellarium-zoom.ts` | `components/starmap/canvas/__tests__/hooks.test.tsx` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| `convertFrame` | `lib/hooks/stellarium/use-click-coordinates.ts` | `lib/hooks/stellarium/__tests__/use-click-coordinates.test.ts` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| 投影逆变换（10 种投影） | `lib/core/stellarium-projection.ts` `lib/hooks/stellarium/use-click-coordinates.ts` `lib/hooks/use-coordinate-projection.ts` | `lib/hooks/stellarium/__tests__/use-click-coordinates.test.ts` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| `calendar` | `lib/hooks/stellarium/use-stellarium-calendar.ts` `components/starmap/canvas/stellarium-canvas.tsx` | `lib/hooks/stellarium/__tests__/advanced-capabilities.test.tsx` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| `setFont` | `lib/hooks/stellarium/use-stellarium-fonts.ts` `components/starmap/canvas/stellarium-canvas.tsx` | `lib/hooks/stellarium/__tests__/advanced-capabilities.test.tsx` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| `on('click'/'rectSelection')` 事件桥接 | `components/starmap/canvas/stellarium-canvas.tsx` | `components/starmap/canvas/__tests__/stellarium-canvas.test.tsx` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| GeoJSON 扩展（`setData/filter/queryRenderedFeatureIds`） | `lib/hooks/stellarium/use-stellarium-layer-api.ts` | `lib/hooks/stellarium/__tests__/advanced-capabilities.test.tsx` | `docs/developer-guide/core-modules/starmap-core.md` | done |
| 设置持久化版本升级与自动迁移（v10） | `lib/stores/settings-store.ts` | `lib/stores/__tests__/settings-store.test.ts` | `docs/user-guide/starmap/display-settings.md` `docs/developer-guide/apis/frontend-apis/stores.md` | done |
| 设置 UI -> Store -> Core 同步链路 | `components/starmap/settings/display-settings.tsx` `lib/hooks/stellarium/use-settings-sync.ts` | `components/starmap/settings/__tests__/display-settings.test.tsx` | `docs/user-guide/starmap/display-settings.md` | done |
| survey 选择与持久化行为 | `components/starmap/settings/*` `lib/stores/settings-store.ts` `lib/stores/stellarium-store.ts` | `tests/e2e/starmap/survey-selector.spec.ts` | `docs/user-guide/starmap/display-settings.md` | done |
| `useMountStore.persist` 兼容（无 persist 环境不崩） | `lib/hooks/stellarium/use-observer-sync.ts` | `components/starmap/canvas/__tests__/hooks.test.tsx` | `docs/developer-guide/core-modules/starmap-core.md` | done |

## 说明

- 范围定义：仅覆盖 Stellarium 官方公开 JS 层能力，不涉及 C/WASM 内核改造。
- 双引擎策略：Stellarium 优先；Aladin 仅实现共享交集，不模拟 Stellarium 专有语义。
