import { renderHook, act } from '@testing-library/react';
import { useScrollRestoration } from '../useScrollRestoration';

// Mock localStorage
const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        length: 0,
        key: (_: number) => null,
        getAllKeys: () => Object.keys(store),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(callback, 0);

// Setup mock element for testing
const setupMockElement = () => {
    const element = document.createElement('div');
    Object.defineProperties(element, {
        scrollTop: {
            get: function() { return this._scrollTop || 0; },
            set: function(value) { this._scrollTop = value; }
        },
        scrollLeft: {
            get: function() { return this._scrollLeft || 0; },
            set: function(value) { this._scrollLeft = value; }
        }
    });
    return element;
};

// Mock console.warn to track warnings
const originalWarn = console.warn;
const originalError = console.error;
let consoleWarnings: string[] = [];
let consoleErrors: string[] = [];

describe('useScrollRestoration', () => {
    beforeEach(() => {
        // Clear localStorage and console logs before each test
        localStorage.clear();
        consoleWarnings = [];
        consoleErrors = [];
        console.warn = (warning: string) => {
            consoleWarnings.push(warning);
        };
        console.error = (error: string) => {
            consoleErrors.push(error);
        };
        jest.useFakeTimers();
    });

    afterEach(() => {
        console.warn = originalWarn;
        console.error = originalError;
        jest.useRealTimers();
    });

    describe('expiry time validation', () => {
        const MINUTE_MS = 60 * 1000;
        const HOUR_MS = 60 * MINUTE_MS;

        test('should use default expiry time (2 hours) when no option is provided', () => {
            const { result } = renderHook(() => useScrollRestoration('test'));
            expect(consoleWarnings).toHaveLength(0);
        });

        test('should accept valid expiry time within bounds', () => {
            const validTime = 6 * HOUR_MS; // 6 hours
            const { result } = renderHook(() => 
                useScrollRestoration('test', { expiryTime: validTime })
            );
            expect(consoleWarnings).toHaveLength(0);
        });

        test('should warn and use minimum when expiry time is too short', () => {
            const tooShort = 1 * MINUTE_MS; // 1 minute
            const { result } = renderHook(() => 
                useScrollRestoration('test', { expiryTime: tooShort })
            );
            expect(consoleWarnings).toHaveLength(1);
            expect(consoleWarnings[0]).toContain('too short');
        });

        test('should warn and use maximum when expiry time is too long', () => {
            const tooLong = 48 * HOUR_MS; // 48 hours
            const { result } = renderHook(() => 
                useScrollRestoration('test', { expiryTime: tooLong })
            );
            expect(consoleWarnings).toHaveLength(1);
            expect(consoleWarnings[0]).toContain('too long');
        });

        test('should warn and use default for invalid expiry time', () => {
            const { result } = renderHook(() => 
                useScrollRestoration('test', { expiryTime: NaN })
            );
            expect(consoleWarnings).toHaveLength(1);
            expect(consoleWarnings[0]).toContain('Invalid expiry time');
        });

        test('should handle edge cases of minimum and maximum values', () => {
            const MIN_EXPIRY = 5 * MINUTE_MS;
            const MAX_EXPIRY = 24 * HOUR_MS;

            // Test exact minimum
            const { rerender } = renderHook(({ expiryTime }) => 
                useScrollRestoration('test', { expiryTime }),
                { initialProps: { expiryTime: MIN_EXPIRY } }
            );
            expect(consoleWarnings).toHaveLength(0);

            // Test exact maximum
            rerender({ expiryTime: MAX_EXPIRY });
            expect(consoleWarnings).toHaveLength(0);
        });

        test('should handle non-number values gracefully', () => {
            const { result } = renderHook(() => 
                useScrollRestoration('test', { expiryTime: '1hour' as any })
            );
            expect(consoleWarnings).toHaveLength(1);
            expect(consoleWarnings[0]).toContain('Invalid expiry time');
        });
    });

    describe('scroll position storage and restoration', () => {
        test('should store scroll position with timestamp on unmount', () => {
            const mockElement = setupMockElement();
            mockElement.scrollTop = 100;
            mockElement.scrollLeft = 50;

            const { unmount } = renderHook(() => {
                const ref = useScrollRestoration('test');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            unmount();

            const storedData = Object.entries(localStorage)
                .find(([key]) => key.startsWith('scroll-position-test'));
            
            expect(storedData).toBeTruthy();
            const [_, value] = storedData!;
            const parsed = JSON.parse(value);
            expect(parsed).toEqual(expect.objectContaining({
                top: 100,
                left: 50,
                timestamp: expect.any(Number)
            }));
        });

        test('should restore scroll position on mount if not expired', () => {
            const mockElement = setupMockElement();
            const position = {
                top: 200,
                left: 75,
                timestamp: Date.now()
            };

            localStorage.setItem(
                'scroll-position-test',
                JSON.stringify(position)
            );

            renderHook(() => {
                const ref = useScrollRestoration('test');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            act(() => {
                jest.runAllTimers(); // Run rAF
            });

            expect(mockElement.scrollTop).toBe(200);
            expect(mockElement.scrollLeft).toBe(75);
        });

        test('should not restore expired scroll position', () => {
            const mockElement = setupMockElement();
            const position = {
                top: 200,
                left: 75,
                timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
            };

            localStorage.setItem(
                'scroll-position-test',
                JSON.stringify(position)
            );

            renderHook(() => {
                const ref = useScrollRestoration('test');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            act(() => {
                jest.runAllTimers();
            });

            expect(mockElement.scrollTop).toBe(0);
            expect(mockElement.scrollLeft).toBe(0);
            expect(localStorage.getItem('scroll-position-test')).toBeNull();
        });
    });

    describe('cleanup functionality', () => {
        test('should cleanup expired positions during storage', () => {
            // Setup multiple stored positions with different timestamps
            const positions = {
                'scroll-position-test1': {
                    top: 100,
                    left: 50,
                    timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago (expired)
                },
                'scroll-position-test2': {
                    top: 200,
                    left: 75,
                    timestamp: Date.now() // current (not expired)
                },
                'scroll-position-test3': {
                    top: 150,
                    left: 25,
                    timestamp: Date.now() - (26 * 60 * 60 * 1000) // 26 hours ago (expired)
                }
            };

            Object.entries(positions).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });

            const mockElement = setupMockElement();
            mockElement.scrollTop = 300;
            mockElement.scrollLeft = 100;

            const { unmount } = renderHook(() => {
                const ref = useScrollRestoration('test4');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            unmount();

            // Check that expired positions were cleaned up
            const remainingKeys = (localStorage as any).getAllKeys();
            expect(remainingKeys).toHaveLength(2); // test2 and test4
            expect(remainingKeys).toContain('scroll-position-test2');
            expect(remainingKeys).toContain('scroll-position-test4');
        });

        test('should handle corrupted localStorage data', () => {
            localStorage.setItem('scroll-position-test', 'invalid-json');

            const mockElement = setupMockElement();
            
            renderHook(() => {
                const ref = useScrollRestoration('test');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            expect(consoleErrors).toHaveLength(1);
            expect(localStorage.getItem('scroll-position-test')).toBeNull();
        });
    });

    describe('error handling', () => {
        test('should handle localStorage quota exceeded error', () => {
            const mockElement = setupMockElement();
            jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            const { unmount } = renderHook(() => {
                const ref = useScrollRestoration('test');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            unmount();

            expect(consoleErrors).toHaveLength(1);
            expect(consoleErrors[0]).toContain('Error saving scroll position');
        });

        test('should handle null ref gracefully', () => {
            const { result } = renderHook(() => useScrollRestoration('test'));
            expect(result.current.current).toBeNull();
        });
    });
}); 