import React from 'react';
import { useRole } from '@/lib/RoleContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoleSwitcher() {
  const { role, setRole, switcherOpen, setSwitcherOpen, ROLES } = useRole();

  return (
    <AnimatePresence>
      {switcherOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden bg-papier border-b-2 border-papier-fonce max-w-[480px] mx-auto"
        >
          <div className="px-5">
            {Object.entries(ROLES).map(([key, val], i, arr) => (
              <div
                key={key}
                onClick={() => { setRole(key); setSwitcherOpen(false); }}
                className={`py-3 flex items-center gap-3 cursor-pointer transition-colors hover:text-bordeaux ${
                  i < arr.length - 1 ? 'border-b border-dashed border-foreground/20' : ''
                } ${role === key ? 'text-bordeaux' : ''}`}
              >
                <span className="text-[20px] w-7 text-center">{val.icon}</span>
                <div>
                  <div className="text-[13px] tracking-[1px] font-typewriter">{val.label}</div>
                  <div className="text-[10px] text-foreground/50 italic font-fell">{val.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}