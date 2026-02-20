import type { DailyKnowledgeCategory } from '@/lib/services/daily-knowledge/types';

export interface CuratedLocalizedContent {
  title: string;
  summary: string;
  body: string;
}

export interface CuratedKnowledgeEntry {
  id: string;
  categories: DailyKnowledgeCategory[];
  tags: string[];
  externalUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageType?: 'image' | 'video';
  relatedObjects: Array<{ name: string; ra?: number; dec?: number }>;
  attribution: {
    sourceName: string;
    sourceUrl?: string;
    licenseName?: string;
    licenseUrl?: string;
  };
  localeContent: {
    en: CuratedLocalizedContent;
    zh: CuratedLocalizedContent;
  };
}

export const DAILY_KNOWLEDGE_CURATED: CuratedKnowledgeEntry[] = [
  {
    id: 'curated-andromeda-distance',
    categories: ['object', 'history'],
    tags: ['M31', 'Local Group', 'distance'],
    externalUrl: 'https://messier.seds.org/m/m031.html',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/M31bobo.jpg',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/M31bobo.jpg/640px-M31bobo.jpg',
    imageType: 'image',
    relatedObjects: [{ name: 'M31', ra: 10.6847, dec: 41.2687 }],
    attribution: {
      sourceName: 'SEDS / Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:M31bobo.jpg',
      licenseName: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    },
    localeContent: {
      en: {
        title: 'Andromeda Is A Time Machine',
        summary: 'When you observe M31, you are seeing light that left about 2.5 million years ago.',
        body: 'Andromeda (M31) is the nearest large spiral galaxy to the Milky Way. Its distance means every photon you see began its trip long before modern humans. Deep exposure reveals dust lanes and star-forming regions that are ideal for small telescope astrophotography.',
      },
      zh: {
        title: '仙女座星系是一台时间机器',
        summary: '观测 M31 时，你看到的是大约 250 万年前发出的光。',
        body: '仙女座星系（M31）是离银河系最近的大型旋涡星系。由于距离极远，我们观测到的是非常古老的光。长时间曝光可清晰呈现其尘埃带与恒星形成区，是小口径设备常见的深空摄影目标。',
      },
    },
  },
  {
    id: 'curated-orion-nebula-hii',
    categories: ['object', 'technique'],
    tags: ['M42', 'HII', 'narrowband'],
    externalUrl: 'https://messier.seds.org/m/m042.html',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg/640px-Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
    imageType: 'image',
    relatedObjects: [{ name: 'M42', ra: 83.8221, dec: -5.3911 }],
    attribution: {
      sourceName: 'NASA/ESA Hubble',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
      licenseName: 'Public domain',
    },
    localeContent: {
      en: {
        title: 'Why Orion Nebula Is Bright In Narrowband',
        summary: 'M42 is a classic H II emission region with strong hydrogen and oxygen lines.',
        body: 'Orion Nebula is energized by young hot stars in the Trapezium cluster. Hydrogen-alpha and doubly ionized oxygen emissions make it a perfect target for narrowband filters. Capture short and long exposures to preserve both the bright core and faint outer wings.',
      },
      zh: {
        title: '为什么 M42 在窄带下如此出色',
        summary: 'M42 是典型 H II 发射星云，氢与氧发射线都非常明显。',
        body: '猎户座大星云由梯形星团中的高温年轻恒星电离。其 Hα 与 OIII 发射使其非常适合窄带拍摄。建议同时拍摄短曝与长曝，再进行 HDR 合成，兼顾核心和外围细节。',
      },
    },
  },
  {
    id: 'curated-jupiter-great-red-spot',
    categories: ['object', 'culture'],
    tags: ['Jupiter', 'planetary', 'GRS'],
    externalUrl: 'https://science.nasa.gov/jupiter/',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/640px-Jupiter.jpg',
    imageType: 'image',
    relatedObjects: [{ name: 'Jupiter' }],
    attribution: {
      sourceName: 'NASA/JPL',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Jupiter.jpg',
      licenseName: 'Public domain',
    },
    localeContent: {
      en: {
        title: 'Jupiter’s Great Red Spot Is A Long-Lived Storm',
        summary: 'The Great Red Spot has been observed for centuries, though it is shrinking.',
        body: 'Jupiter rotates rapidly, so planetary imaging relies on short video captures and stacking. The Great Red Spot changes in size and color over time. Even modest telescopes can reveal cloud belts, moon transits, and shadow events under stable seeing.',
      },
      zh: {
        title: '木星大红斑是一场“长寿风暴”',
        summary: '大红斑已被观测数百年，但尺寸正逐渐缩小。',
        body: '木星自转很快，行星摄影通常采用短视频叠加。大红斑的大小与颜色会随时间变化。在视宁度良好时，中小口径也能看到木星云带、卫星凌日与影子凌日等现象。',
      },
    },
  },
  {
    id: 'curated-pleiades-blue-dust',
    categories: ['object', 'history'],
    tags: ['M45', 'reflection nebula'],
    externalUrl: 'https://messier.seds.org/m/m045.html',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Pleiades_large.jpg',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/640px-Pleiades_large.jpg',
    imageType: 'image',
    relatedObjects: [{ name: 'M45', ra: 56.75, dec: 24.1167 }],
    attribution: {
      sourceName: 'NOIRLab / Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pleiades_large.jpg',
      licenseName: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
    localeContent: {
      en: {
        title: 'Pleiades Dust Is Reflection, Not Emission',
        summary: 'The blue glow around M45 is starlight scattered by dust.',
        body: 'Unlike emission nebulae, the Pleiades nebulosity shines because dust reflects blue starlight from hot stars. This makes broadband imaging especially effective. Good calibration frames and careful gradient control are key to preserving faint dust structures.',
      },
      zh: {
        title: '昴星团蓝色星云是反射而非发射',
        summary: 'M45 周围蓝色辉光来自尘埃对恒星光的散射。',
        body: '与发射星云不同，昴星团星云主要靠反射高温恒星的蓝光发亮，因此宽带拍摄效果很好。为了保留暗弱尘埃细节，需要重视平场与背景梯度处理。',
      },
    },
  },
  {
    id: 'curated-transit-and-altitude',
    categories: ['technique', 'event'],
    tags: ['transit', 'altitude', 'seeing'],
    relatedObjects: [{ name: 'Polaris' }],
    attribution: {
      sourceName: 'SkyMap Curated',
    },
    localeContent: {
      en: {
        title: 'Plan Around Transit For Better Results',
        summary: 'Targets near transit are highest in the sky and usually cleaner to image.',
        body: 'When a target crosses the local meridian, air mass is minimized and atmospheric dispersion is reduced. Use transit-centered windows for deep-sky sessions, and place short calibration or refocus blocks before and after the peak altitude period.',
      },
      zh: {
        title: '围绕中天安排拍摄更稳妥',
        summary: '目标接近中天时高度最高，通常画质更稳定。',
        body: '目标通过本地子午线时，大气质量数最小，色散也更低。深空拍摄可将核心曝光窗口放在中天附近，把校准与重新对焦安排在中天前后，提高整体成片率。',
      },
    },
  },
  {
    id: 'curated-dark-adaptation',
    categories: ['technique', 'culture'],
    tags: ['dark adaptation', 'night vision'],
    relatedObjects: [{ name: 'Moon' }],
    attribution: {
      sourceName: 'SkyMap Curated',
    },
    localeContent: {
      en: {
        title: 'Dark Adaptation Takes Time',
        summary: 'Human night vision improves after roughly 20–30 minutes in darkness.',
        body: 'Rod cells dominate low-light vision, but bright phone screens can reset adaptation quickly. Use red-light mode and keep brightness low. For visual observing, this single habit often yields a larger improvement than changing eyepieces.',
      },
      zh: {
        title: '暗适应需要时间建立',
        summary: '人眼在黑暗环境下通常需要 20–30 分钟完成暗适应。',
        body: '低照度下主要依赖视杆细胞，明亮屏幕会迅速破坏暗适应。建议开启红光模式并降低亮度。对于目视观测，这个习惯往往比更换目镜带来更明显提升。',
      },
    },
  },
];
