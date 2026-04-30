// Side-effect CSS imports are valid in Next.js — silence the TS error
// that fires before `next dev` / `next build` populates .next/types/.
declare module '*.css';
