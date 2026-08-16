// ============================================================
//  FRAME THEME DEFS  — single source of truth for theme ids,
//  display labels and QR color (dark/light contrast).
//  Order here = order shown in the theme picker UI.
// ============================================================

export const FRAME_THEME_DEFS = [
  { id: 'haru_white',       name: 'Clean White',      isDark: false },
  { id: 'anime_sakura',     name: 'Korean Pink',      isDark: false },
  { id: 'anime_chibi',      name: 'Anime Chibi',      isDark: false },
  { id: 'hari_guru',        name: 'Hari Guru / Fest', isDark: false },
  { id: 'birthday_bash',    name: 'Happy Birthday',   isDark: false },
  { id: 'photomatic_black', name: 'Studio Matte',     isDark: true  },
  { id: 'anime_cyber',      name: 'Cyber Neon',       isDark: true  },
  { id: 'y2k_silver',       name: 'Y2K Chrome',       isDark: false },
  { id: 'film_roll',        name: 'Vintage 35mm',     isDark: true  },
  { id: 'boba_taro',        name: 'Boba Taro',        isDark: false },
  { id: 'citypop_90s',      name: 'CityPop 90s',      isDark: true  },
  { id: 'anime_neko',       name: 'Neko Cat',         isDark: false },
  { id: 'anime_goth',       name: 'Dark Lolita',      isDark: true  },
  { id: 'coquette_pink',    name: 'Coquette Pink',    isDark: false },
  { id: 'cloud_dream',      name: 'Cloud Dream',      isDark: false },
  { id: 'gothic_star',      name: 'Midnight Star',    isDark: true  },
  { id: 'matcha_cream',     name: 'Matcha Café',      isDark: false },
  { id: 'butter_bear',      name: 'Butter Bear',      isDark: false },
  { id: 'custom_png',       name: 'Custom PNG',       isDark: false },
  { id: 'custom_color',     name: 'Custom Color',     isDark: false },
];

export const QR_DARK_COLOR = '#121212';
export const QR_LIGHT_COLOR = '#FFFFFF';

export function getFrameThemeDef(id) {
  return FRAME_THEME_DEFS.find(t => t.id === id) || FRAME_THEME_DEFS[0];
}

export function getQrColor(id) {
  return getFrameThemeDef(id).isDark ? QR_LIGHT_COLOR : QR_DARK_COLOR;
}