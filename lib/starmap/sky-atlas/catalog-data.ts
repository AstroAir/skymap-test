/**
 * Deep Sky Object Catalog Data
 * Contains Messier, NGC, IC, and Caldwell objects
 */

import type { DeepSkyObject, DSOType } from './types';

// ============================================================================
// Messier Catalog (Complete 110 objects)
// ============================================================================

const MESSIER_OBJECTS: DeepSkyObject[] = [
  { id: 'M1', name: 'M1 - Crab Nebula', type: 'SupernovaRemnant', constellation: 'Tau', ra: 83.6287, dec: 22.0145, magnitude: 8.4, sizeMax: 6, sizeMin: 4, alternateNames: ['NGC 1952'] },
  { id: 'M2', name: 'M2', type: 'GlobularCluster', constellation: 'Aqr', ra: 323.3626, dec: -0.8232, magnitude: 6.3, sizeMax: 16, alternateNames: ['NGC 7089'] },
  { id: 'M3', name: 'M3', type: 'GlobularCluster', constellation: 'CVn', ra: 205.5484, dec: 28.3773, magnitude: 6.2, sizeMax: 18, alternateNames: ['NGC 5272'] },
  { id: 'M4', name: 'M4', type: 'GlobularCluster', constellation: 'Sco', ra: 245.8967, dec: -26.5256, magnitude: 5.6, sizeMax: 36, alternateNames: ['NGC 6121'] },
  { id: 'M5', name: 'M5', type: 'GlobularCluster', constellation: 'Ser', ra: 229.6385, dec: 2.0810, magnitude: 5.6, sizeMax: 23, alternateNames: ['NGC 5904'] },
  { id: 'M6', name: 'M6 - Butterfly Cluster', type: 'OpenCluster', constellation: 'Sco', ra: 265.0833, dec: -32.2167, magnitude: 4.2, sizeMax: 20, alternateNames: ['NGC 6405'] },
  { id: 'M7', name: 'M7 - Ptolemy Cluster', type: 'OpenCluster', constellation: 'Sco', ra: 268.4667, dec: -34.7833, magnitude: 3.3, sizeMax: 80, alternateNames: ['NGC 6475'] },
  { id: 'M8', name: 'M8 - Lagoon Nebula', type: 'EmissionNebula', constellation: 'Sgr', ra: 270.9208, dec: -24.3833, magnitude: 5.0, sizeMax: 90, sizeMin: 40, alternateNames: ['NGC 6523'] },
  { id: 'M9', name: 'M9', type: 'GlobularCluster', constellation: 'Oph', ra: 259.7981, dec: -18.5161, magnitude: 7.7, sizeMax: 12, alternateNames: ['NGC 6333'] },
  { id: 'M10', name: 'M10', type: 'GlobularCluster', constellation: 'Oph', ra: 254.2877, dec: -4.0994, magnitude: 6.6, sizeMax: 20, alternateNames: ['NGC 6254'] },
  { id: 'M11', name: 'M11 - Wild Duck Cluster', type: 'OpenCluster', constellation: 'Sct', ra: 282.7667, dec: -6.2667, magnitude: 5.8, sizeMax: 14, alternateNames: ['NGC 6705'] },
  { id: 'M12', name: 'M12', type: 'GlobularCluster', constellation: 'Oph', ra: 251.8092, dec: -1.9478, magnitude: 6.7, sizeMax: 16, alternateNames: ['NGC 6218'] },
  { id: 'M13', name: 'M13 - Great Hercules Cluster', type: 'GlobularCluster', constellation: 'Her', ra: 250.4218, dec: 36.4617, magnitude: 5.8, sizeMax: 20, alternateNames: ['NGC 6205'] },
  { id: 'M14', name: 'M14', type: 'GlobularCluster', constellation: 'Oph', ra: 264.4004, dec: -3.2458, magnitude: 7.6, sizeMax: 11, alternateNames: ['NGC 6402'] },
  { id: 'M15', name: 'M15', type: 'GlobularCluster', constellation: 'Peg', ra: 322.4930, dec: 12.1670, magnitude: 6.2, sizeMax: 18, alternateNames: ['NGC 7078'] },
  { id: 'M16', name: 'M16 - Eagle Nebula', type: 'EmissionNebula', constellation: 'Ser', ra: 274.7000, dec: -13.8167, magnitude: 6.0, sizeMax: 35, alternateNames: ['NGC 6611'] },
  { id: 'M17', name: 'M17 - Omega Nebula', type: 'EmissionNebula', constellation: 'Sgr', ra: 275.1958, dec: -16.1833, magnitude: 6.0, sizeMax: 46, sizeMin: 37, alternateNames: ['NGC 6618', 'Swan Nebula'] },
  { id: 'M18', name: 'M18', type: 'OpenCluster', constellation: 'Sgr', ra: 274.9000, dec: -17.1333, magnitude: 6.9, sizeMax: 9, alternateNames: ['NGC 6613'] },
  { id: 'M19', name: 'M19', type: 'GlobularCluster', constellation: 'Oph', ra: 255.6571, dec: -26.2681, magnitude: 6.8, sizeMax: 17, alternateNames: ['NGC 6273'] },
  { id: 'M20', name: 'M20 - Trifid Nebula', type: 'EmissionNebula', constellation: 'Sgr', ra: 270.6208, dec: -23.0333, magnitude: 6.3, sizeMax: 28, alternateNames: ['NGC 6514'] },
  { id: 'M21', name: 'M21', type: 'OpenCluster', constellation: 'Sgr', ra: 270.9833, dec: -22.5000, magnitude: 5.9, sizeMax: 13, alternateNames: ['NGC 6531'] },
  { id: 'M22', name: 'M22', type: 'GlobularCluster', constellation: 'Sgr', ra: 279.0996, dec: -23.9047, magnitude: 5.1, sizeMax: 32, alternateNames: ['NGC 6656'] },
  { id: 'M23', name: 'M23', type: 'OpenCluster', constellation: 'Sgr', ra: 269.2667, dec: -18.9833, magnitude: 5.5, sizeMax: 27, alternateNames: ['NGC 6494'] },
  { id: 'M24', name: 'M24 - Sagittarius Star Cloud', type: 'StarCluster', constellation: 'Sgr', ra: 274.5000, dec: -18.4833, magnitude: 4.6, sizeMax: 90, alternateNames: ['IC 4715'] },
  { id: 'M25', name: 'M25', type: 'OpenCluster', constellation: 'Sgr', ra: 277.8667, dec: -19.2500, magnitude: 4.6, sizeMax: 32, alternateNames: ['IC 4725'] },
  { id: 'M26', name: 'M26', type: 'OpenCluster', constellation: 'Sct', ra: 281.3167, dec: -9.3833, magnitude: 8.0, sizeMax: 15, alternateNames: ['NGC 6694'] },
  { id: 'M27', name: 'M27 - Dumbbell Nebula', type: 'PlanetaryNebula', constellation: 'Vul', ra: 299.9017, dec: 22.7211, magnitude: 7.4, sizeMax: 8, sizeMin: 5.7, alternateNames: ['NGC 6853'] },
  { id: 'M28', name: 'M28', type: 'GlobularCluster', constellation: 'Sgr', ra: 276.1369, dec: -24.8697, magnitude: 6.8, sizeMax: 11, alternateNames: ['NGC 6626'] },
  { id: 'M29', name: 'M29', type: 'OpenCluster', constellation: 'Cyg', ra: 305.9917, dec: 38.5167, magnitude: 6.6, sizeMax: 7, alternateNames: ['NGC 6913'] },
  { id: 'M30', name: 'M30', type: 'GlobularCluster', constellation: 'Cap', ra: 325.0921, dec: -23.1797, magnitude: 7.2, sizeMax: 12, alternateNames: ['NGC 7099'] },
  { id: 'M31', name: 'M31 - Andromeda Galaxy', type: 'Galaxy', constellation: 'And', ra: 10.6847, dec: 41.2689, magnitude: 3.4, sizeMax: 190, sizeMin: 60, alternateNames: ['NGC 224'] },
  { id: 'M32', name: 'M32', type: 'Galaxy', constellation: 'And', ra: 10.6743, dec: 40.8658, magnitude: 8.1, sizeMax: 8, sizeMin: 6, alternateNames: ['NGC 221'] },
  { id: 'M33', name: 'M33 - Triangulum Galaxy', type: 'Galaxy', constellation: 'Tri', ra: 23.4621, dec: 30.6602, magnitude: 5.7, sizeMax: 73, sizeMin: 45, alternateNames: ['NGC 598'] },
  { id: 'M34', name: 'M34', type: 'OpenCluster', constellation: 'Per', ra: 40.5167, dec: 42.7667, magnitude: 5.2, sizeMax: 35, alternateNames: ['NGC 1039'] },
  { id: 'M35', name: 'M35', type: 'OpenCluster', constellation: 'Gem', ra: 92.2500, dec: 24.3333, magnitude: 5.1, sizeMax: 28, alternateNames: ['NGC 2168'] },
  { id: 'M36', name: 'M36', type: 'OpenCluster', constellation: 'Aur', ra: 84.0833, dec: 34.1333, magnitude: 6.0, sizeMax: 12, alternateNames: ['NGC 1960'] },
  { id: 'M37', name: 'M37', type: 'OpenCluster', constellation: 'Aur', ra: 88.0750, dec: 32.5500, magnitude: 5.6, sizeMax: 24, alternateNames: ['NGC 2099'] },
  { id: 'M38', name: 'M38', type: 'OpenCluster', constellation: 'Aur', ra: 82.1667, dec: 35.8333, magnitude: 6.4, sizeMax: 21, alternateNames: ['NGC 1912'] },
  { id: 'M39', name: 'M39', type: 'OpenCluster', constellation: 'Cyg', ra: 322.9167, dec: 48.4333, magnitude: 4.6, sizeMax: 32, alternateNames: ['NGC 7092'] },
  { id: 'M40', name: 'M40 - Winnecke 4', type: 'DoubleStar', constellation: 'UMa', ra: 185.5500, dec: 58.0833, magnitude: 8.4, sizeMax: 0.8, alternateNames: ['WNC 4'] },
  { id: 'M41', name: 'M41', type: 'OpenCluster', constellation: 'CMa', ra: 101.5000, dec: -20.7333, magnitude: 4.5, sizeMax: 38, alternateNames: ['NGC 2287'] },
  { id: 'M42', name: 'M42 - Orion Nebula', type: 'EmissionNebula', constellation: 'Ori', ra: 83.8221, dec: -5.3911, magnitude: 4.0, sizeMax: 85, sizeMin: 60, alternateNames: ['NGC 1976'] },
  { id: 'M43', name: 'M43 - De Mairan\'s Nebula', type: 'EmissionNebula', constellation: 'Ori', ra: 83.8875, dec: -5.2667, magnitude: 9.0, sizeMax: 20, alternateNames: ['NGC 1982'] },
  { id: 'M44', name: 'M44 - Beehive Cluster', type: 'OpenCluster', constellation: 'Cnc', ra: 130.0333, dec: 19.6667, magnitude: 3.1, sizeMax: 95, alternateNames: ['NGC 2632', 'Praesepe'] },
  { id: 'M45', name: 'M45 - Pleiades', type: 'OpenCluster', constellation: 'Tau', ra: 56.6000, dec: 24.1167, magnitude: 1.6, sizeMax: 110, alternateNames: ['Seven Sisters'] },
  { id: 'M46', name: 'M46', type: 'OpenCluster', constellation: 'Pup', ra: 115.4333, dec: -14.8167, magnitude: 6.1, sizeMax: 27, alternateNames: ['NGC 2437'] },
  { id: 'M47', name: 'M47', type: 'OpenCluster', constellation: 'Pup', ra: 114.1500, dec: -14.4833, magnitude: 4.4, sizeMax: 30, alternateNames: ['NGC 2422'] },
  { id: 'M48', name: 'M48', type: 'OpenCluster', constellation: 'Hya', ra: 123.4333, dec: -5.8000, magnitude: 5.8, sizeMax: 54, alternateNames: ['NGC 2548'] },
  { id: 'M49', name: 'M49', type: 'Galaxy', constellation: 'Vir', ra: 187.4449, dec: 8.0003, magnitude: 8.4, sizeMax: 10, sizeMin: 8, alternateNames: ['NGC 4472'] },
  { id: 'M50', name: 'M50', type: 'OpenCluster', constellation: 'Mon', ra: 105.6833, dec: -8.3500, magnitude: 5.9, sizeMax: 16, alternateNames: ['NGC 2323'] },
  { id: 'M51', name: 'M51 - Whirlpool Galaxy', type: 'Galaxy', constellation: 'CVn', ra: 202.4696, dec: 47.1952, magnitude: 8.4, sizeMax: 11, sizeMin: 7, alternateNames: ['NGC 5194'] },
  { id: 'M52', name: 'M52', type: 'OpenCluster', constellation: 'Cas', ra: 351.2000, dec: 61.5833, magnitude: 6.9, sizeMax: 13, alternateNames: ['NGC 7654'] },
  { id: 'M53', name: 'M53', type: 'GlobularCluster', constellation: 'Com', ra: 198.2303, dec: 18.1681, magnitude: 7.6, sizeMax: 13, alternateNames: ['NGC 5024'] },
  { id: 'M54', name: 'M54', type: 'GlobularCluster', constellation: 'Sgr', ra: 283.7637, dec: -30.4783, magnitude: 7.6, sizeMax: 12, alternateNames: ['NGC 6715'] },
  { id: 'M55', name: 'M55', type: 'GlobularCluster', constellation: 'Sgr', ra: 294.9988, dec: -30.9647, magnitude: 6.3, sizeMax: 19, alternateNames: ['NGC 6809'] },
  { id: 'M56', name: 'M56', type: 'GlobularCluster', constellation: 'Lyr', ra: 289.1479, dec: 30.1833, magnitude: 8.3, sizeMax: 8.8, alternateNames: ['NGC 6779'] },
  { id: 'M57', name: 'M57 - Ring Nebula', type: 'PlanetaryNebula', constellation: 'Lyr', ra: 283.3962, dec: 33.0286, magnitude: 8.8, sizeMax: 1.4, sizeMin: 1.0, alternateNames: ['NGC 6720'] },
  { id: 'M58', name: 'M58', type: 'Galaxy', constellation: 'Vir', ra: 189.9973, dec: 11.8203, magnitude: 9.7, sizeMax: 5.9, sizeMin: 4.7, alternateNames: ['NGC 4579'] },
  { id: 'M59', name: 'M59', type: 'Galaxy', constellation: 'Vir', ra: 190.5092, dec: 11.6467, magnitude: 9.6, sizeMax: 5.4, sizeMin: 3.7, alternateNames: ['NGC 4621'] },
  { id: 'M60', name: 'M60', type: 'Galaxy', constellation: 'Vir', ra: 190.9166, dec: 11.5525, magnitude: 8.8, sizeMax: 7.4, sizeMin: 6.0, alternateNames: ['NGC 4649'] },
  { id: 'M61', name: 'M61', type: 'Galaxy', constellation: 'Vir', ra: 185.4787, dec: 4.4736, magnitude: 9.7, sizeMax: 6.5, sizeMin: 5.8, alternateNames: ['NGC 4303'] },
  { id: 'M62', name: 'M62', type: 'GlobularCluster', constellation: 'Oph', ra: 255.3033, dec: -30.1136, magnitude: 6.5, sizeMax: 15, alternateNames: ['NGC 6266'] },
  { id: 'M63', name: 'M63 - Sunflower Galaxy', type: 'Galaxy', constellation: 'CVn', ra: 198.9554, dec: 42.0294, magnitude: 8.6, sizeMax: 12.6, sizeMin: 7.2, alternateNames: ['NGC 5055'] },
  { id: 'M64', name: 'M64 - Black Eye Galaxy', type: 'Galaxy', constellation: 'Com', ra: 194.1826, dec: 21.6817, magnitude: 8.5, sizeMax: 10.3, sizeMin: 5.4, alternateNames: ['NGC 4826'] },
  { id: 'M65', name: 'M65', type: 'Galaxy', constellation: 'Leo', ra: 169.7330, dec: 13.0922, magnitude: 9.3, sizeMax: 10, sizeMin: 3.3, alternateNames: ['NGC 3623'] },
  { id: 'M66', name: 'M66', type: 'Galaxy', constellation: 'Leo', ra: 170.0629, dec: 12.9914, magnitude: 8.9, sizeMax: 9.1, sizeMin: 4.2, alternateNames: ['NGC 3627'] },
  { id: 'M67', name: 'M67', type: 'OpenCluster', constellation: 'Cnc', ra: 132.8250, dec: 11.8000, magnitude: 6.9, sizeMax: 30, alternateNames: ['NGC 2682'] },
  { id: 'M68', name: 'M68', type: 'GlobularCluster', constellation: 'Hya', ra: 189.8667, dec: -26.7444, magnitude: 7.8, sizeMax: 11, alternateNames: ['NGC 4590'] },
  { id: 'M69', name: 'M69', type: 'GlobularCluster', constellation: 'Sgr', ra: 279.0983, dec: -32.3481, magnitude: 7.6, sizeMax: 9.8, alternateNames: ['NGC 6637'] },
  { id: 'M70', name: 'M70', type: 'GlobularCluster', constellation: 'Sgr', ra: 281.2754, dec: -32.2908, magnitude: 7.9, sizeMax: 8, alternateNames: ['NGC 6681'] },
  { id: 'M71', name: 'M71', type: 'GlobularCluster', constellation: 'Sge', ra: 298.4438, dec: 18.7792, magnitude: 8.2, sizeMax: 7.2, alternateNames: ['NGC 6838'] },
  { id: 'M72', name: 'M72', type: 'GlobularCluster', constellation: 'Aqr', ra: 313.3646, dec: -12.5372, magnitude: 9.3, sizeMax: 6.6, alternateNames: ['NGC 6981'] },
  { id: 'M73', name: 'M73', type: 'Asterism', constellation: 'Aqr', ra: 314.7500, dec: -12.6333, magnitude: 9.0, sizeMax: 2.8, alternateNames: ['NGC 6994'] },
  { id: 'M74', name: 'M74', type: 'Galaxy', constellation: 'Psc', ra: 24.1740, dec: 15.7833, magnitude: 9.4, sizeMax: 10.5, sizeMin: 9.5, alternateNames: ['NGC 628'] },
  { id: 'M75', name: 'M75', type: 'GlobularCluster', constellation: 'Sgr', ra: 301.5200, dec: -21.9211, magnitude: 8.5, sizeMax: 6.8, alternateNames: ['NGC 6864'] },
  { id: 'M76', name: 'M76 - Little Dumbbell', type: 'PlanetaryNebula', constellation: 'Per', ra: 25.5817, dec: 51.5747, magnitude: 10.1, sizeMax: 2.7, sizeMin: 1.8, alternateNames: ['NGC 650', 'NGC 651'] },
  { id: 'M77', name: 'M77', type: 'Galaxy', constellation: 'Cet', ra: 40.6696, dec: -0.0133, magnitude: 8.9, sizeMax: 7.3, sizeMin: 6.3, alternateNames: ['NGC 1068'] },
  { id: 'M78', name: 'M78', type: 'ReflectionNebula', constellation: 'Ori', ra: 86.6833, dec: 0.0833, magnitude: 8.3, sizeMax: 8, sizeMin: 6, alternateNames: ['NGC 2068'] },
  { id: 'M79', name: 'M79', type: 'GlobularCluster', constellation: 'Lep', ra: 81.0463, dec: -24.5247, magnitude: 7.7, sizeMax: 9.6, alternateNames: ['NGC 1904'] },
  { id: 'M80', name: 'M80', type: 'GlobularCluster', constellation: 'Sco', ra: 244.2600, dec: -22.9758, magnitude: 7.3, sizeMax: 10, alternateNames: ['NGC 6093'] },
  { id: 'M81', name: 'M81 - Bode\'s Galaxy', type: 'Galaxy', constellation: 'UMa', ra: 148.8882, dec: 69.0653, magnitude: 6.9, sizeMax: 26.9, sizeMin: 14.1, alternateNames: ['NGC 3031'] },
  { id: 'M82', name: 'M82 - Cigar Galaxy', type: 'Galaxy', constellation: 'UMa', ra: 148.9685, dec: 69.6797, magnitude: 8.4, sizeMax: 11.2, sizeMin: 4.3, alternateNames: ['NGC 3034'] },
  { id: 'M83', name: 'M83 - Southern Pinwheel', type: 'Galaxy', constellation: 'Hya', ra: 204.2538, dec: -29.8657, magnitude: 7.5, sizeMax: 12.9, sizeMin: 11.5, alternateNames: ['NGC 5236'] },
  { id: 'M84', name: 'M84', type: 'Galaxy', constellation: 'Vir', ra: 186.2655, dec: 12.8869, magnitude: 9.1, sizeMax: 6.5, sizeMin: 5.6, alternateNames: ['NGC 4374'] },
  { id: 'M85', name: 'M85', type: 'Galaxy', constellation: 'Com', ra: 186.3499, dec: 18.1914, magnitude: 9.1, sizeMax: 7.3, sizeMin: 5.5, alternateNames: ['NGC 4382'] },
  { id: 'M86', name: 'M86', type: 'Galaxy', constellation: 'Vir', ra: 186.5489, dec: 12.9461, magnitude: 8.9, sizeMax: 9.8, sizeMin: 6.3, alternateNames: ['NGC 4406'] },
  { id: 'M87', name: 'M87 - Virgo A', type: 'Galaxy', constellation: 'Vir', ra: 187.7059, dec: 12.3911, magnitude: 8.6, sizeMax: 8.3, sizeMin: 6.6, alternateNames: ['NGC 4486'] },
  { id: 'M88', name: 'M88', type: 'Galaxy', constellation: 'Com', ra: 188.9963, dec: 14.4203, magnitude: 9.6, sizeMax: 6.9, sizeMin: 3.7, alternateNames: ['NGC 4501'] },
  { id: 'M89', name: 'M89', type: 'Galaxy', constellation: 'Vir', ra: 188.9159, dec: 12.5564, magnitude: 9.8, sizeMax: 5.1, sizeMin: 4.7, alternateNames: ['NGC 4552'] },
  { id: 'M90', name: 'M90', type: 'Galaxy', constellation: 'Vir', ra: 189.2095, dec: 13.1628, magnitude: 9.5, sizeMax: 9.5, sizeMin: 4.4, alternateNames: ['NGC 4569'] },
  { id: 'M91', name: 'M91', type: 'Galaxy', constellation: 'Com', ra: 188.8642, dec: 14.4961, magnitude: 10.2, sizeMax: 5.4, sizeMin: 4.3, alternateNames: ['NGC 4548'] },
  { id: 'M92', name: 'M92', type: 'GlobularCluster', constellation: 'Her', ra: 259.2807, dec: 43.1364, magnitude: 6.4, sizeMax: 14, alternateNames: ['NGC 6341'] },
  { id: 'M93', name: 'M93', type: 'OpenCluster', constellation: 'Pup', ra: 116.1333, dec: -23.8500, magnitude: 6.2, sizeMax: 22, alternateNames: ['NGC 2447'] },
  { id: 'M94', name: 'M94', type: 'Galaxy', constellation: 'CVn', ra: 192.7215, dec: 41.1203, magnitude: 8.2, sizeMax: 14.4, sizeMin: 12.1, alternateNames: ['NGC 4736'] },
  { id: 'M95', name: 'M95', type: 'Galaxy', constellation: 'Leo', ra: 160.9898, dec: 11.7039, magnitude: 9.7, sizeMax: 7.4, sizeMin: 5, alternateNames: ['NGC 3351'] },
  { id: 'M96', name: 'M96', type: 'Galaxy', constellation: 'Leo', ra: 161.6905, dec: 11.8194, magnitude: 9.2, sizeMax: 7.6, sizeMin: 5.2, alternateNames: ['NGC 3368'] },
  { id: 'M97', name: 'M97 - Owl Nebula', type: 'PlanetaryNebula', constellation: 'UMa', ra: 168.6987, dec: 55.0192, magnitude: 9.9, sizeMax: 3.4, sizeMin: 3.3, alternateNames: ['NGC 3587'] },
  { id: 'M98', name: 'M98', type: 'Galaxy', constellation: 'Com', ra: 183.4514, dec: 14.9003, magnitude: 10.1, sizeMax: 9.8, sizeMin: 2.8, alternateNames: ['NGC 4192'] },
  { id: 'M99', name: 'M99', type: 'Galaxy', constellation: 'Com', ra: 184.7068, dec: 14.4167, magnitude: 9.9, sizeMax: 5.4, sizeMin: 4.7, alternateNames: ['NGC 4254'] },
  { id: 'M100', name: 'M100', type: 'Galaxy', constellation: 'Com', ra: 185.7289, dec: 15.8222, magnitude: 9.3, sizeMax: 7.4, sizeMin: 6.3, alternateNames: ['NGC 4321'] },
  { id: 'M101', name: 'M101 - Pinwheel Galaxy', type: 'Galaxy', constellation: 'UMa', ra: 210.8024, dec: 54.3489, magnitude: 7.9, sizeMax: 28.8, sizeMin: 26.9, alternateNames: ['NGC 5457'] },
  { id: 'M102', name: 'M102 - Spindle Galaxy', type: 'Galaxy', constellation: 'Dra', ra: 226.6232, dec: 55.7636, magnitude: 9.9, sizeMax: 6.5, sizeMin: 3.1, alternateNames: ['NGC 5866'] },
  { id: 'M103', name: 'M103', type: 'OpenCluster', constellation: 'Cas', ra: 23.3333, dec: 60.6500, magnitude: 7.4, sizeMax: 6, alternateNames: ['NGC 581'] },
  { id: 'M104', name: 'M104 - Sombrero Galaxy', type: 'Galaxy', constellation: 'Vir', ra: 189.9977, dec: -11.6230, magnitude: 8.0, sizeMax: 8.9, sizeMin: 4, alternateNames: ['NGC 4594'] },
  { id: 'M105', name: 'M105', type: 'Galaxy', constellation: 'Leo', ra: 161.9564, dec: 12.5819, magnitude: 9.3, sizeMax: 5.4, sizeMin: 4.8, alternateNames: ['NGC 3379'] },
  { id: 'M106', name: 'M106', type: 'Galaxy', constellation: 'CVn', ra: 184.7397, dec: 47.3039, magnitude: 8.4, sizeMax: 18.6, sizeMin: 7.2, alternateNames: ['NGC 4258'] },
  { id: 'M107', name: 'M107', type: 'GlobularCluster', constellation: 'Oph', ra: 248.1325, dec: -13.0536, magnitude: 7.9, sizeMax: 13, alternateNames: ['NGC 6171'] },
  { id: 'M108', name: 'M108 - Surfboard Galaxy', type: 'Galaxy', constellation: 'UMa', ra: 167.8790, dec: 55.6742, magnitude: 10.0, sizeMax: 8.7, sizeMin: 2.2, alternateNames: ['NGC 3556'] },
  { id: 'M109', name: 'M109', type: 'Galaxy', constellation: 'UMa', ra: 179.3999, dec: 53.3747, magnitude: 9.8, sizeMax: 7.6, sizeMin: 4.7, alternateNames: ['NGC 3992'] },
  { id: 'M110', name: 'M110', type: 'Galaxy', constellation: 'And', ra: 10.0917, dec: 41.6850, magnitude: 8.5, sizeMax: 21.9, sizeMin: 11.0, alternateNames: ['NGC 205'] },
];

// ============================================================================
// Popular NGC Objects
// ============================================================================

const POPULAR_NGC_OBJECTS: DeepSkyObject[] = [
  { id: 'NGC869', name: 'NGC 869 - Double Cluster', type: 'OpenCluster', constellation: 'Per', ra: 34.75, dec: 57.133, magnitude: 5.3, sizeMax: 30, alternateNames: ['h Persei'] },
  { id: 'NGC884', name: 'NGC 884 - Double Cluster', type: 'OpenCluster', constellation: 'Per', ra: 35.083, dec: 57.133, magnitude: 6.1, sizeMax: 30, alternateNames: ['χ Persei'] },
  { id: 'NGC253', name: 'NGC 253 - Sculptor Galaxy', type: 'Galaxy', constellation: 'Scl', ra: 11.888, dec: -25.288, magnitude: 7.1, sizeMax: 27.5, sizeMin: 6.8 },
  { id: 'NGC2024', name: 'NGC 2024 - Flame Nebula', type: 'EmissionNebula', constellation: 'Ori', ra: 85.417, dec: -1.917, magnitude: 2.0, sizeMax: 30, sizeMin: 30 },
  { id: 'NGC2237', name: 'NGC 2237 - Rosette Nebula', type: 'EmissionNebula', constellation: 'Mon', ra: 98.0, dec: 4.95, magnitude: 9.0, sizeMax: 80, sizeMin: 60 },
  { id: 'NGC2264', name: 'NGC 2264 - Cone Nebula', type: 'EmissionNebula', constellation: 'Mon', ra: 100.25, dec: 9.883, magnitude: 3.9, sizeMax: 20 },
  { id: 'NGC2359', name: 'NGC 2359 - Thor\'s Helmet', type: 'EmissionNebula', constellation: 'CMa', ra: 109.275, dec: -13.233, magnitude: 11.5, sizeMax: 10 },
  { id: 'NGC2403', name: 'NGC 2403', type: 'Galaxy', constellation: 'Cam', ra: 114.214, dec: 65.603, magnitude: 8.4, sizeMax: 21.9, sizeMin: 12.3 },
  { id: 'NGC2841', name: 'NGC 2841', type: 'Galaxy', constellation: 'UMa', ra: 140.511, dec: 50.976, magnitude: 9.2, sizeMax: 8.1, sizeMin: 3.5 },
  { id: 'NGC2903', name: 'NGC 2903', type: 'Galaxy', constellation: 'Leo', ra: 143.042, dec: 21.501, magnitude: 9.0, sizeMax: 12.6, sizeMin: 6.0 },
  { id: 'NGC3115', name: 'NGC 3115 - Spindle Galaxy', type: 'Galaxy', constellation: 'Sex', ra: 151.308, dec: -7.718, magnitude: 9.1, sizeMax: 7.2, sizeMin: 2.5 },
  { id: 'NGC3242', name: 'NGC 3242 - Ghost of Jupiter', type: 'PlanetaryNebula', constellation: 'Hya', ra: 156.158, dec: -18.633, magnitude: 7.3, sizeMax: 1.35 },
  { id: 'NGC3628', name: 'NGC 3628 - Hamburger Galaxy', type: 'Galaxy', constellation: 'Leo', ra: 170.071, dec: 13.589, magnitude: 9.5, sizeMax: 14.8, sizeMin: 3.0 },
  { id: 'NGC4038', name: 'NGC 4038 - Antennae Galaxies', type: 'Galaxy', constellation: 'Crv', ra: 180.471, dec: -18.868, magnitude: 10.3, sizeMax: 5.2, sizeMin: 3.1 },
  { id: 'NGC4244', name: 'NGC 4244 - Silver Needle Galaxy', type: 'Galaxy', constellation: 'CVn', ra: 184.374, dec: 37.807, magnitude: 10.2, sizeMax: 16.6, sizeMin: 1.9 },
  { id: 'NGC4361', name: 'NGC 4361', type: 'PlanetaryNebula', constellation: 'Crv', ra: 186.163, dec: -18.783, magnitude: 10.3, sizeMax: 1.85 },
  { id: 'NGC4565', name: 'NGC 4565 - Needle Galaxy', type: 'Galaxy', constellation: 'Com', ra: 189.087, dec: 25.988, magnitude: 9.6, sizeMax: 15.9, sizeMin: 1.9 },
  { id: 'NGC4631', name: 'NGC 4631 - Whale Galaxy', type: 'Galaxy', constellation: 'CVn', ra: 190.533, dec: 32.541, magnitude: 9.2, sizeMax: 15.5, sizeMin: 2.7 },
  { id: 'NGC4656', name: 'NGC 4656 - Hockey Stick Galaxy', type: 'Galaxy', constellation: 'CVn', ra: 190.992, dec: 32.170, magnitude: 10.5, sizeMax: 15.3, sizeMin: 2.4 },
  { id: 'NGC4725', name: 'NGC 4725', type: 'Galaxy', constellation: 'Com', ra: 192.611, dec: 25.501, magnitude: 9.4, sizeMax: 10.7, sizeMin: 7.6 },
  { id: 'NGC5128', name: 'NGC 5128 - Centaurus A', type: 'Galaxy', constellation: 'Cen', ra: 201.365, dec: -43.019, magnitude: 6.8, sizeMax: 25.7, sizeMin: 20.0 },
  { id: 'NGC5139', name: 'NGC 5139 - Omega Centauri', type: 'GlobularCluster', constellation: 'Cen', ra: 201.697, dec: -47.479, magnitude: 3.9, sizeMax: 36.3 },
  { id: 'NGC6543', name: 'NGC 6543 - Cat\'s Eye Nebula', type: 'PlanetaryNebula', constellation: 'Dra', ra: 269.639, dec: 66.633, magnitude: 8.1, sizeMax: 0.35 },
  { id: 'NGC6826', name: 'NGC 6826 - Blinking Planetary', type: 'PlanetaryNebula', constellation: 'Cyg', ra: 296.200, dec: 50.525, magnitude: 8.8, sizeMax: 0.43 },
  { id: 'NGC6888', name: 'NGC 6888 - Crescent Nebula', type: 'EmissionNebula', constellation: 'Cyg', ra: 303.062, dec: 38.350, magnitude: 7.4, sizeMax: 18, sizeMin: 12 },
  { id: 'NGC6960', name: 'NGC 6960 - Veil Nebula West', type: 'SupernovaRemnant', constellation: 'Cyg', ra: 312.75, dec: 30.717, magnitude: 7.0, sizeMax: 70, sizeMin: 6 },
  { id: 'NGC6992', name: 'NGC 6992 - Veil Nebula East', type: 'SupernovaRemnant', constellation: 'Cyg', ra: 314.583, dec: 31.717, magnitude: 7.0, sizeMax: 60, sizeMin: 8 },
  { id: 'NGC7000', name: 'NGC 7000 - North America Nebula', type: 'EmissionNebula', constellation: 'Cyg', ra: 314.75, dec: 44.333, magnitude: 4.0, sizeMax: 120, sizeMin: 100 },
  { id: 'NGC7023', name: 'NGC 7023 - Iris Nebula', type: 'ReflectionNebula', constellation: 'Cep', ra: 315.375, dec: 68.167, magnitude: 7.1, sizeMax: 18, sizeMin: 18 },
  { id: 'NGC7129', name: 'NGC 7129', type: 'ReflectionNebula', constellation: 'Cep', ra: 325.758, dec: 66.117, magnitude: 11.5, sizeMax: 7, sizeMin: 7 },
  { id: 'NGC7293', name: 'NGC 7293 - Helix Nebula', type: 'PlanetaryNebula', constellation: 'Aqr', ra: 337.411, dec: -20.837, magnitude: 7.6, sizeMax: 16 },
  { id: 'NGC7331', name: 'NGC 7331', type: 'Galaxy', constellation: 'Peg', ra: 339.267, dec: 34.416, magnitude: 9.5, sizeMax: 10.5, sizeMin: 3.7 },
  { id: 'NGC7635', name: 'NGC 7635 - Bubble Nebula', type: 'EmissionNebula', constellation: 'Cas', ra: 350.2, dec: 61.2, magnitude: 10.0, sizeMax: 15, sizeMin: 8 },
  { id: 'NGC7822', name: 'NGC 7822', type: 'EmissionNebula', constellation: 'Cep', ra: 0.75, dec: 67.417, magnitude: 7.0, sizeMax: 60, sizeMin: 30 },
];

// ============================================================================
// Popular IC Objects
// ============================================================================

const POPULAR_IC_OBJECTS: DeepSkyObject[] = [
  { id: 'IC434', name: 'IC 434 - Horsehead Nebula', type: 'DarkNebula', constellation: 'Ori', ra: 85.25, dec: -2.433, magnitude: 6.8, sizeMax: 60, sizeMin: 10 },
  { id: 'IC1396', name: 'IC 1396 - Elephant Trunk Nebula', type: 'EmissionNebula', constellation: 'Cep', ra: 324.75, dec: 57.5, magnitude: 3.5, sizeMax: 170, sizeMin: 140 },
  { id: 'IC1805', name: 'IC 1805 - Heart Nebula', type: 'EmissionNebula', constellation: 'Cas', ra: 38.208, dec: 61.45, magnitude: 6.5, sizeMax: 60, sizeMin: 60 },
  { id: 'IC1848', name: 'IC 1848 - Soul Nebula', type: 'EmissionNebula', constellation: 'Cas', ra: 43.0, dec: 60.433, magnitude: 6.5, sizeMax: 60, sizeMin: 30 },
  { id: 'IC2118', name: 'IC 2118 - Witch Head Nebula', type: 'ReflectionNebula', constellation: 'Eri', ra: 80.083, dec: -7.183, magnitude: 13.0, sizeMax: 180, sizeMin: 60 },
  { id: 'IC2177', name: 'IC 2177 - Seagull Nebula', type: 'EmissionNebula', constellation: 'Mon', ra: 109.333, dec: -10.7, magnitude: 7.0, sizeMax: 120, sizeMin: 40 },
  { id: 'IC4592', name: 'IC 4592 - Blue Horsehead', type: 'ReflectionNebula', constellation: 'Sco', ra: 243.167, dec: -19.367, magnitude: 4.0, sizeMax: 90, sizeMin: 60 },
  { id: 'IC4603', name: 'IC 4603', type: 'ReflectionNebula', constellation: 'Oph', ra: 244.667, dec: -20.633, magnitude: 10.0, sizeMax: 15, sizeMin: 10 },
  { id: 'IC4604', name: 'IC 4604 - Rho Ophiuchi', type: 'ReflectionNebula', constellation: 'Oph', ra: 246.417, dec: -23.45, magnitude: 4.6, sizeMax: 60, sizeMin: 60 },
  { id: 'IC5067', name: 'IC 5067 - Pelican Nebula', type: 'EmissionNebula', constellation: 'Cyg', ra: 312.75, dec: 44.367, magnitude: 8.0, sizeMax: 60, sizeMin: 50 },
  { id: 'IC5146', name: 'IC 5146 - Cocoon Nebula', type: 'EmissionNebula', constellation: 'Cyg', ra: 328.375, dec: 47.267, magnitude: 7.2, sizeMax: 12, sizeMin: 12 },
];

// ============================================================================
// Caldwell Objects (selected)
// ============================================================================

const CALDWELL_OBJECTS: DeepSkyObject[] = [
  { id: 'C14', name: 'C14 - Double Cluster', type: 'OpenCluster', constellation: 'Per', ra: 34.75, dec: 57.133, magnitude: 4.3, sizeMax: 60, caldwell: 14 },
  { id: 'C33', name: 'C33 - East Veil Nebula', type: 'SupernovaRemnant', constellation: 'Cyg', ra: 314.583, dec: 31.717, magnitude: 7.0, sizeMax: 60, caldwell: 33 },
  { id: 'C34', name: 'C34 - West Veil Nebula', type: 'SupernovaRemnant', constellation: 'Cyg', ra: 312.75, dec: 30.717, magnitude: 7.0, sizeMax: 70, caldwell: 34 },
  { id: 'C49', name: 'C49 - Rosette Nebula', type: 'EmissionNebula', constellation: 'Mon', ra: 98.0, dec: 4.95, magnitude: 9.0, sizeMax: 80, caldwell: 49 },
  { id: 'C55', name: 'C55 - Saturn Nebula', type: 'PlanetaryNebula', constellation: 'Aqr', ra: 316.099, dec: -11.366, magnitude: 8.0, sizeMax: 0.7, caldwell: 55, alternateNames: ['NGC 7009'] },
  { id: 'C63', name: 'C63 - Helix Nebula', type: 'PlanetaryNebula', constellation: 'Aqr', ra: 337.411, dec: -20.837, magnitude: 7.6, sizeMax: 16, caldwell: 63 },
  { id: 'C69', name: 'C69 - Bug Nebula', type: 'PlanetaryNebula', constellation: 'Sco', ra: 258.054, dec: -37.104, magnitude: 9.6, sizeMax: 2.2, caldwell: 69, alternateNames: ['NGC 6302'] },
  { id: 'C80', name: 'C80 - Omega Centauri', type: 'GlobularCluster', constellation: 'Cen', ra: 201.697, dec: -47.479, magnitude: 3.9, sizeMax: 36.3, caldwell: 80 },
];

// ============================================================================
// Combined Catalog Export
// ============================================================================

export const DSO_CATALOG: DeepSkyObject[] = [
  ...MESSIER_OBJECTS,
  ...POPULAR_NGC_OBJECTS,
  ...POPULAR_IC_OBJECTS,
  ...CALDWELL_OBJECTS,
].sort((a, b) => {
  // Sort by magnitude for default ordering
  const magA = a.magnitude ?? 99;
  const magB = b.magnitude ?? 99;
  return magA - magB;
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get object by ID
 */
export function getDSOById(id: string): DeepSkyObject | undefined {
  return DSO_CATALOG.find(obj => obj.id === id);
}

/**
 * Get all Messier objects
 */
export function getMessierObjects(): DeepSkyObject[] {
  return MESSIER_OBJECTS;
}

/**
 * Get objects by constellation
 */
export function getDSOsByConstellation(constellation: string): DeepSkyObject[] {
  return DSO_CATALOG.filter(obj => 
    obj.constellation.toLowerCase() === constellation.toLowerCase()
  );
}

/**
 * Get objects by type
 */
export function getDSOsByType(type: DSOType): DeepSkyObject[] {
  return DSO_CATALOG.filter(obj => obj.type === type);
}
