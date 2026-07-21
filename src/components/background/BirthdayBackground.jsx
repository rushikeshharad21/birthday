import "./birthdayBackground.css";
import { useMemo } from "react";

const particles = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 20,
    opacity: Math.random() * 0.3 + 0.1,
    drift: (Math.random() - 0.5) * 80,
  }));

export default function BirthdayBackground() {
  const dots = useMemo(() => particles(30), []);

  return (
    <div className="birthday-bg">
      {/* Orbs */}
      <div className="bg-orb rose" />
      <div className="bg-orb lavender" />
      <div className="bg-orb gold" />

      {/* Floating Particles */}
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="bg-particle"
          style={{
            left: `${dot.left}%`,
            width: dot.size,
            height: dot.size,
            animationDuration: `${dot.duration}s`,
            animationDelay: `${dot.delay}s`,
            opacity: dot.opacity,
            "--drift": `${dot.drift}px`,
          }}
        />
      ))}
    </div>
  );
}