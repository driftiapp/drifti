declare module 'react-virtualized-auto-sizer' {
  import * as React from 'react';

  interface AutoSizerProps {
    children: (size: { height: number; width: number }) => React.ReactNode;
    className?: string;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    nonce?: string;
    onResize?: (size: { height: number; width: number }) => void;
    style?: React.CSSProperties;
  }

  const AutoSizer: React.FC<AutoSizerProps>;

  export default AutoSizer;
} 