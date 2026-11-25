export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container-wide stack">
        <div>
          FanGlobe is about decisions, not people. Abuse of referees, players or fans gets removed.
        </div>
        <div className="row" style={{ gap: 16 }}>
          <span>© {new Date().getFullYear()} FanGlobe</span>
          <a href="mailto:hello@fanglobe.live">Contact</a>
        </div>
      </div>
    </footer>
  )
}
