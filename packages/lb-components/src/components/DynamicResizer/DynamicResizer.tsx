import React, { useRef } from 'react';
import { Resizable } from 're-resizable';
import { DynamicResizerProps } from './types/interface';
import './styles.scss';
import useDrag from './hooks/useDrag';

const DynamicResizer: React.FC<DynamicResizerProps> = ({
  direction = 'vertical',
  children,
  defaultWidth,
  defaultHeight,
  minTopHeight,
  minBottomHeight,
  minLeftWidth,
  minRightWidth,
  localKey,
  enableEdges = ['right', 'bottom'],
  disabled = false,
  onResizeStart,
  onResize,
  onResizeStop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dynamicResizerProps = useDrag({
    direction,
    containerRef,
    defaultHeight,
    defaultWidth,
    minTopHeight,
    minBottomHeight,
    minLeftWidth,
    minRightWidth,
    localKey,
    enableEdges,
    onResizeStart,
    onResize,
    onResizeStop,
  });

  // Shared style for elements
  const sharedStyle = disabled ? { display: 'contents' } : undefined;

  return (
    <div style={sharedStyle} className={`dynamic-resizer-content ${direction}`} ref={containerRef}>
      <Resizable style={sharedStyle} {...dynamicResizerProps}>
        <div style={sharedStyle} className='resizable-child'>
          {children[0]}
        </div>
      </Resizable>

      <div style={sharedStyle} className='resizable-child-two'>
        {children[1]}
      </div>
    </div>
  );
};

export default DynamicResizer;
