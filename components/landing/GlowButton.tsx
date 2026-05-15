import Link from 'next/link';

export default function GlowButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300';
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]'
      : variant === 'outline'
        ? 'border border-[#E5E7EB] bg-white/70 backdrop-blur-md text-[#0F172A] hover:border-emerald-400/60 hover:shadow-md'
        : 'text-emerald-600 hover:text-emerald-700 hover:underline';

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}
