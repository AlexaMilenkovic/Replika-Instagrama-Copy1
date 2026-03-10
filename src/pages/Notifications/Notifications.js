import React, { useState } from 'react';

function Notifications() {
  const [zahtevi, setZahtevi] = useState([
    { id: 1, username: "neko_tajni", fullName: "Neko", avatar: "/slike/radnja.jfif" },
    { id: 2, username: "programer_99", fullName: "Marko", avatar: "/slike/outfit.jpg" }
  ]);

  const ukloniZahtev = (id) => {
    setZahtevi(zahtevi.filter(z => z.id !== id));
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Obaveštenja</h2>
      </div>

      <div style={contentStyle}>
        <h4 style={{ color: 'gray', marginTop: 0 }}>Zahtevi za praćenje</h4>
        {zahtevi.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'gray', marginTop: '20px' }}>Nema novih zahteva.</p>
        ) : (
          zahtevi.map(zahtev => (
            <div key={zahtev.id} style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={zahtev.avatar} alt="avatar" style={avatarStyle} />
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{zahtev.username}</span>
              </div>
              <div>
                <button onClick={() => ukloniZahtev(zahtev.id)} style={acceptBtnStyle}>Prihvati</button>
                <button onClick={() => ukloniZahtev(zahtev.id)} style={rejectBtnStyle}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const containerStyle = { backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const headerStyle = { width: '100%', maxWidth: '470px', padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #dbdbdb' };
const contentStyle = { width: '100%', maxWidth: '470px', backgroundColor: 'white', flex: 1, padding: '20px 15px' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #efefef' };
const avatarStyle = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', marginRight: '10px', border: '1px solid #dbdbdb' };
const acceptBtnStyle = { backgroundColor: '#0095f6', color: 'white', border: 'none', borderRadius: '5px', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer', marginRight: '8px', fontSize: '12px' };
const rejectBtnStyle = { backgroundColor: '#efefef', color: 'black', border: 'none', borderRadius: '5px', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };

export default Notifications;