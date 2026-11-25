import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container-wide inner">
        <Link href="/" className="brand" aria-label="FanGlobe home">
          <span className="brand-mark" aria-hidden>✓</span>
          <span>fanglobe<span className="tld">.live</span></span>
        </Link>
        <nav className="nav">
          <Link href="/#live">Live</Link>
          <Link href="/#how">How it works</Link>
        </nav>
      </div>
    </header>
  )
}
