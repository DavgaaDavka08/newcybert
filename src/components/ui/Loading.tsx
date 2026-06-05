'use client';

const MORTY_LOADER = '/The Morty Dance Loader.svg';

type LoadingProps = {
  message?: string;
  size?: number;
  fullScreen?: boolean;
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
      <img
        src={MORTY_LOADER}
        alt="Ачаалж байна…"
        width={size}
        height={size}
        style={{ display: 'block', objectFit: 'contain' }}
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
