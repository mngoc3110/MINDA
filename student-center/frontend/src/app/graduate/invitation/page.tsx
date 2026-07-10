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

  // Mobile Gallery state
  const [mobilePageIndex, setMobilePageIndex] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleMobileNext = () => {
    if (mobilePageIndex < 6) setMobilePageIndex(mobilePageIndex + 1);
  };
  const handleMobilePrev = () => {
    if (mobilePageIndex > 1) setMobilePageIndex(mobilePageIndex - 1);
  };

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1240, 1748] // typical A4 ratio for these images
      });

      for (let i = 1; i <= 6; i++) {
        if (i > 1) pdf.addPage();
        
        const img = new Image();
        img.src = `/graduate/${i}.png`;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        pdf.addImage(img, 'PNG', 0, 0, 1240, 1748);
        
        // Add guest name on page 2
        if (i === 2 && guestName) {
          pdf.setFont("times", "italic");
          pdf.setTextColor(219, 39, 119); // pink-600
          pdf.setFontSize(140);
          // Angle is counter-clockwise in jsPDF. Positive 3 = rotate(-3deg)
          pdf.text(guestName, 1240 * 0.26, 1748 * 0.165, { angle: 3 });
        }
        // Add QR code on page 6
        if (i === 6) {
          try {
            const qrImg = new Image();
            qrImg.src = '/graduate/qr.png';
            await new Promise((resolve, reject) => {
              qrImg.onload = resolve;
              qrImg.onerror = reject;
            });
            pdf.addImage(qrImg, 'PNG', 1240 * 0.08, 1748 * 0.72, 350, 350);
          } catch (e) {
            console.log('No QR code found or failed to load');
          }
        }
      }
      
      pdf.save(`Thiep_Moi_${guestName || 'Khach'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Có lỗi xảy ra khi tải thiệp. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
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
                <img src="/graduate/qr.png" alt="QR" className={styles.qrCodeOverlay} />
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

      {/* MOBILE SCROLL VIEW (Only visible on mobile and after envelope opens) */}
      {cardAnimation === 'presented' && (
        <div className={styles.mobileCardGallery}>
          <div className={styles.mobilePageWrapper} onClick={handleMobileNext}>
             <img src={`/graduate/${mobilePageIndex}.png`} alt={`Page ${mobilePageIndex}`} />
             {mobilePageIndex === 2 && guestName && <div className={styles.mobileGuestName}>{guestName}</div>}
             {mobilePageIndex === 6 && <img src="/graduate/qr.png" alt="QR" className={styles.mobileQrOverlay} />}
          </div>
          <div className={styles.mobileControls}>
             <button 
               disabled={mobilePageIndex === 1} 
               onClick={(e) => { e.stopPropagation(); handleMobilePrev(); }}
               className={styles.mobileNavBtn}
             >
               Trang trước
             </button>
             <span className={styles.mobilePageIndicator}>{mobilePageIndex} / 6</span>
             <button 
               disabled={mobilePageIndex === 6} 
               onClick={(e) => { e.stopPropagation(); handleMobileNext(); }}
               className={styles.mobileNavBtn}
             >
               Trang sau
             </button>
          </div>
          <button 
            className={styles.downloadBtn} 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? 'Đang tạo PDF...' : 'Tải thiệp (PDF)'}
          </button>
        </div>
      )}

    </div>
  );
}
