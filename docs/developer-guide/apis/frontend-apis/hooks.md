# React Hooks API

SkyMap Test 提供了一系列自定义 React Hooks，封装常用的业务逻辑。

## Hooks 概览

```mermaid
graph TD
    A[React Hooks] --> B[设备 Hooks]
    A --> C[搜索 Hooks]
    A --> D[规划 Hooks]
    A --> E[翻译 Hooks]
    A --> F[缓存 Hooks]

    B --> B1[useGeolocation]
    B --> B2[useDeviceOrientation]
    B --> B3[useOrientation]

    C --> C1[useObjectSearch]
    C --> C2[useCelestialName]

    D --> D1[useTonightRecommendations]
    D --> D2[useTargetPlanner]

    E --> E1[useCelestialNames]
    E --> E2[useSkyCultureLanguage]

    F --> F1[useCacheInit]
```

### Hooks 列表

| Hook | 文件 | 说明 |
|------|------|------|
| `useGeolocation` | `use-geolocation.ts` | 获取用户地理位置 |
| `useDeviceOrientation` | `use-device-orientation.ts` | 设备方向传感器 |
| `useOrientation` | `use-orientation.ts` | 屏幕方向检测 |
| `useObjectSearch` | `use-object-search.ts` | 天体搜索 |
| `useCelestialName` | `use-celestial-name.ts` | 天体名称翻译 |
| `useTonightRecommendations` | `use-tonight-recommendations.ts` | 今晚观测推荐 |
| `useTargetPlanner` | `use-target-planner.ts` | 目标规划器 |
| `useCacheInit` | `use-cache-init.ts` | 缓存初始化 |

## 设备 Hooks

### useGeolocation

获取用户地理位置，支持高精度定位和自动更新。

**文件**: `lib/hooks/use-geolocation.ts`

```typescript
interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;  // 高精度模式
  timeout?: number;              // 超时时间 (ms)
  maximumAge?: number;           // 缓存时间 (ms)
  watchPosition?: boolean;       // 持续监听
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: GeolocationPositionError | null;
  timestamp: number | null;
}

function useGeolocation(options?: UseGeolocationOptions): UseGeolocationReturn;
```

**使用示例**:

```typescript
import { useGeolocation } from '@/lib/hooks';

function LocationDisplay() {
  const { latitude, longitude, loading, error, refresh } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  if (loading) return <div>获取位置中...</div>;
  if (error) return <div>定位失败: {error.message}</div>;

  return (
    <div>
      <p>纬度: {latitude?.toFixed(4)}°</p>
      <p>经度: {longitude?.toFixed(4)}°</p>
      <Button onClick={refresh}>刷新位置</Button>
    </div>
  );
}
```

**辅助函数**:

```typescript
// 获取位置，支持 Tauri 和浏览器回退
import { getLocationWithFallback } from '@/lib/hooks';

const position = await getLocationWithFallback();
```

### useDeviceOrientation

获取设备方向传感器数据，支持指向天空计算。

**文件**: `lib/hooks/use-device-orientation.ts`

```typescript
interface DeviceOrientation {
  alpha: number | null;   // 绕 Z 轴旋转 (0-360)
  beta: number | null;    // 绕 X 轴旋转 (-180 to 180)
  gamma: number | null;   // 绕 Y 轴旋转 (-90 to 90)
  absolute: boolean;
}

interface SkyDirection {
  azimuth: number;        // 方位角 (0-360, 北=0)
  altitude: number;       // 高度角 (-90 to 90)
}

function useDeviceOrientation(): {
  orientation: DeviceOrientation;
  skyDirection: SkyDirection | null;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
};
```

**使用示例**:

```typescript
import { useDeviceOrientation } from '@/lib/hooks';

function CompassView() {
  const { orientation, skyDirection, isSupported, requestPermission } = 
    useDeviceOrientation();

  if (!isSupported) {
    return <div>设备不支持方向传感器</div>;
  }

  return (
    <div>
      <p>指向天空: Alt {skyDirection?.altitude.toFixed(1)}°, 
         Az {skyDirection?.azimuth.toFixed(1)}°</p>
      <Button onClick={requestPermission}>请求权限</Button>
    </div>
  );
}
```

## 搜索 Hooks

### useObjectSearch

天体搜索 Hook，支持模糊搜索、筛选和排序。

**文件**: `lib/hooks/use-object-search.ts`

```typescript
type ObjectType = 
  | 'star' | 'galaxy' | 'nebula' | 'cluster' 
  | 'planet' | 'moon' | 'comet' | 'asteroid'
  | 'double_star' | 'variable_star';

type SortOption = 
  | 'relevance' | 'magnitude' | 'altitude' 
  | 'name' | 'type' | 'size';

type SearchMode = 'fuzzy' | 'exact' | 'prefix';

interface UseObjectSearchOptions {
  objectTypes?: ObjectType[];
  minMagnitude?: number;
  maxMagnitude?: number;
  minAltitude?: number;
  sortBy?: SortOption;
  searchMode?: SearchMode;
  limit?: number;
}

function useObjectSearch(
  query: string,
  options?: UseObjectSearchOptions
): {
  results: SearchResult[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
};
```

**使用示例**:

```typescript
import { useObjectSearch, getDetailedMatch } from '@/lib/hooks';

function SearchPanel() {
  const [query, setQuery] = useState('');
  
  const { results, loading, totalCount } = useObjectSearch(query, {
    objectTypes: ['galaxy', 'nebula', 'cluster'],
    minAltitude: 30,
    sortBy: 'altitude',
    limit: 50,
  });

  return (
    <div>
      <Input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索天体..."
      />
      
      {loading && <Spinner />}
      
      <p>找到 {totalCount} 个结果</p>
      
      {results.map(result => (
        <SearchResultItem 
          key={result.id} 
          result={result}
          match={getDetailedMatch(result, query)}
        />
      ))}
    </div>
  );
}
```

### useCelestialName

获取天体的本地化名称。

**文件**: `lib/hooks/use-celestial-name.ts`

```typescript
function useCelestialName(
  objectId: string,
  options?: { fallback?: string }
): string;

function useCelestialNames(
  objectIds: string[]
): Record<string, string>;

function useCelestialNameWithOriginal(
  objectId: string
): { translated: string; original: string };

function useSkyCultureLanguage(): {
  language: SkyCultureLanguage;
  setLanguage: (lang: SkyCultureLanguage) => void;
  availableLanguages: SkyCultureLanguage[];
};

type SkyCultureLanguage = 'latin' | 'english' | 'chinese' | 'native';
```

**使用示例**:

```typescript
import { 
  useCelestialName, 
  useCelestialNameWithOriginal,
  useSkyCultureLanguage 
} from '@/lib/hooks';

function ObjectName({ objectId }: { objectId: string }) {
  const name = useCelestialName(objectId);
  return <span>{name}</span>;
}

function ObjectNameWithOriginal({ objectId }: { objectId: string }) {
  const { translated, original } = useCelestialNameWithOriginal(objectId);
  
  return (
    <div>
      <span className="font-bold">{translated}</span>
      {translated !== original && (
        <span className="text-muted-foreground ml-2">({original})</span>
      )}
    </div>
  );
}

function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useSkyCultureLanguage();
  
  return (
    <Select value={language} onValueChange={setLanguage}>
      {availableLanguages.map(lang => (
        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
      ))}
    </Select>
  );
}
```

## 规划 Hooks

### useTonightRecommendations

获取今晚的观测目标推荐。

**文件**: `lib/hooks/use-tonight-recommendations.ts`

```typescript
interface RecommendedTarget {
  id: string;
  name: string;
  type: string;
  ra: number;
  dec: number;
  magnitude: number;
  size?: number;
  score: number;           // 推荐分数 0-100
  reasons: string[];       // 推荐原因
  bestTime: Date;          // 最佳观测时间
  visibleWindow: {
    start: Date;
    end: Date;
    maxAltitude: number;
  };
}

interface TonightConditions {
  moonPhase: number;
  moonIllumination: number;
  twilight: TwilightInfo;
  weatherSuitable: boolean;
}

interface TwilightInfo {
  sunset: Date;
  civilDusk: Date;
  nauticalDusk: Date;
  astronomicalDusk: Date;
  astronomicalDawn: Date;
  nauticalDawn: Date;
  civilDawn: Date;
  sunrise: Date;
}

function useTonightRecommendations(options?: {
  location?: { lat: number; lon: number };
  date?: Date;
  equipment?: EquipmentConfig;
  preferences?: {
    objectTypes?: string[];
    minAltitude?: number;
    avoidMoon?: boolean;
    maxMagnitude?: number;
  };
}): {
  recommendations: RecommendedTarget[];
  conditions: TonightConditions;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
};
```

**使用示例**:

```typescript
import { useTonightRecommendations } from '@/lib/hooks';

function TonightPanel() {
  const { 
    recommendations, 
    conditions, 
    loading,
    refresh 
  } = useTonightRecommendations({
    preferences: {
      objectTypes: ['galaxy', 'nebula'],
      minAltitude: 40,
      avoidMoon: true,
    },
  });

  return (
    <div>
      <div className="flex justify-between">
        <h2>今晚推荐</h2>
        <Button onClick={refresh}>刷新</Button>
      </div>
      
      <div className="text-sm text-muted-foreground">
        月相: {(conditions.moonIllumination * 100).toFixed(0)}%
        天文昏影: {format(conditions.twilight.astronomicalDusk, 'HH:mm')}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-2">
          {recommendations.map(target => (
            <RecommendationCard key={target.id} target={target} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### useTargetPlanner

目标规划器，计算可见性和最佳观测时段。

**文件**: `lib/hooks/use-target-planner.ts`

```typescript
interface TargetVisibility {
  targetId: string;
  isVisible: boolean;
  riseTime: Date | null;
  setTime: Date | null;
  transitTime: Date;
  maxAltitude: number;
  currentAltitude: number;
  isCircumpolar: boolean;
  neverRises: boolean;
}

interface SessionPlan {
  targets: TargetScheduleSlot[];
  totalDuration: number;
  conflicts: SessionConflict[];
  efficiency: number;
}

interface TargetScheduleSlot {
  targetId: string;
  startTime: Date;
  endTime: Date;
  priority: number;
  altitude: number;
}

interface SessionConflict {
  type: 'overlap' | 'twilight' | 'moon' | 'altitude';
  targetIds: string[];
  message: string;
}

function useTargetPlanner(targets: Target[], options?: {
  location?: { lat: number; lon: number };
  date?: Date;
  sessionStart?: Date;
  sessionEnd?: Date;
  constraints?: {
    minAltitude?: number;
    twilightLimit?: 'civil' | 'nautical' | 'astronomical';
    moonDistance?: number;
  };
}): {
  visibility: Map<string, TargetVisibility>;
  plan: SessionPlan | null;
  optimizePlan: () => void;
  reorderTargets: (order: string[]) => void;
  loading: boolean;
  error: Error | null;
};
```

**使用示例**:

```typescript
import { useTargetPlanner } from '@/lib/hooks';

function SessionPlanner({ targets }: { targets: Target[] }) {
  const { 
    visibility, 
    plan, 
    optimizePlan,
    loading 
  } = useTargetPlanner(targets, {
    constraints: {
      minAltitude: 30,
      twilightLimit: 'astronomical',
      moonDistance: 30,
    },
  });

  return (
    <div>
      <Button onClick={optimizePlan} disabled={loading}>
        优化观测顺序
      </Button>

      {plan && (
        <div>
          <p>总时长: {Math.round(plan.totalDuration / 60)} 分钟</p>
          <p>效率: {(plan.efficiency * 100).toFixed(0)}%</p>
          
          {plan.conflicts.length > 0 && (
            <Alert variant="warning">
              {plan.conflicts.map((c, i) => (
                <p key={i}>{c.message}</p>
              ))}
            </Alert>
          )}
          
          <Timeline slots={plan.targets} />
        </div>
      )}
    </div>
  );
}
```

## 缓存 Hooks

### useCacheInit

初始化缓存系统。

**文件**: `lib/hooks/use-cache-init.ts`

```typescript
function useCacheInit(): {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  stats: CacheStats | null;
  reinitialize: () => Promise<void>;
};

interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  lastCleanup: Date | null;
}
```

**使用示例**:

```typescript
import { useCacheInit } from '@/lib/hooks';

function App() {
  const { isInitialized, isLoading, stats } = useCacheInit();

  if (isLoading) {
    return <SplashScreen message="初始化缓存..." />;
  }

  if (!isInitialized) {
    return <ErrorScreen message="缓存初始化失败" />;
  }

  return <MainApp />;
}
```

## 最佳实践

### 1. 条件调用

React Hooks 不能条件调用，使用 enabled 参数：

```typescript
// ❌ 错误
if (shouldSearch) {
  const results = useObjectSearch(query);
}

// ✅ 正确
const results = useObjectSearch(query, {
  enabled: shouldSearch,
});
```

### 2. 依赖优化

避免不必要的重新计算：

```typescript
// ❌ 每次渲染都创建新对象
const { results } = useObjectSearch(query, {
  objectTypes: ['galaxy', 'nebula'],
});

// ✅ 使用 useMemo
const options = useMemo(() => ({
  objectTypes: ['galaxy', 'nebula'],
}), []);

const { results } = useObjectSearch(query, options);
```

### 3. 错误处理

始终处理 error 状态：

```typescript
const { data, loading, error } = useSomeHook();

if (error) {
  return <ErrorBoundary error={error} />;
}
```

### 4. 清理副作用

Hooks 内部已处理清理，但如果需要：

```typescript
useEffect(() => {
  const subscription = someService.subscribe();
  return () => subscription.unsubscribe();
}, []);
```

## 相关文档

- [Stores API](stores.md) - 状态管理
- [核心模块](../../core-modules/index.md) - 核心模块文档
- [天文计算](../../core-modules/astronomy-engine.md) - 天文计算引擎

---

返回：[API参考](../index.md)
