import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Timeline from './pages/Timeline/Timeline';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Navbar from './components/Navbar';
import CreatePost from './pages/CreatePost/CreatePost';
import Search from './pages/Search/Search';
import Notifications from './pages/Notifications/Notifications'; 

function App() {
  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '60px' }}> 
        
        <h1 style={hiddenTitleStyle}>
          Instagram Replica
        </h1>

        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </div>
      <Navbar />
    </Router>
  );
}

//zbog testa naslov aplikacije
const hiddenTitleStyle = {
  position: 'absolute', 
  top: '10px',
  left: '10px',
  fontSize: '14px',      
  color: '#262626',      
  margin: 0,
  fontWeight: 'bold',
  zIndex: 9999,          
  pointerEvents: 'none'  
};

export default App;