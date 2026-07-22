import { useMusicPlayer } from "../../providers/MusicProvider";

export default function MusicToggleButton({ className = "" }) {
  const { isPlaying, toggle } = useMusicPlayer();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isPlaying ? "Pause background music" : "Play background music"}
      aria-pressed={isPlaying}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full border border-current/20 transition-opacity hover:opacity-80 ${className}`}
    >
      {isPlaying ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}