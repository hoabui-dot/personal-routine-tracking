'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { EdgeProps, BaseEdge, EdgeLabelRenderer } from 'reactflow';
import { motion } from 'framer-motion';
import { NodeBounds, AnchorPoint } from '@/lib/mindmap/anchor-solver';

interface AdjustableEdgeData {
  controlPointOffset?: { x: number; y: number };
  onControlPointChange?: (edgeId: string, offset: { x: number; y: number }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  sourceBounds?: NodeBounds;
  targetBounds?: NodeBounds;
  sourceAnchor?: AnchorPoint;
  targetAnchor?: AnchorPoint;
}

// Calculate elastic Bezier curve
function calculateElasticBezier(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  controlOffsetX: number = 0,
  controlOffsetY: number = 0
): { 
  path: string; 
  controlX: number; 
  controlY: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
} {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Elastic curvature based on distance
  const curvature = Math.min(0.5, 0.25 + (distance / 1000));
  const offset = distance * curvature;
  
  // Calculate control points based on direction
  let cp1x: number, cp1y: number, cp2x: number, cp2y: number;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal flow
    cp1x = sourceX + offset;
    cp1y = sourceY;
    cp2x = targetX - offset;
    cp2y = targetY;
  } else {
    // Vertical flow
    cp1x = sourceX;
    cp1y = sourceY + offset;
    cp2x = targetX;
    cp2y = targetY - offset;
  }
  
  // Apply user's control offset
  cp1x += controlOffsetX * 0.5;
  cp1y += controlOffsetY * 0.5;
  cp2x += controlOffsetX * 0.5;
  cp2y += controlOffsetY * 0.5;
  
  const controlX = (cp1x + cp2x) / 2 + controlOffsetX;
  const controlY = (cp1y + cp2y) / 2 + controlOffsetY;
  
  const path = `M ${sourceX},${sourceY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`;
  
  return { path, controlX, controlY, cp1x, cp1y, cp2x, cp2y };
}

export const AdjustableEdge: React.FC<EdgeProps<AdjustableEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const controlPointOffset = useMemo(
    () => data?.controlPointOffset || { x: 0, y: 0 },
    [data?.controlPointOffset]
  );

  // Use dynamic anchors if available, otherwise fall back to sourceX/sourceY
  const actualSourceX = data?.sourceAnchor?.x ?? sourceX;
  const actualSourceY = data?.sourceAnchor?.y ?? sourceY;
  const actualTargetX = data?.targetAnchor?.x ?? targetX;
  const actualTargetY = data?.targetAnchor?.y ?? targetY;

  // Calculate path with current offset
  const { path, controlX, controlY, cp1x, cp1y, cp2x, cp2y } = useMemo(
    () => calculateElasticBezier(
      actualSourceX, 
      actualSourceY, 
      actualTargetX, 
      actualTargetY, 
      controlPointOffset.x + dragOffset.x,
      controlPointOffset.y + dragOffset.y
    ),
    [actualSourceX, actualSourceY, actualTargetX, actualTargetY, controlPointOffset, dragOffset]
  );

  // Handle control point drag with pointer events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    data?.onDragStart?.();
    
    // Capture pointer to receive events even outside element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [data]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setDragOffset(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY,
    }));
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(false);
    data?.onDragEnd?.();
    
    // Release pointer capture
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Save the final offset
    if (data?.onControlPointChange) {
      const newOffset = {
        x: controlPointOffset.x + dragOffset.x,
        y: controlPointOffset.y + dragOffset.y,
      };
      data.onControlPointChange(id, newOffset);
    }
    
    setDragOffset({ x: 0, y: 0 });
  }, [isDragging, id, controlPointOffset, dragOffset, data]);

  // Double-click to reset
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onControlPointChange && (controlPointOffset.x !== 0 || controlPointOffset.y !== 0)) {
      data.onControlPointChange(id, { x: 0, y: 0 });
    }
  }, [id, controlPointOffset, data]);

  const showControl = selected || isDragging;
  const hasCustomization = controlPointOffset.x !== 0 || controlPointOffset.y !== 0;

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isDragging ? 3 : selected ? 2.5 : 2,
          stroke: style.stroke || '#b1b1b7',
          opacity: isDragging ? 0.8 : 0.6,
          transition: isDragging ? 'none' : 'all 0.2s ease',
        }}
      />

      {/* Invisible interaction area - always active for dragging */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          pointerEvents: 'stroke',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      />

      {/* Draggable control point - only show when selected or dragging */}
      {showControl && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              left: controlX,
              top: controlY,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'all',
            }}
          >
            {/* Guide lines when dragging */}
            {isDragging && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 1,
                  height: 1,
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
              >
                <line
                  x1={actualSourceX - controlX}
                  y1={actualSourceY - controlY}
                  x2={cp1x - controlX}
                  y2={cp1y - controlY}
                  stroke={style.stroke || '#8b5cf6'}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.3}
                />
                <line
                  x1={cp2x - controlX}
                  y1={cp2y - controlY}
                  x2={actualTargetX - controlX}
                  y2={actualTargetY - controlY}
                  stroke={style.stroke || '#8b5cf6'}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.3}
                />
                <circle
                  cx={cp1x - controlX}
                  cy={cp1y - controlY}
                  r={3}
                  fill={style.stroke || '#8b5cf6'}
                  opacity={0.4}
                />
                <circle
                  cx={cp2x - controlX}
                  cy={cp2y - controlY}
                  r={3}
                  fill={style.stroke || '#8b5cf6'}
                  opacity={0.4}
                />
              </svg>
            )}

            {/* Control point handle */}
            <motion.div
              animate={{
                scale: isDragging ? 1.3 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#fff',
                border: `3px solid ${style.stroke || '#8b5cf6'}`,
                cursor: isDragging ? 'grabbing' : 'grab',
                boxShadow: isDragging 
                  ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 4px ${style.stroke || '#8b5cf6'}20`
                  : '0 4px 12px rgba(0,0,0,0.2)',
                transition: 'box-shadow 0.2s ease',
                touchAction: 'none',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
            />

            {/* Reset hint - only show when there's customization */}
            {!isDragging && hasCustomization && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                style={{
                  position: 'absolute',
                  top: '-28px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.75)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Double-click to reset
              </motion.div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
