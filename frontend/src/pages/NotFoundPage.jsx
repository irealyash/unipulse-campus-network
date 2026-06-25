import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-base-200 p-4">
      <div className="text-center">
        <div className="text-7xl font-extrabold text-primary">404</div>
        <p className="mt-2 text-base-content/70">This page wandered off campus.</p>
        <Link to="/" className="btn btn-primary rounded-full mt-4">
          Take me home
        </Link>
      </div>
    </div>
  );
}
