# Sub-Task Selection & UI Improvements

## Overview
Improved the calendar router with better sub-task selection logic and beautiful headless UI components that match the capybara theme.

## Changes Made

### 1. **Sub-Task Selection Logic** 🔄
**Before**: Users could choose "Main Goal (Full 2h)" OR individual sub-tasks
**After**: Users can ONLY choose individual sub-tasks (Task 1: 60m, Task 2: 60m)

#### New Logic:
- **If goal has sub-tasks**: User MUST select a specific sub-task to start
- **If goal has no sub-tasks**: User starts the full goal session directly
- **No "Main Goal" option**: Forces users to work on specific tasks

#### Benefits:
- ✅ **Focused Work**: Users must choose specific tasks, promoting focused sessions
- ✅ **Better Tracking**: Each session tracks a specific sub-task, not generic "goal work"
- ✅ **Clear Intent**: Users know exactly what they're working on

### 2. **Beautiful Headless UI Dropdowns** 🎨
**Before**: Basic HTML `<select>` elements with limited styling
**After**: Custom headless UI components with full theme integration

#### New CustomSelect Component:
- **Headless UI**: Using `@headlessui/react` for accessibility and behavior
- **Theme Integration**: Fully matches capybara theme colors and styling
- **Interactive**: Hover effects, focus states, smooth transitions
- **Accessible**: Keyboard navigation, screen reader support
- **Icons**: Support for emoji icons and descriptions

#### Features:
- 🎯 **Goal Selector**: Shows goal name + duration (e.g., "English Daily Practice (2h per day)")
- 📝 **Sub-Task Selector**: Shows task name + duration (e.g., "Speaking (60 minutes)")
- ✨ **Smooth Animations**: Fade in/out transitions
- 🎨 **Theme Colors**: Uses theme.surface, theme.primary, theme.success, etc.
- 📱 **Mobile Friendly**: Works perfectly on all screen sizes

## Technical Implementation

### Dependencies Added
```bash
npm install @headlessui/react @heroicons/react
```

### CustomSelect Component
**File**: `web-frontend/components/ui/CustomSelect.tsx`

**Features**:
- TypeScript with proper interfaces
- Theme context integration
- Hover and focus states
- Icon and description support
- Accessibility compliant
- Mobile responsive

**Props**:
```typescript
interface CustomSelectProps {
  options: Option[];
  value: Option | null | undefined;
  onChange: (option: Option) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface Option {
  id: string | number;
  name: string;
  description?: string;
  icon?: string;
}
```

### Updated GameCalendar Logic

#### Goal Selector
```typescript
<CustomSelect
  options={goals.map(goal => ({
    id: goal.id,
    name: goal.title,
    description: "2h per day",
    icon: "🎯"
  }))}
  value={selectedGoal}
  onChange={setSelectedGoal}
  placeholder="Choose a goal to track"
/>
```

#### Sub-Task Selector
```typescript
// Only show individual sub-tasks (no "Main Goal" option)
<CustomSelect
  options={subTasks.map(task => ({
    id: task.id,
    name: task.title,
    description: `${task.duration_minutes} minutes`,
    icon: "📝"
  }))}
  value={selectedSubTask}
  onChange={setSelectedSubTask}
  placeholder="Choose a task to start"
/>
```

#### Validation Logic
```typescript
// If sub-tasks exist but none selected, show error
if (userSubTasks.length > 0 && !subTaskId) {
  toast.error('Please select a task to start');
  return;
}
```

## User Experience Flow

### **Scenario 1: Goal with Sub-Tasks**
1. User selects "English Daily Practice" goal
2. Calendar shows users with that goal
3. User sees sub-task dropdown: "Speaking (60min)", "Listening (60min)"
4. User MUST select a specific task
5. Button shows "▶️ Start Selected Task"
6. If no task selected → Error: "Please select a task to start"

### **Scenario 2: Goal without Sub-Tasks**
1. User selects "Workout" goal (no sub-tasks configured)
2. Calendar shows users with that goal
3. User sees message: "🎯 Ready to start the full goal session"
4. Button shows "▶️ Start Goal Session"
5. Starts full goal session directly

## UI/UX Improvements

### **Dropdown Styling**
- **Rounded corners**: `rounded-xl` for modern look
- **Smooth borders**: 2px borders with theme colors
- **Hover effects**: Background and border color changes
- **Focus states**: Proper focus rings for accessibility
- **Shadows**: Subtle shadows for depth
- **Typography**: Proper font weights and sizes

### **Option Styling**
- **Icons**: Emoji icons for visual appeal (🎯, 📝)
- **Descriptions**: Secondary text with duration info
- **Selection indicator**: Green checkmark for selected items
- **Hover states**: Highlighted background on hover
- **Spacing**: Proper padding and margins

### **Mobile Optimization**
- **Touch friendly**: Large touch targets
- **Responsive text**: Scales with screen size
- **Proper spacing**: Works on 320px screens
- **Smooth scrolling**: Long option lists scroll smoothly

## Theme Integration

### **Colors Used**
- `theme.surface` - Dropdown background
- `theme.surfaceHover` - Hover state
- `theme.border` - Border colors
- `theme.primary` - Focus/active states
- `theme.text` - Main text color
- `theme.textSecondary` - Description text
- `theme.success` - Selection indicators
- `theme.highlight` - Option hover background
- `theme.cardBg` - Dropdown panel background
- `theme.shadow` - Drop shadows

### **Consistency**
- Matches existing button styles
- Uses same border radius as cards
- Consistent with theme switching
- Proper contrast ratios
- Accessible color combinations

## Files Modified

1. **`web-frontend/components/ui/CustomSelect.tsx`** (NEW)
   - Beautiful headless UI dropdown component
   - Full theme integration
   - TypeScript interfaces
   - Accessibility features

2. **`web-frontend/components/GameCalendar.tsx`**
   - Updated imports for CustomSelect
   - Changed goal selector to use CustomSelect
   - Updated sub-task selection logic
   - Added selectedSubTaskByUser state
   - Improved validation and error handling

3. **`web-frontend/package.json`**
   - Added @headlessui/react dependency
   - Added @heroicons/react dependency

## Testing Scenarios

### ✅ **Goal Selection**
- Beautiful dropdown with goal names and durations
- Smooth animations and hover effects
- Proper theme colors
- Mobile responsive

### ✅ **Sub-Task Selection (Required)**
- Only shows individual sub-tasks
- No "Main Goal" option
- Must select a task to start
- Error if trying to start without selection

### ✅ **No Sub-Tasks Available**
- Shows "Ready to start full goal session" message
- Start button works directly
- No dropdown shown

### ✅ **Theme Integration**
- Matches capybara theme perfectly
- Proper colors in light/dark modes
- Consistent with existing UI
- Smooth transitions

## Benefits

### **For Users**
- 🎯 **Focused Sessions**: Must choose specific tasks
- 🎨 **Beautiful UI**: Modern, polished dropdowns
- 📱 **Mobile Friendly**: Works great on all devices
- ♿ **Accessible**: Keyboard navigation, screen readers

### **For Developers**
- 🔧 **Reusable Component**: CustomSelect can be used elsewhere
- 🎨 **Theme Consistent**: Automatically matches theme changes
- 📝 **TypeScript**: Proper type safety
- 🧪 **Testable**: Clean component structure

---

## Summary

The calendar router now provides a much better user experience with:
- **Focused task selection** (no generic "main goal" option)
- **Beautiful headless UI dropdowns** that match the capybara theme perfectly
- **Better validation** to ensure users select specific tasks
- **Mobile-optimized** interface that works on all screen sizes

Users are now guided to work on specific, focused tasks rather than vague "goal work", leading to better productivity and tracking!