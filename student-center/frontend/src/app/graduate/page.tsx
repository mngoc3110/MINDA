"use client";
import React, { useState } from 'react';
import styles from './page.module.css';

export default function GraduationCard() {
  // 'input' -> 'envelope' -> 'card'
  const [stage, setStage] = useState<'input' | 'envelope' | 'card'>('input');
  
  // Envelope animation state
  const [envelopeState, setEnvelopeState] = useState<'closed' | 'opening' | 'opened'>('closed');
  
  const [guestName, setGuestName] = useState('');
  
  // Book animation state
  const [bookState, setBookState] = useState<'closed' | 'opened' | 'back'>('closed');

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      setStage('envelope');
    }
  };

  const handleOpenEnvelope = () => {
    if (envelopeState !== 'closed') return;
    setEnvelopeState('opening');
    
    // Play sound if you have one: new Audio('/open.mp3').play();
    
    setTimeout(() => {
      setEnvelopeState('opened');
      setTimeout(() => {
        setStage('card');
      }, 1500); // Wait for letter to slide out, then transition to full card
    }, 600); // Time for the top flap to open
  };

  const handleOpenBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookState('opened');
  };
  
  const handleCloseBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookState('closed');
  };
  
  const handleTurnBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookState('back');
  };

  return (
    <div className={styles.container}>
      
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
              <button type="submit" className={`${styles.btn} ${styles.dark}`}>
                Tiếp tục
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STAGE 2: Envelope */}
      {stage === 'envelope' && (
        <div className={styles.envelopeStage}>
          <div className={styles.hintText}>Click vào thư để mở</div>
          
          <div className={`${styles.envelopeWrapper} ${styles[envelopeState]}`} onClick={handleOpenEnvelope}>
            <div className={styles.envelopeBase} />
            <div className={styles.envelopeLetter}>
              <div className={styles.letterLogo}>🎓</div>
              <div className={styles.letterText}>Thiệp Mời Tốt Nghiệp</div>
              <div className={styles.letterText} style={{ marginTop: '10px', fontSize: '1rem', color: '#4f46e5' }}>
                Thân gửi: {guestName}
              </div>
            </div>
            <div className={styles.envelopeFlaps}>
              <div className={styles.flapLeft} />
              <div className={styles.flapRight} />
              <div className={styles.flapBottom} />
              <div className={styles.flapTop} />
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: The 3D Card */}
      {stage === 'card' && (
        <div className={`${styles.scene} ${styles.cardStage}`}>
          <div className={`${styles.book} ${styles[bookState]}`}>
            
            {/* Base of the book (Page 3 & 4) */}
            <div className={styles.basePage}>
              <div className={`${styles.face} ${styles.front}`}>
                <div className={styles.spineShadow} />
                <div className={styles.content}>
                  <h2 className={styles.title}>Kỷ niệm đáng nhớ</h2>
                  <div className={styles.photoGrid}>
                    <div className={styles.photo}>
                      <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=500&auto=format&fit=crop" alt="Graduation" />
                    </div>
                    <div className={styles.photo}>
                      <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=500&auto=format&fit=crop" alt="Friends" />
                    </div>
                    <div className={styles.photo}>
                      <img src="https://images.unsplash.com/photo-1525926477800-7a3b10316ac6?q=80&w=500&auto=format&fit=crop" alt="University" />
                    </div>
                    <div className={styles.photo}>
                      <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=500&auto=format&fit=crop" alt="Diploma" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`${styles.face} ${styles.back}`}>
                <div className={styles.content}>
                  <h2 className={`${styles.title} ${styles.white}`}>Lễ Tốt Nghiệp</h2>
                  <div className={styles.addressBox}>
                    <p><strong>Thời gian:</strong> 08:00 Sáng, Chủ Nhật, 15/08/2026</p>
                    <p><strong>Địa điểm:</strong> Hội trường A, Đại học Quốc Gia Hà Nội</p>
                    <p><strong>Dress code:</strong> Trang phục lịch sự, trang trọng</p>
                    <div className={styles.mapPlaceholder}>
                      <span>📍 Bản đồ (Quét mã QR)</span>
                    </div>
                  </div>
                  <div className={styles.actions} style={{ marginTop: 'auto', justifyContent: 'center' }}>
                    <button className={`${styles.btn} ${styles.outline}`} onClick={handleCloseBook}>
                      Quay lại trang bìa
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Flap of the book (Page 1 & 2) */}
            <div className={styles.flapPage}>
              <div className={`${styles.face} ${styles.front}`}>
                <div className={styles.spineShadow} />
                <div className={styles.coverDesign}>
                  
                  {guestName && (
                    <div className={styles.guestBadge}>
                      Thân gửi: {guestName}
                    </div>
                  )}

                  <h1>Thiệp Mời</h1>
                  <div className={styles.gradHat}>🎓</div>
                  <h2>Nguyễn Văn A</h2>
                  <p>Cử nhân Công nghệ Thông tin</p>
                  <p className={styles.year}>2026</p>
                  
                  <div className={styles.actions}>
                    <button className={styles.btn} onClick={handleOpenBook}>Mở thiệp</button>
                    <button className={`${styles.btn} ${styles.outline}`} onClick={handleTurnBack}>Mặt sau</button>
                  </div>
                </div>
              </div>
              
              <div className={`${styles.face} ${styles.back}`}>
                <div className={styles.spineShadow} />
                <div className={styles.content}>
                  <h2 className={styles.title}>Lời Cảm Ơn</h2>
                  <div className={styles.thankYouText}>
                    <p>Mình xin gửi lời cảm ơn chân thành nhất tới gia đình, thầy cô và những người bạn đã luôn đồng hành, ủng hộ mình trong suốt hành trình 4 năm đại học.</p>
                    <br/>
                    <p>Sự có mặt của <strong>{guestName || 'bạn'}</strong> trong buổi lễ tốt nghiệp này là niềm vinh hạnh và món quà quý giá nhất đối với mình. Hẹn gặp {guestName || 'bạn'} ở buổi lễ nhé!</p>
                  </div>
                  <div className={styles.signature}>
                    <p>Thân mến,</p>
                    <p style={{fontFamily: 'cursive', fontSize: '1.5rem', marginTop: '10px', color: '#4f46e5'}}>Văn A</p>
                  </div>
                  <div className={styles.actions} style={{ justifyContent: 'center' }}>
                    <button className={`${styles.btn} ${styles.dark}`} onClick={handleCloseBook}>
                      Đóng thiệp
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
