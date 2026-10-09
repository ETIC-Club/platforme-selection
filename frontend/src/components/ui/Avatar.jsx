import { initials } from '../../utils/format.js';

const COLORS = ['bg-green-600', 'bg-amber-500', 'bg-red-600', 'bg-brand', 'bg-indigo-500', 'bg-fuchsia-500', 'bg-sky-500'];
const hash = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' };

export default function Avatar({ name = '', src, size = 'md' }) {
  if (src) return <img src={src} alt={name} className={`${SIZES[size]} shrink-0 rounded-full object-cover`} />;
  return (
    <span className={`${SIZES[size]} ${COLORS[hash(name) % COLORS.length]} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}>
      {initials(name)}
    </span>
  );
}
