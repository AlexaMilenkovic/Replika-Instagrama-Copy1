import React, { useState } from 'react';

function CreatePost() {
  const [opis, setOpis] = useState('');
  const [slike, setSlike] = useState([]);

  const handleObjavi = () => {
    if (slike.length === 0) {
      alert("Moraš dodati barem jednu sliku!");
      return;
    }
    // Ovde ce kasnije icci poziv ka backendu!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    alert("Bravo! Objava je uspesno kreirana (Simulacija za sada).");
    setOpis('');
    setSlike([]);
  };

  const simulirajDodavanjeSlike = () => {
    // Pravilo iz specifikacije: max 20 slika!
    if (slike.length >= 20) {
      alert("Možeš dodati najviše 20 elemenata po specifikaciji!");
      return;
    }
    // Dodala sam test sliku cisto da vidim vizuelno kako radi
    setSlike([...slike, "/slike/radnja.jfif"]); 
  };

  const ukloniSliku = (indexZaBrisanje) => {
    setSlike(slike.filter((_, index) => index !== indexZaBrisanje));
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Nova objava</h2>
      </div>

      <div style={contentStyle}>
        {/* DEO ZA DODAVANJE SLIKA */}
        <div style={imageUploadArea} onClick={simulirajDodavanjeSlike}>
          <span style={{ fontSize: '40px' }}>📸</span>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Klikni da dodaš sliku/video</p>
          <p style={{ fontSize: '12px', color: 'gray', margin: 0 }}>Max 20 fajlova (do 50MB)</p>
        </div>

        {/* PREGLED DODATIH SLIKA */}
        {slike.length > 0 && (
          <div style={previewGridStyle}>
            {slike.map((slika, index) => (
              <div key={index} style={previewImageContainerStyle}>
                <img src={slika} alt={`Preview ${index}`} style={previewImageStyle} />
                <button onClick={() => ukloniSliku(index)} style={removeImageBtnStyle}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* DEO ZA OPIS */}
        <textarea 
          placeholder="Dodaj opis ༘˚⋆𐙚｡⋆𖦹.✧˚" 
          value={opis}
          onChange={(e) => setOpis(e.target.value)}
          style={textareaStyle}
        />

        <button onClick={handleObjavi} style={publishBtnStyle}>Objavi</button>
      </div>
    </div>
  );
}

// STILOVI
const containerStyle = { backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const headerStyle = { width: '100%', maxWidth: '470px', padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #dbdbdb', display: 'flex', justifyContent: 'center' };
const contentStyle = { width: '100%', maxWidth: '470px', padding: '20px', backgroundColor: 'white', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' };
const imageUploadArea = { border: '2px dashed #dbdbdb', borderRadius: '10px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#fafafa' };
const previewGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' };
const previewImageContainerStyle = { position: 'relative', width: '100%', aspectRatio: '1/1' };
const previewImageStyle = { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' };
const removeImageBtnStyle = { position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' };
const textareaStyle = { width: '100%', height: '100px', padding: '15px', borderRadius: '8px', border: '1px solid #dbdbdb', outline: 'none', resize: 'none', fontSize: '14px', fontFamily: 'inherit' };
const publishBtnStyle = { width: '100%', padding: '12px', backgroundColor: '#0095f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };

export default CreatePost;