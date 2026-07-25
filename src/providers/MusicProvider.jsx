import { createContext, useContext, useEffect, useRef, useState } from "react";

const MusicContext = createContext(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within a <MusicProvider>.");
  }
  return ctx;
}

const MUSIC_SRC = "/audio/background-music.mp3";
const MUSIC_VOLUME = 0.5;

/**
 * Owns a single global <audio> element and its play state. The <audio>
 * element itself is NOT created until the person's first interaction —
 * this means the 1.4MB mp3 file is never fetched on page load, only once
 * the person actually engages with the page (matching browser autoplay
 * policy anyway, so nothing is lost by waiting).
 */
export default function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function ensureAudio() {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(MUSIC_SRC);
    audio.preload = "none";
    audio.loop = true;
    audio.volume = MUSIC_VOLUME;
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audioRef.current = audio;
    return audio;
  }

  useEffect(() => {
    function startOnFirstInteraction() {
      const audio = ensureAudio();
      if (!audio.paused) return;
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
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, startOnFirstInteraction);
      });
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function play() {
    const audio = ensureAudio();
    if (!audio.paused) return;
    audio.play().catch(() => {});
  }

  function toggle() {
    const audio = ensureAudio();
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  return (
    <MusicContext.Provider value={{ isPlaying, play, toggle }}>
      {children}
    </MusicContext.Provider>
  );
}