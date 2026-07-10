"use client";
import React, { useState } from 'react';
import styles from './page.module.css';

export default function GraduationCard() {
  // 'input' -> 'envelope' -> 'card'
  const [stage, setStage] = useState<'input' | 'envelope' | 'card'>('input');
  
  // Envelope animation state
  const [envelopeState, setEnvelopeState] = useState<'closed' | 'opening' | 'opened'>('closed');
  
  const [guestName, setGuestName] = useState('');
  
  // 3D Book animation state
  const [cardAnimation, setCardAnimation] = useState<'hidden' | 'pullingOut' | 'presented'>('hidden');
  const [bookState, setBookState] = useState<'closed' | 'opened'>('closed');

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      setStage('envelope');
    }
  };

  const handleOpenEnvelope = () => {
    if (envelopeState !== 'closed') return;
    setEnvelopeState('opening');
    
    setTimeout(() => {
      setEnvelopeState('opened');
      setCardAnimation('pullingOut'); // Start pulling the book out
      
      setTimeout(() => {
        setStage('card');
        setCardAnimation('presented'); // Book scales up to the center
      }, 1200); // Time for the book to slide up out of the envelope
      
    }, 600); // Time for the top flap to open
  };

  return (
    <div className={styles.container}>
      
      {/* Import Google Fonts for the elegant typography */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
      `}} />

      {/* STAGE 1: Input Name */}
      {stage === 'input' && (
        <div className={styles.inputStage}>
          <div className={styles.inputBox}>
            <h2 className={styles.inputTitle}>Vui lòng cho biết tên của bạn</h2>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                className={styles.nameInput}
                placeholder="Nhập tên của bạn..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoFocus
              />
              <button type="submit" className={styles.btn}>
                Tiếp tục
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ENVELOPE STAGE (Visible during Stage 2, fades out in Stage 3) */}
      <div className={`${styles.envelopeStage} ${stage === 'card' ? styles.hide : ''}`} style={{ display: stage === 'input' ? 'none' : 'flex' }}>
        {stage === 'envelope' && <div className={styles.hintText}>Click vào thư để mở</div>}
        
        <div className={`${styles.envelopeWrapper} ${styles[envelopeState]} ${stage === 'card' ? styles.hide : ''}`} onClick={handleOpenEnvelope}>
          <div className={styles.envelopeBase} />
          <div className={styles.envelopeFlaps}>
            <div className={styles.flapLeft} />
            <div className={styles.flapRight} />
            <div className={styles.flapBottomWrapper}>
              <div className={styles.flapBottom} />
            </div>
            <div className={styles.flapTopWrapper}>
              <div className={styles.flapTop} />
              <div className={styles.waxSeal}>★</div>
            </div>
          </div>
        </div>
      </div>

      {/* STAGE 3: 3D FLIPPING IMAGE BOOK */}
      {cardAnimation !== 'hidden' && (
        <div className={`${styles.bookContainer} ${styles[cardAnimation]}`}>
          <div 
            className={`${styles.book} ${bookState === 'opened' ? styles.opened : ''}`} 
            onClick={() => setBookState(s => s === 'closed' ? 'opened' : 'closed')}
          >
            
            {/* The right side of the open book (Page 3 on front, Page 4 on back) */}
            <div className={`${styles.page} ${styles.basePage}`}>
              <div className={styles.pageFront}>
                {/* Trang 3: Lời Cảm Ơn, Hình Ảnh... */}
                <img src="/graduate/page3.jpg" alt="Page 3" className={styles.imgPlaceholder} />
              </div>
              <div className={styles.pageBack}>
                {/* Trang 4: Bìa sau */}
                <img src="/graduate/page4.jpg" alt="Page 4" className={styles.imgPlaceholder} />
              </div>
            </div>

            {/* The left side of the open book / Cover (Page 1 on front, Page 2 on back) */}
            <div className={`${styles.page} ${styles.coverPage}`}>
              <div className={styles.pageFront}>
                {/* Trang 1: Bìa trước */}
                <img src="/graduate/page1.jpg" alt="Page 1" className={styles.imgPlaceholder} />
                
                {/* Có thể thêm Tên Khách Mời hiển thị đè lên bìa 1 nếu muốn */}
                {/* <div className={styles.guestNameOverlay}>Dear {guestName}</div> */}
              </div>
              <div className={styles.pageBack}>
                {/* Trang 2: Thông tin buổi lễ... */}
                <img src="/graduate/page2.jpg" alt="Page 2" className={styles.imgPlaceholder} />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
