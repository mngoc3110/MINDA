"use client";
import React, { useState } from 'react';
import styles from './page.module.css';

export default function GraduationCard() {
  const [stage, setStage] = useState<'input' | 'envelope' | 'card'>('input');
  const [envelopeState, setEnvelopeState] = useState<'closed' | 'opening' | 'opened'>('closed');
  const [guestName, setGuestName] = useState('');

  const [cardAnimation, setCardAnimation] = useState<'hidden' | 'pullingOut' | 'presented'>('hidden');

  // Book state: 0 = cover, 1 = pages 2-3, 2 = pages 4-5, 3 = back cover
  const [bookPage, setBookPage] = useState(0);

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
      setCardAnimation('pullingOut');

      setTimeout(() => {
        setStage('card');
        setCardAnimation('presented');
      }, 1200);

    }, 600);
  };

  const flipNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookPage(p => Math.min(3, p + 1));
  };

  const flipPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookPage(p => Math.max(0, p - 1));
  };

  // Calculate book transform based on state to keep it centered
  let bookTransformClass = '';
  if (bookPage === 0) bookTransformClass = styles.bookClosedFront;
  else if (bookPage === 3) bookTransformClass = styles.bookClosedBack;
  else bookTransformClass = styles.bookOpened;

  return (
    <div className={styles.container}>

      {/* Import Google Fonts */}
      <style dangerouslySetInnerHTML={{
        __html: `
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

      {/* ENVELOPE STAGE */}
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

      {/* STAGE 3: MULTI-PAGE 3D FLIPPING IMAGE BOOK */}
      {cardAnimation !== 'hidden' && (
        <div className={`${styles.bookContainer} ${styles[cardAnimation]}`}>
          <div className={`${styles.book} ${bookTransformClass}`}>

            {/* LEAF 3 (Pages 5 & 6) */}
            <div
              className={`${styles.leaf} ${styles.leaf3} ${bookPage >= 3 ? styles.flipped : ''}`}
              style={{ zIndex: bookPage >= 3 ? 3 : 1 }}
            >
              <div className={styles.pageFront} onClick={flipNext}>
                <img src="/graduate/5.png" alt="Page 5" className={styles.imgPlaceholder} />
              </div>
              <div className={styles.pageBack} onClick={flipPrev}>
                <img src="/graduate/6.png" alt="Page 6" className={styles.imgPlaceholder} />
              </div>
            </div>

            {/* LEAF 2 (Pages 3 & 4) */}
            <div
              className={`${styles.leaf} ${styles.leaf2} ${bookPage >= 2 ? styles.flipped : ''}`}
              style={{ zIndex: bookPage >= 2 ? 2 : 2 }}
            >
              <div className={styles.pageFront} onClick={flipNext}>
                <img src="/graduate/3.png" alt="Page 3" className={styles.imgPlaceholder} />
              </div>
              <div className={styles.pageBack} onClick={flipPrev}>
                <img src="/graduate/4.png" alt="Page 4" className={styles.imgPlaceholder} />
              </div>
            </div>

            {/* LEAF 1 (Pages 1 & 2) */}
            <div
              className={`${styles.leaf} ${styles.leaf1} ${bookPage >= 1 ? styles.flipped : ''}`}
              style={{ zIndex: bookPage >= 1 ? 1 : 3 }}
            >
              <div className={styles.pageFront} onClick={flipNext}>
                <img src="/graduate/1.png" alt="Page 1" className={styles.imgPlaceholder} />
              </div>
              <div className={styles.pageBack} onClick={flipPrev}>
                <img src="/graduate/2.png" alt="Page 2" className={styles.imgPlaceholder} />
                {guestName && <div className={styles.guestNameOverlay} style={{ top: '16.5%', left: '26%' }}>{guestName}</div>}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
