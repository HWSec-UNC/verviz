import { Link } from "react-router-dom";
import "../../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">Hardware Visualizer</div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/upload">Upload</Link></li>
        <li><Link to="/visualizer">Visualizer</Link></li>
        <li><Link to="/about">About</Link></li>
      </ul>
    </nav>
  );
}