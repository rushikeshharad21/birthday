import { useMusicPlayer } from "../../providers/MusicProvider";

/**
 * Browsers block audio-with-sound autoplay until the person makes a real
 * interaction (click, tap, key press) — scrolling does NOT count as a
 * qualifying gesture in any modern browser's autoplay policy.
 *
 * This is a real, clickable button rather than an invisible "listen for
 * any click on window" trick — that approach was unreliable here because
 * this site's smooth-scroll library (Lenis) and the cake's OrbitControls
 * both do their own pointer-event handling, which can intercept or stop
 * propagation before a generic window-level listener ever sees the click.
 * A direct onClick on this button sidesteps all of that — same mechanism
 * that already works reliably for the Footer's play/pause button.
 *
 * Visible only while music isn't yet playing; disappears automatically
 * the moment it starts (whether from this button or the Footer one).
 */
export default function MusicAutoplayHint() {
  const { isPlaying, play } = useMusicPlayer();

  if (isPlaying) return null;

  return (
    <button
      type="button"
      onClick={play}
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 select-none rounded-full bg-black/70 px-4 py-2 text-xs text-white animate-pulse hover:bg-black/80"
    >
      🎵 Tap for sound
    </button>
  );
}