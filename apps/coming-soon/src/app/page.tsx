// next.config.mjs redirects `/` to `/coming-soon`, so this stub is
// effectively unreachable at runtime — it exists so the app router has
// a root segment.
export default function Home(): null {
  return null;
}
