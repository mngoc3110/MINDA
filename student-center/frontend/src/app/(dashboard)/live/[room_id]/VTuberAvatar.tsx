"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as Kalidokit from "kalidokit";
const { Holistic } = require("@mediapipe/holistic");
const { Camera } = require("@mediapipe/camera_utils");

interface VTuberAvatarProps {
  onStreamReady: (stream: MediaStream) => void;
  modelUrl: string;
}

export default function VTuberAvatar({ onStreamReady, modelUrl }: VTuberAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;
    let currentVrm: any = null;
    let isComponentMounted = true;

    // 1. Setup Three.js Scene
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(640, 480);
    renderer.setPixelRatio(window.devicePixelRatio);
    const camera = new THREE.PerspectiveCamera(30.0, 640 / 480, 0.1, 20.0);
    camera.position.set(0.0, 1.4, 1.2); // Focus on upper body/face

    const scene = new THREE.Scene();
    const light = new THREE.DirectionalLight(0xffffff, Math.PI);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);

    // 2. Load VRM Model (Initial)
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    // Lưu các hàm để đổi model
    (window as any).changeVrmModel = (newUrl: string) => {
      setLoading(true);
      loader.load(
        newUrl,
        (gltf) => {
          if (!isComponentMounted) return;
          const vrm = gltf.userData.vrm;
          VRMUtils.removeUnnecessaryJoints(gltf.scene);
          
          if (currentVrm) {
            scene.remove(currentVrm.scene);
          }
          
          scene.add(vrm.scene);
          currentVrm = vrm;
          vrm.scene.rotation.y = Math.PI; // Rotate model to face camera
          setLoading(false);
        },
        undefined,
        (error) => console.error("Error loading VRM:", error)
      );
    };

    (window as any).changeVrmModel(modelUrl);

    // Notify parent that stream is ready
    if (onStreamReady && canvasRef.current) {
      const stream = canvasRef.current.captureStream(30);
      onStreamReady(stream);
    }

    // 3. Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;
    function animate() {
      if (!isComponentMounted) return;
      animationFrameId = requestAnimationFrame(animate);
      if (currentVrm) {
        currentVrm.update(clock.getDelta());
      }
      renderer.render(scene, camera);
    }
    animate();

    // 4. Setup MediaPipe Holistic
    const holistic = new Holistic({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // 5. Apply Kalidokit to VRM
    const rigRotation = (name: string, rad = { x: 0, y: 0, z: 0 }, damp = 1, lerpAmount = 0.3) => {
      if (!currentVrm) return;
      const part = currentVrm.humanoid.getNormalizedBoneNode(name);
      if (!part) return;
      const euler = new THREE.Euler(rad.x * damp, rad.y * damp, rad.z * damp);
      const quaternion = new THREE.Quaternion().setFromEuler(euler);
      part.quaternion.slerp(quaternion, lerpAmount);
    };

    holistic.onResults((results) => {
      if (!isComponentMounted || !videoRef.current) return;

      // Solve Face
      if (results.faceLandmarks && currentVrm) {
        const faceRig = Kalidokit.Face.solve(results.faceLandmarks, { runtime: "mediapipe", video: videoRef.current });
        if (faceRig) {
          rigRotation("head", faceRig.head, 0.7);
          rigRotation("neck", faceRig.head, 0.3);

          // Expressions
          currentVrm.expressionManager.setValue("blinkLeft", faceRig.eye.l);
          currentVrm.expressionManager.setValue("blinkRight", faceRig.eye.r);
          currentVrm.expressionManager.setValue("aa", faceRig.mouth.shape.A);
          currentVrm.expressionManager.setValue("ee", faceRig.mouth.shape.E);
          currentVrm.expressionManager.setValue("ih", faceRig.mouth.shape.I);
          currentVrm.expressionManager.setValue("oh", faceRig.mouth.shape.O);
          currentVrm.expressionManager.setValue("ou", faceRig.mouth.shape.U);
        }
      }
      
      // Solve Pose (upper body only for performance)
      if (results.pose3DLandmarks && results.poseLandmarks && currentVrm) {
        const poseRig = Kalidokit.Pose.solve(results.pose3DLandmarks, results.poseLandmarks, { runtime: "mediapipe", video: videoRef.current });
        if (poseRig) {
            rigRotation("rightUpperArm", poseRig.RightUpperArm, 1, 0.3);
            rigRotation("rightLowerArm", poseRig.RightLowerArm, 1, 0.3);
            rigRotation("leftUpperArm", poseRig.LeftUpperArm, 1, 0.3);
            rigRotation("leftLowerArm", poseRig.LeftLowerArm, 1, 0.3);
        }
      }
    });

    // 6. Setup Camera
    let cameraUtils: Camera | null = null;
    if (videoRef.current) {
        cameraUtils = new Camera(videoRef.current, {
        onFrame: async () => {
            if (videoRef.current && isComponentMounted) {
            await holistic.send({ image: videoRef.current });
            }
        },
        width: 640,
        height: 480,
        });
        cameraUtils.start();
    }

    return () => {
      isComponentMounted = false;
      cancelAnimationFrame(animationFrameId);
      if (cameraUtils) cameraUtils.stop();
      holistic.close();
      scene.clear();
      renderer.dispose();
      delete (window as any).changeVrmModel;
    };
  }, [onStreamReady]); // Only run once, do not depend on modelUrl

  useEffect(() => {
    if ((window as any).changeVrmModel) {
      (window as any).changeVrmModel(modelUrl);
    }
  }, [modelUrl]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-white text-xs font-bold uppercase tracking-wider">Đang tải VTuber...</p>
        </div>
      )}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover" width={640} height={480} />
    </div>
  );
}
