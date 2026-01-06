// Anchor solver for dynamic edge attachment points
// Calculates optimal anchor positions based on node positions and boundaries

export interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnchorPoint {
  x: number;
  y: number;
  side: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Calculate the anchor point on a node's boundary
 * Projects the vector from node center to target point onto the node perimeter
 */
export function calculateAnchorPoint(
  node: NodeBounds,
  targetX: number,
  targetY: number
): AnchorPoint {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  
  // Vector from center to target
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  
  // Avoid division by zero
  if (dx === 0 && dy === 0) {
    return {
      x: node.x + node.width,
      y: centerY,
      side: 'right',
    };
  }
  
  // Calculate intersection with rectangle boundary
  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;
  
  // Normalize the direction vector
  const length = Math.sqrt(dx * dx + dy * dy);
  const normDx = dx / length;
  const normDy = dy / length;
  
  // Calculate intersection with each side
  let x: number, y: number, side: 'left' | 'right' | 'top' | 'bottom';
  
  // Determine which side based on angle
  const angle = Math.atan2(dy, dx);
  const absAngle = Math.abs(angle);
  
  // Calculate aspect ratio to determine side boundaries
  const aspectAngle = Math.atan2(halfHeight, halfWidth);
  
  if (absAngle < aspectAngle) {
    // Right side
    side = 'right';
    x = node.x + node.width;
    y = centerY + (halfWidth * normDy / Math.abs(normDx));
  } else if (absAngle > Math.PI - aspectAngle) {
    // Left side
    side = 'left';
    x = node.x;
    y = centerY - (halfWidth * normDy / Math.abs(normDx));
  } else if (angle > 0) {
    // Bottom side
    side = 'bottom';
    x = centerX + (halfHeight * normDx / Math.abs(normDy));
    y = node.y + node.height;
  } else {
    // Top side
    side = 'top';
    x = centerX - (halfHeight * normDx / Math.abs(normDy));
    y = node.y;
  }
  
  // Clamp to node boundaries (with small padding for rounded corners)
  const padding = 4;
  x = Math.max(node.x + padding, Math.min(node.x + node.width - padding, x));
  y = Math.max(node.y + padding, Math.min(node.y + node.height - padding, y));
  
  return { x, y, side };
}

/**
 * Calculate both source and target anchor points for an edge
 */
export function calculateEdgeAnchors(
  sourceNode: NodeBounds,
  targetNode: NodeBounds
): {
  source: AnchorPoint;
  target: AnchorPoint;
} {
  const sourceCenterX = sourceNode.x + sourceNode.width / 2;
  const sourceCenterY = sourceNode.y + sourceNode.height / 2;
  const targetCenterX = targetNode.x + targetNode.width / 2;
  const targetCenterY = targetNode.y + targetNode.height / 2;
  
  // Calculate source anchor pointing towards target
  const source = calculateAnchorPoint(sourceNode, targetCenterX, targetCenterY);
  
  // Calculate target anchor pointing towards source
  const target = calculateAnchorPoint(targetNode, sourceCenterX, sourceCenterY);
  
  return { source, target };
}

/**
 * Get offset from node center to anchor point
 * Useful for storing anchor customizations
 */
export function getAnchorOffset(
  node: NodeBounds,
  anchorX: number,
  anchorY: number
): { x: number; y: number } {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  
  return {
    x: anchorX - centerX,
    y: anchorY - centerY,
  };
}

/**
 * Apply anchor offset to get absolute position
 */
export function applyAnchorOffset(
  node: NodeBounds,
  offset: { x: number; y: number }
): { x: number; y: number } {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  
  return {
    x: centerX + offset.x,
    y: centerY + offset.y,
  };
}

/**
 * Snap a point to the nearest position on node boundary
 * Used for manual anchor dragging
 */
export function snapToNodeBoundary(
  node: NodeBounds,
  pointX: number,
  pointY: number
): AnchorPoint {
  // Calculate which side is closest
  const distToLeft = Math.abs(pointX - node.x);
  const distToRight = Math.abs(pointX - (node.x + node.width));
  const distToTop = Math.abs(pointY - node.y);
  const distToBottom = Math.abs(pointY - (node.y + node.height));
  
  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
  
  let x: number, y: number, side: 'left' | 'right' | 'top' | 'bottom';
  
  if (minDist === distToLeft) {
    side = 'left';
    x = node.x;
    y = Math.max(node.y, Math.min(node.y + node.height, pointY));
  } else if (minDist === distToRight) {
    side = 'right';
    x = node.x + node.width;
    y = Math.max(node.y, Math.min(node.y + node.height, pointY));
  } else if (minDist === distToTop) {
    side = 'top';
    x = Math.max(node.x, Math.min(node.x + node.width, pointX));
    y = node.y;
  } else {
    side = 'bottom';
    x = Math.max(node.x, Math.min(node.x + node.width, pointX));
    y = node.y + node.height;
  }
  
  return { x, y, side };
}
