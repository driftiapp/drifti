import { useCallback, useRef } from 'react';

interface UseFocusTrapOptions {
    enabled: boolean;
    onEscape?: () => void;
}

export const useFocusTrap = ({ enabled, onEscape }: UseFocusTrapOptions) => {
    const firstFocusableRef = useRef<HTMLElement | null>(null);
    const lastFocusableRef = useRef<HTMLElement | null>(null);

    const updateFocusableRefs = useCallback((element: HTMLElement | null) => {
        if (!element) return;

        const focusableElements = element.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        firstFocusableRef.current = focusableElements[0] || null;
        lastFocusableRef.current = focusableElements[focusableElements.length - 1] || null;
    }, []);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        if (event.key === 'Escape' && onEscape) {
            onEscape();
            return;
        }

        if (event.key !== 'Tab') return;

        // Handle tab and shift+tab navigation
        if (!firstFocusableRef.current || !lastFocusableRef.current) return;

        if (event.shiftKey) {
            if (document.activeElement === firstFocusableRef.current) {
                event.preventDefault();
                lastFocusableRef.current.focus();
            }
        } else {
            if (document.activeElement === lastFocusableRef.current) {
                event.preventDefault();
                firstFocusableRef.current.focus();
            }
        }
    }, [enabled, onEscape]);

    return {
        updateFocusableRefs,
        handleKeyDown
    };
}; 