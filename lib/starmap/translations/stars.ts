/**
 * Star name translations
 * Maps common star names to localized names
 */

export interface StarTranslation {
  /** Common English name */
  english: string;
  /** Chinese name */
  chinese: string;
  /** Bayer designation (if applicable) */
  bayer?: string;
  /** HIP number (if known) */
  hip?: number;
}

/**
 * Common bright stars with Chinese translations
 * Based on traditional Chinese star names and modern translations
 */
export const STAR_TRANSLATIONS: StarTranslation[] = [
  // Brightest stars
  { english: 'Sirius', chinese: '天狼星', bayer: 'α CMa', hip: 32349 },
  { english: 'Canopus', chinese: '老人星', bayer: 'α Car', hip: 30438 },
  { english: 'Arcturus', chinese: '大角星', bayer: 'α Boo', hip: 69673 },
  { english: 'Vega', chinese: '织女星', bayer: 'α Lyr', hip: 91262 },
  { english: 'Capella', chinese: '五车二', bayer: 'α Aur', hip: 24608 },
  { english: 'Rigel', chinese: '参宿七', bayer: 'β Ori', hip: 24436 },
  { english: 'Procyon', chinese: '南河三', bayer: 'α CMi', hip: 37279 },
  { english: 'Betelgeuse', chinese: '参宿四', bayer: 'α Ori', hip: 27989 },
  { english: 'Achernar', chinese: '水委一', bayer: 'α Eri', hip: 7588 },
  { english: 'Hadar', chinese: '马腹一', bayer: 'β Cen', hip: 68702 },
  { english: 'Altair', chinese: '河鼓二', bayer: 'α Aql', hip: 97649 },
  { english: 'Acrux', chinese: '十字架二', bayer: 'α Cru', hip: 60718 },
  { english: 'Aldebaran', chinese: '毕宿五', bayer: 'α Tau', hip: 21421 },
  { english: 'Antares', chinese: '心宿二', bayer: 'α Sco', hip: 80763 },
  { english: 'Spica', chinese: '角宿一', bayer: 'α Vir', hip: 65474 },
  { english: 'Pollux', chinese: '北河三', bayer: 'β Gem', hip: 37826 },
  { english: 'Fomalhaut', chinese: '北落师门', bayer: 'α PsA', hip: 113368 },
  { english: 'Deneb', chinese: '天津四', bayer: 'α Cyg', hip: 102098 },
  { english: 'Regulus', chinese: '轩辕十四', bayer: 'α Leo', hip: 49669 },
  
  // Orion constellation stars
  { english: 'Bellatrix', chinese: '参宿五', bayer: 'γ Ori', hip: 25336 },
  { english: 'Alnilam', chinese: '参宿二', bayer: 'ε Ori', hip: 26311 },
  { english: 'Alnitak', chinese: '参宿一', bayer: 'ζ Ori', hip: 26727 },
  { english: 'Mintaka', chinese: '参宿三', bayer: 'δ Ori', hip: 25930 },
  { english: 'Saiph', chinese: '参宿六', bayer: 'κ Ori', hip: 27366 },
  
  // Ursa Major (Big Dipper) stars
  { english: 'Dubhe', chinese: '天枢', bayer: 'α UMa', hip: 54061 },
  { english: 'Merak', chinese: '天璇', bayer: 'β UMa', hip: 53910 },
  { english: 'Phecda', chinese: '天玑', bayer: 'γ UMa', hip: 58001 },
  { english: 'Megrez', chinese: '天权', bayer: 'δ UMa', hip: 59774 },
  { english: 'Alioth', chinese: '玉衡', bayer: 'ε UMa', hip: 62956 },
  { english: 'Mizar', chinese: '开阳', bayer: 'ζ UMa', hip: 65378 },
  { english: 'Alkaid', chinese: '摇光', bayer: 'η UMa', hip: 67301 },
  { english: 'Alcor', chinese: '辅', bayer: '80 UMa', hip: 65477 },
  
  // Ursa Minor stars
  { english: 'Polaris', chinese: '北极星', bayer: 'α UMi', hip: 11767 },
  { english: 'Kochab', chinese: '北极二', bayer: 'β UMi', hip: 72607 },
  { english: 'Pherkad', chinese: '北极三', bayer: 'γ UMi', hip: 75097 },
  
  // Cassiopeia stars
  { english: 'Schedar', chinese: '王良四', bayer: 'α Cas', hip: 3179 },
  { english: 'Caph', chinese: '王良一', bayer: 'β Cas', hip: 746 },
  { english: 'Ruchbah', chinese: '阁道三', bayer: 'δ Cas', hip: 6686 },
  
  // Cygnus stars
  { english: 'Sadr', chinese: '天津一', bayer: 'γ Cyg', hip: 100453 },
  { english: 'Albireo', chinese: '辇道增七', bayer: 'β Cyg', hip: 95947 },
  
  // Leo stars
  { english: 'Denebola', chinese: '五帝座一', bayer: 'β Leo', hip: 57632 },
  { english: 'Algieba', chinese: '轩辕十二', bayer: 'γ Leo', hip: 50583 },
  
  // Scorpius stars
  { english: 'Shaula', chinese: '尾宿八', bayer: 'λ Sco', hip: 85927 },
  { english: 'Sargas', chinese: '尾宿五', bayer: 'θ Sco', hip: 86228 },
  
  // Gemini stars
  { english: 'Castor', chinese: '北河二', bayer: 'α Gem', hip: 36850 },
  
  // Taurus stars
  { english: 'Elnath', chinese: '五车五', bayer: 'β Tau', hip: 25428 },
  { english: 'Alcyone', chinese: '昴宿六', bayer: 'η Tau', hip: 17702 },
  
  // Virgo stars
  { english: 'Vindemiatrix', chinese: '东次将', bayer: 'ε Vir', hip: 63608 },
  
  // Centaurus stars
  { english: 'Rigil Kentaurus', chinese: '南门二', bayer: 'α Cen', hip: 71683 },
  { english: 'Alpha Centauri', chinese: '南门二', bayer: 'α Cen', hip: 71683 },
  { english: 'Proxima Centauri', chinese: '比邻星', hip: 70890 },
  
  // Canis Major stars
  { english: 'Mirzam', chinese: '军市一', bayer: 'β CMa', hip: 30324 },
  { english: 'Wezen', chinese: '弧矢七', bayer: 'δ CMa', hip: 34444 },
  { english: 'Adhara', chinese: '弧矢一', bayer: 'ε CMa', hip: 33579 },
  
  // Aquila stars
  { english: 'Tarazed', chinese: '河鼓三', bayer: 'γ Aql', hip: 97278 },
  { english: 'Alshain', chinese: '河鼓一', bayer: 'β Aql', hip: 98036 },
  
  // Perseus stars
  { english: 'Mirfak', chinese: '天船三', bayer: 'α Per', hip: 15863 },
  { english: 'Algol', chinese: '大陵五', bayer: 'β Per', hip: 14576 },
  
  // Pegasus stars
  { english: 'Markab', chinese: '室宿一', bayer: 'α Peg', hip: 113963 },
  { english: 'Scheat', chinese: '室宿二', bayer: 'β Peg', hip: 113881 },
  { english: 'Algenib', chinese: '壁宿一', bayer: 'γ Peg', hip: 1067 },
  { english: 'Enif', chinese: '危宿三', bayer: 'ε Peg', hip: 107315 },
  
  // Andromeda stars
  { english: 'Alpheratz', chinese: '壁宿二', bayer: 'α And', hip: 677 },
  { english: 'Mirach', chinese: '奎宿九', bayer: 'β And', hip: 5447 },
  { english: 'Almach', chinese: '天大将军一', bayer: 'γ And', hip: 9640 },
  
  // Boötes stars
  { english: 'Izar', chinese: '梗河一', bayer: 'ε Boo', hip: 72105 },
  { english: 'Nekkar', chinese: '招摇', bayer: 'β Boo', hip: 67927 },
  
  // Auriga stars
  { english: 'Menkalinan', chinese: '五车三', bayer: 'β Aur', hip: 28360 },
  
  // Sagittarius stars
  { english: 'Kaus Australis', chinese: '箕宿三', bayer: 'ε Sgr', hip: 90185 },
  { english: 'Nunki', chinese: '斗宿四', bayer: 'σ Sgr', hip: 92855 },
  
  // Lyra stars
  { english: 'Sheliak', chinese: '渐台二', bayer: 'β Lyr', hip: 92420 },
  { english: 'Sulafat', chinese: '渐台三', bayer: 'γ Lyr', hip: 93194 },
  
  // Aries stars
  { english: 'Hamal', chinese: '娄宿三', bayer: 'α Ari', hip: 9884 },
  { english: 'Sheratan', chinese: '娄宿一', bayer: 'β Ari', hip: 8903 },
  
  // Aquarius stars
  { english: 'Sadalmelik', chinese: '危宿一', bayer: 'α Aqr', hip: 109074 },
  { english: 'Sadalsuud', chinese: '虚宿一', bayer: 'β Aqr', hip: 106278 },
  
  // Pisces stars
  { english: 'Alrescha', chinese: '外屏七', bayer: 'α Psc', hip: 7097 },
  
  // Capricornus stars
  { english: 'Deneb Algedi', chinese: '垒壁阵四', bayer: 'δ Cap', hip: 107556 },
  
  // Libra stars
  { english: 'Zubenelgenubi', chinese: '氐宿一', bayer: 'α Lib', hip: 72622 },
  { english: 'Zubeneschamali', chinese: '氐宿四', bayer: 'β Lib', hip: 74785 },
  
  // Cancer stars
  { english: 'Acubens', chinese: '柳宿增三', bayer: 'α Cnc', hip: 44066 },
  
  // Draco stars
  { english: 'Eltanin', chinese: '天棓四', bayer: 'γ Dra', hip: 87833 },
  { english: 'Rastaban', chinese: '天棓三', bayer: 'β Dra', hip: 85670 },
  { english: 'Thuban', chinese: '右枢', bayer: 'α Dra', hip: 68756 },
  
  // Cepheus stars
  { english: 'Alderamin', chinese: '天钩五', bayer: 'α Cep', hip: 105199 },
  { english: 'Errai', chinese: '少卫增八', bayer: 'γ Cep', hip: 116727 },
  
  // Ophiuchus stars
  { english: 'Rasalhague', chinese: '候', bayer: 'α Oph', hip: 86032 },
  { english: 'Sabik', chinese: '宗正一', bayer: 'η Oph', hip: 84012 },
  
  // Hercules stars
  { english: 'Rasalgethi', chinese: '帝座', bayer: 'α Her', hip: 84345 },
  { english: 'Kornephoros', chinese: '天纪二', bayer: 'β Her', hip: 80816 },
  
  // Eridanus stars
  { english: 'Cursa', chinese: '玉井三', bayer: 'β Eri', hip: 23875 },
  { english: 'Zaurak', chinese: '天苑一', bayer: 'γ Eri', hip: 18543 },
  
  // Carina stars
  { english: 'Miaplacidus', chinese: '南船五', bayer: 'β Car', hip: 45238 },
  { english: 'Avior', chinese: '南船三', bayer: 'ε Car', hip: 41037 },
  
  // Puppis stars
  { english: 'Naos', chinese: '弧矢增二十二', bayer: 'ζ Pup', hip: 39429 },
  
  // Vela stars
  { english: 'Suhail', chinese: '天社一', bayer: 'λ Vel', hip: 44816 },
  
  // Crux stars
  { english: 'Mimosa', chinese: '十字架三', bayer: 'β Cru', hip: 62434 },
  { english: 'Gacrux', chinese: '十字架一', bayer: 'γ Cru', hip: 61084 },
  
  // Corona Borealis stars
  { english: 'Alphecca', chinese: '贯索四', bayer: 'α CrB', hip: 76267 },
  
  // Serpens stars
  { english: 'Unukalhai', chinese: '天市右垣七', bayer: 'α Ser', hip: 77070 },
  
  // Triangulum stars
  { english: 'Mothallah', chinese: '天大将军六', bayer: 'α Tri', hip: 8796 },
  
  // Pavo stars
  { english: 'Peacock', chinese: '孔雀十一', bayer: 'α Pav', hip: 100751 },
  
  // Phoenix stars
  { english: 'Ankaa', chinese: '火鸟六', bayer: 'α Phe', hip: 2081 },
  
  // Grus stars
  { english: 'Alnair', chinese: '鹤一', bayer: 'α Gru', hip: 109268 },
  
  // Planets
  { english: 'Sun', chinese: '太阳' },
  { english: 'Moon', chinese: '月球' },
  { english: 'Mercury', chinese: '水星' },
  { english: 'Venus', chinese: '金星' },
  { english: 'Mars', chinese: '火星' },
  { english: 'Jupiter', chinese: '木星' },
  { english: 'Saturn', chinese: '土星' },
  { english: 'Uranus', chinese: '天王星' },
  { english: 'Neptune', chinese: '海王星' },
  { english: 'Pluto', chinese: '冥王星' },
  
  // Jupiter moons
  { english: 'Io', chinese: '木卫一' },
  { english: 'Europa', chinese: '木卫二' },
  { english: 'Ganymede', chinese: '木卫三' },
  { english: 'Callisto', chinese: '木卫四' },
  
  // Saturn moons
  { english: 'Titan', chinese: '土卫六' },
  { english: 'Enceladus', chinese: '土卫二' },
];

/**
 * Create lookup map for efficient translation
 */
function createStarMap() {
  const byEnglish = new Map<string, StarTranslation>();
  const byHip = new Map<number, StarTranslation>();

  for (const star of STAR_TRANSLATIONS) {
    byEnglish.set(star.english.toLowerCase(), star);
    if (star.hip) {
      byHip.set(star.hip, star);
    }
  }

  return { byEnglish, byHip };
}

const { byEnglish, byHip } = createStarMap();

/**
 * Get star translation by name or HIP number
 */
export function getStarTranslation(
  identifier: string | number
): StarTranslation | undefined {
  if (typeof identifier === 'number') {
    return byHip.get(identifier);
  }
  return byEnglish.get(identifier.toLowerCase());
}

/**
 * Translate star name to Chinese
 */
export function translateStarName(name: string, targetLang: 'zh' | 'en'): string {
  const translation = getStarTranslation(name);
  if (!translation) return name;

  return targetLang === 'zh' ? translation.chinese : translation.english;
}
