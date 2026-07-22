import Home from "./pages/Home";
import MusicProvider from "./providers/MusicProvider";

function App() {
  return (
    <MusicProvider>
      <Home />
    </MusicProvider>
  );
}

export default App;