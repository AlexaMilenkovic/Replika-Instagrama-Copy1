import React, { useState } from 'react';

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now - postDate) / 1000);

  if (diffInSeconds < 60) return 'Upravo sada';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `pre ${diffInMinutes} minuta`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `pre ${diffInHours} sata`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `pre ${diffInDays} dana`;
};

function Timeline() {
  const [isLoading, setIsLoading] = useState(false); 
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: "ksenijai670",
      location: "Novi Sad, Srbija",
      
      items: ["/slike/radnja.jfif", "/slike/lala.jfif"],
      currentImageIndex: 0,
      description: "⊚⃝⸜(⸝⸝•ᴗ•⸝⸝)✩♬ ₊˚.",
      likes: 120,
      isLiked: false,
      isSaved: false,
      comments: [{ id: 1, user: "marko_pk", text: "Prelepo!" }],
      newComment: "",
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      user: "stefan_99",
      
      items: ["/slike/kola.jfif"],
      currentImageIndex: 0,
      description: "⛐",
      likes: 45,
      isLiked: false,
      isSaved: true,
      comments: [],
      newComment: "",
      timestamp: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 3,
      user: "ana_marija",
      location: "Beograd, Srbija",
      
      items: ["/slike/outfit.jpg", "/slike/tokio.jfif", "/slike/leto.jfif"],
      currentImageIndex: 0,
      description: "✨",
      likes: 890,
      isLiked: true,
      isSaved: false,
      comments: [{ id: 1, user: "jelena_j", text: "Prelepo! 😍" }],
      newComment: "VAAU",
      timestamp: new Date(Date.now() - 86400000).toISOString() 
    },
    {
      id: 4,
      user: "nikola_tech",
      
      items: ["/slike/macka.jfif", "/slike/ogljedalo.jfif"],
      currentImageIndex: 0,
      description: "random...𑣲⋆｡˚",
      likes: 342,
      isLiked: false,
      isSaved: false,
      comments: [],
      newComment: "",
      timestamp: new Date(Date.now() - 172800000).toISOString() 
    }
  ]);

  const handleLike = (postId) => setPosts(posts.map(post => post.id === postId ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 } : post));
  const handleSave = (postId) => setPosts(posts.map(post => post.id === postId ? { ...post, isSaved: !post.isSaved } : post));
  const handleShare = () => alert("🔗 Link objave je kopiran!");

  const focusCommentInput = (postId) => {
    const inputField = document.getElementById(`comment-input-${postId}`);
    if (inputField) {
      inputField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => inputField.focus(), 400); 
    }
  };

  const nextImage = (postId) => setPosts(posts.map(post => (post.id === postId && post.currentImageIndex < post.items.length - 1) ? { ...post, currentImageIndex: post.currentImageIndex + 1 } : post));
  const prevImage = (postId) => setPosts(posts.map(post => (post.id === postId && post.currentImageIndex > 0) ? { ...post, currentImageIndex: post.currentImageIndex - 1 } : post));
  const handleCommentChange = (postId, text) => setPosts(posts.map(post => post.id === postId ? { ...post, newComment: text } : post));
  
  const submitComment = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId && post.newComment.trim() !== "") {
        const newCommentObj = { id: Date.now(), user: "ja_korisnik", text: post.newComment };
        return { ...post, comments: [...post.comments, newCommentObj], newComment: "" };
      }
      return post;
    }));
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newPost = {
        id: Date.now(),
        user: "novi_korisnik",
        location: "nmp isk",
        // TVOJE SLIKE IZ FOLDERA 
        items: ["/slike/slikaa.jpg", "/slike/bla.jfif"],
        currentImageIndex: 0,
        description: "Upravo sam osvežio feed! Prva objava!",
        likes: 0,
        isLiked: false,
        isSaved: false,
        comments: [],
        newComment: "",
        timestamp: new Date().toISOString()
      };
      setPosts([newPost, ...posts]); 
      setIsLoading(false);
    }, 1500); 
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontFamily: 'cursive', margin: 0 }}>Instagram Replica</h2>
        <button onClick={handleRefresh} style={buttonStyle} disabled={isLoading}>
          {isLoading ? "Učitavam..." : "Osveži"}
        </button>
      </div>

      <div style={feedStyle}>
        {posts.map(post => (
          <div key={post.id} style={postStyle}>
            <div style={postHeaderStyle}>
              <div>
                <strong>{post.user}</strong>
                {post.location && <p style={locationStyle}>{post.location}</p>}
              </div>
              <span style={{ color: 'gray', fontSize: '12px' }}>{formatTimeAgo(post.timestamp)}</span>
            </div>
            
            <div style={mediaContainerStyle}>
              {post.currentImageIndex > 0 && <button onClick={() => prevImage(post.id)} style={leftArrowStyle}>{"<"}</button>}
              <img src={post.items[post.currentImageIndex]} alt="Post media" style={imageStyle} onDoubleClick={() => handleLike(post.id)} />
              {post.currentImageIndex < post.items.length - 1 && <button onClick={() => nextImage(post.id)} style={rightArrowStyle}>{">"}</button>}
              {post.items.length > 1 && <div style={carouselIndicator}>{post.currentImageIndex + 1} / {post.items.length} 📸</div>}
            </div>

            <div style={actionsContainerStyle}>
              <div style={leftActionsStyle}>
                <span onClick={() => handleLike(post.id)} style={iconStyle}>{post.isLiked ? '❤️' : '🤍'}</span>
                <span onClick={() => focusCommentInput(post.id)} style={iconStyle}>💬</span>
                <span onClick={handleShare} style={iconStyle}>✈️</span>
              </div>
              <span onClick={() => handleSave(post.id)} style={iconStyle}>{post.isSaved ? '🌟' : '⭐'}</span>
            </div>

            <div style={postFooterStyle}>
              <p style={{ margin: '0 0 5px 0' }}><strong>{post.likes} lajkova</strong></p>
              <p style={{ margin: '0 0 10px 0' }}><strong>{post.user}</strong> {post.description}</p>
              <div style={commentsSectionStyle}>
                {post.comments.map(comment => (
                  <p key={comment.id} style={{ margin: '3px 0', fontSize: '14px' }}><strong>{comment.user}</strong> {comment.text}</p>
                ))}
              </div>
            </div>

            <div style={commentInputContainerStyle}>
              <input 
                id={`comment-input-${post.id}`} 
                type="text" 
                placeholder="Dodaj komentar..." 
                value={post.newComment}
                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                style={commentInputStyle}
              />
              <button onClick={() => submitComment(post.id)} style={postCommentButtonStyle} disabled={!post.newComment.trim()}>Objavi</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// STILOVI 
const containerStyle = { backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const headerStyle = { width: '100%', maxWidth: '470px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 10px', backgroundColor: 'white', borderBottom: '1px solid #dbdbdb', position: 'sticky', top: 0, zIndex: 10 };
const buttonStyle = { backgroundColor: '#0095f6', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' };
const feedStyle = { width: '100%', maxWidth: '470px', marginTop: '20px' };
const postStyle = { backgroundColor: 'white', border: '1px solid #dbdbdb', borderRadius: '3px', marginBottom: '20px' };
const postHeaderStyle = { padding: '10px', borderBottom: '1px solid #efefef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const locationStyle = { fontSize: '12px', color: 'gray', margin: '2px 0 0 0' };
const mediaContainerStyle = { position: 'relative', width: '100%', backgroundColor: 'black', userSelect: 'none' };
const imageStyle = { width: '100%', display: 'block', maxHeight: '600px', objectFit: 'contain' }; // Dodao sam 'objectFit' da se tvoje slike lepo uklope
const carouselIndicator = { position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' };
const actionsContainerStyle = { padding: '10px 10px 0 10px', display: 'flex', justifyContent: 'space-between' };
const leftActionsStyle = { display: 'flex', gap: '15px' };
const iconStyle = { cursor: 'pointer', fontSize: '24px', userSelect: 'none' };
const postFooterStyle = { padding: '10px' };
const commentsSectionStyle = { marginTop: '10px' };
const commentInputContainerStyle = { display: 'flex', padding: '10px', borderTop: '1px solid #efefef' };
const commentInputStyle = { flex: 1, border: 'none', outline: 'none', padding: '5px' };
const postCommentButtonStyle = { backgroundColor: 'transparent', border: 'none', color: '#0095f6', fontWeight: 'bold', cursor: 'pointer' };
const arrowStyle = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px' };
const leftArrowStyle = { ...arrowStyle, left: '10px' };
const rightArrowStyle = { ...arrowStyle, right: '10px' };

export default Timeline;