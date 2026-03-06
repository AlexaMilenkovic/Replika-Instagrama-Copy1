import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate(); // Funkcija za prebacivanje stranica
  const location = useLocation(); // Da znamo na kojoj smo trenutno stranici

  return (
    <div style={navbarContainerStyle}>
      <div style={navbarStyle}>
        {/* Ikonica za Kućicu (Timeline) */}
        <span 
          onClick={() => navigate('/')} 
          style={{ ...iconStyle, opacity: location.pathname === '/' ? 1 : 0.4 }}
        >
          🏠
        </span>
        
        {/* Ikonica za Profil */}
        <span 
          onClick={() => navigate('/profile')} 
          style={{ ...iconStyle, opacity: location.pathname === '/profile' ? 1 : 0.4 }}
        >
          👤
        </span>
      </div>
    </div>
  );
}

// STILOVI ZA MENI (Zakačen za dno ekrana)
const navbarContainerStyle = {
  position: 'fixed',
  bottom: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 1000,
  backgroundColor: '#fafafa'
};

const navbarStyle = {
  width: '100%',
  maxWidth: '470px',
  backgroundColor: 'white',
  borderTop: '1px solid #dbdbdb',
  display: 'flex',
  justifyContent: 'space-around',
  padding: '12px 0',
  fontSize: '28px'
};

const iconStyle = {
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'opacity 0.2s'
};

export default Navbar;