import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Visualizer from "./pages/Visualizer";
import About from "./pages/About";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;
