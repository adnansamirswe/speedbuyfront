import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { Home } from './components/Homepage/Home';
import { Signup } from './components/auth/Signup';
import { AddMoney } from './components/AddMoney/AddMoney';
import { Dashboard } from './dashboard/Dashboard';
import { ForgotPassword } from './components/auth/ForgotPassword';

import { Tools } from './components/Homepage/Tools';
import { Contact } from './components/Homepage/Contact';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/addmoney" element={<AddMoney />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
