import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Drop shadow for art lifted off the paper. Rests at (x, y) and slides away from the cursor
 * by up to `shift` px via the hero's --nr-dx/--nr-dy (still where those are unset), so
 * higher layers — longer `shift` — part visibly from lower ones.
 */
export function liftShadow(x: number, y: number, blur: number, shift: number, alpha: number) {
  return (
    `drop-shadow(calc(${x}px - var(--nr-dx, 0) * ${shift}px) ` +
    `calc(${y}px - var(--nr-dy, 0) * ${shift}px) ${blur}px rgba(60, 58, 80, ${alpha}))`
  )
}
