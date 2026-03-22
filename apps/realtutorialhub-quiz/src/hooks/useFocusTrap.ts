import { useEffect } from 'react';

/**
 * Lightweight focus trap for modals/dialogs.
 * Keeps tab focus within the given container while it's mounted.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  containerRef: React.RefObject<T | null>,
  isActive: boolean,
) {
  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(',')));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !container.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable when activated
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}
