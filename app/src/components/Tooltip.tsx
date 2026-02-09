'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: ReactNode;
  maxWidth?: number;
}

export function Tooltip({ content, children, maxWidth = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  }, []);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, 200);
  }, [updatePosition]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const tooltip = (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            transform: 'translate(-50%, -100%)',
            paddingBottom: 8,
            maxWidth,
          }}
        >
          <div
            className="rounded-lg px-3 py-2.5 text-[11px] leading-relaxed text-[#c9d1d9] border border-white/[0.08] shadow-xl"
            style={{
              background: 'rgba(22, 27, 34, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            {content}
            {/* Arrow */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-white/[0.08]"
              style={{ background: 'rgba(22, 27, 34, 0.85)', marginTop: -4 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <span ref={triggerRef} className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onTouchStart={show} onTouchEnd={hide}>
      {children}
      {mounted && createPortal(tooltip, document.body)}
    </span>
  );
}
