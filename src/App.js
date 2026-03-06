import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Timeline from './pages/Timeline/Timeline';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div style={{ paddingBottom: '60px' }}> 
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
      <Navbar />
    </Router>
  );
}

export default App;