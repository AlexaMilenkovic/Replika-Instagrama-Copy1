import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Uvozimo funkciju za navigaciju

function Search() {
  const [upit, setUpit] = useState('');
  const navigate = useNavigate(); // Aktiviramo navigaciju

  // Privremena baza korisnika (dok ne dodje pravi backend)
  const sviKorisnici = [
    { id: 1, username: "ana_marija", fullName: "Ana Marija", avatar: "/slike/outfit.jpg" },
    { id: 2, username: "neko_tajni", fullName: "Neko", avatar: "/slike/radnja.jfif" },
    { id: 3, username: "ksenija_dev", fullName: "Ksenija", avatar: "/slike/radnja.jfif" },
    { id: 4, username: "programer_99", fullName: "Marko Marković", avatar: "/slike/outfit.jpg" }
  ];

  // da probam
  const rezultati = sviKorisnici.filter(korisnik => 
    korisnik.username.toLowerCase().includes(upit.toLowerCase()) || 
    korisnik.fullName.toLowerCase().includes(upit.toLowerCase())
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <input 
          type="text" 
          placeholder="Pretraži po imenu ili korisničkom imenu..." 
          value={upit}
          onChange={(e) => setUpit(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      <div style={resultsStyle}>
        {upit === '' ? (
          <div style={emptyStateStyle}>
            <span style={{ fontSize: '40px' }}>🔍</span>
            <p>Unesite ime za pretragu...</p>
          </div>
        ) : rezultati.length > 0 ? (
          rezultati.map(korisnik => (
            // klik koji vodi na profil
            <div 
              key={korisnik.id} 
              style={userRowStyle} 
              onClick={() => navigate('/profile', { state: { korisnik } })}
            >
              <img src={korisnik.avatar} alt="avatar" style={avatarStyle} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{korisnik.username}</div>
                <div style={{ color: 'gray', fontSize: '14px' }}>{korisnik.fullName}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={emptyStateStyle}>
            <p>Nema rezultata za "{upit}".</p>
          </div>
        )}
      </div>
    </div>
  );
}

// STILOVI
const containerStyle = { backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const headerStyle = { width: '100%', maxWidth: '470px', padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #dbdbdb' };
const searchInputStyle = { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #dbdbdb', outline: 'none', fontSize: '14px', backgroundColor: '#efefef' };
const resultsStyle = { width: '100%', maxWidth: '470px', backgroundColor: 'white', flex: 1 };
const userRowStyle = { display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #efefef', cursor: 'pointer' };
const avatarStyle = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px', border: '1px solid #dbdbdb' };
const emptyStateStyle = { textAlign: 'center', color: 'gray', marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' };

export default Search;