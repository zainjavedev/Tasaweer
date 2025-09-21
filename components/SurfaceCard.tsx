import React, { PropsWithChildren } from 'react';

interface SurfaceCardProps {
  className?: string;
}

const base =
  'w-full bg-white/40 backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)]';

export function SurfaceCard({ children, className }: PropsWithChildren<SurfaceCardProps>) {
  return <div className={`${base}${className ? ` ${className}` : ''}`}>{children}</div>;
}

export default SurfaceCard;
