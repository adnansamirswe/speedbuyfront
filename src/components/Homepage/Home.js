import React from 'react';
import { Link } from 'react-router-dom';

import './Home.css';

export function Home() {
  return (
    <header>
      <nav className="navbar">
        <div className="logo"><a href="#">SPEED</a></div>
        <ul className="menu">
          <li><Link to="/tools">Tools</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
        <div className="buttons">
          <Link to="/login"><button>Login</button></Link> {/* Link to the login page */}
          <Link to="/signup"><button>Signup</button></Link> {/* Link to the signup page */}
        </div>
      </nav>
      <div className="text-content">
        <p>This is an automated web app where you can buy SOCKS5 proxies. Unlike buying locally where issues require contacting the seller for fixes, here you can solve problems yourself.</p>
        <p>We introduce a Proxy Regenerator to quickly fix non-working or slow proxies by changing servers, eliminating the need to rely on sellers for troubleshooting.</p>
      </div>
    </header>
  );
}
