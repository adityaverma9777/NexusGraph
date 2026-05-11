import React, { useState, useEffect } from 'react';

interface ConnectionGuardProps {
  children: React.ReactNode;
}

const ConnectionGuard: React.FC<ConnectionGuardProps> = ({ children }) => {
  const [isWarmedUp, setIsWarmedUp] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    let intervalId: number;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) {
          setIsWarmedUp(true);
        } else {
          setErrorCount(prev => prev + 1);
        }
      } catch (error) {
        setErrorCount(prev => prev + 1);
      }
    };

    checkHealth();

    intervalId = window.setInterval(checkHealth, 2000);

    return () => window.clearInterval(intervalId);
  }, [baseUrl]);

  if (isWarmedUp) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050a14] text-[#e6edf7]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-[#4db8ff]/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-[#c77dff]/5 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border border-[#4db8ff]/20 bg-[#0c1422] shadow-[0_0_40px_rgba(77,184,255,0.1)]" />
          <div className="absolute inset-0 animate-ping rounded-full border border-[#4db8ff]/40" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-tr from-[#4db8ff] to-[#c77dff] opacity-80 blur-[8px]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-8 w-8 text-[#f3f7ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-[#f3f7ff]">
            Waking Intelligence Engine
          </h2>
          <p className="max-w-[300px] text-sm text-[#91a5c2]">
            Connecting to high-performance graph clusters. This may take up to 30 seconds on cold start.
          </p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="h-[2px] w-48 overflow-hidden rounded-full bg-[#1f2a3b]">
            <div className="h-full animate-[loading_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[#4db8ff] to-transparent" />
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#4db8ff]/60">
            Attempting sync {errorCount > 0 && `(${errorCount})`}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default ConnectionGuard;
