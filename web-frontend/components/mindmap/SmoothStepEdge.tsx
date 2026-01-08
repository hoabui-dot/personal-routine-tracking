'use client';

import React, { useMemo } from 'react';
import { EdgeProps, BaseEdge, useNodes } from 'reactflow';
import { getEdgeConnectionPoints, getSmoothStepPath } from '@/lib/mindmap/floating-edge-utils';

/**
 * Alternative edge component with smooth step (rounded corners) paths
 * Use this instead of AdjustableEdge for a softer, more organic look
 */
export const SmoothStepEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  selected,
}) => {
  const nodes = useNodes();

  // Calculate floating connection points with smooth step path
  const path = useMemo(() => {
    // Find source and target nodes
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);

    if (!sourceNode || !targetNode) {
      // Fallback to straight line
      return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    }

    // Get node dimensions
    const sourceDimensions = {
      x: sourceNode.position.x,
      y: sourceNode.position.y,
      width: sourceNode.width || 180,
      height: sourceNode.height || 60,
    };

    const targetDimensions = {
      x: targetNode.position.x,
      y: targetNode.position.y,
      width: targetNode.width || 180,
      height: targetNode.height || 60,
    };

    // Calculate floating connection points
    const connectionPoints = getEdgeConnectionPoints(sourceDimensions, targetDimensions);

    // Use smooth step path with rounded corners
    return getSmoothStepPath(
      connectionPoints.source.x,
      connectionPoints.source.y,
      connectionPoints.target.x,
      connectionPoints.target.y,
      connectionPoints.source.position,
      12 // border radius for corners
    );
  }, [nodes, source, target, sourceX, sourceY, targetX, targetY]);

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        ...style,
        strokeWidth: selected ? 2.5 : 2,
        stroke: style.stroke || '#b1b1b7',
        opacity: 0.6,
        transition: 'all 0.2s ease',
      }}
    />
  );
};
