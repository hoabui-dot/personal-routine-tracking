# Edge Anchor Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        MindMapEditor.tsx                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ State Management                                           │ │
│  │ • tree: MindMapTree                                        │ │
│  │ • edgeCustomizations: EdgeCustomization                    │ │
│  │ • isDraggingEdge: boolean ◄─────────────┐                 │ │
│  │ • selectedNodeId: string | null         │                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                 │                    │
│                           ▼                 │                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Callbacks                               │                  │ │
│  │ • handleEdgeDragStart() ────────────────┘                  │ │
│  │ • handleEdgeDragEnd() ──────────────────┐                  │ │
│  │ • handleEdgeControlPointChange()        │                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                 │                    │
│                           ▼                 ▼                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ReactFlow Component                                        │ │
│  │ • panOnDrag={!isDraggingEdge} ◄─── Disables pan on drag   │ │
│  │ • nodes={flowNodes}                                        │ │
│  │ • edges={flowEdges}                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      flow-converter.ts                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ treeToFlow(tree, callbacks, edgeCustomizations)            │ │
│  │                                                            │ │
│  │ 1. Get layout from layout-engine                          │ │
│  │    layout = calculateLayout(tree)                         │ │
│  │                                                            │ │
│  │ 2. For each edge:                                         │ │
│  │    • Get source & target node bounds from layout          │ │
│  │    • Calculate dynamic anchors ──────────┐                │ │
│  │    • Pass to edge data                   │                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      anchor-solver.ts                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ calculateEdgeAnchors(sourceBounds, targetBounds)           │ │
│  │                                                            │ │
│  │ Algorithm:                                                 │ │
│  │ 1. Calculate vector: parent center → child center         │ │
│  │ 2. Calculate angle: atan2(dy, dx)                         │ │
│  │ 3. Determine side based on angle & aspect ratio           │ │
│  │ 4. Project onto node boundary                             │ │
│  │ 5. Return { source: AnchorPoint, target: AnchorPoint }    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AdjustableEdge.tsx                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Edge Rendering                                             │ │
│  │                                                            │ │
│  │ 1. Receive anchor data from props:                        │ │
│  │    • sourceAnchor: { x, y, side }                         │ │
│  │    • targetAnchor: { x, y, side }                         │ │
│  │    • sourceBounds, targetBounds                           │ │
│  │                                                            │ │
│  │ 2. Use anchors instead of sourceX/sourceY:                │ │
│  │    actualSourceX = sourceAnchor?.x ?? sourceX             │ │
│  │    actualSourceY = sourceAnchor?.y ?? sourceY             │ │
│  │                                                            │ │
│  │ 3. Calculate Bezier path with elastic curvature           │ │
│  │                                                            │ │
│  │ 4. Render:                                                 │ │
│  │    • Main edge path                                       │ │
│  │    • Invisible interaction area (20px wide)               │ │
│  │    • Draggable control point (when selected)              │ │
│  │    • Guide lines (when dragging)                          │ │
│  │                                                            │ │
│  │ 5. Handle pointer events:                                 │ │
│  │    • onPointerDown → call onDragStart()                   │ │
│  │    • onPointerMove → update drag offset                   │ │
│  │    • onPointerUp → call onDragEnd()                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Render
```
User opens mind map
    ↓
MindMapEditor loads tree from content
    ↓
treeToFlow() converts tree to React Flow format
    ↓
For each edge:
    • Get node bounds from layout
    • Calculate anchors using anchor-solver
    • Create edge with anchor data
    ↓
AdjustableEdge renders using anchor positions
```

### 2. Node Movement
```
User drags a node
    ↓
MindMapEditor.handleNodeDragStop()
    ↓
updateNodePosition() updates tree
    ↓
treeToFlow() recalculates layout
    ↓
Anchors automatically recalculated
    ↓
Edges update to connect to new sides
```

### 3. Edge Control Point Drag
```
User clicks edge control point
    ↓
AdjustableEdge.handlePointerDown()
    ↓
Calls data.onDragStart()
    ↓
MindMapEditor sets isDraggingEdge = true
    ↓
ReactFlow disables pan (panOnDrag={false})
    ↓
User drags control point
    ↓
AdjustableEdge updates dragOffset
    ↓
Path recalculates in real-time
    ↓
User releases
    ↓
AdjustableEdge.handlePointerUp()
    ↓
Calls data.onDragEnd()
    ↓
MindMapEditor sets isDraggingEdge = false
    ↓
ReactFlow re-enables pan
    ↓
Calls onControlPointChange() to save offset
```

## Anchor Calculation Example

### Scenario: Child node to the right of parent

```
Parent Node (100, 100, 180x60)          Child Node (400, 120, 180x60)
┌─────────────────────┐                 ┌─────────────────────┐
│                     │                 │                     │
│      Parent         │                 │       Child         │
│    (190, 130)       │                 │     (490, 150)      │
│         ●           │                 │          ●          │
└─────────────────────┘                 └─────────────────────┘
         center                                  center

Step 1: Calculate vector
  dx = 490 - 190 = 300
  dy = 150 - 130 = 20

Step 2: Calculate angle
  angle = atan2(20, 300) ≈ 0.067 rad ≈ 3.8°

Step 3: Determine side
  aspectAngle = atan2(30, 90) ≈ 0.322 rad ≈ 18.4°
  Since |angle| < aspectAngle → RIGHT side

Step 4: Project onto boundary
  Parent anchor: (280, 130) - right edge
  Child anchor: (400, 150) - left edge

Result:
┌─────────────────────┐                 ┌─────────────────────┐
│                     │                 │                     │
│      Parent         ●─────────────────●       Child         │
│                     │                 │                     │
└─────────────────────┘                 └─────────────────────┘
                    (280,130)       (400,150)
```

## Key Design Decisions

### 1. Why Pointer Events Instead of Framer Motion Drag?
- **Problem**: Framer Motion drag events bubble to React Flow pane
- **Solution**: Use `onPointerDown/Move/Up` with `stopPropagation()`
- **Benefit**: Prevents canvas pan without complex event handling

### 2. Why Calculate Anchors in flow-converter?
- **Problem**: Edges need node bounds to calculate anchors
- **Solution**: Calculate in flow-converter where layout data is available
- **Benefit**: Single source of truth, automatic updates on layout changes

### 3. Why Pass Anchors via edge.data?
- **Problem**: React Flow doesn't support custom edge props
- **Solution**: Use edge.data to pass custom information
- **Benefit**: Type-safe, follows React Flow patterns

### 4. Why Elastic Curvature?
- **Problem**: Fixed curvature looks bad at different distances
- **Solution**: Calculate curvature based on edge length
- **Benefit**: Natural-looking curves at all scales

## Performance Considerations

### Optimizations
1. **useMemo** for path calculations - prevents recalculation on every render
2. **useCallback** for event handlers - prevents function recreation
3. **Anchor calculation only on layout change** - not on every render
4. **Pointer capture** - ensures smooth dragging even outside element

### Potential Bottlenecks
- Large mind maps (100+ nodes) may need virtualization
- Complex Bezier calculations on every drag event
- Layout recalculation on node movement

### Future Optimizations
- Memoize anchor calculations per edge
- Debounce layout recalculation
- Use Web Workers for large tree calculations

## Testing Strategy

### Unit Tests (Future)
- `anchor-solver.ts`: Test anchor calculation for all sides
- `flow-converter.ts`: Test edge data structure
- `AdjustableEdge.tsx`: Test drag interactions

### Integration Tests (Future)
- Test node movement updates anchors
- Test edge drag doesn't pan canvas
- Test control point customization persists

### Manual Testing Checklist
- [x] Edges connect to correct sides
- [x] Canvas doesn't pan when dragging edges
- [x] Anchors update when nodes move
- [x] Control point dragging works smoothly
- [x] Double-click resets customization
- [x] Works with left and right branches
- [x] Works with vertical alignment

## Conclusion

The dynamic edge anchor system provides a natural mind map editing experience by:
1. Automatically connecting edges to the correct side of nodes
2. Preventing canvas pan during edge manipulation
3. Updating anchors dynamically when nodes move
4. Allowing fine-tuned control point adjustments

The architecture is modular, maintainable, and follows React Flow best practices.
