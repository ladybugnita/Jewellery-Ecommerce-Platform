import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero-container">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="gold-text">Jewellery</span> Ecommerce Platform
        </h1>
        <p className="hero-subtitle">
          Experience the finest collection of exquisite jewellery, crafted with passion and precision
        </p>
        <div className="hero-buttons">
          <Link to="/login" className="hero-button primary">
            Admin Login
          </Link>
          <Link to="/" className="hero-button secondary">
            Explore Collection
          </Link>
        </div>
      </div>
      <div className="hero-stats">
        <div className="stat-item">
          <h3>500+</h3>
          <p>Unique Designs</p>
        </div>
        <div className="stat-item">
          <h3>1000+</h3>
          <p>Happy Customers</p>
        </div>
        <div className="stat-item">
          <h3>24K</h3>
          <p>Pure Gold</p>
        </div>
        <div className="stat-item">
          <h3>50+</h3>
          <p>Certified Artisans</p>
        </div>
      </div>
    </div>
  );
};

export default Hero;