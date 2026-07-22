import Home from "./pages/Home";
import MusicProvider from "./providers/MusicProvider";
import MusicAutoplayHint from "./components/music/MusicAutoplayHint";

function App() {
  return (
    <MusicProvider>
      <Home/>
      <MusicAutoplayHint />
    </MusicProvider>
  );
}

export default App;