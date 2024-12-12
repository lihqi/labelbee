import { ReactElement, RefObject } from 'react';

export type ResizableDirection = 'horizontal' | 'vertical';
export type EdgeDirection = 'top' | 'bottom' | 'left' | 'right';

interface Common {
  direction?: ResizableDirection;
  defaultWidth?: number;
  defaultHeight?: number;
  minTopHeight?: number | string; // Users can set the minimum height of the upper part
  minBottomHeight?: number | string; // Users can set the minimum height of the lower part
  minLeftWidth?: number | string; // Users can set the minimum left side width
  minRightWidth?: number | string; // Users can set the minimum width of the right section
  localKey?: string;
  enableEdges?: EdgeDirection[]; // Users can set the default dragging direction to the right and the common dragging direction to the bottom
  disabled?: boolean;
  onResizeStart?: () => void;
  onResize?: () => void;
  onResizeStop?: () => void;
}

export interface DynamicResizerProps extends Common {
  children: ReactElement[];
}

export interface DragProps extends Common {
  containerRef: RefObject<HTMLDivElement>;
}
