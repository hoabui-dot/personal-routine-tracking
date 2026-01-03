# Settings Page Improvements

## Summary
Updated the settings page with responsive grid layout and full goal CRUD functionality.

## Changes Made

### 1. Fixed Accordion Grid Layout
**Problem**: User goal cards were displayed in a single column, wasting space on larger screens.

**Solution**: Implemented responsive CSS grid layout:
```css
display: grid;
gridTemplateColumns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
gap: 1.5rem;
```

**Behavior**:
- Mobile (< 350px): 1 column
- Tablet (350-700px): 1-2 columns
- Desktop (> 700px): 2-3 columns automatically
- Cards have equal heights with `height: 100%`

### 2. Disabled Add Sub-Task Button When Goal is Full
**Problem**: Users could add sub-tasks even when total duration exceeded the goal.

**Solution**: 
- Button disabled when `remainingMinutes <= 0`
- Visual feedback: grayed background, reduced opacity (0.6)
- Cursor changes to `not-allowed`
- Button text changes to "⚠️ Goal Full"
- Tooltip explains why disabled

### 3. Goal CRUD Operations

#### Create Goal
- "New Goal" button in header
- Form with title and year inputs
- Validates title is not empty
- Year defaults to current year
- Creates goal and refreshes data

#### Update Goal
- "Edit" button on each goal header
- Inline editing form replaces header
- Updates title and/or year
- Validates inputs before saving
- Preserves scroll position after update

#### Delete Goal
- "Delete" button on each goal header
- Confirmation dialog warns about cascading deletion
- Removes goal and all associated user goals/sub-tasks
- Refreshes data after deletion

### 4. API Client Updates
Added goal management methods to `web-frontend/lib/api/game.ts`:
```typescript
getGoals(year?: number): Promise<any[]>
createGoal(title: string, year: number): Promise<any>
updateGoal(id: number, updates: { title?: string; year?: number }): Promise<any>
deleteGoal(id: number): Promise<void>
```

### 5. UI/UX Improvements
- Goal header shows year: "2 players • Year 2026"
- Edit/Delete buttons with emoji icons for clarity
- Responsive layout adapts to screen size
- Smooth transitions and hover effects
- Consistent spacing and alignment
- Scroll position preserved during data refreshes

## Technical Details

### State Management
```typescript
const [editingGoal, setEditingGoal] = useState<{ id: number; title: string; year: number } | null>(null);
const [creatingGoal, setCreatingGoal] = useState(false);
const [newGoalData, setNewGoalData] = useState<GoalFormData>({ title: '', year: new Date().getFullYear() });
```

### Grid Layout Benefits
- Automatic column adjustment based on available space
- No media queries needed (CSS Grid handles it)
- Consistent card heights
- Better space utilization on larger screens
- Mobile-first responsive design

### Button Disable Logic
```typescript
disabled={remainingMinutes <= 0}
title={remainingMinutes <= 0 ? 'Cannot add more sub-tasks...' : 'Add a new sub-task'}
background: remainingMinutes <= 0 ? theme.border : theme.primary
```

## Files Modified
1. `web-frontend/pages/settings.tsx` - Main settings page with grid and CRUD
2. `web-frontend/lib/api/game.ts` - Added goal API methods

## Testing Checklist
- [x] Grid layout responsive on mobile (320px)
- [x] Grid layout responsive on tablet (768px)
- [x] Grid layout responsive on desktop (1024px+)
- [x] Add Sub-Task button disabled when goal full
- [x] Create new goal works
- [x] Edit goal title works
- [x] Edit goal year works
- [x] Delete goal with confirmation works
- [x] Scroll position preserved during updates
- [x] No TypeScript errors
- [x] Toast notifications show for all operations

## User Experience
- Clean, organized layout that scales with screen size
- Clear visual feedback for all actions
- Prevents invalid operations (adding sub-tasks when full)
- Easy goal management without leaving settings page
- Responsive design works on all devices
