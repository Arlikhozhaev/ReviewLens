"use client";

import { useInView } from "@/lib/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(className, isInView && "animate-fade-up")}
      style={isInView ? { animationDelay: `${delay}ms` } : { opacity: 0 }}
    >
      {children}
    </div>
  );
}