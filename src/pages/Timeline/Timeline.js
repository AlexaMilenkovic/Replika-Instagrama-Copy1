import React, { useState } from 'react';

function Timeline() {
  const [objave, setObjave] = useState([
    {
      id: 1,
      korisnik: "ana_marija",
      slike: ["/slike/outfit.jpg", "/slike/radnja.jfif"],
      opis: "Današnji outfit! ✨",
      lajkovi: 120,
      indeksSlike: 0,
      komentari: [
        { id: 101, korisnik: "marko_99", tekst: "Top kombinacija!" },
        { id: 102, korisnik: "ksenija_dev", tekst: "Prelepo izgleda." }
      ]
    },
    {
      id: 2,
      korisnik: "ksenija_dev", // moja objava
      slike: ["/slike/radnja.jfif", "/slike/slikaa.jpg"],
      opis: "Radna atmosfera 💻",
      lajkovi: 45,
      indeksSlike: 0,
      komentari: []
    }
  ]);

  const [noviKomentari, setNoviKomentari] = useState({});
  const [izmenaKomentara, setIzmenaKomentara] = useState({ idObjave: null, idKom: null, tekst: '' });
  const [izmenaObjave, setIzmenaObjave] = useState({ idObjave: null, opis: '' });
  const [otvorenMeni, setOtvorenMeni] = useState(null); 
  const [lajkovane, setLajkovane] = useState({});
  const [prikaziKomentare, setPrikaziKomentare] = useState({});

  const toggleLajk = (objavaId) => {
    setLajkovane(prev => ({ ...prev, [objavaId]: !prev[objavaId] }));
  };

  const toggleKomentare = (objavaId) => {
    setPrikaziKomentare(prev => ({ ...prev, [objavaId]: !prev[objavaId] }));
  };

  const promeniSliku = (objavaId, smer) => {
    setObjave(objave.map(obj => {
      if (obj.id === objavaId) {
        let noviIndeks = obj.indeksSlike + smer;
        if (noviIndeks < 0) noviIndeks = obj.slike.length - 1;
        if (noviIndeks >= obj.slike.length) noviIndeks = 0;
        return { ...obj, indeksSlike: noviIndeks };
      }
      return obj;
    }));
  };

  // f-ja za uklanjanje pojedinačne slike iz kolaža
  const obrisiSlikuIzKolaza = (objavaId) => {
    setObjave(prevObjave => {
      return prevObjave.map(obj => {
        if (obj.id === objavaId) {
          const noveSlike = obj.slike.filter((_, i) => i !== obj.indeksSlike);
          // Ako više nema slika, ova objava će se filtrirati u sledećem koraku ili ostati prazna
          return { ...obj, slike: noveSlike, indeksSlike: 0 };
        }
        return obj;
      }).filter(obj => obj.slike.length > 0); // Briše celu objavu ako nema više slika
    });
  };

  const dodajKomentar = (objavaId) => {
    const tekst = noviKomentari[objavaId];
    if (!tekst) return;
    setObjave(objave.map(obj => {
      if (obj.id === objavaId) {
        return { ...obj, komentari: [...obj.komentari, { id: Date.now(), korisnik: "ksenija_dev", tekst }] };
      }
      return obj;
    }));
    setNoviKomentari({ ...noviKomentari, [objavaId]: '' });
    setPrikaziKomentare({ ...prikaziKomentare, [objavaId]: true });
  };

  const obrisiKomentar = (objavaId, komentarId) => {
    setObjave(objave.map(obj => {
      if (obj.id === objavaId) {
        return { ...obj, komentari: obj.komentari.filter(kom => kom.id !== komentarId) };
      }
      return obj;
    }));
  };

  const sacuvajKomentar = () => {
    setObjave(objave.map(obj => {
      if (obj.id === izmenaKomentara.idObjave) {
        return {
          ...obj,
          komentari: obj.komentari.map(kom => 
            kom.id === izmenaKomentara.idKom ? { ...kom, tekst: izmenaKomentara.tekst } : kom
          )
        };
      }
      return obj;
    }));
    setIzmenaKomentara({ idObjave: null, idKom: null, tekst: '' });
  };

  const obrisiObjavu = (objavaId) => {
    setObjave(objave.filter(obj => obj.id !== objavaId));
    setOtvorenMeni(null);
  };

  const sacuvajOpisObjave = () => {
    setObjave(objave.map(obj => 
      obj.id === izmenaObjave.idObjave ? { ...obj, opis: izmenaObjave.opis } : obj
    ));
    setIzmenaObjave({ idObjave: null, opis: '' });
  };

  const pokreniIzmenuOpisa = (objavaId, trenutniOpis) => {
    setIzmenaObjave({ idObjave: objavaId, opis: trenutniOpis });
    setOtvorenMeni(null);
  };

  return (
    <div style={containerStyle}>
      {objave.map(obj => (
        <div key={obj.id} style={cardStyle}>
          
          <div style={headerStyle}>
            <strong>{obj.korisnik}</strong>
            {obj.korisnik === "ksenija_dev" && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setOtvorenMeni(otvorenMeni === obj.id ? null : obj.id)} style={dotsBtnStyle}>•••</button>
                {otvorenMeni === obj.id && (
                  <div style={dropdownMenuStyle}>
                    <button onClick={() => pokreniIzmenuOpisa(obj.id, obj.opis)} style={dropdownItemStyle}>Izmeni opis</button>
                    <button onClick={() => obrisiObjavu(obj.id)} style={{...dropdownItemStyle, color: '#ed4956', fontWeight: 'bold'}}>Obriši objavu</button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div style={imageContainerStyle}>
            <img src={obj.slike[obj.indeksSlike]} alt="Post" style={imageStyle} />
            
            {/* dugme za uklanjanje trenutne slike */}
            {obj.korisnik === "ksenija_dev" && (
              <button 
                onClick={() => obrisiSlikuIzKolaza(obj.id)} 
                style={removeImageBtnStyle}
                title="Ukloni ovu sliku"
              >✕</button>
            )}

            {obj.slike.length > 1 && (
              <>
                <button onClick={() => promeniSliku(obj.id, -1)} style={leftBtnStyle}>◀</button>
                <button onClick={() => promeniSliku(obj.id, 1)} style={rightBtnStyle}>▶</button>
              </>
            )}
          </div>

          <div style={contentStyle}>
            <div style={{ marginBottom: '10px', fontSize: '24px', display: 'flex', alignItems: 'center' }}>
              <span onClick={() => toggleLajk(obj.id)} style={{ cursor: 'pointer', marginRight: '15px', userSelect: 'none' }}>
                {lajkovane[obj.id] ? '♥' : '♡'}
              </span>
              <span onClick={() => toggleKomentare(obj.id)} style={{ cursor: 'pointer', userSelect: 'none', fontSize: '20px' }}>
                💬
              </span>
            </div>

            <div style={{ marginBottom: '5px' }}>
              <strong style={{ fontSize: '14px' }}>{obj.lajkovi + (lajkovane[obj.id] ? 1 : 0)} lajkova</strong>
            </div>
            
            <div style={{ marginBottom: '10px', fontSize: '14px' }}>
              <strong>{obj.korisnik}</strong>{' '}
              {izmenaObjave.idObjave === obj.id ? (
                <span style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <input value={izmenaObjave.opis} onChange={(e) => setIzmenaObjave({...izmenaObjave, opis: e.target.value})} style={editInputStyle} />
                  <button onClick={sacuvajOpisObjave} style={saveBtnStyle}>✓</button>
                  <button onClick={() => setIzmenaObjave({idObjave: null, opis: ''})} style={cancelBtnStyle}>X</button>
                </span>
              ) : (
                <span>{obj.opis}</span>
              )}
            </div>
            
            {obj.komentari.length > 0 && (
              <div 
                onClick={() => toggleKomentare(obj.id)} 
                style={{ color: 'gray', fontSize: '14px', cursor: 'pointer', marginBottom: '10px' }}
              >
                {prikaziKomentare[obj.id] ? 'Sakrij komentare' : `Prikaži sve komentare (${obj.komentari.length})`}
              </div>
            )}
            
            {prikaziKomentare[obj.id] && (
              <div style={commentSectionStyle}>
                {obj.komentari.map(kom => (
                  <div key={kom.id} style={commentRowStyle}>
                    {izmenaKomentara.idKom === kom.id ? (
                      <div style={{ display: 'flex', width: '100%', gap: '5px' }}>
                        <input value={izmenaKomentara.tekst} onChange={(e) => setIzmenaKomentara({...izmenaKomentara, tekst: e.target.value})} style={editInputStyle} />
                        <button onClick={sacuvajKomentar} style={saveBtnStyle}>✓</button>
                      </div>
                    ) : (
                      <>
                        <span><strong>{kom.korisnik}</strong> {kom.tekst}</span>
                        {kom.korisnik === "ksenija_dev" && (
                          <div>
                            <button onClick={() => setIzmenaKomentara({ idObjave: obj.id, idKom: kom.id, tekst: kom.tekst })} style={editBtnStyle}>✏️</button>
                            <button onClick={() => obrisiKomentar(obj.id, kom.id)} style={deleteBtnStyle}>×</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={inputAreaStyle}>
              <input 
                type="text" 
                placeholder="Dodaj komentar..." 
                value={noviKomentari[obj.id] || ''}
                onChange={(e) => setNoviKomentari({ ...noviKomentari, [obj.id]: e.target.value })}
                style={inputStyle}
              />
              <button onClick={() => dodajKomentar(obj.id)} style={postBtnStyle}>Objavi</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// STILOVI 
const containerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', backgroundColor: '#fafafa', minHeight: '100vh' };
const cardStyle = { backgroundColor: 'white', border: '1px solid #dbdbdb', borderRadius: '8px', width: '100%', maxWidth: '470px', marginBottom: '20px' };
const headerStyle = { padding: '15px', borderBottom: '1px solid #efefef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const dotsBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', padding: '0 10px' };
const dropdownMenuStyle = { position: 'absolute', top: '30px', right: '0', backgroundColor: 'white', border: '1px solid #dbdbdb', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', zIndex: 10, width: '120px' };
const dropdownItemStyle = { padding: '10px', background: 'none', border: 'none', borderBottom: '1px solid #efefef', cursor: 'pointer', textAlign: 'left', fontSize: '14px' };
const imageContainerStyle = { position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: '#000' };
const imageStyle = { width: '100%', height: '100%', objectFit: 'contain' };
const removeImageBtnStyle = { position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' };

const contentStyle = { padding: '15px' };
const commentSectionStyle = { maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' };
const commentRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '5px 0', fontSize: '14px' };
const inputAreaStyle = { display: 'flex', borderTop: '1px solid #efefef', paddingTop: '10px' };
const inputStyle = { flex: 1, border: 'none', outline: 'none', fontSize: '14px' };
const postBtnStyle = { background: 'none', border: 'none', color: '#0095f6', fontWeight: 'bold', cursor: 'pointer' };
const deleteBtnStyle = { background: 'none', border: 'none', color: '#ed4956', fontSize: '18px', cursor: 'pointer', padding: '0 5px' };
const editBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginLeft: '5px' };
const editInputStyle = { flex: 1, border: '1px solid #dbdbdb', borderRadius: '4px', padding: '4px 8px', fontSize: '14px', marginRight: '5px' };
const saveBtnStyle = { background: '#0095f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold' };
const cancelBtnStyle = { background: '#efefef', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', marginLeft: '2px' };
const leftBtnStyle = { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: '5px 8px' };
const rightBtnStyle = { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: '5px 8px' };

export default Timeline;