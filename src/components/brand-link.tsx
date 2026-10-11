import { Link } from '@tanstack/react-router'

export function BrandLink() {
  return (
    <Link to="/" className="brand-link" aria-label="Quantum Digital home">
      <img
        className="brand-logo"
        src="/brand/quantum-digital.svg"
        width="201"
        height="25"
        alt=""
      />
    </Link>
  )
}
