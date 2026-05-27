// App.jsx — Component gốc, quản lý state toàn cục và routing section
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, BookOpen } from 'lucide-react';

// Components
import Navbar             from './components/Layout/Navbar';
import FloatingMusicPlayer from './components/Layout/FloatingMusicPlayer';
import PetalRain          from './components/Effects/PetalRain';
import HeroSection        from './components/Home/HeroSection';
import MemoryWall         from './components/Home/MemoryWall';
import SignatureWall       from './components/Signature/SignatureWall';
import GalleryWall        from './components/Gallery/GalleryWall';
import SubmitForm         from './components/Form/SubmitForm';
import TeacherDashboard     from './components/TeacherDashboard/TeacherDashboard';
import JoinYearbook         from './components/Home/JoinYearbook';
import WelcomeScreen    from './components/Home/WelcomeScreen';
import GuestJoinScreen  from './components/Home/GuestJoinScreen';
import BookLayout         from './components/Book/BookLayout';

// Utilities
import { 
  initStorage, getActiveYearbook, updateYearbook, getPersonalYearbook, 
  createPersonalYearbook, getTeacherYearbook, getYearbooks, 
  setActiveYearbookId, fetchMessagesFromDB, createYearbook, fetchYearbookGroup
} from './utils/storage';

// Khởi tạo dữ liệu mẫu ngay khi load
initStorage();

export default function App() {
  const [appState, setAppState]     = useState('welcome'); // 'welcome' | 'teacher_dashboard' | 'join_yearbook' | 'viewing' | 'guest_join'
  const [section, setSection]       = useState('wall');    // 'wall' | 'signature' | 'gallery'
  const [layoutMode, setLayoutMode] = useState('book');    // 'book' | 'grid'
  const [yearbook, setYearbook]     = useState(null);
  const [formOpen, setFormOpen]     = useState(false);
  const [editMessageData, setEditMessageData] = useState(null);
  const [viewMode, setViewMode]     = useState('public');  // 'public' | 'teacher'
  const [userRole, setUserRole]     = useState('student'); // 'teacher' | 'student' | 'admin' | 'guest'
  const [guestPendingId, setGuestPendingId] = useState(null);

  // Load phân quyền
  useEffect(() => {
    const rawRole = localStorage.getItem('minda_role') || 'guest';
    const role = rawRole.toLowerCase();
    setUserRole(role);
    
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');

    if (role === 'teacher' || role === 'admin') {
      if (idFromUrl) {
        handleLoadYearbook(idFromUrl, 'teacher');
      } else {
        setAppState('teacher_dashboard');
      }
    } else if (role === 'student') {
      if (idFromUrl) {
        // Vào qua link của giáo viên → lưu lại và load luôn
        localStorage.setItem('yearbook_active_id', idFromUrl);
        handleLoadYearbook(idFromUrl, 'public');
      } else {
        // Kiểm tra xem học sinh đã từng vào sổ nào chưa
        const savedId = localStorage.getItem('yearbook_active_id');
        if (savedId && savedId !== 'teacher_template_01') {
          // Đã có sổ lưu → vào thẳng, không cần nhập mã lại
          handleLoadYearbook(savedId, 'public');
        } else {
          // Lần đầu vào → yêu cầu nhập mã
          setAppState('join_yearbook');
        }
      }
    } else {
      // role === 'guest'
      if (idFromUrl) {
        setGuestPendingId(idFromUrl);
        setAppState('guest_join');
      } else {
        setAppState('welcome');
      }
    }
  }, []);

  const handleLoadYearbook = async (id, initViewMode) => {
    setActiveYearbookId(id);
    setViewMode(initViewMode);
    
    // Check if we have group details
    const group = await fetchYearbookGroup(id);
    
    let targetYb = {
      id: id,
      title: group ? group.title : 'Kỷ Yếu Lớp',
      type: 'class',
      cover: { bgColor: '#f0fdf4', stickers: [] },
      pages: []
    };
    
    setYearbook(targetYb);
    setAppState('viewing');
    
    const updatedYb = await fetchMessagesFromDB(id);
    if (updatedYb) {
      setYearbook({ ...targetYb, pages: updatedYb.pages });
    }
  };

  const handleSelectOption = useCallback((option) => {
    let targetYb;
    
    if (option === 'sign_teacher') {
      targetYb = getTeacherYearbook();
      setViewMode('public');
    } else if (option === 'create_personal') {
      targetYb = getPersonalYearbook();
      if (!targetYb) {
        targetYb = createPersonalYearbook();
      }
      setViewMode('public'); // Xem dưới góc độ public/personal
    }
    
    if (targetYb) {
      setActiveYearbookId(targetYb.id);
      setYearbook(targetYb);
      setAppState('viewing');
      
      fetchMessagesFromDB(targetYb.id).then(updatedYb => {
        if (updatedYb) setYearbook(updatedYb);
      });
      
      // Tự động mở form ký tên nếu họ chọn ký sổ GV
      if (option === 'sign_teacher') {
        setTimeout(() => setFormOpen(true), 500);
      }
    }
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    const yearbooks = getYearbooks();
    let target = yearbooks.find(y => y.type === (mode === 'teacher' ? 'teacher' : 'class'));
    
    // Nếu chuyển sang Lớp mà chưa có sổ của lớp thì tạo mới
    if (!target && mode === 'public') {
      target = createYearbook('Kỷ Yếu Lớp Mình');
    }
    
    if (target) {
      setActiveYearbookId(target.id);
      setYearbook(target);
      
      fetchMessagesFromDB(target.id).then(updatedYb => {
        if (updatedYb) setYearbook(updatedYb);
      });
    }
  }, []);

  // Callback khi học sinh gửi/cập nhật lưu bút mới
  const handleNewMessage = useCallback((newMsg, isEdit = false) => {
    if (!yearbook) return;
    
    if (isEdit) {
      const updatedPages = yearbook.pages.map(p => 
        p.id === newMsg.id ? { ...p, content: { ...p.content, ...newMsg } } : p
      );
      const updated = { ...yearbook, pages: updatedPages };
      updateYearbook(yearbook.id, updated);
      setYearbook(updated);
    } else {
      const newPage = {
        id: newMsg.id,
        type: 'student',
        content: newMsg,
        stickers: []
      };
      const updated = { ...yearbook, pages: [newPage, ...(yearbook.pages || [])] };
      updateYearbook(yearbook.id, updated);
      setYearbook(updated);
    }
  }, [yearbook]);

  const handleUpdateYearbook = useCallback((updates) => {
    if (!yearbook) return;
    const updated = updateYearbook(yearbook.id, updates);
    setYearbook(updated);
  }, [yearbook]);

  const handleEditMessage = useCallback((msg) => {
    setEditMessageData(msg);
    setFormOpen(true);
  }, []);

  const handleHeartUpdate = useCallback((id, newCount) => {
    if (!yearbook) return;
    const updatedPages = yearbook.pages.map(p => 
      p.id === id ? { ...p, content: { ...p.content, hearts: newCount } } : p
    );
    const updated = updateYearbook(yearbook.id, { pages: updatedPages });
    setYearbook(updated);
  }, [yearbook]);

  if (appState === 'welcome') {
    return (
      <div className="min-h-screen bg-cream-50 font-body">
        <PetalRain count={30} duration={15000} />
        <WelcomeScreen onSelectOption={handleSelectOption} />
      </div>
    );
  }

  if (appState === 'teacher_dashboard') {
    return (
      <div className="min-h-screen bg-cream-50 font-body">
        <TeacherDashboard onSelectGroup={(id) => handleLoadYearbook(id, 'teacher')} />
      </div>
    );
  }

  if (appState === 'join_yearbook') {
    return (
      <div className="min-h-screen bg-cream-50 font-body">
        <JoinYearbook 
          onJoin={(id) => handleLoadYearbook(id, 'public')} 
          onCreatePersonal={() => handleSelectOption('create_personal')}
        />
      </div>
    );
  }

  if (appState === 'guest_join') {
    return (
      <div className="min-h-screen bg-cream-50 font-body">
        <PetalRain count={30} duration={15000} />
        <GuestJoinScreen 
          yearbookId={guestPendingId} 
          onJoinAsGuest={(id) => handleLoadYearbook(id, 'public')} 
        />
      </div>
    );
  }

  if (!yearbook) return null;

  const messages = yearbook.pages ? yearbook.pages.map(p => p.content) : [];

  return (
    <div className="min-h-screen bg-cream-50 font-body">
      {/* Hiệu ứng cánh hoa rơi */}
      <PetalRain count={30} duration={15000} />

      {/* Thanh điều hướng */}
      <div className="print:hidden">
        <Navbar
          onOpenForm={() => setFormOpen(true)}
          activeSection={section}
          onNav={setSection}
          onBackToDashboard={
            userRole !== 'student' 
              ? () => setAppState('teacher_dashboard') 
              : () => setAppState('join_yearbook')
          }
          backButtonLabel={userRole !== 'student' ? 'Quản lý Sổ' : 'Đổi Sổ Khác'}
          yearbookId={userRole === 'student' ? yearbook?.id : null}
        />
      </div>

      {/* Nội dung chính */}
      <main className="pt-24 print:pt-0">
        <AnimatePresence mode="wait">
          {section === 'wall' ? (
            <motion.div
              key="wall-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {layoutMode === 'book' ? (
                <BookLayout 
                  yearbook={yearbook} 
                  viewMode={viewMode}
                  userRole={userRole}
                  onUpdateYearbook={handleUpdateYearbook} 
                  onEditMessage={handleEditMessage}
                />
              ) : (
                <>
                  <HeroSection
                    totalMessages={messages.length}
                    onOpenForm={() => { setEditMessageData(null); setFormOpen(true); }}
                    onGoToSignature={() => setSection('signature')}
                  />
                  <MemoryWall
                    messages={messages}
                    viewMode={viewMode}
                    onHeartUpdate={handleHeartUpdate}
                    onEditMessage={handleEditMessage}
                  />
                </>
              )}
            </motion.div>
          ) : section === 'gallery' ? (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="print:hidden"
            >
              <GalleryWall />
            </motion.div>
          ) : (
            <motion.div
              key="signature"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="print:hidden"
            >
              <SignatureWall />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Form gửi lưu bút (modal) */}
      <div className="print:hidden">
        <SubmitForm
          isOpen={formOpen}
          initialData={editMessageData}
          onClose={() => { setFormOpen(false); setEditMessageData(null); }}
          onSubmit={handleNewMessage}
        />
      </div>

      {/* Music Player nổi */}
      <div className="print:hidden">
        <FloatingMusicPlayer />
      </div>

      {/* ── Menu Tools (Dành cho Dev/Demo/Switch Layout) ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 print:hidden">
        
        {/* Toggle Layout */}
        {section === 'wall' && (
          <div className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-full shadow-float border border-pink-100 flex items-center gap-1">
            <button
              onClick={() => setLayoutMode('book')}
              className={`p-1.5 rounded-full transition-colors ${layoutMode === 'book' ? 'bg-pink-100 text-pink-600' : 'text-ink/40 hover:text-ink'}`}
              title="Giao diện Sách"
            >
              <BookOpen size={16} />
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-full transition-colors ${layoutMode === 'grid' ? 'bg-pink-100 text-pink-600' : 'text-ink/40 hover:text-ink'}`}
              title="Giao diện Lưới"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        )}

        {/* Toggle Góc nhìn (Chỉ dành cho GV / Admin) */}
        {userRole !== 'student' && (
          <div className="flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-float border border-pink-100 flex items-center gap-2">
              <span className="text-xs font-body font-700 text-ink/60 hidden sm:inline">Chế độ:</span>
            <div className="flex bg-cream-100 rounded-full p-1 relative">
              <button
                onClick={() => handleViewModeChange('public')}
                className={`relative z-10 px-3 py-1 rounded-full text-xs font-body font-600 transition-colors ${
                  viewMode === 'public' ? 'text-white' : 'text-ink/60 hover:text-ink'
                }`}
              >
                Lớp
              </button>
              <button
                onClick={() => handleViewModeChange('teacher')}
                className={`relative z-10 px-3 py-1 rounded-full text-xs font-body font-600 transition-colors ${
                  viewMode === 'teacher' ? 'text-white' : 'text-ink/60 hover:text-ink'
                }`}
              >
                Mẫu GV
              </button>
              
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-pink-500 rounded-full transition-transform duration-300"
                style={{
                  transform: viewMode === 'public' ? 'translateX(0)' : 'translateX(100%)',
                  left: viewMode === 'public' ? '4px' : '0'
                }}
              />
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
