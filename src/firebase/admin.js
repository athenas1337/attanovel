// src/firebase/admin.js
// Admin system — athenas1337@gmail.com is the permanent site admin
// All admin privileges are checked against this email server-side via
// Firestore security rules and client-side display gating.

export const ADMIN_EMAIL = 'athenas1337@gmail.com';

/**
 * Check if a Firebase user object is the site admin.
 * @param {object|null} user - Firebase auth user
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  if (!user) return false;
  return user.email === ADMIN_EMAIL;
};

/**
 * Check if a user profile has admin role.
 * Used for Firestore-sourced profile objects.
 */
export const isAdminProfile = (userProfile) => {
  if (!userProfile) return false;
  return userProfile.email === ADMIN_EMAIL || userProfile.role === 'admin';
};
