import { useCallback } from 'react';

interface ScrollOptions {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    inline?: ScrollLogicalPosition;
}

export const useSmoothScroll = () => {
    const scrollIntoView = useCallback((element: HTMLElement | null, options: ScrollOptions = {}) => {
        if (!element) return;

        const defaultOptions: ScrollIntoViewOptions = {
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
            ...options
        };

        // Check if element is partially visible
        const rect = element.getBoundingClientRect();
        const isPartiallyVisible = 
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        // Only scroll if element is not fully visible
        if (!isPartiallyVisible) {
            element.scrollIntoView(defaultOptions);
        }
    }, []);

    return scrollIntoView;
}; 