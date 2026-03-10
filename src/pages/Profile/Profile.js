import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const [tipProfila, setTipProfila] = useState('privatni'); 
  const [statusPracenja, setStatusPracenja] = useState('ne_prati'); 
  const [isEditing, setIsEditing] = useState(false);
  const [blokiran, setBlokiran] = useState(false); 
  
  const [prikaziPratioce, setPrikaziPratioce] = useState(false);
  const [prikaziPrati, setPrikaziPrati] = useState(false);

  
  const [mojProfil, setMojProfil] = useState({
    username: "ksenija_dev",
    fullName: "Ksenija",
    bio: "opis 💻✨",
    avatar: "/slike/radnja.jfif"
  });

  // Lista pratilaca u useState 
  const [listaPratilaca, setListaPratilaca] = useState([
    { id: 1, username: "ana_marija", fullName: "Ana Marija", avatar: "/slike/outfit.jpg" },
    { id: 2, username: "programer_99", fullName: "Marko Marković", avatar: "/slike/radnja.jfif" },
    { id: 3, username: "neko_tajni", fullName: "Neko", avatar: "/slike/outfit.jpg" }
  ]);

  const [tempPodaci, setTempPodaci] = useState({ username: '', fullName: '', bio: '' });

  const userProfile = {
    username: tipProfila === 'moj' ? mojProfil.username : (tipProfila === 'javni' ? "ana_marija" : "neko_tajni"),
    fullName: tipProfila === 'moj' ? mojProfil.fullName : (tipProfila === 'javni' ? "Ana Marija" : "Neko"),
    bio: tipProfila === 'moj' ? mojProfil.bio : "Samo pozitivna energija ✨",
    followers: tipProfila === 'moj' ? listaPratilaca.length : 890,
    following: tipProfila === 'moj' ? 350 : 400,
    posts: tipProfila === 'moj' ? 4 : 0,
    avatar: tipProfila === 'moj' ? mojProfil.avatar : "/slike/outfit.jpg"
  };

  const userPosts = [
    "/slike/radnja.jfif", "/slike/slikaa.jpg", "/slike/outfit.jpg", "/slike/macka.jfif"
  ];

  // f-ja koja izbacuje osobu sa liste 
  const ukloniPratioca = (id) => {
    setListaPratilaca(listaPratilaca.filter(p => p.id !== id));
  };

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

  const otvoriProzorZaIzmenu = () => {
    setTempPodaci({
      username: mojProfil.username,
      fullName: mojProfil.fullName,
      bio: mojProfil.bio
    });
    setIsEditing(true);
  };

  const sacuvajIzmene = () => {
    setMojProfil({
      ...mojProfil,
      username: tempPodaci.username,
      fullName: tempPodaci.fullName,
      bio: tempPodaci.bio
    });
    setIsEditing(false); 
  };

  const mozeDaVidiSlike = tipProfila === 'moj' || tipProfila === 'javni' || (tipProfila === 'privatni' && statusPracenja === 'prati');

  return (
    <div style={containerStyle}>
      <div style={devToolsStyle}>
        <span style={{fontSize: '12px', fontWeight: 'bold'}}>TESTIRANJE UI: </span> 
        <button onClick={() => { setTipProfila('moj'); setStatusPracenja('ne_prati'); setBlokiran(false); }}>Moj Profil</button>
        <button onClick={() => { setTipProfila('javni'); setStatusPracenja('ne_prati'); setBlokiran(false); }}>Javni Profil</button>
        <button onClick={() => { setTipProfila('privatni'); setStatusPracenja('ne_prati'); setBlokiran(false); }}>Privatni Profil</button>
      </div>

      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>{userProfile.username}</h2>
        <span style={{ fontSize: '20px', cursor: 'pointer' }}>≡</span>
      </div>

      <div style={profileInfoStyle}>
        <img src={userProfile.avatar} alt="Avatar" style={avatarStyle} />
        <div style={statsContainerStyle}>
          <div style={statItemStyle}>
            <strong>{mozeDaVidiSlike ? userPosts.length : 0}</strong><span style={statLabelStyle}>objava</span>
          </div>
          <div style={{...statItemStyle, cursor: 'pointer'}} onClick={() => mozeDaVidiSlike && setPrikaziPratioce(true)}>
            <strong>{userProfile.followers}</strong><span style={statLabelStyle}>pratilaca</span>
          </div>
          <div style={{...statItemStyle, cursor: 'pointer'}} onClick={() => mozeDaVidiSlike && setPrikaziPrati(true)}>
            <strong>{userProfile.following}</strong><span style={statLabelStyle}>prati</span>
          </div>
        </div>
      </div>

      <div style={bioStyle}>
        <strong>{userProfile.fullName}</strong>
        <p style={{ margin: '5px 0' }}>{userProfile.bio}</p>
      </div>

      <div style={actionButtonStyle}>
        {tipProfila === 'moj' ? (
          <>
            <button onClick={otvoriProzorZaIzmenu} style={editButtonStyle}>Uredi profil</button>
            <button onClick={() => navigate('/login')} style={{...editButtonStyle, marginLeft: '5px', backgroundColor: '#efefef'}}>Odjavi se</button>
          </>
        ) : (
          <>
            <button onClick={handleFollowClick} style={statusPracenja === 'ne_prati' ? followButtonStyle : followingButtonStyle}>
              {statusPracenja === 'ne_prati' ? 'Zaprati' : (statusPracenja === 'poslat_zahtev' ? 'Zahtev poslat' : 'Praćenje')}
            </button>
            <button onClick={() => setBlokiran(!blokiran)} style={{...followingButtonStyle, marginLeft: '5px', color: blokiran ? 'white' : 'red', backgroundColor: blokiran ? 'red' : '#efefef'}}>
              {blokiran ? 'Odblokiraj' : 'Blokiraj'}
            </button>
          </>
        )}
      </div>

      {!mozeDaVidiSlike ? (
        <div style={privateProfileContainerStyle}>
          <span style={{ fontSize: '50px' }}>⊘</span>
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

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Uredi profil</h3>
            <label style={labelStyle}>Ime</label>
            <input type="text" value={tempPodaci.fullName} onChange={(e) => setTempPodaci({...tempPodaci, fullName: e.target.value})} style={inputStyle} />
            <label style={labelStyle}>Korisničko ime</label>
            <input type="text" value={tempPodaci.username} onChange={(e) => setTempPodaci({...tempPodaci, username: e.target.value})} style={inputStyle} />
            <label style={labelStyle}>Biografija</label>
            <textarea value={tempPodaci.bio} onChange={(e) => setTempPodaci({...tempPodaci, bio: e.target.value})} style={textareaStyle} />
            <div style={modalButtonContainerStyle}>
              <button onClick={() => setIsEditing(false)} style={cancelModalBtnStyle}>Odustani</button>
              <button onClick={sacuvajIzmene} style={saveModalBtnStyle}>Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {prikaziPratioce && (
        <div style={modalOverlayStyle}>
          <div style={listModalStyle}>
            <div style={listHeaderStyle}>
              <h3 style={{ margin: 0 }}>Pratioci</h3>
              <button onClick={() => setPrikaziPratioce(false)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={listContainerStyle}>
              {listaPratilaca.map(korisnik => (
                <div key={korisnik.id} style={userRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={korisnik.avatar} alt="avatar" style={listAvatarStyle} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{korisnik.username}</div>
                      <div style={{ color: 'gray', fontSize: '14px' }}>{korisnik.fullName}</div>
                    </div>
                  </div>
                  {tipProfila === 'moj' && (
                    <button 
                      onClick={() => ukloniPratioca(korisnik.id)} 
                      style={removeBtnStyle}
                    >
                      Ukloni
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {prikaziPrati && (
        <div style={modalOverlayStyle}>
          <div style={listModalStyle}>
            <div style={listHeaderStyle}>
              <h3 style={{ margin: 0 }}>Prati</h3>
              <button onClick={() => setPrikaziPrati(false)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={listContainerStyle}>

              {listaPratilaca.map(korisnik => (
                <div key={korisnik.id} style={userRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={korisnik.avatar} alt="avatar" style={listAvatarStyle} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{korisnik.username}</div>
                      <div style={{ color: 'gray', fontSize: '14px' }}>{korisnik.fullName}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
const editButtonStyle = { width: '100%', padding: '7px 0', backgroundColor: '#efefef', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1 };
const followButtonStyle = { width: '100%', padding: '7px 0', backgroundColor: '#0095f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1 };
const followingButtonStyle = { width: '100%', padding: '7px 0', backgroundColor: '#efefef', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1 };
const gridStyle = { width: '100%', maxWidth: '470px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', backgroundColor: 'white', borderTop: '1px solid #dbdbdb', paddingTop: '2px' };
const gridItemStyle = { width: '100%', aspectRatio: '1 / 1' }; 
const gridImageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const privateProfileContainerStyle = { width: '100%', maxWidth: '470px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', backgroundColor: 'white', borderTop: '1px solid #dbdbdb' };
const modalOverlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContentStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' };
const inputStyle = { padding: '8px', border: '1px solid #dbdbdb', borderRadius: '5px', outline: 'none' };
const textareaStyle = { padding: '8px', border: '1px solid #dbdbdb', borderRadius: '5px', outline: 'none', resize: 'none', height: '60px' };
const modalButtonContainerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' };
const cancelModalBtnStyle = { padding: '8px 15px', backgroundColor: '#efefef', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' };
const saveModalBtnStyle = { padding: '8px 15px', backgroundColor: '#0095f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' };
const listModalStyle = { backgroundColor: 'white', borderRadius: '10px', width: '90%', maxWidth: '400px', maxHeight: '60vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const listHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #dbdbdb' };
const closeBtnStyle = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' };
const listContainerStyle = { padding: '10px 15px', overflowY: 'auto' };
const userRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' };
const listAvatarStyle = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px', border: '1px solid #dbdbdb' };
const removeBtnStyle = { background: '#efefef', border: 'none', borderRadius: '5px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };

export default Profile;