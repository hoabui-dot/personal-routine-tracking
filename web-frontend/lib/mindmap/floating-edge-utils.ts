// Utility functions for calculating floating edge connection points
// Based on node positions and dimensions

export interface NodeDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConnectionPoint {
  x: number;
  y: number;
  position: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Get the center point of a node
 */
export function getNodeCenter(node: NodeDimensions): { x: number; y: number } {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}

/**
 * Calculate the angle between two points in radians
 */
export function getAngleBetweenPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Calculate the intersection point of a line from center to target
 * with the node's rectangular boundary
 */
export function getNodeIntersectionPoint(
  node: NodeDimensions,
  targetX: number,
  targetY: number
): ConnectionPoint {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;

  // Calculate angle from center to target
  const angle = getAngleBetweenPoints(centerX, centerY, targetX, targetY);

  // Calculate the half dimensions
  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;

  // Determine which edge the line intersects
  // Using angle ranges to determine the side
  const angleInDegrees = (angle * 180) / Math.PI;

  // Calculate the aspect ratio angle
  const aspectAngle = Math.atan2(halfHeight, halfWidth);
  const aspectAngleDegrees = (aspectAngle * 180) / Math.PI;

  let x: number, y: number, position: 'top' | 'right' | 'bottom' | 'left';

  if (angleInDegrees >= -aspectAngleDegrees && angleInDegrees < aspectAngleDegrees) {
    // Right side
    position = 'right';
    x = node.x + node.width;
    y = centerY + halfWidth * Math.tan(angle);
  } else if (angleInDegrees >= aspectAngleDegrees && angleInDegrees < 180 - aspectAngleDegrees) {
    // Bottom side
    position = 'bottom';
    x = centerX + halfHeight * Math.tan(Math.PI / 2 - angle);
    y = node.y + node.height;
  } else if (angleInDegrees >= 180 - aspectAngleDegrees || angleInDegrees < -180 + aspectAngleDegrees) {
    // Left side
    position = 'left';
    x = node.x;
    y = centerY - halfWidth * Math.tan(angle);
  } else {
    // Top side
    position = 'top';
    x = centerX - halfHeight * Math.tan(Math.PI / 2 - angle);
    y = node.y;
  }

  // Clamp to node boundaries with small padding
  const padding = 2;
  x = Math.max(node.x + padding, Math.min(node.x + node.width - padding, x));
  y = Math.max(node.y + padding, Math.min(node.y + node.height - padding, y));

  return { x, y, position };
}

/**
 * Calculate both source and target connection points for an edge
 */
export function getEdgeConnectionPoints(
  sourceNode: NodeDimensions,
  targetNode: NodeDimensions
): {
  source: ConnectionPoint;
  target: ConnectionPoint;
} {
  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);

  // Calculate source point (from source node towards target)
  const source = getNodeIntersectionPoint(
    sourceNode,
    targetCenter.x,
    targetCenter.y
  );

  // Calculate target point (from target node towards source)
  const target = getNodeIntersectionPoint(
    targetNode,
    sourceCenter.x,
    sourceCenter.y
  );

  return { source, target };
}

/**
 * Calculate a straight path between two points
 */
export function getStraightPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
}

/**
 * Calculate an orthogonal (right-angle) path between two points
 * Useful for cleaner mind map layouts
 */
export function getOrthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: 'top' | 'right' | 'bottom' | 'left',
  targetPosition: 'top' | 'right' | 'bottom' | 'left'
): string {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // For horizontal layouts (left-right)
  if (
    (sourcePosition === 'right' && targetPosition === 'left') ||
    (sourcePosition === 'left' && targetPosition === 'right')
  ) {
    return `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`;
  }

  // For vertical layouts (top-bottom)
  if (
    (sourcePosition === 'bottom' && targetPosition === 'top') ||
    (sourcePosition === 'top' && targetPosition === 'bottom')
  ) {
    return `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;
  }

  // Default to straight line for other cases
  return getStraightPath(sourceX, sourceY, targetX, targetY);
}

/**
 * Calculate a smooth step path (combination of straight and curved)
 */
export function getSmoothStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: 'top' | 'right' | 'bottom' | 'left',
  borderRadius: number = 8
): string {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  // For horizontal flow
  if (sourcePosition === 'right' || sourcePosition === 'left') {
    const midX = sourceX + dx / 2;
    const radius = Math.min(borderRadius, Math.abs(dx) / 2, Math.abs(dy) / 2);

    if (Math.abs(dy) < radius * 2) {
      // Too close vertically, use straight line
      return getStraightPath(sourceX, sourceY, targetX, targetY);
    }

    const direction = dy > 0 ? 1 : -1;

    return `
      M ${sourceX},${sourceY}
      L ${midX - radius},${sourceY}
      Q ${midX},${sourceY} ${midX},${sourceY + radius * direction}
      L ${midX},${targetY - radius * direction}
      Q ${midX},${targetY} ${midX + radius},${targetY}
      L ${targetX},${targetY}
    `.replace(/\s+/g, ' ').trim();
  }

  // For vertical flow
  const midY = sourceY + dy / 2;
  const radius = Math.min(borderRadius, Math.abs(dx) / 2, Math.abs(dy) / 2);

  if (Math.abs(dx) < radius * 2) {
    return getStraightPath(sourceX, sourceY, targetX, targetY);
  }

  const direction = dx > 0 ? 1 : -1;

  return `
    M ${sourceX},${sourceY}
    L ${sourceX},${midY - radius}
    Q ${sourceX},${midY} ${sourceX + radius * direction},${midY}
    L ${targetX - radius * direction},${midY}
    Q ${targetX},${midY} ${targetX},${midY + radius}
    L ${targetX},${targetY}
  `.replace(/\s+/g, ' ').trim();
}
