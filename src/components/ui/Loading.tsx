'use client';

import dynamic from 'next/dynamic';

// DotLottie uses WebAssembly — must be loaded client-side only.
// next/dynamic with ssr:false prevents WASM errors during SSR on Vercel.
const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((m) => m.DotLottieReact),
  { ssr: false, loading: () => <FallbackSpinner /> }
);

export const LOADING_LOTTIE_SRC =
  'https://lottie.host/7374b437-a0c7-4083-b17b-c66568142373/ZYvqELTKZ3.lottie';

function FallbackSpinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 40,
        height: 40,
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

type LoadingProps = {
  /** Optional caption below the animation */
  message?: string;
  /** Animation size in px */
  size?: number;
  /** Centered full-viewport overlay */
  fullScreen?: boolean;
  /** Background when fullScreen */
  background?: string;
  className?: string;
};

export function Loading({
  message,
  size = 140,
  fullScreen = false,
  background = '#f8fafc',
  className = '',
}: LoadingProps) {
  const inner = (
    <div className={`app-loading ${className}`.trim()} role="status" aria-live="polite">
      <DotLottieReact
        src={LOADING_LOTTIE_SRC}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      {message ? <p className="app-loading-message">{message}</p> : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="app-loading-screen" style={{ background }}>
        {inner}
      </div>
    );
  }

  return inner;
}
