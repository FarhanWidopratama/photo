/**
 * AI Neural Studio & Style Engine for SeoulSnap AI Studio V3
 * Simulates AI Background Swaps, AI Style Transfers, & AI Outfit Swaps
 */

export const AI_BACKGROUNDS = [
  { id: 'none', name: 'Original Background', icon: '📷' },
  { id: 'japan_sakura', name: '🌸 Tokyo Sakura Street', icon: '🌸', badge: 'POPULAR' },
  { id: 'paris_eiffel', name: '🗼 Paris Sunset Eiffel', icon: '🌆', badge: 'ROMANTIC' },
  { id: 'bali_beach', name: '🏖️ Bali Beach Sunset', icon: '🌅' },
  { id: 'cyberpunk_city', name: '⚡️ Cyberpunk 2077 City', icon: '⚡️', badge: 'VIRAL' },
  { id: 'outer_space', name: '🌌 Galaxy Space Nebula', icon: '🚀' },
  { id: 'hogwarts_magic', name: '🏰 Magic Castle Fantasy', icon: '🪄' },
  { id: 'kpop_concert', name: '🎤 K-Pop Stage Lights', icon: '✨', badge: 'K-POP' },
  { id: 'kyoto_bamboo', name: '🎋 Kyoto Bamboo Forest', icon: '🎋' },
  { id: 'retro_arcade', name: '👾 80s Synthwave Arcade', icon: '🎮' },
  { id: 'seoul_street', name: '🇰🇷 Hongdae Night Street', icon: '🌃' },
];

export const AR_PROPS = [
  { id: 'none', name: 'Tanpa Aksesoris', icon: '🚫' },
  { id: 'thug_glasses', name: '🕶️ Kacamata Cool Thug', icon: '🕶️' },
  { id: 'cat_ears', name: '🐱 Telinga Kucing Cute', icon: '🐱' },
  { id: 'crown', name: '👑 Mahkota Ratu / Raja', icon: '👑' },
  { id: 'mustache', name: '👨🏻 Kumis Gentleman', icon: '👨🏻' },
  { id: 'party_hat', name: '🥳 Topi Pesta Ultah', icon: '🥳' },
  { id: 'speech_bubble', name: '💬 Bubble Chat "Bestie!"', icon: '💬' }
];

/**
 * Helper to render AR Props emojis at correct proportions on top of face area
 */
export function drawArPropToCanvas(ctx, width, height, propId) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (propId === 'thug_glasses') {
    ctx.font = `${Math.round(height * 0.22)}px sans-serif`;
    ctx.fillText('🕶️', width / 2, height * 0.42);
  } else if (propId === 'cat_ears') {
    ctx.font = `${Math.round(height * 0.28)}px sans-serif`;
    ctx.fillText('🐱', width / 2, height * 0.22);
    ctx.font = `${Math.round(height * 0.1)}px sans-serif`;
    ctx.fillText('🌸', width * 0.3, height * 0.55);
    ctx.fillText('🌸', width * 0.7, height * 0.55);
  } else if (propId === 'crown' || propId === 'heart_crown') {
    ctx.font = `${Math.round(height * 0.26)}px sans-serif`;
    ctx.fillText('👑', width / 2, height * 0.2);
  } else if (propId === 'mustache') {
    ctx.font = `${Math.round(height * 0.18)}px sans-serif`;
    ctx.fillText('👨🏻', width / 2, height * 0.55);
  } else if (propId === 'party_hat') {
    ctx.font = `${Math.round(height * 0.26)}px sans-serif`;
    ctx.fillText('🥳', width / 2, height * 0.22);
  } else if (propId === 'speech_bubble') {
    ctx.font = `${Math.round(height * 0.22)}px sans-serif`;
    ctx.fillText('💬', width * 0.75, height * 0.28);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#121212';
    ctx.fillText('Bestie! 💕', width * 0.75, height * 0.28);
  }

  ctx.restore();
}
