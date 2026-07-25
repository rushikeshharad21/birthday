import { useState } from "react";
import Home from "./pages/Home";
import MusicProvider from "./providers/MusicProvider";
import MusicAutoplayHint from "./components/music/MusicAutoplayHint";
import Preloader from "./components/preloader/Preloader";

function App() {
  const [ready, setReady] = useState(false);

  return (
    <MusicProvider>
      {!ready && <Preloader onComplete={() => setReady(true)} />}
      <div style={{ visibility: ready ? "visible" : "hidden" }}>
        <Home />
        <MusicAutoplayHint />
      </div>
    </MusicProvider>
  );
}

export default App;