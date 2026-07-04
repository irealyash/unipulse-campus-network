/**
 * useDebouncedValue HOOK
 * ----------------------------------------------------------------------------
 * Returns a debounced version of the provided value that only updates after
 * the value has been stable (unchanged) for `delayMs` milliseconds. Useful
 * for search inputs, filter fields, and other rapid-fire user inputs where
 * you want to avoid triggering API calls on every keystroke.
 *
 * @param {*}      value   - The raw value to debounce (typically a string from an input).
 * @param {number} delayMs - Debounce delay in milliseconds (default 300).
 * @returns {*} The debounced value, which lags behind the input by `delayMs`.
 */

import { useEffect, useState } from 'react';

export default function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
