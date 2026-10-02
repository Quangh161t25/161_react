/**
 * Utility for generating local offline SVG avatars based on user initials.
 * Avoids any external network calls to third-party services like ui-avatars.com,
 * preventing user and employee name data leakage.
 */

export function getInitialsAvatar(name?: string, bg = '#1d4ed8', color = '#ffffff'): string {
  const cleanName = (name || 'User').trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = 'U';
  if (words.length === 1) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else if (words.length > 1) {
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  const hexBg = bg.startsWith('#') ? bg : `#${bg}`;
  const hexColor = color.startsWith('#') ? color : `#${color}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="${hexBg}"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="${hexColor}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="40" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getSafeAvatarUrl(url?: string, fallbackName?: string, bg = '#1d4ed8'): string {
  if (url && !url.includes('ui-avatars.com')) {
    return url;
  }
  return getInitialsAvatar(fallbackName || 'User', bg);
}
