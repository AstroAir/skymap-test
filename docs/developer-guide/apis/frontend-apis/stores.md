# Zustand Stores API

SkyMap Test 使用 Zustand 进行状态管理。本文档介绍所有可用的 Stores。

## Store 概览

应用包含以下 Stores：

```mermaid
graph TD
    A[Zustand Stores] --> B[stellarium-store<br/>星图状态]
    A --> C[equipment-store<br/>设备配置]
    A --> D[target-list-store<br/>目标列表]
    A --> E[marker-store<br/>标记数据]
    A --> F[settings-store<br/>应用设置]
    A --> G[mount-store<br/>赤道仪状态]
    A --> H[framing-store<br/>取景器状态]
    A --> I[satellite-store<br/>卫星数据]
    A --> J[onboarding-store<br/>新手引导]
    A --> K[setup-wizard-store<br/>设置向导]
    A --> L[theme-store<br/>主题定制]
    A --> M[favorites-store<br/>收藏对象]
    A --> N[bookmarks-store<br/>视图书签]
```

### Store 列表

| Store | 文件 | 说明 |
|-------|------|------|
| `useStellariumStore` | `stellarium-store.ts` | 星图引擎状态 |
| `useSettingsStore` | `settings-store.ts` | 应用设置 |
| `useEquipmentStore` | `equipment-store.ts` | 设备配置（望远镜、相机等） |
| `useTargetListStore` | `target-list-store.ts` | 观测目标列表 |
| `useMarkerStore` | `marker-store.ts` | 天空标记 |
| `useSatelliteStore` | `satellite-store.ts` | 卫星追踪 |
| `useFramingStore` | `framing-store.ts` | 取景框状态 |
| `useMountStore` | `mount-store.ts` | 赤道仪状态 |
| `useOnboardingStore` | `onboarding-store.ts` | 新手引导教程 |
| `useSetupWizardStore` | `setup-wizard-store.ts` | 首次设置向导 |
| `useThemeStore` | `theme-store.ts` | 主题颜色定制 |
| `useFavoritesStore` | `favorites-store.ts` | 收藏天体对象 |
| `useBookmarksStore` | `bookmarks-store.ts` | 视图书签 |

## Stellarium Store

管理星图引擎和视图状态。

**文件**: `lib/stores/stellarium-store.ts`

### State 接口

```typescript
interface StellariumState {
  // 引擎实例
  stel: StellariumEngine | null;
  baseUrl: string;

  // 搜索状态
  search: {
    RAangle: number;        // 赤经角度
    DECangle: number;       // 赤纬角度
    RAangleString: string;  // 赤经字符串
    DECangleString: string; // 赤纬字符串
  };

  // 辅助函数
  getCurrentViewDirection: (() => {
    ra: number;    // 赤经
    dec: number;   // 赤纬
    alt: number;   // 高度角
    az: number;    // 方位角
  }) | null;

  setViewDirection: ((raDeg: number, decDeg: number) => void) | null;
}
```

### Actions

#### setStel

设置星图引擎实例。

```typescript
setStel: (stel: StellariumEngine | null) => void
```

**示例**:

```typescript
import { useStellariumStore } from '@/lib/stores';

const setStel = useStellariumStore(state => state.setStel);

// 设置引擎
setStel(engineInstance);
```

#### setSearch

更新搜索状态。

```typescript
setSearch: (search: Partial<StellariumState['search']>) => void
```

**示例**:

```typescript
const setSearch = useStellariumStore(state => state.setSearch);

// 更新赤经赤纬
setSearch({
  RAangle: 45.5,
  DECangle: -12.3,
  RAangleString: '3h 2m',
  DECangleString: '-12° 18\''
});
```

#### updateStellariumCore

更新星图核心设置。

```typescript
updateStellariumCore: (settings: StellariumSettings) => void
```

**参数**:

```typescript
interface StellariumSettings {
  constellationsLinesVisible: boolean;    // 星座连线
  constellationArtVisible: boolean;        // 星座艺术图
  azimuthalLinesVisible: boolean;          // 地平网格
  equatorialLinesVisible: boolean;         // 赤道网格
  meridianLinesVisible: boolean;           // 子午线
  eclipticLinesVisible: boolean;           // 黄道
  atmosphereVisible: boolean;              // 大气层
  dsosVisible: boolean;                    // 深空天体
  landscapesVisible: boolean;              // 地平景观
  surveyEnabled: boolean;                  // 星图survey
  surveyId: string;                        // survey ID
  surveyUrl?: string;                      // survey URL
  skyCultureLanguage: string;              // 星座文化语言
}
```

**示例**:

```typescript
const updateStellariumCore = useStellariumStore(
  state => state.updateStellariumCore
);

// 启用星座连线
updateStellariumCore({
  constellationsLinesVisible: true,
  equatorialLinesVisible: true
});
```

## Equipment Store

管理观测设备配置（望远镜、相机等）。

**文件**: `lib/stores/equipment-store.ts`

### 主要功能

```typescript
interface EquipmentState {
  // 望远镜列表
  telescopes: Telescope[];
  // 相机列表
  cameras: Camera[];
  // 当前选择的设备
  selectedTelescope: Telescope | null;
  selectedCamera: Camera | null;

  // Actions
  addTelescope: (telescope: Telescope) => void;
  removeTelescope: (id: string) => void;
  updateTelescope: (id: string, data: Partial<Telescope>) => void;
  selectTelescope: (telescope: Telescope | null) => void;

  addCamera: (camera: Camera) => void;
  removeCamera: (id: string) => void;
  updateCamera: (id: string, data: Partial<Camera>) => void;
  selectCamera: (camera: Camera | null) => void;
}
```

### 使用示例

```typescript
import { useEquipmentStore } from '@/lib/stores';

// 添加望远镜
const addTelescope = useEquipmentStore(state => state.addTelescope);

addTelescope({
  id: 'tele-001',
  name: 'Celestron 8SE',
  type: 'schmidt-cassegrain',
  aperture: 203,        // mm
  focalLength: 2032,    // mm
});

// 计算放大倍数
const telescope = useEquipmentStore(state => state.selectedTelescope);
const eyepiece = { focalLength: 25 }; // 25mm目镜
const magnification = telescope.focalLength / eyepiece.focalLength;
console.log(`放大倍数: ${magnification}x`);
```

## Target List Store

管理观测目标列表。

**文件**: `lib/stores/target-list-store.ts`

### 主要功能

```typescript
interface TargetListState {
  // 目标列表
  targets: Target[];

  // Actions
  addTarget: (target: Target) => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, data: Partial<Target>) => void;
  toggleTargetStatus: (id: string) => void;
  setTargetPriority: (id: string, priority: Priority) => void;
  clearCompleted: () => void;
  sortBy: (criteria: SortCriteria) => void;
}
```

### 使用示例

```typescript
import { useTargetListStore } from '@/lib/stores';

// 添加目标
const addTarget = useTargetListStore(state => state.addTarget);

addTarget({
  id: 'tgt-001',
  objectId: 'M31',
  name: '仙女座星系',
  ra: 10.6847,
  dec: 41.2687,
  priority: 'high',
  status: 'pending',
  notes: '最佳观测时间：23:00-01:00'
});

// 更新目标状态
const updateTarget = useTargetListStore(state => state.updateTarget);

updateTarget('tgt-001', { status: 'completed' });
```

## Marker Store

管理天空标记。

**文件**: `lib/stores/marker-store.ts`

### 主要功能

```typescript
interface MarkerState {
  // 标记列表
  markers: Marker[];
  // 标记分组
  groups: MarkerGroup[];

  // Actions
  addMarker: (marker: Marker) => void;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, data: Partial<Marker>) => void;
  toggleMarkerVisibility: (id: string) => void;
  addMarkerGroup: (group: MarkerGroup) => void;
}
```

### 使用示例

```typescript
import { useMarkerStore } from '@/lib/stores';

// 添加标记
const addMarker = useMarkerStore(state => state.addMarker);

addMarker({
  id: 'marker-001',
  name: '有趣的目标',
  ra: 180.5,
  dec: 45.2,
  color: '#ff0000',
  visible: true
});
```

## Settings Store

管理应用全局设置。

**文件**: `lib/stores/settings-store.ts`

### 主要功能

```typescript
interface SettingsState {
  // 观测位置
  location: {
    latitude: number;
    longitude: number;
    altitude: number;
    timezone: string;
    name: string;
  };

  // 显示设置
  display: {
    theme: 'light' | 'dark' | 'auto';
    magnitudeLimit: number;
    starSize: number;
    constellations: boolean;
  };

  // Actions
  updateLocation: (location: Partial<Location>) => void;
  updateDisplay: (display: Partial<Display>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => void;
}
```

## Onboarding Store

管理新手引导教程状态。

**文件**: `lib/stores/onboarding-store.ts`

### 主要功能

```typescript
interface OnboardingState {
  // 教程状态
  hasCompletedTour: boolean;
  currentStep: number;
  isActive: boolean;

  // 教程步骤
  tourSteps: TourStep[];

  // Actions
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

interface TourStep {
  id: string;
  target: string;        // CSS 选择器
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}
```

### 使用示例

```typescript
import { useOnboardingStore, TOUR_STEPS } from '@/lib/stores';

// 启动教程
const startTour = useOnboardingStore(state => state.startTour);
startTour();

// 检查是否完成
const hasCompleted = useOnboardingStore(state => state.hasCompletedTour);
if (!hasCompleted) {
  // 显示欢迎对话框
}
```

## Setup Wizard Store

管理首次设置向导状态。

**文件**: `lib/stores/setup-wizard-store.ts`

### 主要功能

```typescript
interface SetupWizardState {
  // 向导状态
  isOpen: boolean;
  currentStep: number;
  isCompleted: boolean;

  // 收集的数据
  location: LocationData | null;
  equipment: EquipmentData | null;
  preferences: PreferencesData | null;

  // Actions
  openWizard: () => void;
  closeWizard: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setLocation: (location: LocationData) => void;
  setEquipment: (equipment: EquipmentData) => void;
  setPreferences: (preferences: PreferencesData) => void;
  completeSetup: () => void;
  resetWizard: () => void;
}
```

### 使用示例

```typescript
import { useSetupWizardStore, SETUP_WIZARD_STEPS } from '@/lib/stores';

// 打开向导
const openWizard = useSetupWizardStore(state => state.openWizard);
openWizard();

// 保存位置设置
const setLocation = useSetupWizardStore(state => state.setLocation);
setLocation({
  latitude: 39.904,
  longitude: 116.407,
  name: '北京'
});
```

## Theme Store

管理主题颜色定制。

**文件**: `lib/stores/theme-store.ts`

### 主要功能

```typescript
interface ThemeState {
  // 当前主题
  currentPreset: string;
  customColors: ThemeColors;
  isDarkMode: boolean;

  // 预设主题
  presets: ThemePreset[];

  // Actions
  setPreset: (presetId: string) => void;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
  toggleDarkMode: () => void;
  resetToDefault: () => void;
  exportTheme: () => ThemeCustomization;
  importTheme: (theme: ThemeCustomization) => void;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
}
```

### 使用示例

```typescript
import { useThemeStore, themePresets } from '@/lib/stores';

// 应用预设主题
const setPreset = useThemeStore(state => state.setPreset);
setPreset('astronomy-dark');

// 自定义颜色
const setCustomColors = useThemeStore(state => state.setCustomColors);
setCustomColors({
  primary: '#ff6b6b',
  accent: '#4ecdc4'
});

// 导出主题配置
const exportTheme = useThemeStore(state => state.exportTheme);
const themeConfig = exportTheme();
localStorage.setItem('custom-theme', JSON.stringify(themeConfig));
```

## Satellite Store

管理卫星追踪数据。

**文件**: `lib/stores/satellite-store.ts`

### 主要功能

```typescript
interface SatelliteState {
  // 追踪的卫星
  trackedSatellites: TrackedSatellite[];
  selectedSatellite: TrackedSatellite | null;

  // 显示设置
  showOrbits: boolean;
  showLabels: boolean;

  // Actions
  addSatellite: (satellite: TrackedSatellite) => void;
  removeSatellite: (noradId: number) => void;
  selectSatellite: (satellite: TrackedSatellite | null) => void;
  updatePosition: (noradId: number, position: Position) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
}

interface TrackedSatellite {
  noradId: number;
  name: string;
  tle: string[];
  position?: Position;
  nextPass?: PassInfo;
}
```

### 使用示例

```typescript
import { useSatelliteStore } from '@/lib/stores';

// 添加 ISS 追踪
const addSatellite = useSatelliteStore(state => state.addSatellite);
addSatellite({
  noradId: 25544,
  name: 'ISS (ZARYA)',
  tle: [
    '1 25544U 98067A   ...',
    '2 25544  51.6400 ...'
  ]
});

// 获取追踪列表
const satellites = useSatelliteStore(state => state.trackedSatellites);
```

## Store 使用最佳实践

### 1. 选择性订阅

只订阅需要的状态片段，避免不必要的重渲染：

```typescript
// ❌ 不好：订阅整个 store
const store = useStellariumStore();
console.log(store.stel);

// ✅ 好：只订阅需要的字段
const stel = useStellariumStore(state => state.stel);
console.log(stel);
```

### 2. 派生状态

使用 useMemo 计算派生状态：

```typescript
const telescopes = useEquipmentStore(state => state.telescopes);
const selectedId = useEquipmentStore(state => state.selectedTelescope?.id);

// 派生：当前选择的望远镜
const selectedTelescope = useMemo(
  () => telescopes.find(t => t.id === selectedId),
  [telescopes, selectedId]
);
```

### 3. Actions 复用

将常用的 action 组合封装成自定义 hook：

```typescript
function useStellariumSettings() {
  const updateStellariumCore = useStellariumStore(
    state => state.updateStellariumCore
  );

  const enableGrids = useCallback(() => {
    updateStellariumCore({
      equatorialLinesVisible: true,
      azimuthalLinesVisible: true
    });
  }, [updateStellariumCore]);

  const disableGrids = useCallback(() => {
    updateStellariumCore({
      equatorialLinesVisible: false,
      azimuthalLinesVisible: false
    });
  }, [updateStellariumCore]);

  return { enableGrids, disableGrids };
}
```

### 4. 持久化

使用中间件持久化 store 到本地存储：

```typescript
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      // ... store implementation
    }),
    {
      name: 'skymap-settings',
      partialize: (state) => ({
        // 只持久化部分字段
        location: state.location,
        display: state.display
      })
    }
  )
);
```

## Store 开发工具

### Zustand DevTools

集成 Redux DevTools：

```typescript
import { devtools } from 'zustand/middleware';

export const useStellariumStore = create(
  devtools<StellariumState>(
    (set, get) => ({
      // ... store implementation
    }),
    { name: 'StellariumStore' }
  )
);
```

### 调试技巧

```typescript
// 监听 store 变化
useStellariumStore.subscribe(
  (state) => state.search,
  (search) => {
    console.log('搜索状态更新:', search);
  }
);

// 获取完整状态
const state = useStellariumStore.getState();
console.log('完整状态:', state);
```

## Framing Store

管理取景框和图像构图状态。

**文件**: `lib/stores/framing-store.ts`

### 主要功能

```typescript
interface FramingStoreState {
  // 坐标
  RAangle: number;           // 赤经角度
  DECangle: number;          // 赤纬角度
  RAangleString: string;     // 赤经字符串
  DECangleString: string;    // 赤纬字符串
  rotationAngle: number;     // 旋转角度

  // 界面状态
  showFramingModal: boolean; // 显示取景框对话框
  selectedItem: object | null;
  containerSize: number;     // 容器尺寸

  // 望远镜状态
  isSlewing: boolean;        // 是否正在转向
  isSlewingAndCentering: boolean;

  // Actions
  setRAangle: (angle: number) => void;
  setDECangle: (angle: number) => void;
  setRotationAngle: (angle: number) => void;
  setShowFramingModal: (show: boolean) => void;
  setCoordinates: (coords: {
    ra?: number;
    dec?: number;
    raString?: string;
    decString?: string;
  }) => void;
}
```

### 使用示例

```typescript
import { useFramingStore } from '@/lib/stores';

// 设置目标坐标
const setCoordinates = useFramingStore(state => state.setCoordinates);
setCoordinates({
  ra: 83.82,
  dec: -5.39,
  raString: '5h 35m 17s',
  decString: '-5° 23\' 24"'
});

// 打开取景框模态框
const setShowFramingModal = useFramingStore(state => state.setShowFramingModal);
setShowFramingModal(true);

// 设置相机旋转角度
const setRotationAngle = useFramingStore(state => state.setRotationAngle);
setRotationAngle(45); // 45度
```

## Mount Store

管理赤道仪和望远镜架台状态。

**文件**: `lib/stores/mount-store.ts`

### 主要功能

```typescript
interface MountStoreState {
  // 赤道仪信息
  mountInfo: {
    Connected: boolean;      // 连接状态
    Coordinates: {
      RADegrees: number;     // 赤经（度）
      Dec: number;           // 赤纬（度）
    };
  };

  // 观测站配置
  profileInfo: {
    AstrometrySettings: {
      Latitude: number;      // 纬度
      Longitude: number;     // 经度
      Elevation: number;     // 海拔
    };
  };

  // 拍摄序列状态
  sequenceRunning: boolean;  // 序列是否运行中
  currentTab: string;        // 当前标签页

  // Actions
  setMountInfo: (info: Partial<MountInfo>) => void;
  setMountCoordinates: (ra: number, dec: number) => void;
  setMountConnected: (connected: boolean) => void;
  setProfileInfo: (info: Partial<ProfileInfo>) => void;
  setSequenceRunning: (running: boolean) => void;
}
```

### 使用示例

```typescript
import { useMountStore } from '@/lib/stores';

// 检查赤道仪连接状态
const isConnected = useMountStore(state => state.mountInfo.Connected);

// 更新赤道仪坐标
const setMountCoordinates = useMountStore(state => state.setMountCoordinates);
setMountCoordinates(180.5, 45.2);

// 设置观测站位置
const setProfileInfo = useMountStore(state => state.setProfileInfo);
setProfileInfo({
  AstrometrySettings: {
    Latitude: 39.904,
    Longitude: 116.407,
    Elevation: 50
  }
});
```

## Favorites Store

管理用户收藏的天体对象。

**文件**: `lib/stores/favorites-store.ts`

### 主要功能

```typescript
interface FavoriteObject {
  id: string;
  name: string;
  ra: number;
  dec: number;
  raString: string;
  decString: string;
  type?: string;
  magnitude?: number;
  constellation?: string;
  notes?: string;
  addedAt: number;
  lastViewedAt?: number;
  viewCount: number;
  tags: string[];
}

interface FavoritesState {
  favorites: FavoriteObject[];
  recentlyViewed: FavoriteObject[];
  maxRecent: number;

  // Actions
  addFavorite: (object: Omit<FavoriteObject, 'id' | 'addedAt' | 'viewCount' | 'tags'>) => void;
  removeFavorite: (id: string) => void;
  updateFavorite: (id: string, updates: Partial<FavoriteObject>) => void;
  isFavorite: (name: string) => boolean;
  getFavoriteByName: (name: string) => FavoriteObject | undefined;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  recordView: (object: Omit<FavoriteObject, ...>) => void;
  clearRecentlyViewed: () => void;
  getAllTags: () => string[];
  getFavoritesByTag: (tag: string) => FavoriteObject[];
}
```

### 预定义标签

```typescript
const FAVORITE_TAGS = [
  'imaging',    // 适合摄影
  'visual',     // 适合目视
  'must-see',   // 必看
  'difficult',  // 难度较高
  'seasonal',   // 季节性
  'priority',   // 优先
] as const;
```

### 使用示例

```typescript
import { useFavoritesStore, FAVORITE_TAGS } from '@/lib/stores';

// 添加收藏
const addFavorite = useFavoritesStore(state => state.addFavorite);
addFavorite({
  name: 'M31',
  ra: 10.6847,
  dec: 41.2687,
  raString: '0h 42m 44s',
  decString: '+41° 16\' 9"',
  type: 'Galaxy',
  magnitude: 3.4,
  constellation: 'Andromeda',
  notes: '仙女座星系，最佳秋季观测'
});

// 检查是否已收藏
const isFavorite = useFavoritesStore(state => state.isFavorite);
if (isFavorite('M31')) {
  console.log('M31 已在收藏列表中');
}

// 添加标签
const addTag = useFavoritesStore(state => state.addTag);
addTag('fav_xxx', 'imaging');

// 获取某标签下的所有收藏
const getFavoritesByTag = useFavoritesStore(state => state.getFavoritesByTag);
const imagingTargets = getFavoritesByTag('imaging');

// 记录浏览历史
const recordView = useFavoritesStore(state => state.recordView);
recordView({
  name: 'M42',
  ra: 83.82,
  dec: -5.39,
  raString: '5h 35m 17s',
  decString: '-5° 23\' 24"'
});
```

## Bookmarks Store

管理视图书签，保存和恢复天空视图位置。

**文件**: `lib/stores/bookmarks-store.ts`

### 主要功能

```typescript
interface ViewBookmark {
  id: string;
  name: string;
  ra: number;
  dec: number;
  fov: number;            // 视场角
  description?: string;
  color?: string;         // 标记颜色
  icon?: BookmarkIcon;    // 图标类型
  createdAt: number;
  updatedAt: number;
}

type BookmarkIcon = 'star' | 'heart' | 'flag' | 'pin' | 'eye' | 'camera' | 'telescope';

interface BookmarksState {
  bookmarks: ViewBookmark[];

  // Actions
  addBookmark: (bookmark: Omit<ViewBookmark, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBookmark: (id: string, updates: Partial<ViewBookmark>) => void;
  removeBookmark: (id: string) => void;
  getBookmark: (id: string) => ViewBookmark | undefined;
  reorderBookmarks: (fromIndex: number, toIndex: number) => void;
  duplicateBookmark: (id: string) => string | null;
}
```

### 预定义颜色

```typescript
const BOOKMARK_COLORS = [
  '#ef4444', // 红色
  '#f97316', // 橙色
  '#eab308', // 黄色
  '#22c55e', // 绿色
  '#06b6d4', // 青色
  '#3b82f6', // 蓝色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
];
```

### 默认书签

```typescript
const DEFAULT_BOOKMARKS = [
  {
    name: 'North Celestial Pole',
    ra: 0, dec: 90, fov: 30,
    description: '北天极',
    icon: 'star',
  },
  {
    name: 'Orion Nebula',
    ra: 83.82, dec: -5.39, fov: 2,
    description: 'M42 - 猎户座大星云',
    icon: 'camera',
  },
  {
    name: 'Andromeda Galaxy',
    ra: 10.68, dec: 41.27, fov: 3,
    description: 'M31 - 仙女座星系',
    icon: 'telescope',
  },
  {
    name: 'Galactic Center',
    ra: 266.42, dec: -29.01, fov: 15,
    description: '银河系中心',
    icon: 'eye',
  },
];
```

### 使用示例

```typescript
import { useBookmarksStore, BOOKMARK_COLORS, BOOKMARK_ICONS } from '@/lib/stores';

// 添加书签
const addBookmark = useBookmarksStore(state => state.addBookmark);
const bookmarkId = addBookmark({
  name: '我的观测位置',
  ra: 180.5,
  dec: 45.2,
  fov: 5,
  description: '银河拍摄最佳区域',
  color: BOOKMARK_COLORS[5],
  icon: 'camera'
});

// 获取所有书签
const bookmarks = useBookmarksStore(state => state.bookmarks);

// 跳转到书签位置
const bookmark = useBookmarksStore(state => state.getBookmark(bookmarkId));
if (bookmark) {
  stellariumStore.setViewDirection(bookmark.ra, bookmark.dec);
  stellariumStore.setFov(bookmark.fov);
}

// 重新排序书签
const reorderBookmarks = useBookmarksStore(state => state.reorderBookmarks);
reorderBookmarks(0, 2); // 将第一个移到第三个位置

// 复制书签
const duplicateBookmark = useBookmarksStore(state => state.duplicateBookmark);
const newId = duplicateBookmark(bookmarkId);
```

## 相关文档

- [数据流设计](../../architecture/data-flow.md)
- [组件开发](../../frontend-development/react-components.md)

---

返回：[API参考](../index.md)
