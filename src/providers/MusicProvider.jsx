import { createContext, useContext, useEffect, useRef, useState } from "react";

const MusicContext = createContext(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within a <MusicProvider>.");
  }
  return ctx;
}

// Place your uploaded audio file at public/audio/background-music.mp3 (Vite
// serves everything under public/ from the site root, so that file becomes
// reachable at exactly this path). Update this constant if you name the
// file differently.
const MUSIC_SRC = "/audio/background-music.mp3";
const MUSIC_VOLUME = 0.5;

/**
 * Owns a single global <audio> element and its play state, so the music
 * keeps playing continuously across scroll/section changes rather than
 * being tied to any one component's mount lifecycle.
 *
 * Autoplay handling: browsers block audio-with-sound autoplay until the
 * person has interacted with the page at least once. This tries to play
 * immediately on mount (works in some browsers/contexts depending on
 * site-engagement history), and if that's blocked, silently starts on the
 * very first interaction instead (click, tap, key press, or scroll) — so
 * the person never has to find a button first, and we never fight the
 * browser's own autoplay policy by retrying repeatedly.
 */
export default function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = MUSIC_VOLUME;
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Immediate attempt — silently ignored if the browser blocks it.
    const playAttempt = audio.play();
    if (playAttempt !== undefined) {
      playAttempt.catch(() => {
        // Blocked by autoplay policy — the interaction-based fallback
        // below will start it on the person's first tap/click/scroll.
      });
    }

    function startOnFirstInteraction() {
      if (!audio.paused) return; // already playing — nothing to do
      audio.play().catch(() => {});
    }

    const interactionEvents = ["pointerdown", "keydown", "touchstart", "scroll"];
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, startOnFirstInteraction, {
        once: true,
        passive: true,
      });
    });

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, startOnFirstInteraction);
      });
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  return (
    <MusicContext.Provider value={{ isPlaying, toggle }}>
      {children}
    </MusicContext.Provider>
  );
}