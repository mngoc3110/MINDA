"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[MINDA] SW registered:", reg.scope))
        .catch((err) => console.warn("[MINDA] SW registration failed:", err));
    }
  }, []);

  return null;
}
