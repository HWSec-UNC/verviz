import { Link } from "react-router-dom";
import "../../styles/home.css";

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Visualize Hardware Security</h1>
        <p>Upload Verilog files and analyze execution paths interactively.</p>
        <Link to="/upload" className="cta-button">Get Started</Link>
      </section>

      <section className="features">
        <h2>How It Works</h2>
        <ul>
          <li>🔍 Upload your Verilog RTL files</li>
          <li>📈 View symbolic execution paths</li>
          <li>🎯 Analyze security flow dynamically</li>
        </ul>
      </section>
    </div>
  );
}
