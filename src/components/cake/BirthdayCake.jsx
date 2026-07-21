import FireworksTrigger from "../fireworks/FireworksTrigger";
import CakeScene from "../cake/CakeScene";

export default function BirthdayCake() {
  return (
    <FireworksTrigger
      aria-label="Birthday cake"
      className="min-h-screen flex items-center justify-center px-4"
    >
      {(launcher) => (
        <div className="w-full max-w-4xl">
          <CakeScene fireworkLauncher={launcher} />
        </div>
      )}
    </FireworksTrigger>
  );
}