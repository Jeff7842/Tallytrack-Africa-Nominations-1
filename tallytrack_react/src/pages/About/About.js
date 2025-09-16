// src/pages/About/About.js
import React, { useEffect } from 'react';
import './About.css';

const About = () => {

  useEffect(() => {
    // Initialize hero image animation
    setTimeout(() => {
      const heroImage = document.getElementById('about-hero-image');
      if (heroImage) heroImage.classList.add('active');
    }, 300);
    
    // Initialize scroll animations
    initScrollAnimations();
  }, []);

  const initScrollAnimations = () => {
    const elements = document.querySelectorAll('.trust-card, .opportunity-card, .value-item, .stat-item');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    }, { threshold: 0.1 });
    
    elements.forEach(element => {
      observer.observe(element);
    });
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
      const header = document.getElementById('header');
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  };

  return (
    <div className="about-page">
      {/* About Hero Section */}
      <section className="about-hero">
        <div className="about-hero-image" id="about-hero-image"></div>
        <div className="about-hero-overlay"></div>
        
        <div className="container">
          <div className="about-hero-content">
            <h1 className="hero-title">Get to Know <span>TallyTrack Africa</span></h1>
            <p className="hero-description">Discover the vision behind Africa's most trusted platform for recognizing and rewarding excellence among the next generation of leaders and innovators.</p>
            <div className="hero-buttons">
              <a href="#trust" className="btn btn-primary">Why Trust Us</a>
              <a href="#empowerment" className="btn btn-outline">Our Mission</a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section" id="trust">
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Why Choose Us</span>
            <h2 className="section-title">Your Vote Matters & We Protect It</h2>
            <p className="section-description">We've built a platform with integrity at its core, ensuring every vote counts and every voice is heard.</p>
          </div>
          
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3 className="trust-title">Secure Voting</h3>
              <p>Advanced encryption and verification systems protect every vote from manipulation, ensuring fair and transparent results.</p>
            </div>
            
            <div className="trust-card">
              <div className="trust-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="trust-title">Real-time Tracking</h3>
              <p>Watch votes accumulate in real-time with our transparent tracking system that leaves no room for doubt.</p>
            </div>
            
            <div className="trust-card">
              <div className="trust-icon">
                <i className="fas fa-users-cog"></i>
              </div>
              <h3 className="trust-title">Independent Auditing</h3>
              <p>Third-party verification of all voting processes guarantees the integrity of our results and builds confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Empowerment Section */}
      <section className="empowerment-section" id="empowerment">
        <div className="container">
          <div className="empowerment-content">
            <span className="section-subtitle">Our Purpose</span>
            <h2 className="section-title">Empowering Africa's Next Generation</h2>
            <p className="section-description">
              TallyTrack Africa was built on the belief that young Africans deserve recognition for their outstanding contributions 
              and a platform that connects them with life-changing opportunities. We're not just about awards—we're about creating pathways to success.
            </p>
            
            <div className="opportunity-cards">
              <div className="opportunity-card">
                <div className="opportunity-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <h3>Recognition That Matters</h3>
                <p>We spotlight exceptional talent across diverse fields, giving visibility to those who are shaping Africa's future through innovation, creativity, and leadership.</p>
              </div>
              
              <div className="opportunity-card">
                <div className="opportunity-icon">
                  <i className="fas fa-handshake"></i>
                </div>
                <h3>Connecting Talent with Opportunity</h3>
                <p>Our platform serves as a bridge between exceptional individuals and organizations seeking fresh talent, investment opportunities, and partnerships.</p>
              </div>
              
              <div className="opportunity-card">
                <div className="opportunity-icon">
                  <i className="fas fa-globe-africa"></i>
                </div>
                <h3>Pan-African Network</h3>
                <p>Join a continent-wide community of innovators, creators, and leaders who are driving change and creating impact in their communities.</p>
              </div>
              
              <div className="opportunity-card">
                <div className="opportunity-icon">
                  <i className="fas fa-rocket"></i>
                </div>
                <h3>Accelerating Growth</h3>
                <p>Winners and notable nominees gain access to mentorship programs, funding opportunities, and platforms that amplify their work to wider audiences.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Our Foundation</span>
            <h2 className="section-title">Core Values That Guide Us</h2>
            <p className="section-description">These principles shape every aspect of our platform and our relationship with the community we serve.</p>
          </div>
          
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">
                <i className="fas fa-eye"></i>
              </div>
              <div className="value-content">
                <h3>Transparency</h3>
                <p>We believe in open processes and clear communication, ensuring that every participant understands how the system works.</p>
              </div>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <i className="fas fa-balance-scale"></i>
              </div>
              <div className="value-content">
                <h3>Fairness</h3>
                <p>Every nominee is evaluated on their merits, and every vote carries equal weight in our system.</p>
              </div>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <div className="value-content">
                <h3>Innovation</h3>
                <p>We continuously evolve our platform to incorporate the latest technology while maintaining accessibility.</p>
              </div>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <i className="fas fa-heart"></i>
              </div>
              <div className="value-content">
                <h3>Community</h3>
                <p>We prioritize building a supportive ecosystem where African talent can thrive and collaborate.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">By The Numbers</span>
            <h2 className="section-title">Our Impact</h2>
            <p className="section-description">The results of our work in empowering young Africans across the continent</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-value">15,000+</div>
              <div className="stat-label">Active Nominees</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <i className="fas fa-vote-yea"></i>
              </div>
              <div className="stat-value">2.5M+</div>
              <div className="stat-label">Votes Cast</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="stat-value">240+</div>
              <div className="stat-label">Awards Given</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <i className="fas fa-globe-africa"></i>
              </div>
              <div className="stat-value">28</div>
              <div className="stat-label">African Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Ready to Make Your Voice Count?</h2>
            <p className="section-description">
              Join thousands of Africans who are already participating in recognizing and elevating exceptional talent across the continent.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '2rem' }}>
              <a href="/#nominees" className="btn btn-primary">View Nominees</a>
              <a href="/#voting" className="btn btn-outline">Learn How to Vote</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;