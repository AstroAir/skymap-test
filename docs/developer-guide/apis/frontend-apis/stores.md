# Zustand Stores API

本文档仅描述当前代码中真实存在且已验证的 store 接口。  
源代码优先级高于文档，如有差异请以 `lib/stores/*.ts` 为准。

## Store 一览

核心导出入口：`lib/stores/index.ts`

| Store | 文件 | 作用 |
| --- | --- | --- |
| `useStellariumStore` | `lib/stores/stellarium-store.ts` | Stellarium/Aladin 引擎实例与 Stellarium 核心映射 |
| `useSettingsStore` | `lib/stores/settings-store.ts` | 全局设置（含 Stellarium 与 Aladin 显示设置） |
| `useAladinStore` | `lib/stores/aladin-store.ts` | Aladin 图层状态（catalog/overlay/moc/fits） |
| `useMountStore` | `lib/stores/mount-store.ts` | 观测地与赤道仪信息 |
| `useFramingStore` | `lib/stores/framing-store.ts` | 取景与坐标状态 |
| `useTargetListStore` | `lib/stores/target-list-store.ts` | 目标清单 |
| `useMarkerStore` | `lib/stores/marker-store.ts` | 标记与分组 |

## useStellariumStore

文件：`lib/stores/stellarium-store.ts`

### 关键 State

```ts
interface StellariumState {
  stel: StellariumEngine | null;
  aladin: AladinInstance | null;
  activeEngine: 'stellarium' | 'aladin';
  baseUrl: string;
  search: {
    RAangle: number;
    DECangle: number;
    RAangleString: string;
    DECangleString: string;
  };
  getCurrentViewDirection: (() => { ra: number; dec: number; alt: number; az: number }) | null;
  setViewDirection: ((raDeg: number, decDeg: number) => void) | null;
  viewDirection: { ra: number; dec: number; alt: number; az: number } | null;
}
```

### 关键 Actions

```ts
setStel: (stel: StellariumEngine | null) => void;
setAladin: (aladin: AladinInstance | null) => void;
setActiveEngine: (engine: 'stellarium' | 'aladin') => void;
setBaseUrl: (url: string) => void;
setSearch: (search: Partial<StellariumState['search']>) => void;
setHelpers: (helpers: {
  getCurrentViewDirection?: StellariumState['getCurrentViewDirection'];
  setViewDirection?: StellariumState['setViewDirection'];
}) => void;
updateViewDirection: () => void;
updateStellariumCore: (settings: StellariumSettings) => void;
```

### updateStellariumCore 能力映射（当前实现）

`updateStellariumCore` 已按能力拆分为原子函数：

- `applyCoreRendering`
- `applyConstellations`
- `applyGridLines`
- `applyLandscapeAndFog`
- `applySurvey`
- `applyLocalization`

映射采用“能力探测 + 安全赋值”：

- 目标路径存在才写入（如 `core.tonemapper_p`）。
- 不存在时仅记录一次 `debug` 诊断，不抛错。

#### 已映射字段（含 v10 新增）

- 渲染：
  `bortle_index`、`star_linear_scale`、`star_relative_scale`、`display_limit_mag`、`exposure_scale`、`tonemapper_p`、`projection`、`mount_frame`、`y_offset`、`flip_view_vertical`、`flip_view_horizontal`
- 星座：
  `constellations.lines_visible`、`labels_visible`、`images_visible`、`boundaries_visible`
- 网格线：
  `lines.azimuthal.visible`、`equatorial.visible`、`equatorial_jnow.visible`、`meridian.visible`、`ecliptic.visible`、`horizon.visible`、`galactic.visible`
- 天空层：
  `atmosphere.visible`、`dsos.visible`、`milkyway.visible`、`landscapes.visible`、`landscapes.fog_visible`
- Survey：
  `hips.visible`、`hips.url`（或 fallback 到 `hips.addDataSource`）

Survey URL 规则：

- `surveyUrl` 优先；
- 无 `surveyUrl` 时使用 `SKY_SURVEYS[surveyId]`（大小写不敏感）；
- URL 自动规范化为末尾 `/`；
- 未解析到 URL 则禁用 `hips.visible`。

## useSettingsStore

文件：`lib/stores/settings-store.ts`

### 关键 State（节选）

```ts
interface SettingsState {
  connection: { ip: string; port: string };
  backendProtocol: 'http' | 'https';
  skyEngine: 'stellarium' | 'aladin';
  stellarium: StellariumSettings;
  aladinDisplay: AladinDisplaySettings;
  preferences: AppPreferences;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  notifications: NotificationSettings;
  search: SearchSettings;
}
```

### StellariumSettings（当前字段全集）

类型定义：`lib/core/types/stellarium.ts`

- 星座/标注：`constellationsLinesVisible`、`constellationArtVisible`、`constellationLabelsVisible`、`constellationBoundariesVisible`、`starLabelsVisible`、`planetLabelsVisible`
- 网格线：`azimuthalLinesVisible`、`equatorialLinesVisible`、`equatorialJnowLinesVisible`、`meridianLinesVisible`、`eclipticLinesVisible`、`horizonLinesVisible`、`galacticLinesVisible`
- 天空层：`atmosphereVisible`、`landscapesVisible`、`fogVisible`、`dsosVisible`、`milkyWayVisible`
- Survey：`surveyEnabled`、`surveyId`、`surveyUrl`
- 渲染：`projectionType`、`bortleIndex`、`starLinearScale`、`starRelativeScale`、`displayLimitMag`、`exposureScale`、`tonemapperP`、`mountFrame`、`viewYOffset`、`flipViewVertical`、`flipViewHorizontal`
- 其它：`skyCultureLanguage`、`nightMode`、`sensorControl`、`crosshairVisible`、`crosshairColor`

### 关键 Actions（节选）

```ts
setSkyEngine: (engine: SkyEngineType) => void;
setStellariumSetting: <K extends keyof StellariumSettings>(
  key: K,
  value: StellariumSettings[K]
) => void;
setStellariumSettings: (settings: StellariumSettings) => void;
toggleStellariumSetting: (key: keyof StellariumSettings) => void;
setAladinDisplaySetting: <K extends keyof AladinDisplaySettings>(
  key: K,
  value: AladinDisplaySettings[K]
) => void;
```

### 持久化与迁移

- 存储键：`starmap-settings`
- 当前版本：`10`
- `v10` 迁移策略：保留旧值，仅为 Stellarium 新字段补默认值（`DEFAULT_STELLARIUM_SETTINGS`）

## 测试覆盖入口

- `lib/stores/__tests__/stellarium-store.test.ts`
- `lib/stores/__tests__/settings-store.test.ts`

以上测试覆盖了新增字段映射、survey fallback 与设置迁移等关键行为。

---

返回：[API 参考](../index.md)
