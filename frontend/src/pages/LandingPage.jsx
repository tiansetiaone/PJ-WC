import React from "react";
import "../style/LandingPage.css";
import logoImage from "../assets/logo-blasterc-blue.png";
import aw from "../assets/a&w.png";
import binance from "../assets/binance.png";
import bitcoinlogo from "../assets/bitcoin-logo.png";
import cardano from "../assets/cardano-logo.png";
import diy from "../assets/diy-logo.png";
import eth from "../assets/eth.png";
import etiqa from "../assets/etiqa-logo.png";
import fpx from "../assets/fpxlogo.jpg";
import grabPay from "../assets/grab_pay.png";
import mb from "../assets/Marrybrown_Logo.png";
import payPal from "../assets/paypal_logo.png";
import proton from "../assets/proton-Logo.png";
import stripe from "../assets/Stripe_logo.png";
import tether from "../assets/tether.png";
import univmalaya from "../assets/university-malaya.png";
import { Bitcoin, Theater } from "lucide-react";

const LandingPage = () => {
  return (
    <div>
      {/* Header */}
      <header className="header-lp">
        <div className="container-lp">
          <div className="header-content">
            <div className="logo">
        <img src={logoImage} alt="BLASTERC" className="logo-img" />
            </div>
            <div className="auth-buttons">
              <a href="/login" className="btn-lp btn-login">Login</a>
              <a href="/register" className="btn-lp btn-register">Register</a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container-lp">
          <h1>Introducing</h1>
          <h2>The Biggest WhatsApp And SMS Blasting Platform in ASEAN</h2>
          <p>
            We provide a variety of WhatsApp And SMS blasting services and
            online marketing solutions using WhatsApp And SMS to help you
            connect with and re-engage your customers. With our WhatsApp blast
            software, you can deliver texts, images, documents, videos, and more
            to your audience through our advanced bulk messaging system.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container-lp">
          <div className="features-content">
            <div className="features-text">
              <h3>Why Choose BlasterPro?</h3>
              <ul className="feature-list">
                <li className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-chart-bar"></i>
                  </div>
                  <div>
                    <h4>Biggest Mobile Marketing Blasting Platform in ASEAN</h4>
                  </div>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-tag"></i>
                  </div>
                  <div>
                    <h4>Lowest Price In The Market.</h4>
                    <p>Starting At Only $0,003</p>
                  </div>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-truck-fast"></i>
                  </div>
                  <div>
                    <h4>High Broadcast Delivery Rates</h4>
                    <p>95% Success Rate</p>
                  </div>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-laptop"></i>
                  </div>
                  <div>
                    <h4>Web Based Control Panel</h4>
                    <p>No Installation Required.</p>
                  </div>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-globe"></i>
                  </div>
                  <div>
                    <h4>Auto Country Code Converter</h4>
                  </div>
                </li>
              </ul>
            </div>
            <div className="features-image">
              <div className="messaging-icons">
                <div className="icon-wrapper whatsapp-icon">
                  <i className="fab fa-whatsapp"></i>
                </div>
                <div className="icon-wrapper sms-icon">
                  <i className="fas fa-sms"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="clients">
        <div className="container-lp">
          <h3>Our Client</h3>
          <div className="client-logos">
            <div className="client-logo">
              <img src={etiqa} alt="etiqa" />
            </div>
            <div className="client-logo">
              <img src={aw} alt="AW" />
            </div>
            <div className="client-logo">
              <img src={univmalaya} alt="univ-malaya" />
            </div>
            <div className="client-logo">
              <img src={diy} alt="DIY" />
            </div>
            <div className="client-logo">
              <img src={proton} alt="proton" />
            </div>
            <div className="client-logo">
              <img src={mb} alt="Marry-brown" />
            </div>
          </div>
          <div className="client-count">10,500+</div>
          <div className="client-label">Satisfied Customers</div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container-lp">
          <div className="footer-content">
            <div className="payment-methods">
              <h4 className="footer-title">Payment Method:</h4>
               <div className="crypto-payments1">
                <span className="crypto-badge">
                  <img src={payPal} alt="Tether" />
                  <h6>PayPal</h6>
                </span>
                <span className="crypto-badge">
                  <img src={stripe} alt="Tether" />
                  <h6>Stripe</h6>
                </span>
                <span className="crypto-badge">
                  <img src={fpx} alt="Tether" />
                  <h6>FPX</h6>
                </span>
                <span className="crypto-badge">
                  <img src={grabPay} alt="Tether" />
                  <h6>Grab Pay</h6>
                </span>
              </div>
              <p>Crypto Payments Accepted</p>
              <div className="crypto-payments">
                <span className="crypto-badge">
                  <img src={bitcoinlogo} alt="Tether" />
                  <h6>Bitcoin</h6>
                </span>
                <span className="crypto-badge">
                  <img src={eth} alt="Tether" />
                  <h6>Etheureum</h6>
                </span>
                <span className="crypto-badge">
                  <img src={cardano} alt="Tether" />
                  <h6>Cardano</h6>
                </span>
                <span className="crypto-badge">
                  <img src={binance} alt="Tether" />
                  <h6>Bitcoin</h6>
                </span>
                <span className="crypto-badge">
                  <img src={tether} alt="Tether" />
                  <h6>Bitcoin</h6>
                </span>
              </div>
            </div>
            <div className="support-contact">
              <h4 className="footer-title">Contact Support</h4>
              <p>
                <i className="fas fa-envelope"></i>{" "}
                <a href="mailto:blastercsupport@gmail.com">
                  blastercsupport@gmail.com
                </a>
              </p>
              <p>
                <i className="fab fa-telegram"></i>{" "}
                <a href="https://t.me/blastercsupport" target="_blank" rel="noreferrer">
                  t.me/blastercsupport
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
