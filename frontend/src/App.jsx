import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Visualizer from "./pages/Visualizer";
import About from "./pages/About";
import VisualizationDetails from "./pages/VisualizerDetails";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/visualizations" element={<Visualizer />} />
        <Route path="/visualization/:visualization_id" element={<VisualizationDetails />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;
