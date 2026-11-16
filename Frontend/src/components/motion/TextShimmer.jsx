import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils.js';

function TextShimmerComponent({
  children,
  as = 'span',
  className = '',
  duration = 2.4,
  spread = 2,
}) {
  const MotionComponent = motion[as] || motion.span;

  const dynamicSpread = useMemo(() => {
    return (typeof children === 'string' ? children.length : 12) * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text',
        'text-transparent [--base-color:#94a3b8] [--base-gradient-color:#0f172a]',
        '[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]',
        className
      )}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={{
        '--spread': `${dynamicSpread}px`,
        backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
      }}
    >
      {children}
    </MotionComponent>
  );
}

export const TextShimmer = memo(TextShimmerComponent);
