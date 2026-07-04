/**
 * CountryFlag — lazy-loaded SVG country flag for international communities.
 *
 * Uses Vite's import.meta.glob to dynamically import flag SVG strings from
 * the `country-flag-icons` package. The flag is loaded asynchronously on
 * first render and injected as raw HTML via dangerouslySetInnerHTML.
 *
 * Shows a neutral placeholder while loading or if the country code is unknown.
 *
 * Props:
 * @param {string} code      — ISO 3166-1 alpha-2 country code (e.g. "CA")
 * @param {string} title     — tooltip text (community/country name)
 * @param {string} className — additional Tailwind classes
 */
import { useEffect, useState } from 'react';

// Eagerly build a map of country code → lazy loader function via Vite glob
const flagLoaders = import.meta.glob('../../node_modules/country-flag-icons/string/3x2/*.js', {
  import: 'default',
});

const loaderByCode = Object.fromEntries(
  Object.entries(flagLoaders)
    .map(([path, loader]) => {
      const code = path.match(/\/([A-Z]{2})\.js$/)?.[1];
      return code ? [code, loader] : [];
    })
    .filter(([code]) => code)
);

export default function CountryFlag({ code, title, className = '' }) {
  // The raw SVG markup string for the flag
  const [svg, setSvg] = useState('');

  // Asynchronously load the SVG for the given country code
  useEffect(() => {
    let alive = true;
    const loader = loaderByCode[code?.toUpperCase()];
    if (!loader) {
      setSvg('');
      return undefined;
    }
    loader().then((html) => {
      if (alive) setSvg(html);
    });
    return () => {
      alive = false;
    };
  }, [code]);

  if (!svg) {
    return <div className={`bg-base-300 ${className}`} aria-hidden />;
  }

  return (
    <span
      title={title}
      className={`inline-flex w-full h-full overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover ${className}`}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
