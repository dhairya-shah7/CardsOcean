"use client";

import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { RuPayCard } from "./rupay-card";

export function HeroShowcase({ product }: { product?: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-6 shadow-glow"
    >
      <RuPayCard product={product} />
    </motion.div>
  );
}
