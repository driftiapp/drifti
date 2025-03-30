import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// Image optimization options
interface ImageOptions {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Responsive image sizes
interface ResponsiveSize {
  width: number;
  height: number;
  breakpoint: number;
}

// Generate responsive sizes
function generateResponsiveSizes(
  baseWidth: number,
  baseHeight: number,
  breakpoints: number[] = [640, 768, 1024, 1280, 1536]
): ResponsiveSize[] {
  return breakpoints.map(breakpoint => ({
    width: Math.round((baseWidth * breakpoint) / 1536),
    height: Math.round((baseHeight * breakpoint) / 1536),
    breakpoint,
  }));
}

// Generate srcset
function generateSrcset(
  src: string,
  sizes: ResponsiveSize[],
  quality: number = 75
): string {
  return sizes
    .map(size => {
      const width = size.width;
      const height = size.height;
      const url = `${src}?w=${width}&h=${height}&q=${quality}`;
      return `${url} ${width}w`;
    })
    .join(', ');
}

// Optimized image component
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 1536px) 100vw, 1536px',
  quality = 75,
  priority = false,
  loading = 'lazy',
  placeholder = 'empty',
  blurDataURL,
  className = '',
  style = {},
}: ImageOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const img = document.createElement('img');
    img.src = src;
    img.onload = () => setIsLoading(false);
    img.onerror = () => setError(new Error('Failed to load image'));
  }, [src]);

  const responsiveSizes = generateResponsiveSizes(width, height);
  const srcset = generateSrcset(src, responsiveSizes, quality);

  return (
    <div className={`relative ${className}`} style={style}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={loading}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={() => setError(new Error('Failed to load image'))}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100">
          <span className="text-red-500">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

// Image optimization hook
export function useImageOptimization(src: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const img = document.createElement('img');
    img.src = src;
    img.onload = () => {
      setIsLoading(false);
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => setError(new Error('Failed to load image'));
  }, [src]);

  return {
    isLoading,
    error,
    dimensions,
  };
}

// Example usage:
/*
// In your components:
export default function MyComponent() {
  const { isLoading, error, dimensions } = useImageOptimization('/path/to/image.jpg');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading image</div>;
  }

  return (
    <OptimizedImage
      src="/path/to/image.jpg"
      alt="My image"
      width={dimensions?.width || 800}
      height={dimensions?.height || 600}
      priority={true}
      quality={90}
      sizes="(max-width: 1536px) 100vw, 1536px"
      className="rounded-lg shadow-lg"
    />
  );
}
*/ 