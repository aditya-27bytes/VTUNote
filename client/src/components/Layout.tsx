import React from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="page">
      {children}
      {/* Page Footer */}
      <footer className="page-footer">
        <div className="footer-container">
          <div className="footer-column">
            <div className="footer-logo">
              <h2 className="footer-title">📚 VTU NOTE</h2>
            </div>
            <p className="footer-about">
              Your comprehensive platform for VTU study materials. Generate flashcards, summaries, and key concepts from your PDF notes with AI-powered technology.
            </p>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Quick Links</h3>
            <div className="footer-links">
              <Link to="/upload" className="social-link">📤 Upload PDF</Link>
              <Link to="/notes" className="social-link">📝 My Notes</Link>
              <Link to="/flashcards" className="social-link">🎯 Flashcards</Link>
              <Link to="/dashboard" className="social-link">📊 Dashboard</Link>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Contact Us</h3>
            <div className="footer-links">
              <div className="social-link">📧 support@vtunote.com</div>
              <div className="social-link">📞 +91 98765 43210</div>
              <div className="social-link">🏫 VTU, Belagavi</div>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Follow Us</h3>
            <div className="footer-links">
              <a href="#" className="social-link">📘 Facebook</a>
              <a href="#" className="social-link">🐦 Twitter</a>
              <a href="#" className="social-link">📱 LinkedIn</a>
              <a href="#" className="social-link">📸 Instagram</a>
            </div>
          </div>
        </div>

        <div className="footer-copyright">
          <p>&copy; 2025 VTU NOTE Platform. All rights reserved. Designed for VTU students.</p>
        </div>
      </footer>
    </div>
  );
}