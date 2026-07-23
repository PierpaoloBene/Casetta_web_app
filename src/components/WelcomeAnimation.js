"use client"
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function WelcomeAnimation({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-bg)'
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 1.5, 
              ease: "easeOut",
              type: "spring",
              bounce: 0.4
            }}
          >
            <Home size={100} color="var(--color-accent)" strokeWidth={1} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
