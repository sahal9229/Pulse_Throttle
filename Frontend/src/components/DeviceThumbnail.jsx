import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

const BRAND_GRADIENTS = {
  apple: 'from-slate-800 to-slate-900 text-slate-200',
  samsung: 'from-blue-600 to-indigo-700 text-white',
  xiaomi: 'from-orange-500 to-amber-600 text-white',
  poco: 'from-amber-500 to-yellow-600 text-slate-900',
  oneplus: 'from-red-600 to-rose-700 text-white',
  motorola: 'from-teal-600 to-emerald-700 text-white',
  iqoo: 'from-indigo-600 to-blue-700 text-white',
  vivo: 'from-sky-500 to-blue-600 text-white',
  google: 'from-emerald-600 to-teal-700 text-white',
  sony: 'from-slate-700 to-slate-900 text-white',
  asus: 'from-red-700 to-slate-900 text-white',
  realme: 'from-amber-400 to-yellow-500 text-slate-900',
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
