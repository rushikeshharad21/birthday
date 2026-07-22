import { useMusicPlayer } from "../../providers/MusicProvider";

/**
 * Browsers block audio-with-sound autoplay until the person makes a real
 * interaction (click, tap, key press) — scrolling does NOT count as a
 * qualifying gesture in any modern browser's autoplay policy. If someone
 * only scrolls through the site without ever clicking anything, the music
 * genuinely cannot start until their first real click — which is exactly
 * what MusicProvider's fallback listener is waiting for.
 *
 * This is a small, self-dismissing on-screen nudge so that first click
 * happens sooner and the person understands why: it's visible only while
 * music isn't yet playing, and disappears automatically the moment it
 * starts (whether from this nudge or the Footer button). It's
 * pointer-events-none — it doesn't need to be clicked itself, ANY click
 * anywhere on the page (already listened for in MusicProvider) will start
 * the music and dismiss this.
 */
export default function MusicAutoplayHint() {
  const { isPlaying } = useMusicPlayer();

  if (isPlaying) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 select-none rounded-full bg-black/70 px-4 py-2 text-xs text-white pointer-events-none animate-pulse"
    >
      🎵 Tap anywhere for sound
    </div>
  );
}