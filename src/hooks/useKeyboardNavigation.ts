import { useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onTab?: (direction: 'forward' | 'backward') => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onEnter,
  onEscape,
  onArrowLeft,
  onArrowRight,
  onArrowUp,
  onArrowDown,
  onTab,
  enabled = true,
}: KeyboardNavigationOptions = {}) {
  const elementRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          onEnter?.();
          break;
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowRight?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'Tab':
          if (onTab) {
            event.preventDefault();
            onTab(event.shiftKey ? 'backward' : 'forward');
          }
          break;
      }
    },
    [enabled, onEnter, onEscape, onArrowLeft, onArrowRight, onArrowUp, onArrowDown, onTab]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('keydown', handleKeyDown);
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return elementRef;
} 