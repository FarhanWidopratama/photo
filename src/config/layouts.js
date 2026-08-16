// ============================================================
//  Layouts — single source of truth for photo slot counts
// ============================================================

export const LAYOUT_SLOTS = {
  strip1x4: 4,
  grid2x2: 4,
  hero1plus3: 4,
  duo1x2: 2,
  strip1x3: 3,
  photocard: 1,
  filmroll: 4,
};

export function getLayoutSlotCount(layout) {
  return LAYOUT_SLOTS[layout] || 4;
}
