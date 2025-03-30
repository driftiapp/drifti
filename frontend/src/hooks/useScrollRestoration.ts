import { useEffect, useRef } from 'react';

interface ScrollPosition {
    top: number;
    left: number;
    timestamp: number;
}

// Time constants in milliseconds
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

const MIN_EXPIRY = 5 * MINUTE_MS; // 5 minutes minimum
const MAX_EXPIRY = 24 * HOUR_MS; // 24 hours maximum
const DEFAULT_EXPIRY = 2 * HOUR_MS; // 2 hours default

const validateExpiryTime = (expiryTime: number): number => {
    if (typeof expiryTime !== 'number' || isNaN(expiryTime)) {
        console.warn('Invalid expiry time provided to useScrollRestoration. Using default value.');
        return DEFAULT_EXPIRY;
    }
    
    if (expiryTime < MIN_EXPIRY) {
        console.warn(`Expiry time (${expiryTime}ms) is too short. Using minimum value of ${MIN_EXPIRY}ms.`);
        return MIN_EXPIRY;
    }
    
    if (expiryTime > MAX_EXPIRY) {
        console.warn(`Expiry time (${expiryTime}ms) is too long. Using maximum value of ${MAX_EXPIRY}ms.`);
        return MAX_EXPIRY;
    }
    
    return expiryTime;
};

const cleanupOldPositions = (expiryTime: number) => {
    const now = Date.now();
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('scroll-position-')) {
            try {
                const item = localStorage.getItem(key);
                if (item) {
                    const position: ScrollPosition = JSON.parse(item);
                    if (now - position.timestamp > expiryTime) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (error) {
                console.error('Error cleaning up scroll position:', error);
                localStorage.removeItem(key);
            }
        }
    });
};

interface ScrollRestorationOptions {
    /**
     * Time in milliseconds before scroll position expires.
     * - Minimum: 5 minutes (300,000ms)
     * - Maximum: 24 hours (86,400,000ms)
     * - Default: 2 hours (7,200,000ms)
     */
    expiryTime?: number;
}

export const useScrollRestoration = (key: string, options: ScrollRestorationOptions = {}) => {
    const elementRef = useRef<HTMLElement | null>(null);
    const scrollPositionKey = `scroll-position-${key}`;
    const expiryTime = validateExpiryTime(options.expiryTime ?? DEFAULT_EXPIRY);

    // Save scroll position before unmounting
    useEffect(() => {
        return () => {
            if (elementRef.current) {
                const position: ScrollPosition = {
                    top: elementRef.current.scrollTop,
                    left: elementRef.current.scrollLeft,
                    timestamp: Date.now()
                };
                try {
                    localStorage.setItem(scrollPositionKey, JSON.stringify(position));
                    cleanupOldPositions(expiryTime);
                } catch (error) {
                    console.error('Error saving scroll position:', error);
                }
            }
        };
    }, [scrollPositionKey, expiryTime]);

    // Restore scroll position on mount
    useEffect(() => {
        if (elementRef.current) {
            try {
                const savedPosition = localStorage.getItem(scrollPositionKey);
                if (savedPosition) {
                    const position: ScrollPosition = JSON.parse(savedPosition);
                    
                    // Check if the position has expired
                    if (Date.now() - position.timestamp <= expiryTime) {
                        requestAnimationFrame(() => {
                            if (elementRef.current) {
                                elementRef.current.scrollTo({
                                    top: position.top,
                                    left: position.left,
                                    behavior: 'instant'
                                });
                            }
                        });
                    } else {
                        localStorage.removeItem(scrollPositionKey);
                    }
                }
            } catch (error) {
                console.error('Error restoring scroll position:', error);
                localStorage.removeItem(scrollPositionKey);
            }
        }
    }, [scrollPositionKey, expiryTime]);

    return elementRef;
}; 