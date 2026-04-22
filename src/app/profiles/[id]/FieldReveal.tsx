"use client";

import { AnimatePresence, motion } from "framer-motion";

interface Props {
  revealed: boolean;
  value: string;
}

export default function FieldReveal({ revealed, value }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {revealed ? (
        <motion.span
          key="v"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="block whitespace-pre-wrap font-handwritten text-base leading-relaxed text-ink"
        >
          {value || "（未回答）"}
        </motion.span>
      ) : (
        <motion.span
          key="l"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-2 rounded-sm bg-ink/90 px-2.5 py-1 font-dot text-[11px] tracking-[0.3em] text-paper"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon animate-blink" />
          LOCKED · tap to reveal
        </motion.span>
      )}
    </AnimatePresence>
  );
}
