interface KlendeiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function KlendeiLogo({ size = 'md', className = '' }: KlendeiLogoProps) {
  const sizes = {
    sm: { icon: 'h-7 w-7', text: 'text-lg', sub: 'text-[8px]', gap: 'gap-2' },
    md: { icon: 'h-9 w-9', text: 'text-xl', sub: 'text-[9px]', gap: 'gap-2.5' },
    lg: { icon: 'h-12 w-12', text: 'text-3xl', sub: 'text-[11px]', gap: 'gap-3' },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <div className={`${s.icon} rounded-xl bg-[#7C6EF5] flex items-center justify-center`}>
        <span className="text-white font-medium" style={{ fontSize: size === 'lg' ? 22 : size === 'md' ? 16 : 13, letterSpacing: -1 }}>
          k
        </span>
      </div>
      <div className="flex flex-col">
        <span className={`${s.text} font-medium`} style={{ letterSpacing: -1.5 }}>
          <span className="text-foreground">klen</span>
          <span className="text-[#7C6EF5]">dei</span>
        </span>
      </div>
    </div>
  );
}
