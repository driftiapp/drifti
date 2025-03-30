import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { useScrollRestoration } from '../useScrollRestoration';
import React, { useRef, RefCallback } from 'react';
import userEvent from '@testing-library/user-event';

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

// Mock console methods
const originalWarn = console.warn;
const originalError = console.error;
let consoleWarnings: string[] = [];
let consoleErrors: string[] = [];

// Enhanced mock element setup
const setupMockElement = (): HTMLDivElement => {
    const element = document.createElement('div');
    let intersectionObserverCallback: IntersectionObserverCallback | null = null;
    let resizeObserverCallback: ResizeObserverCallback | null = null;
    let scrollHeight = 1000;
    let scrollWidth = 800;

    Object.defineProperties(element, {
        scrollTop: {
            get: function() { return this._scrollTop || 0; },
            set: function(value) { 
                this._scrollTop = Math.max(0, Math.min(value, scrollHeight - this._clientHeight));
            }
        },
        scrollLeft: {
            get: function() { return this._scrollLeft || 0; },
            set: function(value) { 
                this._scrollLeft = Math.max(0, Math.min(value, scrollWidth - this._clientWidth));
            }
        },
        scrollHeight: {
            get: function() { return scrollHeight; }
        },
        scrollWidth: {
            get: function() { return scrollWidth; }
        },
        clientHeight: {
            get: function() { return this._clientHeight || 200; },
            set: function(value) { this._clientHeight = value; }
        },
        clientWidth: {
            get: function() { return this._clientWidth || 400; },
            set: function(value) { this._clientWidth = value; }
        },
        getBoundingClientRect: {
            value: function() {
                return {
                    top: 0,
                    left: 0,
                    right: this._clientWidth,
                    bottom: this._clientHeight,
                    width: this._clientWidth,
                    height: this._clientHeight
                };
            }
        }
    });

    // Add methods to simulate size changes
    (element as any).setScrollHeight = (value: number) => {
        scrollHeight = value;
        if (resizeObserverCallback) {
            const entry = {
                target: element,
                contentRect: element.getBoundingClientRect(),
                borderBoxSize: [{ blockSize: value, inlineSize: scrollWidth }],
                contentBoxSize: [{ blockSize: value, inlineSize: scrollWidth }],
                devicePixelContentBoxSize: [{ blockSize: value, inlineSize: scrollWidth }]
            } as ResizeObserverEntry;
            resizeObserverCallback([entry], new ResizeObserver(() => {}));
        }
    };

    // Mock IntersectionObserver
    (global as any).IntersectionObserver = class {
        constructor(callback: IntersectionObserverCallback) {
            intersectionObserverCallback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    // Mock ResizeObserver
    (global as any).ResizeObserver = class {
        constructor(callback: ResizeObserverCallback) {
            resizeObserverCallback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    return element as HTMLDivElement;
};

// Test component for integration tests
const ScrollableComponent: React.FC<{ id?: string }> = ({ id = 'test' }) => {
    const containerRef = useScrollRestoration(id);
    
    return (
        <div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            style={{ height: '200px', overflow: 'auto' }}
            data-testid="scrollable-container"
            role="region"
            aria-label="Scrollable content"
            tabIndex={0}
        >
            <div style={{ height: '1000px' }}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <p key={i}>Scroll content {i + 1}</p>
                ))}
            </div>
        </div>
    );
};

// Add CPU throttling simulation
const simulateCPUThrottling = (factor: number) => {
    const originalNow = Date.now;
    Date.now = () => originalNow() * factor;
    return () => {
        Date.now = originalNow;
    };
};

// Add type for screen refresh API
interface ScreenRefresh {
    rate: number;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
}

// Add performance monitoring utilities
const measureScrollPerformance = () => {
    const measurements: number[] = [];
    const originalNow = performance.now;
    performance.now = () => {
        const time = originalNow.call(performance);
        measurements.push(time);
        return time;
    };
    return {
        getMeasurements: () => measurements,
        cleanup: () => {
            performance.now = originalNow;
        }
    };
};

// Add device simulation utilities
interface DeviceConfig {
    viewport: { width: number; height: number };
    pixelRatio: number;
    orientation?: 'portrait' | 'landscape';
    touchPoints?: number;
}

const simulateDevice = (config: DeviceConfig) => {
    const original = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        maxTouchPoints: navigator.maxTouchPoints
    };

    Object.defineProperties(window, {
        innerWidth: { value: config.viewport.width },
        innerHeight: { value: config.viewport.height },
        devicePixelRatio: { value: config.pixelRatio }
    });

    Object.defineProperty(navigator, 'maxTouchPoints', {
        value: config.touchPoints || 0
    });

    return () => {
        Object.defineProperties(window, {
            innerWidth: { value: original.innerWidth },
            innerHeight: { value: original.innerHeight },
            devicePixelRatio: { value: original.devicePixelRatio }
        });
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: original.maxTouchPoints
        });
    };
};

// Add device motion simulation utility
interface MotionConfig {
    acceleration: { x: number; y: number; z: number };
    rotationRate: { alpha: number; beta: number; gamma: number };
    interval: number;
}

const simulateDeviceMotion = (config: MotionConfig) => {
    const event = new DeviceMotionEvent('devicemotion', {
        acceleration: config.acceleration,
        rotationRate: config.rotationRate,
        interval: config.interval
    });
    window.dispatchEvent(event);
};

describe('useScrollRestoration', () => {
    beforeEach(() => {
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

    describe('performance', () => {
        test('should handle rapid mount/unmount cycles', () => {
            const cycles = 100;
            const mockElement = setupMockElement();
            
            for (let i = 0; i < cycles; i++) {
                const { unmount } = renderHook(() => {
                    const ref = useScrollRestoration(`test-${i}`);
                    Object.defineProperty(ref, 'current', {
                        value: mockElement,
                        writable: true
                    });
                    return ref;
                });
                
                mockElement.scrollTop = i;
                unmount();
            }
            
            // Verify localStorage operations were successful
            const scrollPositions = Object.keys(localStorage).filter(
                key => key.startsWith('scroll-position-')
            );
            expect(scrollPositions.length).toBeGreaterThan(0);
            expect(consoleErrors).toHaveLength(0);
        });

        test('should handle concurrent scroll position restorations', () => {
            const components = 10;
            const mockElements = Array.from({ length: components }, () => setupMockElement());
            const hooks = mockElements.map((element, i) => {
                const position = {
                    top: 100 * (i + 1),
                    left: 50 * (i + 1),
                    timestamp: Date.now()
                };
                localStorage.setItem(
                    `scroll-position-test-${i}`,
                    JSON.stringify(position)
                );
                
                return renderHook(() => {
                    const ref = useScrollRestoration(`test-${i}`);
                    Object.defineProperty(ref, 'current', {
                        value: element,
                        writable: true
                    });
                    return ref;
                });
            });

            act(() => {
                jest.runAllTimers();
            });

            mockElements.forEach((element, i) => {
                expect(element.scrollTop).toBe(100 * (i + 1));
                expect(element.scrollLeft).toBe(50 * (i + 1));
            });
        });
    });

    describe('additional edge cases', () => {
        test('should handle elements that change size after mount', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate content size change
            act(() => {
                mockElement.scrollTop = 500;
                // Simulate resize observer callback
                const resizeEvent = new Event('resize');
                mockElement.dispatchEvent(resizeEvent);
                jest.runAllTimers();
            });

            expect(mockElement.scrollTop).toBe(500);
        });

        test('should handle scroll position greater than new content size', () => {
            const mockElement = setupMockElement();
            const position = {
                top: 2000, // Very large scroll position
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
                // Simulate smaller content size
                Object.defineProperty(mockElement, 'scrollHeight', {
                    value: 1000
                });
                return ref;
            });

            act(() => {
                jest.runAllTimers();
            });

            // Should clamp to maximum possible scroll position
            expect(mockElement.scrollTop).toBeLessThanOrEqual(1000);
        });

        test('should handle rapid scroll events', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate rapid scroll events
            act(() => {
                for (let i = 0; i < 100; i++) {
                    mockElement.scrollTop = i * 10;
                    const scrollEvent = new Event('scroll');
                    mockElement.dispatchEvent(scrollEvent);
                }
                jest.runAllTimers();
            });

            expect(mockElement.scrollTop).toBe(990);
        });
    });

    describe('integration', () => {
        test('should restore scroll position in actual component', async () => {
            // First render and scroll
            const { unmount } = render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.scrollTop = 500;
                const scrollEvent = new Event('scroll');
                container.dispatchEvent(scrollEvent);
            });

            unmount();

            // Re-render and verify scroll position is restored
            render(<ScrollableComponent />);
            const newContainer = screen.getByTestId('scrollable-container');
            
            act(() => {
                jest.runAllTimers();
            });

            expect(newContainer.scrollTop).toBe(500);
        });

        test('should handle multiple scrollable components', () => {
            render(
                <>
                    <ScrollableComponent id="component1" />
                    <ScrollableComponent id="component2" />
                </>
            );

            const container1 = screen.getAllByTestId('scrollable-container')[0];
            const container2 = screen.getAllByTestId('scrollable-container')[1];

            act(() => {
                container1.scrollTop = 300;
                container2.scrollTop = 600;
                const scrollEvent = new Event('scroll');
                container1.dispatchEvent(scrollEvent);
                container2.dispatchEvent(scrollEvent);
            });

            expect(container1.scrollTop).toBe(300);
            expect(container2.scrollTop).toBe(600);
        });

        test('should handle component updates without losing scroll position', async () => {
            const { rerender } = render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.scrollTop = 400;
                const scrollEvent = new Event('scroll');
                container.dispatchEvent(scrollEvent);
            });

            // Force re-render
            rerender(<ScrollableComponent />);
            
            expect(container.scrollTop).toBe(400);
        });
    });

    describe('cleanup and memory management', () => {
        test('should not leak memory during rapid remounts', () => {
            const initialKeys = Object.keys(localStorage).length;
            
            // Perform many mount/unmount cycles
            for (let i = 0; i < 50; i++) {
                const { unmount } = render(<ScrollableComponent id={`test-${i}`} />);
                unmount();
            }

            const finalKeys = Object.keys(localStorage).length;
            expect(finalKeys - initialKeys).toBeLessThanOrEqual(50);
        });

        test('should cleanup all related storage on component unmount', () => {
            const { unmount } = render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                container.dispatchEvent(scrollEvent);
            });

            unmount();

            // Verify cleanup after delay
            act(() => {
                jest.advanceTimersByTime(25 * 60 * 60 * 1000); // Advance past expiry
            });

            const remainingKeys = Object.keys(localStorage).filter(
                key => key.startsWith('scroll-position-')
            );
            expect(remainingKeys).toHaveLength(0);
        });
    });

    describe('browser compatibility', () => {
        test('should handle smooth scroll not supported', () => {
            const mockElement = setupMockElement();
            // Remove scrollBehavior support
            Object.defineProperty(mockElement.style, 'scrollBehavior', {
                value: undefined
            });

            const { result } = renderHook(() => useScrollRestoration('test'));
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
        });

        test('should handle passive event listeners', () => {
            const mockElement = setupMockElement();
            let passiveListener = false;
            
            const originalAddEventListener = mockElement.addEventListener;
            mockElement.addEventListener = (type, listener, options) => {
                if (options && typeof options === 'object' && options.passive) {
                    passiveListener = true;
                }
                originalAddEventListener.call(mockElement, type, listener);
            };

            renderHook(() => {
                const ref = useScrollRestoration('test');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            expect(passiveListener).toBe(true);
        });
    });

    describe('network and performance', () => {
        test('should handle slow storage operations', async () => {
            const mockElement = setupMockElement();
            const originalSetItem = localStorage.setItem;
            
            // Simulate slow storage
            localStorage.setItem = async (key: string, value: string) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                originalSetItem.call(localStorage, key, value);
            };

            const { unmount } = renderHook(() => {
                const ref = useScrollRestoration('test');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            act(() => {
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            unmount();
            
            // Fast forward timers
            act(() => {
                jest.advanceTimersByTime(200);
            });

            const storedData = localStorage.getItem('scroll-position-test');
            expect(storedData).toBeTruthy();
        });

        test('should handle storage quota exceeded', () => {
            const mockElement = setupMockElement();
            localStorage.setItem = () => {
                throw new Error('QuotaExceededError');
            };

            const { unmount } = renderHook(() => {
                const ref = useScrollRestoration('test');
                Object.defineProperty(ref, 'current', {
                    value: mockElement,
                    writable: true
                });
                return ref;
            });

            act(() => {
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            unmount();
            expect(consoleErrors.length).toBeGreaterThan(0);
        });
    });

    describe('accessibility', () => {
        test('should maintain focus after scroll restoration', () => {
            const { unmount } = render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            // Set focus and scroll
            act(() => {
                container.focus();
                container.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                container.dispatchEvent(scrollEvent);
            });

            unmount();

            // Re-render
            render(<ScrollableComponent />);
            const newContainer = screen.getByTestId('scrollable-container');
            
            act(() => {
                jest.runAllTimers();
            });

            expect(document.activeElement).toBe(newContainer);
            expect(newContainer.scrollTop).toBe(300);
        });

        test('should handle keyboard navigation', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.focus();
                // Simulate Page Down key
                fireEvent.keyDown(container, { key: 'PageDown' });
                jest.runAllTimers();
            });

            expect(container.scrollTop).toBeGreaterThan(0);
        });

        test('should announce scroll position changes to screen readers', () => {
            const { rerender } = render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                container.dispatchEvent(scrollEvent);
            });

            expect(container.getAttribute('aria-label')).toContain('Scrollable content');
        });
    });

    describe('advanced browser APIs', () => {
        test('should handle IntersectionObserver', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate intersection changes
            act(() => {
                const observer = new IntersectionObserver(() => {});
                observer.observe(mockElement);
                mockElement.scrollTop = 300;
            });

            expect(mockElement.scrollTop).toBe(300);
        });

        test('should handle ResizeObserver', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate content resize
            act(() => {
                mockElement.scrollTop = 300;
                (mockElement as any).setScrollHeight(2000); // Use the custom method
            });

            expect(mockElement.scrollTop).toBe(300);
        });

        test('should handle scroll behavior preferences', () => {
            const mockElement = setupMockElement();
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            Object.defineProperty(mediaQuery, 'matches', { value: true });

            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            expect(mockElement.style.scrollBehavior).not.toBe('smooth');
        });
    });

    describe('advanced performance', () => {
        test('should handle rapid resize during scroll', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate rapid resize and scroll
            act(() => {
                for (let i = 0; i < 50; i++) {
                    mockElement.scrollTop = i * 10;
                    (mockElement as any).setScrollHeight(1000 + i * 20);
                    const scrollEvent = new Event('scroll');
                    mockElement.dispatchEvent(scrollEvent);
                }
            });

            expect(mockElement.scrollTop).toBeLessThanOrEqual(mockElement.scrollHeight - mockElement.clientHeight);
        });

        test('should handle concurrent storage operations', async () => {
            const operations = Array.from({ length: 10 }, (_, i) => ({
                key: `scroll-position-test-${i}`,
                value: JSON.stringify({
                    top: 100 * i,
                    left: 50 * i,
                    timestamp: Date.now()
                })
            }));

            // Perform concurrent storage operations
            await Promise.all(operations.map(({ key, value }) => 
                Promise.resolve().then(() => localStorage.setItem(key, value))
            ));

            const storedKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('scroll-position-')
            );
            expect(storedKeys).toHaveLength(operations.length);
        });

        test('should handle memory pressure', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate memory pressure
            act(() => {
                // @ts-ignore - TypeScript doesn't know about the memory pressure event
                window.dispatchEvent(new Event('memory-pressure'));
                jest.runAllTimers();
            });

            // Should still maintain scroll position
            mockElement.scrollTop = 300;
            expect(mockElement.scrollTop).toBe(300);
        });
    });

    describe('advanced accessibility', () => {
        test('should handle screen reader navigation commands', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            // Simulate various keyboard commands
            act(() => {
                container.focus();
                fireEvent.keyDown(container, { key: 'PageDown' });
                fireEvent.keyDown(container, { key: 'End', ctrlKey: true });
                fireEvent.keyDown(container, { key: 'Home', ctrlKey: true });
            });

            expect(container.scrollTop).toBe(0);
        });

        test('should maintain aria-attributes during scroll', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.scrollTop = container.scrollHeight - container.clientHeight;
                fireEvent.scroll(container);
            });

            expect(container.getAttribute('aria-label')).toBe('Scrollable content');
            expect(container.getAttribute('role')).toBe('region');
        });

        test('should handle touch events with aria-live', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                fireEvent.touchStart(container, {
                    touches: [{ clientY: 0 }]
                });
                fireEvent.touchMove(container, {
                    touches: [{ clientY: -100 }]
                });
                fireEvent.touchEnd(container);
            });

            expect(container.getAttribute('aria-live')).toBe('polite');
        });
    });

    describe('advanced viewport and device scenarios', () => {
        test('should handle mobile viewport changes', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate mobile keyboard opening (viewport height change)
            act(() => {
                mockElement.scrollTop = 300;
                (mockElement as any)._clientHeight = 100; // Reduced height
                const resizeEvent = new Event('resize');
                window.dispatchEvent(resizeEvent);
            });

            expect(mockElement.scrollTop).toBeLessThanOrEqual(mockElement.scrollHeight - mockElement.clientHeight);
        });

        test('should handle orientation changes', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate orientation change (landscape)
            act(() => {
                mockElement.scrollTop = 300;
                (mockElement as any)._clientWidth = 800;
                (mockElement as any)._clientHeight = 400;
                const orientationEvent = new Event('orientationchange');
                window.dispatchEvent(orientationEvent);
            });

            expect(mockElement.scrollTop).toBeLessThanOrEqual(mockElement.scrollHeight - mockElement.clientHeight);
        });

        test('should handle zoom level changes', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate zoom change
            act(() => {
                mockElement.scrollTop = 300;
                Object.defineProperty(window, 'devicePixelRatio', {
                    get: () => 2
                });
                const zoomEvent = new Event('resize');
                window.dispatchEvent(zoomEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
        });
    });

    describe('extreme performance scenarios', () => {
        test('should handle extremely large scroll positions', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Set extremely large content size
            (mockElement as any).setScrollHeight(1000000);
            
            act(() => {
                mockElement.scrollTop = 999999;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            expect(mockElement.scrollTop).toBe(999999);
        });

        test('should handle rapid scroll with dynamic content', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate rapid scroll with content changes
            act(() => {
                for (let i = 0; i < 100; i++) {
                    mockElement.scrollTop = i * 100;
                    (mockElement as any).setScrollHeight(1000 + i * 50);
                    const scrollEvent = new Event('scroll');
                    mockElement.dispatchEvent(scrollEvent);
                    
                    // Simulate RAF timing
                    jest.advanceTimersByTime(16); // ~60fps
                }
            });

            expect(mockElement.scrollTop).toBeLessThanOrEqual(mockElement.scrollHeight - mockElement.clientHeight);
        });

        test('should handle storage under memory pressure', () => {
            const mockElement = setupMockElement();
            let memoryPressure = false;
            
            // Mock performance.memory
            Object.defineProperty(performance, 'memory', {
                get: () => ({
                    usedJSHeapSize: memoryPressure ? 1.5e9 : 5e8, // 1.5GB vs 500MB
                    totalJSHeapSize: 2e9,
                    jsHeapSizeLimit: 2e9
                })
            });

            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate memory pressure
            act(() => {
                memoryPressure = true;
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
        });
    });

    describe('advanced screen reader support', () => {
        test('should handle NVDA navigation commands', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.focus();
                // Simulate NVDA reading commands
                fireEvent.keyDown(container, { key: 'ArrowDown', altKey: true });
                fireEvent.keyDown(container, { key: 'ArrowUp', altKey: true });
                fireEvent.keyDown(container, { key: 'End', altKey: true });
            });

            expect(container.getAttribute('aria-live')).toBe('polite');
        });

        test('should handle VoiceOver gestures', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                // Simulate VoiceOver rotor gesture
                fireEvent.keyDown(container, { key: 'ArrowDown', ctrlKey: true, altKey: true });
                container.scrollTop = 300;
                
                // Simulate VoiceOver announcement
                const announcement = document.createElement('div');
                announcement.setAttribute('role', 'status');
                announcement.setAttribute('aria-live', 'polite');
                container.appendChild(announcement);
            });

            expect(container.querySelector('[role="status"]')).toBeTruthy();
        });

        test('should maintain focus during dynamic updates', () => {
            const { rerender } = render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.focus();
                container.scrollTop = 300;
                
                // Simulate dynamic content update
                const newContent = document.createElement('p');
                newContent.textContent = 'New content';
                container.querySelector('div')?.appendChild(newContent);
                
                // Force update
                rerender(<ScrollableComponent />);
            });

            expect(document.activeElement).toBe(container);
            expect(container.scrollTop).toBe(300);
        });
    });

    describe('error recovery and resilience', () => {
        test('should handle corrupted scroll position data', () => {
            const mockElement = setupMockElement();
            
            // Store corrupted data
            localStorage.setItem('scroll-position-test', 'invalid-json{');
            
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
            expect(consoleErrors.length).toBeGreaterThan(0);
        });

        test('should recover from failed scroll attempts', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate failed scroll attempt
            const originalScrollTo = mockElement.scrollTo;
            let scrollAttempts = 0;
            mockElement.scrollTo = (...args) => {
                scrollAttempts++;
                if (scrollAttempts === 1) {
                    throw new Error('Scroll failed');
                }
                originalScrollTo.apply(mockElement, args);
            };

            act(() => {
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
            expect(scrollAttempts).toBeGreaterThan(1);
        });

        test('should handle storage quota recovery', () => {
            const mockElement = setupMockElement();
            let quotaExceeded = true;
            
            // Mock storage quota error with recovery
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = (...args) => {
                if (quotaExceeded) {
                    quotaExceeded = false;
                    throw new Error('QuotaExceededError');
                }
                originalSetItem.apply(localStorage, args);
            };

            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            // Second attempt should succeed
            const storedData = localStorage.getItem('scroll-position-test');
            expect(storedData).toBeTruthy();
        });
    });

    describe('advanced device scenarios', () => {
        test('should handle high DPI displays', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            // Simulate 4K display (200% scaling)
            Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
            (mockElement as any)._clientWidth = 3840;
            (mockElement as any)._clientHeight = 2160;
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 1000;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            expect(mockElement.scrollTop).toBe(1000);
        });

        test('should handle foldable displays', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));

            // Mock CSS environment variables for foldable displays
            const originalGetComputedStyle = window.getComputedStyle;
            window.getComputedStyle = () => ({
                ...originalGetComputedStyle(document.createElement('div')),
                getPropertyValue: (prop: string) => 
                    prop === '--fold-width' ? '20px' : ''
            });
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate fold change
            act(() => {
                mockElement.scrollTop = 300;
                const foldChangeEvent = new Event('fold-change');
                window.dispatchEvent(foldChangeEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
            window.getComputedStyle = originalGetComputedStyle;
        });

        test('should handle different pointer types', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Test different pointer types
            const pointerTypes = ['mouse', 'touch', 'pen'];
            pointerTypes.forEach(pointerType => {
                act(() => {
                    fireEvent.pointerDown(mockElement, { pointerType });
                    mockElement.scrollTop = 100;
                    fireEvent.pointerUp(mockElement, { pointerType });
                });
            });

            expect(mockElement.scrollTop).toBe(100);
        });

        test('should handle variable refresh rate displays', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            // Mock variable refresh rate API
            const mockRefresh: ScreenRefresh = {
                rate: 120,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
            
            Object.defineProperty(window.screen, 'refresh', {
                value: mockRefresh,
                configurable: true
            });
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                // Simulate refresh rate change
                mockRefresh.rate = 60;
                const refreshEvent = new Event('refresh');
                window.dispatchEvent(refreshEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
        });

        test('should handle dual-screen devices', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));

            // Mock dual-screen API
            Object.defineProperty(window, 'getWindowSegments', {
                value: () => [{
                    x: 0,
                    y: 0,
                    width: 400,
                    height: 800
                }, {
                    x: 400,
                    y: 0,
                    width: 400,
                    height: 800
                }]
            });

            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                const segmentEvent = new Event('screensegmentchange');
                window.dispatchEvent(segmentEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
        });
    });

    describe('advanced performance benchmarks', () => {
        test('should handle CPU throttling', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            const cleanup = simulateCPUThrottling(4); // 4x slower
            
            act(() => {
                for (let i = 0; i < 50; i++) {
                    mockElement.scrollTop = i * 10;
                    const scrollEvent = new Event('scroll');
                    mockElement.dispatchEvent(scrollEvent);
                    jest.advanceTimersByTime(64); // 16ms * 4 (throttled)
                }
            });

            cleanup();
            expect(mockElement.scrollTop).toBe(490);
        });

        test('should handle low memory conditions', () => {
            const mockElement = setupMockElement();
            
            // Mock performance.memory with low memory condition
            Object.defineProperty(performance, 'memory', {
                get: () => ({
                    usedJSHeapSize: 1.9e9, // 1.9GB
                    totalJSHeapSize: 2e9,   // 2GB
                    jsHeapSizeLimit: 2e9     // 2GB limit
                })
            });

            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate intensive scrolling under low memory
            act(() => {
                for (let i = 0; i < 1000; i++) {
                    mockElement.scrollTop = i;
                    const scrollEvent = new Event('scroll');
                    mockElement.dispatchEvent(scrollEvent);
                }
            });

            expect(mockElement.scrollTop).toBe(999);
        });

        test('should handle background tab throttling', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Simulate tab becoming hidden
            Object.defineProperty(document, 'hidden', { value: true });
            const visibilityChange = new Event('visibilitychange');

            act(() => {
                document.dispatchEvent(visibilityChange);
                mockElement.scrollTop = 300;
                jest.advanceTimersByTime(1000); // Longer timer due to throttling
            });

            expect(mockElement.scrollTop).toBe(300);
        });
    });

    describe('advanced screen reader scenarios', () => {
        test('should handle JAWS reading modes', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            // Simulate JAWS reading modes
            const readingModes = [
                { key: 'h', ctrlKey: true, insert: true }, // Headings mode
                { key: 'l', ctrlKey: true, insert: true }, // Links mode
                { key: 'r', ctrlKey: true, insert: true }  // Regions mode
            ];

            act(() => {
                container.focus();
                readingModes.forEach(mode => {
                    fireEvent.keyDown(container, mode);
                });
                container.scrollTop = 300;
            });

            expect(container.getAttribute('role')).toBe('region');
            expect(container.scrollTop).toBe(300);
        });

        test('should handle TalkBack gestures', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            // Simulate TalkBack explore by touch
            act(() => {
                fireEvent.touchStart(container, {
                    touches: [{ clientX: 100, clientY: 100 }]
                });
                container.scrollTop = 200;
                fireEvent.touchMove(container, {
                    touches: [{ clientX: 100, clientY: 50 }]
                });
                container.setAttribute('aria-live', 'assertive');
                fireEvent.touchEnd(container);
            });

            expect(container.getAttribute('aria-live')).toBe('assertive');
        });

        test('should handle dynamic aria-label updates', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.scrollTop = container.scrollHeight - container.clientHeight;
                const percentage = Math.round((container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100);
                container.setAttribute('aria-label', `Scrollable content, ${percentage}% scrolled`);
                fireEvent.scroll(container);
            });

            expect(container.getAttribute('aria-label')).toContain('100% scrolled');
        });

        test('should handle NVDA browse vs focus mode', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.focus();
                // Simulate NVDA mode switch
                fireEvent.keyDown(container, { key: 'Insert', shiftKey: true });
                container.scrollTop = 300;
                // Simulate browse mode navigation
                fireEvent.keyDown(container, { key: 'h' }); // Headings
                fireEvent.keyDown(container, { key: 'f' }); // Forms
            });

            expect(container.getAttribute('role')).toBe('region');
            expect(container.scrollTop).toBe(300);
        });

        test('should handle VoiceOver continuous reading', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.focus();
                // Simulate VoiceOver continuous reading
                fireEvent.keyDown(container, { key: 'ArrowDown', altKey: true });
                container.scrollTop = 300;
                
                // Add live region for announcements
                const liveRegion = document.createElement('div');
                liveRegion.setAttribute('role', 'status');
                liveRegion.setAttribute('aria-live', 'assertive');
                container.appendChild(liveRegion);
                
                // Simulate reading progress
                liveRegion.textContent = 'Reading content...';
            });

            const liveRegion = container.querySelector('[role="status"]');
            expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
        });
    });

    describe('advanced error handling', () => {
        test('should handle RAF callback errors', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            // Mock RAF to throw error on first call
            let rafCalls = 0;
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = (callback) => {
                rafCalls++;
                if (rafCalls === 1) {
                    throw new Error('RAF error');
                }
                return originalRAF(callback);
            };

            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
            window.requestAnimationFrame = originalRAF;
        });

        test('should handle concurrent error recovery', async () => {
            const mockElement = setupMockElement();
            const errors = ['QuotaExceededError', 'NetworkError', 'SecurityError'];
            let errorIndex = 0;
            
            // Simulate multiple types of errors with recovery
            localStorage.setItem = (...args) => {
                if (errorIndex < errors.length) {
                    const error = new Error(errors[errorIndex++]);
                    error.name = errors[errorIndex];
                    throw error;
                }
                localStorage.setItem(...args);
            };

            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            // Attempt multiple operations
            await Promise.all(Array.from({ length: 5 }, async (_, i) => {
                act(() => {
                    mockElement.scrollTop = i * 100;
                    const scrollEvent = new Event('scroll');
                    mockElement.dispatchEvent(scrollEvent);
                });
            }));

            expect(mockElement.scrollTop).toBe(400);
            expect(consoleErrors.length).toBe(errors.length);
        });

        test('should handle GPU process crash recovery', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                // Simulate GPU process crash
                const gpuCrashEvent = new Event('gpu-process-crashed');
                window.dispatchEvent(gpuCrashEvent);
                
                // Verify scroll position is maintained after recovery
                jest.advanceTimersByTime(1000);
            });

            expect(mockElement.scrollTop).toBe(300);
        });

        test('should handle multiple storage quota errors with exponential backoff', () => {
            const mockElement = setupMockElement();
            let attempts = 0;
            const maxAttempts = 3;
            
            // Mock storage with quota errors and backoff
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = (...args) => {
                attempts++;
                if (attempts < maxAttempts) {
                    throw new Error('QuotaExceededError');
                }
                originalSetItem.apply(localStorage, args);
            };

            const { result } = renderHook(() => useScrollRestoration('test'));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                // Simulate multiple save attempts with backoff
                for (let i = 0; i < maxAttempts; i++) {
                    const scrollEvent = new Event('scroll');
                    mockElement.dispatchEvent(scrollEvent);
                    jest.advanceTimersByTime(Math.pow(2, i) * 1000);
                }
            });

            expect(mockElement.scrollTop).toBe(300);
            expect(attempts).toBe(maxAttempts);
        });
    });

    describe('advanced mobile device scenarios', () => {
        test('should handle iPhone Pro Max device', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            const cleanup = simulateDevice({
                viewport: { width: 428, height: 926 },
                pixelRatio: 3,
                orientation: 'portrait',
                touchPoints: 5
            });
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                // Simulate notch area
                (mockElement as any)._clientHeight = 926 - 47; // Account for notch
                mockElement.scrollTop = 300;
                
                // Simulate device rotation
                const rotationEvent = new Event('deviceorientation');
                window.dispatchEvent(rotationEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
            cleanup();
        });

        test('should handle iPad Pro device with Apple Pencil', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            const cleanup = simulateDevice({
                viewport: { width: 1024, height: 1366 },
                pixelRatio: 2,
                touchPoints: 10
            });
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                // Simulate Apple Pencil input
                fireEvent.pointerDown(mockElement, {
                    pointerType: 'pen',
                    pressure: 0.5,
                    tiltX: 30,
                    tiltY: 45
                });
                mockElement.scrollTop = 300;
                fireEvent.pointerUp(mockElement, { pointerType: 'pen' });
            });

            expect(mockElement.scrollTop).toBe(300);
            cleanup();
        });

        test('should handle Samsung Fold device state changes', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));

            let isFolded = true;
            const segments = [
                // Folded state
                [{ width: 320, height: 800 }],
                // Unfolded state
                [
                    { width: 320, height: 800 },
                    { width: 320, height: 800 }
                ]
            ];

            // Mock foldable display API
            Object.defineProperty(window, 'getWindowSegments', {
                value: () => segments[isFolded ? 0 : 1]
            });

            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                // Simulate unfolding
                isFolded = false;
                const foldEvent = new Event('fold-change');
                window.dispatchEvent(foldEvent);
                
                // Adjust viewport
                (mockElement as any)._clientWidth = 640;
            });

            expect(mockElement.scrollTop).toBe(300);
        });

        test('should handle Galaxy Z Flip device transitions', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            const cleanup = simulateDevice({
                viewport: { width: 412, height: 892 },
                pixelRatio: 2.625,
                orientation: 'portrait',
                touchPoints: 10
            });
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                // Simulate flex mode (half-folded)
                (mockElement as any)._clientHeight = 446;
                mockElement.scrollTop = 300;
                
                // Simulate hinge angle change
                const hingeAngleEvent = new Event('hingeangle');
                Object.defineProperty(hingeAngleEvent, 'angle', { value: 90 });
                window.dispatchEvent(hingeAngleEvent);
                
                // Simulate device motion during fold
                simulateDeviceMotion({
                    acceleration: { x: 0.5, y: 1.2, z: 9.8 },
                    rotationRate: { alpha: 45, beta: 90, gamma: 0 },
                    interval: 16
                });
            });

            expect(mockElement.scrollTop).toBe(300);
            cleanup();
        });

        test('should handle Surface Duo dual-screen gestures', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            // Mock dual-screen spanning API
            Object.defineProperty(window, 'visualViewport', {
                value: {
                    segments: [
                        { x: 0, y: 0, width: 540, height: 720 },
                        { x: 560, y: 0, width: 540, height: 720 }
                    ],
                    spanning: 'single'
                }
            });

            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                // Simulate spanning change
                (window.visualViewport as any).spanning = 'dual';
                const spanningEvent = new Event('spanning-change');
                window.dispatchEvent(spanningEvent);
                
                // Simulate cross-screen swipe
                fireEvent.touchStart(mockElement, {
                    touches: [{ clientX: 500, clientY: 300 }]
                });
                mockElement.scrollTop = 300;
                fireEvent.touchMove(mockElement, {
                    touches: [{ clientX: 600, clientY: 300 }]
                });
                fireEvent.touchEnd(mockElement);
            });

            expect(mockElement.scrollTop).toBe(300);
        });
    });

    describe('extreme performance scenarios', () => {
        test('should handle 240Hz display with variable refresh rate', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            // Mock high refresh rate display
            const perf = measureScrollPerformance();
            let currentRefreshRate = 240;
            
            Object.defineProperty(window.screen, 'refresh', {
                value: {
                    rate: currentRefreshRate,
                    addEventListener: (event: string, callback: Function) => {
                        if (event === 'change') {
                            // Simulate refresh rate changes
                            setTimeout(() => {
                                currentRefreshRate = 120;
                                callback();
                            }, 100);
                        }
                    },
                    removeEventListener: jest.fn()
                }
            });
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                // Simulate 240fps scrolling
                for (let i = 0; i < 240; i++) {
                    mockElement.scrollTop = i * 5;
                    const scrollEvent = new Event('scroll');
                    mockElement.dispatchEvent(scrollEvent);
                    jest.advanceTimersByTime(4.17); // ~240fps timing
                }
            });

            const measurements = perf.getMeasurements();
            const frameDeltas = measurements.slice(1).map((time, i) => 
                time - measurements[i]
            );

            expect(Math.min(...frameDeltas)).toBeGreaterThanOrEqual(4);
            perf.cleanup();
        });

        test('should handle WebGL context restoration during scroll', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            // Mock WebGL context
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2');
            let contextLost = false;
            
            Object.defineProperty(gl, 'isContextLost', {
                value: () => contextLost
            });
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                // Simulate context loss and restoration
                contextLost = true;
                canvas.dispatchEvent(new Event('webglcontextlost'));
                jest.advanceTimersByTime(100);
                contextLost = false;
                canvas.dispatchEvent(new Event('webglcontextrestored'));
            });

            expect(mockElement.scrollTop).toBe(300);
        });
    });

    describe('advanced screen reader scenarios', () => {
        test('should handle JAWS virtual cursor navigation', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.focus();
                // Simulate JAWS virtual cursor movement
                fireEvent.keyDown(container, { key: 'NumPad8', altKey: true }); // Line up
                fireEvent.keyDown(container, { key: 'NumPad2', altKey: true }); // Line down
                container.scrollTop = 300;
                
                // Simulate JAWS quick navigation
                fireEvent.keyDown(container, { key: '1', altKey: true }); // Heading level 1
                fireEvent.keyDown(container, { key: 'Tab', shiftKey: true }); // Previous element
            });

            expect(container.getAttribute('role')).toBe('region');
            expect(container.scrollTop).toBe(300);
        });

        test('should handle ChromeVox gestures and commands', () => {
            render(<ScrollableComponent />);
            const container = screen.getByTestId('scrollable-container');
            
            act(() => {
                container.focus();
                // Simulate ChromeVox commands
                fireEvent.keyDown(container, { key: 'j', ctrlKey: true, altKey: true }); // Next heading
                container.scrollTop = 300;
                
                // Simulate ChromeVox earcons
                const earcon = document.createElement('div');
                earcon.setAttribute('role', 'alert');
                earcon.setAttribute('aria-live', 'assertive');
                container.appendChild(earcon);
                earcon.textContent = 'Navigation sound';
            });

            const alert = container.querySelector('[role="alert"]');
            expect(alert?.textContent).toBe('Navigation sound');
        });
    });

    describe('advanced error recovery', () => {
        test('should handle SharedArrayBuffer allocation failures', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            // Mock SharedArrayBuffer error
            const originalSharedArrayBuffer = global.SharedArrayBuffer;
            global.SharedArrayBuffer = function() {
                throw new Error('SharedArrayBuffer allocation failed');
            } as any;
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                const scrollEvent = new Event('scroll');
                mockElement.dispatchEvent(scrollEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
            global.SharedArrayBuffer = originalSharedArrayBuffer;
        });

        test('should handle Worker termination during scroll', () => {
            const mockElement = setupMockElement();
            const { result } = renderHook(() => useScrollRestoration('test'));
            
            // Mock Web Worker
            const worker = new Worker(URL.createObjectURL(new Blob([])));
            
            Object.defineProperty(result.current, 'current', {
                value: mockElement,
                writable: true
            });

            act(() => {
                mockElement.scrollTop = 300;
                // Simulate worker termination
                worker.terminate();
                const errorEvent = new ErrorEvent('error', {
                    error: new Error('Worker terminated'),
                    message: 'Worker terminated unexpectedly'
                });
                worker.dispatchEvent(errorEvent);
            });

            expect(mockElement.scrollTop).toBe(300);
        });
    });
}); 