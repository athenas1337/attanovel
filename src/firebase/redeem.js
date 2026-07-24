// src/firebase/redeem.js
// Redeem code system — validates codes and activates modes
// Developer code: @thA1337 → activates full developer/admin mode

const DEV_CODE = '@thA1337';
const DEV_KEY = 'attanovel_dev_mode';
const REDEEMED_KEY = 'attanovel_redeemed_codes';

export const isDeveloper = () => {
  return localStorage.getItem(DEV_KEY) === 'true';
};

export const activateDeveloper = () => {
  localStorage.setItem(DEV_KEY, 'true');
};

export const deactivateDeveloper = () => {
  localStorage.removeItem(DEV_KEY);
};

// All redeemed codes (for future VIP/premium codes)
export const getRedeemedCodes = () => {
  try {
    return JSON.parse(localStorage.getItem(REDEEMED_KEY) || '[]');
  } catch { return []; }
};

const markRedeemed = (code) => {
  const redeemed = getRedeemedCodes();
  if (!redeemed.includes(code)) {
    localStorage.setItem(REDEEMED_KEY, JSON.stringify([...redeemed, code]));
  }
};

/**
 * Validate and redeem a code.
 * Returns { success, message, type }
 * type: 'dev' | 'vip' | 'unknown'
 */
export const redeemCode = (code) => {
  const trimmed = code.trim();

  if (!trimmed) {
    return { success: false, message: 'Kode tidak boleh kosong.', type: null };
  }

  // Developer code (case-sensitive)
  if (trimmed === DEV_CODE) {
    const already = isDeveloper();
    activateDeveloper();
    markRedeemed(trimmed);
    if (already) {
      return { success: true, message: '🔧 Mode Developer sudah aktif.', type: 'dev' };
    }
    return { success: true, message: '🔧 Mode Developer berhasil diaktifkan! Kamu kini memiliki hak admin penuh.', type: 'dev' };
  }

  // Future codes can be added here
  // if (trimmed === 'VIP2026') { ... }

  return { success: false, message: 'Kode tidak valid atau sudah kedaluwarsa.', type: 'unknown' };
};
