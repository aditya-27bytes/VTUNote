// src/pages/HomePage.jsx
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/HomePage.css";

// Dynamic data
const features = [
  {
    icon: "🎯",
    title: "Smart Flashcards",
    text: "AI-generated flashcards to help you memorize key concepts efficiently",
    accent: "accent-blue",
  },
  {
    icon: "📝",
    title: "Intelligent Summaries",
    text: "Get concise summaries of your notes with important points highlighted",
    accent: "accent-purple",
  },
  {
    icon: "🧠",
    title: "Concept Mapping",
    text: "Visualize complex topics with AI-extracted key concepts and relationships",
    accent: "accent-cyan",
  },
  {
    icon: "📊",
    title: "Progress Tracking",
    text: "Track your learning progress and identify areas that need more focus",
    accent: "accent-red",
  },
];

const steps = [
  {
    number: 1,
    title: "Upload Your PDF",
    text: "Simply upload your VTU lecture notes or study materials",
    accent: "accent-blue",
  },
  {
    number: 2,
    title: "AI Processing",
    text: "Our AI analyzes and extracts key information from your notes",
    accent: "accent-purple",
  },
  {
    number: 3,
    title: "Study & Learn",
    text: "Use flashcards, summaries, and concepts to enhance your learning",
    accent: "accent-cyan",
  },
];

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">📚 VTU NOTE</h1>
          <h2 className="hero-subheading">Student Study Assistant</h2>
          <p className="hero-subtitle">
            Transform your PDF notes into interactive flashcards, summaries, and
            key concepts with AI-powered technology
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary hero-btn">
              Get Started – It’s Free
            </Link>
          </div>
        </div>
        <div className="hero-bg-shape hero-bg-shape-1"></div>
        <div className="hero-bg-shape hero-bg-shape-2"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className={`feature-card ${f.accent}`}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          {steps.map((s, i) => (
            <div key={i} className={`step ${s.accent}`}>
              <div className="step-number">{s.number}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2 className="cta-title">
          Ready to Transform Your Study Experience?
        </h2>
        <p className="cta-subtitle">
          Join thousands of VTU students already excelling with our AI-powered
          learning platform
        </p>
        <Link to="/register" className="btn-primary cta-btn">
          Sign Up Now
        </Link>
      </section>
    </Layout>
  );
}
