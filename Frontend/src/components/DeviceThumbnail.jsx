import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

const BRAND_GRADIENTS = {
  apple: 'from-slate-800 to-slate-950 text-slate-200',
  samsung: 'from-slate-700 to-slate-900 text-sky-400',
  xiaomi: 'from-amber-600 to-amber-700 text-white',
  poco: 'from-amber-500 to-amber-600 text-slate-950',
  oneplus: 'from-rose-600 to-rose-700 text-white',
  motorola: 'from-teal-700 to-slate-900 text-teal-300',
  iqoo: 'from-slate-800 to-slate-950 text-amber-400',
  vivo: 'from-sky-700 to-slate-900 text-sky-300',
  google: 'from-slate-700 to-slate-900 text-emerald-400',
  sony: 'from-slate-800 to-slate-950 text-white',
  asus: 'from-slate-800 to-slate-950 text-rose-400',
  realme: 'from-amber-500 to-amber-600 text-slate-950',
  nothing: 'from-neutral-800 to-neutral-950 text-white',
};

export default function DeviceThumbnail({
  src,
  alt = 'Smartphone',
  brand = '',
  className = 'w-full h-full object-cover',
  iconSize = 'w-5 h-5',
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const brandKey = brand?.toLowerCase() || (alt ? alt.split(' ')[0].toLowerCase() : '');
  const gradient = BRAND_GRADIENTS[brandKey] || 'from-slate-700 to-slate-800 text-slate-200';

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-1 bg-gradient-to-br ${gradient} select-none`}
        title={alt}
      >
        <Smartphone className={`${iconSize} opacity-90 drop-shadow-xs`} />
        {brandKey && (
          <span className="text-[8px] font-black uppercase tracking-wider opacity-80 truncate max-w-full leading-none mt-0.5">
            {brandKey.slice(0, 4)}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
