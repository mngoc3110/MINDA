"use client";
import React, { useState } from 'react';
import styles from './page.module.css';

export default function GraduationCard() {
  // 'closed' | 'opened' | 'back'
  const [state, setState] = useState<'closed' | 'opened' | 'back'>('closed');

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState('opened');
  };
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState('closed');
  };
  
  const handleTurnBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState('back');
  };

  return (
    <div className={styles.container}>
      <div className={styles.scene}>
        <div className={`${styles.book} ${styles[state]}`}>
          
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
                  <button className={`${styles.btn} ${styles.outline}`} onClick={handleClose}>
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
                <h1>Thiệp Mời</h1>
                <div className={styles.gradHat}>🎓</div>
                <h2>Nguyễn Văn A</h2>
                <p>Cử nhân Công nghệ Thông tin</p>
                <p className={styles.year}>2026</p>
                
                <div className={styles.actions}>
                  <button className={styles.btn} onClick={handleOpen}>Mở thiệp</button>
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
                  <p>Sự có mặt của bạn trong buổi lễ tốt nghiệp này là niềm vinh hạnh và món quà quý giá nhất đối với mình. Hẹn gặp bạn ở buổi lễ nhé!</p>
                </div>
                <div className={styles.signature}>
                  <p>Thân mến,</p>
                  <p style={{fontFamily: 'cursive', fontSize: '1.5rem', marginTop: '10px', color: '#4f46e5'}}>Văn A</p>
                </div>
                <div className={styles.actions} style={{ justifyContent: 'center' }}>
                  <button className={`${styles.btn} ${styles.dark}`} onClick={handleClose}>
                    Đóng thiệp
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
