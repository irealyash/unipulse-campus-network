import { Link } from 'react-router-dom';

export function BrandText({ className = 'text-2xl' }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      Uni<span className="text-primary">Pulse</span>
    </span>
  );
}

export function BrandLink({
  to = '/',
  className = 'btn btn-ghost text-xl px-2 normal-case',
  textClassName = 'text-xl',
}) {
  return (
    <Link to={to} className={className}>
      <BrandText className={textClassName} />
    </Link>
  );
}

export default BrandText;
