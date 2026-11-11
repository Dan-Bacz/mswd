"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function LoginSplash() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setVisible(false), 500);
    const removeTimer = window.setTimeout(() => setMounted(false), 850);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-label="Loading MSWD Management Information System"
      aria-live="polite"
      role="status"
      className={`login-splash ${visible ? "login-splash-visible" : "login-splash-hidden"}`}
    >
      <div className="login-splash-glow" aria-hidden="true" />
      <div className="login-splash-content">
        <div className="login-splash-logo-wrap">
          <Image
            src="/images/logo.png"
            alt="Mahayag MSWD logo"
            width={240}
            height={240}
            priority
            unoptimized
            className="login-splash-logo"
          />
        </div>
        <p className="login-splash-kicker">Municipal Social Welfare and Development</p>
        <p className="login-splash-title">Mahayag Management Information System</p>
        <span className="login-splash-loader" aria-hidden="true" />
      </div>
    </div>
  );
}
