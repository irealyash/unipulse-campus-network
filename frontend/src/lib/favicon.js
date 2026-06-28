/**
 * Regenerate the tab favicon using the active theme's primary colors.
 */
export function updateThemeFavicon() {
  const styles = getComputedStyle(document.documentElement);
  const bg = styles.getPropertyValue('--color-primary').trim() || '#570df8';
  const fg = styles.getPropertyValue('--color-primary-content').trim() || '#ffffff';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="${bg}"/>
  <text x="16" y="22" text-anchor="middle" fill="${fg}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="18" font-weight="700">U</text>
</svg>`;

  const href = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  const ensureLink = (rel) => {
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
    if (rel === 'icon') link.type = 'image/svg+xml';
    return link;
  };

  ensureLink('icon');
  ensureLink('apple-touch-icon');
}
