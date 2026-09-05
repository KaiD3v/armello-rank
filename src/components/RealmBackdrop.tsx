/**
 * Atmospheric realm backdrop only — heroes live inside ranking side panels.
 */
export function RealmBackdrop() {
  return (
    <div className="realm-art" aria-hidden>
      <img
        className="realm-art__sky"
        src="/realm/bg-city-purple.jpg"
        alt=""
        decoding="async"
      />
      <div className="realm-art__veil" />
    </div>
  );
}
