import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LIBRARY_COLORS } from './libraryUtils';

export default function AddedBookToast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="fixed left-1/2 bottom-24 z-[260] -translate-x-1/2 border px-5 py-3 shadow-2xl text-sm font-bold" style={{ background: LIBRARY_COLORS.wine, color: LIBRARY_COLORS.cream, borderColor: LIBRARY_COLORS.gold }}>
          ✦ +1 livre ajouté à votre collection !
        </motion.div>
      )}
    </AnimatePresence>
  );
}