import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils.js';

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  springOptions = {
    mass: 0.8,
    stiffness: 85,
    damping: 18,
  },
  as = 'span',
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const spring = useSpring(numericValue, springOptions);

  const display = useTransform(spring, (current) => {
    if (decimals > 0) {
      return `${prefix}${current.toFixed(decimals)}${suffix}`;
    }
    return `${prefix}${Math.round(current).toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    spring.set(numericValue);
  }, [spring, numericValue]);

  const MotionComponent = motion[as] || motion.span;

  return (
    <MotionComponent className={cn('tabular-nums inline-block', className)}>
      {display}
    </MotionComponent>
  );
}
