import { Link } from "react-router-dom";
import "../../styles/home.css";

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>
          <span>Visualized</span> Hardware Security
        </h1>
        <p>
        Upload Verilog files and analyze execution paths interactively.
        </p>
        <div className="cta-buttons">
          <Link to="/upload" className="cta-button primary">Get Started</Link>
          <Link to="/about" className="cta-button secondary">about</Link>
        </div>
        <section className="features">
        <h2>How It Works</h2>
        <ul>
          <li>🔍 Upload your Verilog RTL files</li>
          <li>📈 View symbolic execution paths</li>
          <li>🎯 Analyze security flow dynamically</li>
        </ul>
      </section>
      </section>
    </div>
  );
}
