# 天文计算引擎

本文档介绍 SkyMap Test 的天文计算模块。

## 概述

天文计算模块位于 `lib/astronomy/`，提供纯函数的天文计算能力，无副作用，便于测试和复用。

## 模块结构

```
lib/astronomy/
├── index.ts                 # 模块入口
├── astro-utils.ts           # 通用天文工具
├── starmap-utils.ts         # 星图相关工具
├── coordinates/             # 坐标系统
│   ├── index.ts
│   ├── conversions.ts       # 坐标转换
│   ├── formats.ts           # 格式化
│   └── transforms.ts        # 坐标系变换
├── time/                    # 时间计算
│   ├── index.ts
│   ├── julian.ts            # 儒略日
│   ├── sidereal.ts          # 恒星时
│   └── formats.ts           # 时间格式化
├── celestial/               # 天体位置
│   ├── index.ts
│   ├── sun.ts               # 太阳位置
│   ├── moon.ts              # 月球位置和月相
│   └── separation.ts        # 角距离
├── twilight/                # 薄暮计算
│   ├── index.ts
│   └── calculator.ts        # 薄暮时间计算
├── visibility/              # 可见性计算
│   ├── index.ts
│   ├── altitude.ts          # 高度计算
│   ├── target.ts            # 目标可见性
│   └── circumpolar.ts       # 拱极判断
├── imaging/                 # 成像评估
│   ├── index.ts
│   ├── exposure.ts          # 曝光计算
│   ├── feasibility.ts       # 可行性评估
│   └── planning.ts          # 多目标规划
└── horizon/                 # 自定义地平线
    ├── index.ts
    └── custom-horizon.ts    # 地平线轮廓
```

## 坐标系统 (coordinates/)

### 坐标转换

```typescript
import {
  raDecToAltAz,
  altAzToRaDec,
  raDecToGalactic,
  galacticToRaDec,
  raDecToEcliptic,
  eclipticToRaDec,
} from '@/lib/astronomy';

// 赤道坐标转地平坐标
const { alt, az } = raDecToAltAz(
  ra,      // 赤经 (度)
  dec,     // 赤纬 (度)
  lat,     // 观测纬度
  lon,     // 观测经度
  date     // 观测时间
);

// 地平坐标转赤道坐标
const { ra, dec } = altAzToRaDec(alt, az, lat, lon, date);

// 赤道坐标转银道坐标
const { l, b } = raDecToGalactic(ra, dec);

// 赤道坐标转黄道坐标
const { lambda, beta } = raDecToEcliptic(ra, dec, date);
```

### 坐标格式化

```typescript
import {
  formatRA,
  formatDec,
  parseRA,
  parseDec,
  formatAltAz,
} from '@/lib/astronomy';

// 格式化赤经 (HMS)
formatRA(83.633);  // "05h 34m 32.0s"

// 格式化赤纬 (DMS)
formatDec(22.014); // "+22° 00' 50.4\""

// 解析赤经字符串
parseRA("05h 34m 32s");  // 83.633

// 解析赤纬字符串
parseDec("+22° 00' 50\""); // 22.014
```

## 时间计算 (time/)

### 儒略日

```typescript
import {
  dateToJD,
  jdToDate,
  getMJD,
  getJD2000,
} from '@/lib/astronomy';

// Date 转儒略日
const jd = dateToJD(new Date());

// 儒略日转 Date
const date = jdToDate(2460000.5);

// 修正儒略日 (MJD)
const mjd = getMJD(new Date());

// J2000.0 纪元儒略日
const jd2000 = getJD2000(); // 2451545.0
```

### 恒星时

```typescript
import {
  getGMST,
  getLMST,
  getApparentSiderealTime,
} from '@/lib/astronomy';

// 格林尼治平恒星时
const gmst = getGMST(date); // 小时

// 地方平恒星时
const lmst = getLMST(date, longitude); // 小时

// 视恒星时（考虑章动）
const ast = getApparentSiderealTime(date);
```

## 天体位置 (celestial/)

### 太阳位置

```typescript
import {
  getSunPosition,
  getSunRiseSet,
  getSolarNoon,
} from '@/lib/astronomy';

// 太阳位置
const { ra, dec, distance } = getSunPosition(date);

// 日出日落
const { rise, set } = getSunRiseSet(date, lat, lon);

// 正午时刻
const noon = getSolarNoon(date, lon);
```

### 月球位置和月相

```typescript
import {
  getMoonPosition,
  getMoonPhase,
  getMoonIllumination,
  getMoonRiseSet,
  getNextMoonPhases,
} from '@/lib/astronomy';

// 月球位置
const { ra, dec, distance, parallax } = getMoonPosition(date);

// 月相 (0-1)
const phase = getMoonPhase(date);
// 0 = 新月, 0.25 = 上弦, 0.5 = 满月, 0.75 = 下弦

// 月球亮度百分比
const illumination = getMoonIllumination(date); // 0-100%

// 月出月落
const { rise, set } = getMoonRiseSet(date, lat, lon);

// 未来月相
const phases = getNextMoonPhases(date, count);
// [{ date, phase: 'new'|'first'|'full'|'last' }, ...]
```

### 角距离

```typescript
import { angularSeparation } from '@/lib/astronomy';

// 计算两点角距离
const sep = angularSeparation(ra1, dec1, ra2, dec2);
// 返回角距离（度）
```

## 薄暮计算 (twilight/)

```typescript
import {
  calculateTwilightTimes,
  getTwilightType,
  isAstronomicalNight,
} from '@/lib/astronomy';

// 计算薄暮时间
const twilight = calculateTwilightTimes(date, lat, lon);

interface TwilightTimes {
  civilDawn: Date;        // 民用晨光始
  nauticalDawn: Date;     // 航海晨光始
  astronomicalDawn: Date; // 天文晨光始
  sunrise: Date;          // 日出
  sunset: Date;           // 日落
  civilDusk: Date;        // 民用昏影终
  nauticalDusk: Date;     // 航海昏影终
  astronomicalDusk: Date; // 天文昏影终
}

// 当前薄暮类型
const type = getTwilightType(date, lat, lon);
// 'day' | 'civil' | 'nautical' | 'astronomical' | 'night'

// 是否为天文夜间
const isNight = isAstronomicalNight(date, lat, lon);
```

## 可见性计算 (visibility/)

### 高度计算

```typescript
import {
  getObjectAltitude,
  getMaxAltitude,
  getTransitTime,
  getAltitudeAtTime,
} from '@/lib/astronomy';

// 当前高度角
const alt = getObjectAltitude(ra, dec, lat, lon, date);

// 最高高度
const maxAlt = getMaxAltitude(dec, lat);

// 中天时刻
const transit = getTransitTime(ra, lon, date);

// 指定时间的高度
const altAtTime = getAltitudeAtTime(ra, dec, lat, lon, targetTime);
```

### 目标可见性

```typescript
import {
  calculateVisibility,
  getVisibleWindow,
  isObjectVisible,
} from '@/lib/astronomy';

// 完整可见性信息
const visibility = calculateVisibility(ra, dec, lat, lon, date);

interface Visibility {
  isVisible: boolean;
  riseTime: Date | null;
  setTime: Date | null;
  transitTime: Date;
  maxAltitude: number;
  currentAltitude: number;
  visibleDuration: number; // 分钟
}

// 可见时段
const window = getVisibleWindow(ra, dec, lat, lon, date, {
  minAltitude: 30,    // 最低高度
  twilightLimit: 'astronomical', // 薄暮限制
});

// 简单判断是否可见
const visible = isObjectVisible(ra, dec, lat, lon, date, minAlt);
```

### 拱极判断

```typescript
import {
  isCircumpolar,
  isNeverRises,
  getCircumpolarLimit,
} from '@/lib/astronomy';

// 是否拱极
const circumpolar = isCircumpolar(dec, lat);

// 是否永不升起
const neverRises = isNeverRises(dec, lat);

// 拱极赤纬限制
const limit = getCircumpolarLimit(lat);
// 赤纬大于此值的天体为拱极星
```

## 成像评估 (imaging/)

### 曝光计算

```typescript
import {
  calculateExposureTime,
  calculateSignalToNoise,
  calculateStackedSNR,
} from '@/lib/astronomy';

// 计算曝光时间
const exposure = calculateExposureTime({
  magnitude: 10.5,      // 目标星等
  aperture: 200,        // 口径 mm
  focalRatio: 4,        // 焦比
  pixelScale: 1.5,      // 像素比例 arcsec/pixel
  skyBackground: 20,    // 天空背景星等
  readNoise: 3,         // 读出噪声 e-
  darkCurrent: 0.01,    // 暗电流 e-/s
  targetSNR: 100,       // 目标信噪比
});

// 计算信噪比
const snr = calculateSignalToNoise({
  exposureTime: 300,
  // ... 其他参数
});

// 叠加后信噪比
const stackedSNR = calculateStackedSNR(singleSNR, frameCount);
```

### 可行性评估

```typescript
import {
  assessImagingFeasibility,
  getRecommendedExposure,
} from '@/lib/astronomy';

// 评估成像可行性
const assessment = assessImagingFeasibility({
  target: { ra, dec, magnitude, size },
  equipment: { telescope, camera },
  conditions: { moonPhase, skyQuality, seeing },
  constraints: { minAltitude, maxExposure },
});

interface FeasibilityAssessment {
  feasible: boolean;
  score: number;           // 0-100
  visibleWindow: TimeWindow;
  recommendedExposure: number;
  estimatedTotalTime: number;
  warnings: string[];
  suggestions: string[];
}
```

### 多目标规划

```typescript
import {
  planImagingSession,
  optimizeTargetOrder,
} from '@/lib/astronomy';

// 规划拍摄会话
const plan = planImagingSession({
  targets: targetList,
  equipment: equipmentConfig,
  startTime: sessionStart,
  endTime: sessionEnd,
  constraints: {
    minAltitude: 30,
    meridianFlipBuffer: 15, // 分钟
  },
});

// 优化目标顺序
const optimized = optimizeTargetOrder(targets, {
  strategy: 'altitude', // 'altitude' | 'time' | 'efficiency'
  location: { lat, lon },
  date: sessionDate,
});
```

## 自定义地平线 (horizon/)

```typescript
import {
  loadHorizonProfile,
  getHorizonAltitude,
  isAboveHorizon,
} from '@/lib/astronomy';

// 加载地平线轮廓
const horizon = loadHorizonProfile(profileData);
// profileData: Array<{ azimuth: number, altitude: number }>

// 获取指定方位的地平线高度
const horizonAlt = getHorizonAltitude(horizon, azimuth);

// 判断目标是否在地平线之上
const above = isAboveHorizon(horizon, alt, az);
```

## 使用示例

### 完整观测规划流程

```typescript
import {
  calculateTwilightTimes,
  calculateVisibility,
  getMoonPhase,
  assessImagingFeasibility,
} from '@/lib/astronomy';

async function planObservation(target, location, date) {
  // 1. 获取薄暮时间
  const twilight = calculateTwilightTimes(date, location.lat, location.lon);

  // 2. 计算目标可见性
  const visibility = calculateVisibility(
    target.ra,
    target.dec,
    location.lat,
    location.lon,
    date
  );

  // 3. 检查月相
  const moonPhase = getMoonPhase(date);
  const moonIllumination = getMoonIllumination(date);

  // 4. 评估成像可行性
  const assessment = assessImagingFeasibility({
    target,
    equipment: myEquipment,
    conditions: {
      moonPhase,
      skyQuality: 'suburban',
    },
  });

  return {
    twilight,
    visibility,
    moonPhase,
    moonIllumination,
    assessment,
  };
}
```

## 测试

天文计算模块有完整的单元测试覆盖：

```bash
# 运行天文计算测试
pnpm test lib/astronomy

# 运行特定子模块测试
pnpm test lib/astronomy/coordinates
pnpm test lib/astronomy/visibility
```

## 精度说明

- **坐标转换**: 精度约 1 角秒
- **时间计算**: 精度约 1 秒
- **太阳/月球位置**: 精度约 1 角分
- **升落时间**: 精度约 1 分钟

## 相关文档

- [星图核心](starmap-core.md) - 星图渲染核心
- [Tauri 天文 API](../apis/backend-apis/tauri-commands.md#天文计算-api) - 后端天文计算

---

返回：[核心模块](index.md)
