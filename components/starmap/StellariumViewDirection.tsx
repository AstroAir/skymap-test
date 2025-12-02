'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStellariumStore, useFramingStore } from '@/lib/starmap/stores';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/lib/starmap/utils';

export function StellariumViewDirection() {
  const [formattedRA, setFormattedRA] = useState('--:--:--');
  const [formattedDec, setFormattedDec] = useState('+--:--:--');
  const [raDeg, setRaDeg] = useState(0);
  const [decDeg, setDecDeg] = useState(0);
  
  const stel = useStellariumStore((state) => state.stel);
  const setShowFramingModal = useFramingStore((state) => state.setShowFramingModal);
  const setCoordinates = useFramingStore((state) => state.setCoordinates);
  const setSelectedItem = useFramingStore((state) => state.setSelectedItem);

  // Update view direction
  const updateViewDirection = useCallback(() => {
    if (!stel) return;

    try {
      const obs = stel.observer;
      const viewVec = [0, 0, -1];
      const cirsVec = stel.convertFrame(obs, 'VIEW', 'ICRF', viewVec);
      const radec = stel.c2s(cirsVec);

      let ra = rad2deg(radec[0]);
      const dec = rad2deg(radec[1]);
      ra = ((ra % 360) + 360) % 360;

      setFormattedRA(degreesToHMS(ra));
      setFormattedDec(degreesToDMS(dec));
      setRaDeg(ra);
      setDecDeg(dec);
    } catch (error) {
      console.error('Error updating view direction:', error);
    }
  }, [stel]);

  useEffect(() => {
    if (!stel) return;

    let animationFrameId: number;
    
    const update = () => {
      updateViewDirection();
      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [stel, updateViewDirection]);

  const openFramingModal = () => {
    setCoordinates({
      ra: raDeg,
      dec: decDeg,
      raString: formattedRA,
      decString: formattedDec,
    });
    setSelectedItem({
      Name: 'Stellarium View',
      RA: raDeg,
      Dec: decDeg,
    });
    setShowFramingModal(true);
  };

  if (!stel) return null;

  return (
    <>
      {/* Framing crosshair in center */}
      <div
        className="fixed top-[calc(50%-15px)] left-1/2 -translate-x-1/2 -translate-y-1/2 z-1 w-[100px] h-[100px] cursor-pointer landscape:left-[calc(50%+4rem)]"
        onClick={openFramingModal}
      >
        {/* Rectangle around crosshair */}
        <div className="absolute top-1/2 left-1/2 w-[60px] h-[45px] -translate-x-1/2 -translate-y-1/2 border border-dashed border-white/50 pointer-events-none" />
        
        {/* Vertical line */}
        <div className="absolute w-[2px] h-[20px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/60" />
        
        {/* Horizontal line */}
        <div className="absolute w-[20px] h-[2px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/60" />
        
        {/* Center dot */}
        <div className="absolute w-[6px] h-[6px] bg-white/60 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        
        {/* SVG framing symbol overlay */}
        <svg viewBox="0 0 100 100" className="absolute w-full h-full top-0 left-0 drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]">
          <rect
            x="60"
            y="30"
            width="25"
            height="13"
            fill="none"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
          />
          <rect
            x="62"
            y="28"
            width="25"
            height="13"
            fill="none"
            stroke="rgba(6, 182, 212, 0.7)"
            strokeWidth="1.5"
            transform="rotate(15 75 35)"
          />
        </svg>
      </div>

      {/* Coordinates display */}
      <div className="fixed top-[calc(50%+20px)] left-1/2 -translate-x-1/2 z-1 text-center pointer-events-none landscape:left-[calc(50%+4rem)]">
        <p className="text-white/70 text-xs font-mono my-[2px] leading-tight">{formattedRA}</p>
        <p className="text-white/70 text-xs font-mono my-[2px] leading-tight">{formattedDec}</p>
      </div>
    </>
  );
}
