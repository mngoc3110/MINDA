import { useEffect, useRef, useState } from "react";

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [coords, setCoords] = useState<{ x: number, y: number, normalizedX: number, normalizedY: number } | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [handGestures, setHandGestures] = useState<{ isOpenHand: boolean; isClosedHand: boolean } | null>(null);
  
  const landmarkerRef = useRef<any>(null); // typeof HandLandmarker
  const animationRef = useRef<number>(0);
  const lastVideoTime = useRef(-1);

  // Khởi tạo MediaPipe HandLandmarker Native WASM
  useEffect(() => {
    let active = true;

    const initMediaPipe = async () => {
      try {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        console.log("Downloading MediaPipe WASM Fileset...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        console.log("Loading HandLandmarker Model Task...");
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "CPU" // Fallback to CPU to prevent silent crashes across various browsers
          },
          runningMode: "VIDEO",
          numHands: 1, // Bắt 1 tay
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (active) {
            landmarkerRef.current = handLandmarker;
            setIsReady(true);
            console.log("✅ MediaPipe HandLandmarker is Online!");
        }
      } catch (err) {
        console.error("❌ MediaPipe Load Error:", err);
      }
    };

    initMediaPipe();

    return () => {
      active = false;
      if (landmarkerRef.current) {
         landmarkerRef.current.close();
      }
    };
  }, []);

  // Vòng lặp tracking khung hình siêu tốc liên tục
  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    const video = videoRef.current;
    
    // Tự động yêu cầu Webcam
    const setupCamera = async () => {
       if (!video.srcObject) {
         try {
           const stream = await navigator.mediaDevices.getUserMedia({
             video: { width: 640, height: 480, facingMode: "user" },
           });
           video.srcObject = stream;
           await new Promise((resolve) => {
             video.onloadedmetadata = () => {
               video.play();
               resolve(true);
             };
           });
         } catch(e) {
           console.error("Camera access denied", e);
           return;
         }
       }
       detectFrame();
    };

    // Hàm nhận diện từng Frame
    const detectFrame = async () => {
      // Phải có readyState >= 2 vì detectForVideo yêu cầu video đã có frame hiện tại
      if (video.readyState >= 2 && landmarkerRef.current) {
          const startTimeMs = performance.now();
          if (lastVideoTime.current !== video.currentTime) {
             lastVideoTime.current = video.currentTime;
             
             // Gọi hàm detect trực tiếp bằng WASM
             const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

             if (results.landmarks && results.landmarks.length > 0) {
                 const landmarks = results.landmarks[0]; // Tay đầu tiên

                 // Landmark Indexes MediaPipe:
                 // 0: Cổ tay
                 // 4: Đầu ngón cái
                 // 8: Đầu ngón trỏ
                 // 12: Đầu ngón giữa
                 const wrist = landmarks[0];
                 const thumbTip = landmarks[4];
                 const indexTip = landmarks[8];
                 const middleTip = landmarks[12];
                 const ringTip = landmarks[16];
                 // const pinkyTip = landmarks[20];

                 // Tọa độ ngón trỏ: MediaPipe trả về 0 -> 1
                 // Camera bị lật gương (Mirror) nên x=0 thực chất là bên phải màn hình
                 const mirroredX = 1 - indexTip.x;
                 
                 // Ánh xạ sang tọa độ tuyệt đối pixel màn hình để vẽ con trỏ HTML
                 const x = mirroredX * window.innerWidth;
                 const y = indexTip.y * window.innerHeight;
                 
                 // Chuyển sang Normalized Device Coordinates (-1 -> 1) cho React Three Fiber Camera Raycaster
                 // Tâm giữa viewport là (0,0)
                 const normalizedX = (mirroredX * 2) - 1;
                 const normalizedY = -(indexTip.y * 2) + 1;

                 // --- Tính toán Gesture siêu chuẩn ---
                 
                 // 1. Phân tích Nắm Tay (Fist / Closed Hand)
                 const distMiddleWrist = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
                 const distRingWrist = Math.hypot(ringTip.x - wrist.x, ringTip.y - wrist.y);
                 const isClosedHand = distMiddleWrist < 0.25 && distRingWrist < 0.25;

                 // Xem như bung tay (OpenHand) tự do nếu không phải Nắm Tay
                 const isOpenHand = !isClosedHand && distMiddleWrist > 0.15;

                 // 2. Tính Tỷ lệ kẹp ngón cái & trỏ (Tính năng Pinch để Gắp/Click)
                 const distPinch = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
                 
                 // Ngưỡng bóp: Cực sát (< 0.08 tỉ lệ màn hình) và tuyệt đối không phải Đang nắm tay!
                 const dragTrigger = distPinch < 0.08 && !isClosedHand;

                 // Broadcast State
                 setCoords({ x, y, normalizedX, normalizedY });
                 setIsPinching(dragTrigger);
                 setHandGestures({ isOpenHand, isClosedHand });
             } else {
                 setCoords(null);
                 setIsPinching(false);
                 setHandGestures({ isOpenHand: false, isClosedHand: false });
             }
          }
      }

      animationRef.current = requestAnimationFrame(detectFrame);
    };

    setupCamera();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isReady, videoRef]);

  return { isReady, coords, isPinching, handGestures, videoRef };
}
