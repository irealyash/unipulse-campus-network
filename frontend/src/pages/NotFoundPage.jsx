/**
 * NotFoundPage.jsx
 *
 * 404 fallback page.
 * Route: "*" (any unmatched route)
 * Role: Displays a friendly 404 message with a link back to the home page.
 * Shown when the user navigates to a route that doesn't exist.
 */

import { Link } from 'react-router-dom';
import { BrandText } from '../components/Logo';

export default function NotFoundPage() {
  return (
    // Full-screen centered container
    <div className="min-h-screen grid place-items-center bg-base-200 p-4">
      <div className="text-center">
        {/* App brand logo */}
        <BrandText className="text-3xl mb-4 block" />
        {/* Large 404 indicator */}
        <div className="text-7xl font-extrabold text-primary">404</div>
        {/* Friendly error message */}
        <p className="mt-2 text-base-content/70">This page wandered off campus.</p>
        {/* Navigation link back to home */}
        <Link to="/" className="btn btn-primary rounded-full mt-4">
          Take me home
        </Link>
      </div>
    </div>
  );
}
