// Static Blender renders of service concepts, never completed project screenshots.
export function ServiceArt({ theme }: { theme: string }) {
  return (
    <img
      className="service-art"
      src={`/services/${theme}.jpg`}
      width={880}
      height={480}
      loading="lazy"
      decoding="async"
      alt=""
    />
  )
}
