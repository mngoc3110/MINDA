"use client";
import React, { useState } from 'react';
import styles from './page.module.css';

export default function GraduationCard() {
  // 'input' -> 'envelope' -> 'card'
  const [stage, setStage] = useState<'input' | 'envelope' | 'card'>('input');
  
  // Envelope animation state
  const [envelopeState, setEnvelopeState] = useState<'closed' | 'opening' | 'opened'>('closed');
  
  const [guestName, setGuestName] = useState('');
  
  // Flat card animation state
  const [cardAnimation, setCardAnimation] = useState<'hidden' | 'pullingOut' | 'presented'>('hidden');

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
      setCardAnimation('pullingOut'); // Start pulling the card out
      
      setTimeout(() => {
        setStage('card');
        setCardAnimation('presented'); // Card scales up to the center
      }, 1200); // Time for the card to slide up out of the envelope
      
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

      {/* STAGE 3: FLAT CARD (The HCMUE Layout) */}
      {cardAnimation !== 'hidden' && (
        <div className={`${styles.flatCardContainer} ${styles[cardAnimation]}`}>
          
          <div className={styles.sashContainer}>
            <img src="/graduate/sash.jpg" alt="Sash" className={styles.sashImage} />
          </div>

          <div className={styles.cardLayout}>
            
            <div className={styles.cardHeader}>
              <div className={styles.logos}>
                <img src="/graduate/logo-hcmue.png" alt="HCMUE Logo" className={styles.logoImage} />
                <img src="/graduate/logo-it.png" alt="IT Logo" className={styles.logoImage} />
              </div>
              <div className={styles.headerText}>
                TRƯỜNG ĐẠI HỌC SƯ PHẠM<br/>
                THÀNH PHỐ HỒ CHÍ MINH
              </div>
            </div>

            <div className={styles.dearSection}>
              <span>Dear</span>
              <div className={styles.guestNameLine}>{guestName}</div>
            </div>

            <div className={styles.eventTitle}>
              <p>Tới tham dự</p>
              <h1>LỄ TỐT NGHIỆP</h1>
              <h2>Minh Ngọc</h2>
            </div>

            <div className={styles.detailsRow}>
              <div className={styles.detailBlock}>
                <div className={styles.detailTitle}>Thứ sáu</div>
                <div className={styles.detailText}>24.07.2026</div>
                <div className={styles.detailText}>9:00 - 11:00</div>
              </div>

              <div className={styles.detailBlock}>
                <div className={styles.detailTitle}>TẠI</div>
                <div className={styles.detailText} style={{fontWeight: 'bold'}}>Trường Đại học Sư Phạm</div>
                <div className={`${styles.detailText} ${styles.italic}`}>
                  280 An Dương Vương, P. Chợ Quán
                </div>
              </div>
            </div>

            <div className={styles.message}>
              Sự hiện diện của mọi người là niềm vinh dự và hạnh phúc nhất của con/em trên chặng đường này.
            </div>

            <div className={styles.footerLine}>
              <div className={styles.footerYear}>Niên khóa 2026</div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
