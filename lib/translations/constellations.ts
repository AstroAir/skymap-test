/**
 * Constellation name translations
 * Maps IAU constellation abbreviations and Latin names to localized names
 */

export interface ConstellationTranslation {
  /** IAU 3-letter abbreviation */
  iau: string;
  /** Latin/Native name */
  native: string;
  /** English common name */
  english: string;
  /** Chinese name */
  chinese: string;
}

/**
 * All 88 modern constellations with translations
 */
export const CONSTELLATION_TRANSLATIONS: ConstellationTranslation[] = [
  { iau: 'And', native: 'Andromeda', english: 'Chained Maiden', chinese: '仙女座' },
  { iau: 'Ant', native: 'Antlia', english: 'Air Pump', chinese: '唧筒座' },
  { iau: 'Aps', native: 'Apus', english: 'Bird of Paradise', chinese: '天燕座' },
  { iau: 'Aqr', native: 'Aquarius', english: 'Water Bearer', chinese: '宝瓶座' },
  { iau: 'Aql', native: 'Aquila', english: 'Eagle', chinese: '天鹰座' },
  { iau: 'Ara', native: 'Ara', english: 'Altar', chinese: '天坛座' },
  { iau: 'Ari', native: 'Aries', english: 'Ram', chinese: '白羊座' },
  { iau: 'Aur', native: 'Auriga', english: 'Charioteer', chinese: '御夫座' },
  { iau: 'Boo', native: 'Boötes', english: 'Herdsman', chinese: '牧夫座' },
  { iau: 'Cae', native: 'Caelum', english: 'Engraving Tool', chinese: '雕具座' },
  { iau: 'Cam', native: 'Camelopardalis', english: 'Giraffe', chinese: '鹿豹座' },
  { iau: 'Cnc', native: 'Cancer', english: 'Crab', chinese: '巨蟹座' },
  { iau: 'CVn', native: 'Canes Venatici', english: 'Hunting Dogs', chinese: '猎犬座' },
  { iau: 'CMa', native: 'Canis Major', english: 'Great Dog', chinese: '大犬座' },
  { iau: 'CMi', native: 'Canis Minor', english: 'Lesser Dog', chinese: '小犬座' },
  { iau: 'Cap', native: 'Capricornus', english: 'Sea Goat', chinese: '摩羯座' },
  { iau: 'Car', native: 'Carina', english: 'Keel', chinese: '船底座' },
  { iau: 'Cas', native: 'Cassiopeia', english: 'Seated Queen', chinese: '仙后座' },
  { iau: 'Cen', native: 'Centaurus', english: 'Centaur', chinese: '半人马座' },
  { iau: 'Cep', native: 'Cepheus', english: 'King', chinese: '仙王座' },
  { iau: 'Cet', native: 'Cetus', english: 'Sea Monster', chinese: '鲸鱼座' },
  { iau: 'Cha', native: 'Chamaeleon', english: 'Chameleon', chinese: '蝘蜓座' },
  { iau: 'Cir', native: 'Circinus', english: 'Compass', chinese: '圆规座' },
  { iau: 'Col', native: 'Columba', english: 'Dove', chinese: '天鸽座' },
  { iau: 'Com', native: 'Coma Berenices', english: "Bernice's Hair", chinese: '后发座' },
  { iau: 'CrA', native: 'Corona Australis', english: 'Southern Crown', chinese: '南冕座' },
  { iau: 'CrB', native: 'Corona Borealis', english: 'Northern Crown', chinese: '北冕座' },
  { iau: 'Crv', native: 'Corvus', english: 'Crow', chinese: '乌鸦座' },
  { iau: 'Crt', native: 'Crater', english: 'Cup', chinese: '巨爵座' },
  { iau: 'Cru', native: 'Crux', english: 'Southern Cross', chinese: '南十字座' },
  { iau: 'Cyg', native: 'Cygnus', english: 'Swan', chinese: '天鹅座' },
  { iau: 'Del', native: 'Delphinus', english: 'Dolphin', chinese: '海豚座' },
  { iau: 'Dor', native: 'Dorado', english: 'Swordfish', chinese: '剑鱼座' },
  { iau: 'Dra', native: 'Draco', english: 'Dragon', chinese: '天龙座' },
  { iau: 'Equ', native: 'Equuleus', english: 'Little Horse', chinese: '小马座' },
  { iau: 'Eri', native: 'Eridanus', english: 'River', chinese: '波江座' },
  { iau: 'For', native: 'Fornax', english: 'Furnace', chinese: '天炉座' },
  { iau: 'Gem', native: 'Gemini', english: 'Twins', chinese: '双子座' },
  { iau: 'Gru', native: 'Grus', english: 'Crane', chinese: '天鹤座' },
  { iau: 'Her', native: 'Hercules', english: 'Hercules', chinese: '武仙座' },
  { iau: 'Hor', native: 'Horologium', english: 'Clock', chinese: '时钟座' },
  { iau: 'Hya', native: 'Hydra', english: 'Female Water Snake', chinese: '长蛇座' },
  { iau: 'Hyi', native: 'Hydrus', english: 'Male Water Snake', chinese: '水蛇座' },
  { iau: 'Ind', native: 'Indus', english: 'Indian', chinese: '印第安座' },
  { iau: 'Lac', native: 'Lacerta', english: 'Lizard', chinese: '蝎虎座' },
  { iau: 'Leo', native: 'Leo', english: 'Lion', chinese: '狮子座' },
  { iau: 'LMi', native: 'Leo Minor', english: 'Lesser Lion', chinese: '小狮座' },
  { iau: 'Lep', native: 'Lepus', english: 'Hare', chinese: '天兔座' },
  { iau: 'Lib', native: 'Libra', english: 'Scales', chinese: '天秤座' },
  { iau: 'Lup', native: 'Lupus', english: 'Wolf', chinese: '豺狼座' },
  { iau: 'Lyn', native: 'Lynx', english: 'Lynx', chinese: '天猫座' },
  { iau: 'Lyr', native: 'Lyra', english: 'Lyre', chinese: '天琴座' },
  { iau: 'Men', native: 'Mensa', english: 'Table Mountain', chinese: '山案座' },
  { iau: 'Mic', native: 'Microscopium', english: 'Microscope', chinese: '显微镜座' },
  { iau: 'Mon', native: 'Monoceros', english: 'Unicorn', chinese: '麒麟座' },
  { iau: 'Mus', native: 'Musca', english: 'Fly', chinese: '苍蝇座' },
  { iau: 'Nor', native: 'Norma', english: "Carpenter's Square", chinese: '矩尺座' },
  { iau: 'Oct', native: 'Octans', english: 'Octant', chinese: '南极座' },
  { iau: 'Oph', native: 'Ophiuchus', english: 'Serpent Bearer', chinese: '蛇夫座' },
  { iau: 'Ori', native: 'Orion', english: 'Hunter', chinese: '猎户座' },
  { iau: 'Pav', native: 'Pavo', english: 'Peacock', chinese: '孔雀座' },
  { iau: 'Peg', native: 'Pegasus', english: 'Winged Horse', chinese: '飞马座' },
  { iau: 'Per', native: 'Perseus', english: 'Hero', chinese: '英仙座' },
  { iau: 'Phe', native: 'Phoenix', english: 'Phoenix', chinese: '凤凰座' },
  { iau: 'Pic', native: 'Pictor', english: "Painter's Easel", chinese: '绘架座' },
  { iau: 'Psc', native: 'Pisces', english: 'Fishes', chinese: '双鱼座' },
  { iau: 'PsA', native: 'Piscis Austrinus', english: 'Southern Fish', chinese: '南鱼座' },
  { iau: 'Pup', native: 'Puppis', english: 'Stern', chinese: '船尾座' },
  { iau: 'Pyx', native: 'Pyxis', english: 'Compass', chinese: '罗盘座' },
  { iau: 'Ret', native: 'Reticulum', english: 'Reticle', chinese: '网罟座' },
  { iau: 'Sge', native: 'Sagitta', english: 'Arrow', chinese: '天箭座' },
  { iau: 'Sgr', native: 'Sagittarius', english: 'Archer', chinese: '人马座' },
  { iau: 'Sco', native: 'Scorpius', english: 'Scorpion', chinese: '天蝎座' },
  { iau: 'Scl', native: 'Sculptor', english: 'Sculptor', chinese: '玉夫座' },
  { iau: 'Sct', native: 'Scutum', english: 'Shield', chinese: '盾牌座' },
  { iau: 'Ser', native: 'Serpens', english: 'Serpent', chinese: '巨蛇座' },
  { iau: 'Sex', native: 'Sextans', english: 'Sextant', chinese: '六分仪座' },
  { iau: 'Tau', native: 'Taurus', english: 'Bull', chinese: '金牛座' },
  { iau: 'Tel', native: 'Telescopium', english: 'Telescope', chinese: '望远镜座' },
  { iau: 'Tri', native: 'Triangulum', english: 'Triangle', chinese: '三角座' },
  { iau: 'TrA', native: 'Triangulum Australe', english: 'Southern Triangle', chinese: '南三角座' },
  { iau: 'Tuc', native: 'Tucana', english: 'Toucan', chinese: '杜鹃座' },
  { iau: 'UMa', native: 'Ursa Major', english: 'Great Bear', chinese: '大熊座' },
  { iau: 'UMi', native: 'Ursa Minor', english: 'Little Bear', chinese: '小熊座' },
  { iau: 'Vel', native: 'Vela', english: 'Sails', chinese: '船帆座' },
  { iau: 'Vir', native: 'Virgo', english: 'Maiden', chinese: '室女座' },
  { iau: 'Vol', native: 'Volans', english: 'Flying Fish', chinese: '飞鱼座' },
  { iau: 'Vul', native: 'Vulpecula', english: 'Fox', chinese: '狐狸座' },
];

/**
 * Create lookup maps for efficient translation
 */
function createConstellationMaps() {
  const byIau = new Map<string, ConstellationTranslation>();
  const byNative = new Map<string, ConstellationTranslation>();
  const byEnglish = new Map<string, ConstellationTranslation>();

  for (const constellation of CONSTELLATION_TRANSLATIONS) {
    byIau.set(constellation.iau.toLowerCase(), constellation);
    byNative.set(constellation.native.toLowerCase(), constellation);
    byEnglish.set(constellation.english.toLowerCase(), constellation);
  }

  return { byIau, byNative, byEnglish };
}

const { byIau, byNative, byEnglish } = createConstellationMaps();

/**
 * Get constellation translation by any identifier
 */
export function getConstellationTranslation(
  identifier: string
): ConstellationTranslation | undefined {
  const lower = identifier.toLowerCase();
  return byIau.get(lower) || byNative.get(lower) || byEnglish.get(lower);
}

/**
 * Translate constellation name to specified language
 */
export function translateConstellationName(
  name: string,
  targetLang: 'zh' | 'en' | 'native'
): string {
  const translation = getConstellationTranslation(name);
  if (!translation) return name;

  switch (targetLang) {
    case 'zh':
      return translation.chinese;
    case 'en':
      return translation.english;
    case 'native':
      return translation.native;
    default:
      return name;
  }
}
