import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ImageOptimizationOptions {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface ResponsiveImageSize {
  width: number;
  height: number;
  breakpoint: number;
}

export function useImageOptimization(options: ImageOptimizationOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Preload image if priority is true
    if (options.priority) {
      const img = new Image();
      img.src = options.src;
      img.onload = () => {
        setIsLoading(false);
        options.onLoad?.();
      };
      img.onerror = (e) => {
        const error = new Error('Failed to load image');
        setError(error);
        options.onError?.(error);
      };
    }
  }, [options.src, options.priority, options.onLoad, options.onError]);

  return {
    isLoading,
    error,
    ImageComponent: () => (
      <Image
        src={options.src}
        alt={options.alt}
        width={options.width}
        height={options.height}
        priority={options.priority}
        quality={options.quality || 75}
        sizes={options.sizes || '100vw'}
        className={`${options.className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => {
          setIsLoading(false);
          options.onLoad?.();
        }}
        onError={(e) => {
          const error = new Error('Failed to load image');
          setError(error);
          options.onError?.(error);
        }}
      />
    ),
  };
}

// Generate responsive image sizes
export function generateResponsiveSizes(sizes: ResponsiveImageSize[]): string {
  return sizes
    .map(({ width, breakpoint }) => `(min-width: ${breakpoint}px) ${width}px`)
    .join(', ');
}

// Generate srcset for responsive images
export function generateSrcSet(
  baseUrl: string,
  sizes: ResponsiveImageSize[],
  format: 'webp' | 'jpeg' | 'png' = 'webp'
): string {
  return sizes
    .map(({ width }) => `${baseUrl}?w=${width}&f=${format} ${width}w`)
    .join(', ');
}

// Example usage:
/*
const { ImageComponent, isLoading, error } = useImageOptimization({
  src: '/images/hero.jpg',
  alt: 'Hero image',
  width: 1920,
  height: 1080,
  priority: true,
  quality: 80,
  sizes: generateResponsiveSizes([
    { width: 640, breakpoint: 0 },
    { width: 768, breakpoint: 640 },
    { width: 1024, breakpoint: 768 },
    { width: 1280, breakpoint: 1024 },
    { width: 1920, breakpoint: 1280 },
  ]),
  onLoad: () => console.log('Image loaded'),
  onError: (error) => console.error('Image failed to load:', error),
});

return (
  <div className="relative">
    <ImageComponent />
    {isLoading && <LoadingSpinner />}
    {error && <ErrorMessage message="Failed to load image" />}
  </div>
);
*/ 