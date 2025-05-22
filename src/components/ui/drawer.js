'use client';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function Drawer({
  isOpen,
  onClose,
  children,
  position = 'right',
  className = '',
}) {
  const drawerRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'visible';
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const positionClasses = {
    right: 'right-0 h-full',
    left: 'left-0 h-full',
    top: 'top-0 w-full',
    bottom: 'bottom-0 w-full',
  };

  const transitionProps = {
    right: { x: '100%' },
    left: { x: '-100%' },
    top: { y: '-100%' },
    bottom: { y: '100%' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            initial={transitionProps[position]}
            animate={{ x: 0, y: 0 }}
            exit={transitionProps[position]}
            transition={{ type: 'tween', duration: 0.3 }}
            className={`fixed ${positionClasses[position]} bg-white z-50 shadow-xl ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}