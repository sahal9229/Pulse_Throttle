import { Children, cloneElement, useEffect, useState, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils.js';

export function AnimatedBackground({
  children,
  defaultValue,
  onValueChange,
  className,
  transition = {
    type: 'spring',
    stiffness: 380,
    damping: 30,
  },
  enableHover = false,
}) {
  const [activeId, setActiveId] = useState(defaultValue ?? null);
  const uniqueId = useId();

  const handleSetActiveId = (id) => {
    setActiveId(id);
    if (onValueChange) {
      onValueChange(id);
    }
  };

  useEffect(() => {
    if (defaultValue !== undefined) {
      setActiveId(defaultValue);
    }
  }, [defaultValue]);

  return Children.map(children, (child, index) => {
    if (!child) return null;
    const id = child.props['data-id'];

    const interactionProps = enableHover
      ? {
          onMouseEnter: () => handleSetActiveId(id),
          onMouseLeave: () => handleSetActiveId(null),
        }
      : {
          onClick: (e) => {
            child.props.onClick?.(e);
            handleSetActiveId(id);
          },
        };

    return cloneElement(
      child,
      {
        key: id || index,
        className: cn('relative inline-flex', child.props.className),
        'data-checked': activeId === id ? 'true' : 'false',
        ...interactionProps,
      },
      <>
        <AnimatePresence initial={false}>
          {activeId === id && (
            <motion.div
              layoutId={`background-${uniqueId}`}
              className={cn('absolute inset-0', className)}
              transition={transition}
              initial={{ opacity: defaultValue ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <span className="relative z-10 w-full flex items-center justify-center">
          {child.props.children}
        </span>
      </>
    );
  });
}
