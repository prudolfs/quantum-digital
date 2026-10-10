export function HeroFallback() {
  return (
    <div
      className="hero-visual hero-visual--static"
      data-hero-fallback="true"
      role="img"
      aria-label="Quantum Digital Q symbol"
    >
      <svg
        className="hero-visual__svg"
        viewBox="0 0 440 440"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="q-glow">
            <stop stopColor="#00aeef" stopOpacity=".2" />
            <stop offset="1" stopColor="#00aeef" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="220" cy="220" r="215" fill="url(#q-glow)" />
        <g fill="none" stroke="#398fff" strokeOpacity=".15">
          <circle cx="220" cy="220" r="188" />
          <circle cx="220" cy="220" r="158" strokeDasharray="2 9" />
          <path d="M16 220H64M376 220H424M220 16V64M220 376V424" />
        </g>
        <image
          href="/hero/q-symbol.svg"
          x="99"
          y="95"
          width="242"
          height="242"
        />
      </svg>
    </div>
  )
}
