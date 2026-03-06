import React, { useState } from 'react';

function Profile() {
  const [tipProfila, setTipProfila] = useState('privatni'); 
  const [statusPracenja, setStatusPracenja] = useState('ne_prati'); 
  const [isEditing, setIsEditing] = useState(false);

  // pokusaj promenicu: Memorija koja trajno pamti tvoje prave podatke
  const [mojProfil, setMojProfil] = useState({
    username: "ksenija_dev",
    fullName: "Ksenija",
    bio: "lalalalala 💻",
    avatar: "/slike/radnja.jfif"
  });

  // privremena memorija dok kucan u prozoru (da ne menja odmah na ekranu dok ne stisnem Sacuvaj)
  const [tempPodaci, setTempPodaci] = useState({ username: '', fullName: '', bio: '' });

  // dinamicko pravljenje profila na osnovu onoga sto izaberem u zutoj traci - privremeno - da vidim sve tipove profila
  const userProfile = {
    username: tipProfila === 'moj' ? mojProfil.username : (tipProfila === 'javni' ? "ana_marija" : "neko_tajni"),
    fullName: tipProfila === 'moj' ? mojProfil.fullName : (tipProfila === 'javni' ? "Ana Marija" : "Neko"),
    bio: tipProfila === 'moj' ? mojProfil.bio : "Samo pozitivna energija ✨",
    followers: tipProfila === 'moj' ? 1240 : 890,
    following: tipProfila === 'moj' ? 350 : 400,
    posts: tipProfila === 'moj' ? 4 : 0,
    avatar: tipProfila === 'moj' ? mojProfil.avatar : "/slike/outfit.jpg"
  };

  const userPosts = [
    "/slike/radnja.jfif", "/slike/slikaa.jpg", "/slike/outfit.jpg", "/slike/macka.jfif"
  ];

  const handleFollowClick = () => {
    if (statusPracenja === 'prati' || statusPracenja === 'poslat_zahtev') {
      setStatusPracenja('ne_prati'); 
    } else {
      if (tipProfila === 'javni') {
        setStatusPracenja('prati'); 
      } else if (tipProfila === 'privatni') {
        setStatusPracenja('poslat_zahtev'); 
      }
    }
  };

  // Dunkcija koja se poziva kad kliknem Uredi profil
  const otvoriProzorZaIzmenu = () => {
    // Ubacujemoo trenutne podatke u prozor pre nego sto se otvori
    setTempPodaci({
      username: mojProfil.username,
      fullName: mojProfil.fullName,
      bio: mojProfil.bio
    });
    setIsEditing(true);
  };

  // Funkcija koja se poziva kad kliknem Sacuvaj
  const sacuvajIzmene = () => {
    setMojProfil({
      ...mojProfil, // Zadrži staru sliku
      username: tempPodaci.username,
      fullName: tempPodaci.fullName,
      bio: tempPodaci.bio
    });
    setIsEditing(false); // Zatvori prozor
  };

  const mozeDaVidiSlike = tipProfila === 'moj' || tipProfila === 'javni' || (tipProfila === 'privatni' && statusPracenja === 'prati');

  return (
    <div style={containerStyle}>
      <div style={devToolsStyle}>
        <span style={{fontSize: '12px', fontWeight: 'bold'}}>TESTIRANJE UI: </span> 
        <button onClick={() => { setTipProfila('moj'); setStatusPracenja('ne_prati'); }}>Moj Profil</button>
        <button onClick={() => { setTipProfila('javni'); setStatusPracenja('ne_prati'); }}>Javni Profil</button>
        <button onClick={() => { setTipProfila('privatni'); setStatusPracenja('ne_prati'); }}>Privatni Profil</button>
      </div>

      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>{userProfile.username}</h2>
        <span style={{ fontSize: '20px', cursor: 'pointer' }}>☰</span>
      </div>

      <div style={profileInfoStyle}>
        <img src={userProfile.avatar} alt="Avatar" style={avatarStyle} />
        <div style={statsContainerStyle}>
          <div style={statItemStyle}><strong>{mozeDaVidiSlike ? userPosts.length : 0}</strong><span style={statLabelStyle}>objava</span></div>
          <div style={statItemStyle}><strong>{userProfile.followers}</strong><span style={statLabelStyle}>pratilaca</span></div>
          <div style={statItemStyle}><strong>{userProfile.following}</strong><span style={statLabelStyle}>prati</span></div>
        </div>
      </div>

      <div style={bioStyle}>
        <strong>{userProfile.fullName}</strong>
        <p style={{ margin: '5px 0' }}>{userProfile.bio}</p>
      </div>

      <div style={actionButtonStyle}>
        {tipProfila === 'moj' ? (
          <button onClick={otvoriProzorZaIzmenu} style={editButtonStyle}>Uredi profil</button>
        ) : (
          <button onClick={handleFollowClick} style={statusPracenja === 'ne_prati' ? followButtonStyle : followingButtonStyle}>
            {statusPracenja === 'ne_prati' ? 'Zaprati' : (statusPracenja === 'poslat_zahtev' ? 'Zahtev poslat' : 'Praćenje')}
          </button>
        )}
      </div>

      {!mozeDaVidiSlike ? (
        <div style={privateProfileContainerStyle}>
          <span style={{ fontSize: '50px' }}>🔒</span>
          <h3>Ovaj profil je privatan</h3>
          <p style={{ color: 'gray', textAlign: 'center', margin: '0 20px' }}>Zaprati ovaj profil da bi video/la njegove fotografije.</p>
        </div>
      ) : (
        <div style={gridStyle}>
          {userPosts.map((postImage, index) => (
            <div key={index} style={gridItemStyle}>
              <img src={postImage} alt={`Post ${index}`} style={gridImageStyle} />
            </div>
          ))}
        </div>
      )}

      {/* RENDER MODALA ZA IZMENU PROFILA SA POVEZANIM POLJIMA */}
      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Uredi profil</h3>
            
            <label style={labelStyle}>Ime</label>
            <input 
              type="text" 
              value={tempPodaci.fullName} 
              onChange={(e) => setTempPodaci({...tempPodaci, fullName: e.target.value})}
              style={inputStyle} 
            />
            
            <label style={labelStyle}>Korisničko ime</label>
            <input 
              type="text" 
              value={tempPodaci.username} 
              onChange={(e) => setTempPodaci({...tempPodaci, username: e.target.value})}
              style={inputStyle} 
            />
            
            <label style={labelStyle}>Biografija</label>
            <textarea 
              value={tempPodaci.bio} 
              onChange={(e) => setTempPodaci({...tempPodaci, bio: e.target.value})}
              style={textareaStyle}
            />
            
            <div style={modalButtonContainerStyle}>
              <button onClick={() => setIsEditing(false)} style={cancelModalBtnStyle}>Odustani</button>
              <button onClick={sacuvajIzmene} style={saveModalBtnStyle}>Sačuvaj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STILOVI 
const containerStyle = { backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' };
const devToolsStyle = { width: '100%', maxWidth: '470px', backgroundColor: '#ffeaa7', padding: '5px', display: 'flex', gap: '5px', justifyContent: 'center' };
const headerStyle = { width: '100%', maxWidth: '470px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #dbdbdb' };
const profileInfoStyle = { width: '100%', maxWidth: '470px', display: 'flex', alignItems: 'center', padding: '20px 15px', backgroundColor: 'white' };
const avatarStyle = { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #dbdbdb' };
const statsContainerStyle = { flex: 1, display: 'flex', justifyContent: 'space-around', marginLeft: '20px' };
const statItemStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '16px' };
const statLabelStyle = { fontSize: '14px', color: 'gray' };
const bioStyle = { width: '100%', maxWidth: '470px', padding: '0 15px 15px 15px', backgroundColor: 'white', fontSize: '14px' };
const actionButtonStyle = { width: '100%', maxWidth: '470px', display: 'flex', justifyContent: 'center', padding: '0 15px 20px 15px', backgroundColor: 'white' };
const editButtonStyle = { width: '100%', padding: '7px 0', backgroundColor: '#efefef', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const followButtonStyle = { width: '100%', padding: '7px 0', backgroundColor: '#0095f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const followingButtonStyle = { width: '100%', padding: '7px 0', backgroundColor: '#efefef', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const gridStyle = { width: '100%', maxWidth: '470px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', backgroundColor: 'white', borderTop: '1px solid #dbdbdb', paddingTop: '2px' };
const gridItemStyle = { width: '100%', aspectRatio: '1 / 1' }; 
const gridImageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const privateProfileContainerStyle = { width: '100%', maxWidth: '470px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', backgroundColor: 'white', borderTop: '1px solid #dbdbdb' };

// STILOVI ZA MODAL PROZOR
const modalOverlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContentStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' };
const inputStyle = { padding: '8px', border: '1px solid #dbdbdb', borderRadius: '5px', outline: 'none' };
const textareaStyle = { padding: '8px', border: '1px solid #dbdbdb', borderRadius: '5px', outline: 'none', resize: 'none', height: '60px' };
const modalButtonContainerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' };
const cancelModalBtnStyle = { padding: '8px 15px', backgroundColor: '#efefef', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' };
const saveModalBtnStyle = { padding: '8px 15px', backgroundColor: '#0095f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' };

export default Profile;