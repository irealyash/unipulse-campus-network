import { useEffect, useState } from 'react';

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

/** Lazy-loaded SVG flag (international communities only). */
export default function CountryFlag({ code, title, className = '' }) {
  const [svg, setSvg] = useState('');

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
