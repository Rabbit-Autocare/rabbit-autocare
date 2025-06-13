'use client';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function Drawer({
  isOpen,
  onClose,
  children,
  position = 'right',
  className = '',
}) {
  const drawerRef = useRef(null);

  // Improved scroll lock and click outside handling
  useEffect(() => {
    if (isOpen) {
      // Save the current scroll position
      const scrollY = window.scrollY;

      // Apply fixed position to body with current scroll position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      // Handle outside click more efficiently (delegated to the backdrop)
      // We no longer need document.addEventListener here since we handle clicks
      // directly on the backdrop with onClick={onClose}

      return () => {
        // Restore scroll position when drawer closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
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
    right: 'right-0 inset-y-0',
    left: 'left-0 inset-y-0',
    top: 'top-0 inset-x-0',
    bottom: 'bottom-0 inset-x-0',
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
          {/* Backdrop overlay with animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 bg-black/50 z-[9998]'
            onClick={onClose} // Close drawer when clicking the backdrop
          />

          {/* Drawer panel with animation */}
          <motion.div
            ref={drawerRef}
            initial={transitionProps[position]}
            animate={{ x: 0, y: 0 }}
            exit={transitionProps[position]}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
              duration: 0.3,
            }}
            className={`fixed ${positionClasses[position]} bg-white z-[9999] shadow-xl overflow-hidden ${className}`}
            style={{
              height:
                position === 'right' || position === 'left' ? '100%' : 'auto',
              width:
                position === 'top' || position === 'bottom' ? '100%' : 'auto',
            }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside drawer from closing it
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
