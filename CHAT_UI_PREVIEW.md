# 💬 Chat UI Preview

## Expanded Chat Box

```
┌─────────────────────────────────────────────────┐
│  💬  Chat                              [−]      │ ← Header (Gradient)
│      🟢 Connected                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  Thảo Nhi                                       │ ← Other user message
│  ┌──────────────────────────────────┐          │
│  │ Hey! How's your English          │          │
│  │ practice going today?            │          │
│  │                          10:30   │          │
│  └──────────────────────────────────┘          │
│                                                 │
│                          ┌──────────────────┐  │ ← Own message
│                          │ Going great!     │  │   (Gradient)
│                          │ Just finished    │  │
│                          │ 30 minutes       │  │
│                          │          10:31   │  │
│                          └──────────────────┘  │
│                                                 │
│  Thảo Nhi                                       │
│  ┌──────────────────────────────────┐          │
│  │ Awesome! Keep it up! 🎉          │          │
│  │                          10:32   │          │
│  └──────────────────────────────────┘          │
│                                                 │
│  ● ● ● Thảo Nhi is typing...                   │ ← Typing indicator
│                                                 │
├─────────────────────────────────────────────────┤
│ [Type a message...            ] [Send]         │ ← Input area
└─────────────────────────────────────────────────┘
```

## Minimized State

```
                                    ┌──────┐
                                    │  💬  │ ← Floating button
                                    │  🟢  │   (bottom-right)
                                    └──────┘
```

## Empty State

```
┌─────────────────────────────────────────────────┐
│  💬  Chat                              [−]      │
│      🟢 Connected                               │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│                    🦫                           │
│                                                 │
│              No messages yet.                   │
│         Start the conversation!                 │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Type a message...            ] [Send]         │
└─────────────────────────────────────────────────┘
```

## Disconnected State

```
┌─────────────────────────────────────────────────┐
│  💬  Chat                              [−]      │
│      🔴 Disconnected                            │ ← Red indicator
├─────────────────────────────────────────────────┤
│                                                 │
│  [Previous messages shown in gray]              │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Type a message...            ] [Send]         │ ← Disabled
└─────────────────────────────────────────────────┘
```

## Color Scheme (Capybara Theme)

### Header
- Background: `linear-gradient(135deg, #8D6E63, #A1887F)`
- Text: White
- Status indicator: Green (#10b981) or Red (#ef4444)

### Messages
**Own Messages:**
- Background: `linear-gradient(135deg, #8D6E63, #A1887F)`
- Text: White
- Border radius: `16px 16px 4px 16px` (rounded except bottom-right)

**Other Messages:**
- Background: Surface color (light/dark theme)
- Text: Theme text color
- Border: Theme border color
- Border radius: `16px 16px 16px 4px` (rounded except bottom-left)

### Input Area
- Background: Surface color
- Border: Theme border color
- Focus border: Primary color (#8D6E63)
- Send button: Gradient (same as header)

## Responsive Behavior

### Desktop (> 768px)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Calendar Content                               │
│                                                 │
│                                                 │
│                                    ┌──────────┐ │
│                                    │   Chat   │ │
│                                    │          │ │
│                                    │          │ │
│                                    └──────────┘ │
└─────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────┐
│                 │
│  Calendar       │
│  Content        │
│                 │
│                 │
│            ┌──┐ │
│            │💬│ │ ← Smaller button
│            └──┘ │
└─────────────────┘
```

## Animations

### Typing Indicator
```
● ● ●  →  ● ● ●  →  ● ● ●
↑         ↑         ↑
Bounce    Bounce    Bounce
(0s)      (0.2s)    (0.4s)
```

### Message Appearance
```
New message fades in from bottom
Opacity: 0 → 1 (0.2s)
Transform: translateY(10px) → translateY(0)
```

### Hover Effects
```
Send Button:
  Normal: translateY(0)
  Hover:  translateY(-2px) + increased shadow
```

## Accessibility Features

✅ Keyboard navigation  
✅ Focus indicators  
✅ ARIA labels  
✅ Screen reader friendly  
✅ High contrast support  
✅ Reduced motion support  

## Interactive States

### Input Field
- **Default**: Border color = theme.border
- **Focus**: Border color = theme.primary
- **Disabled**: Opacity = 0.5, cursor = not-allowed

### Send Button
- **Default**: Gradient background
- **Hover**: Elevated shadow, translateY(-2px)
- **Disabled**: Gray background, cursor = not-allowed
- **Active**: Slightly pressed effect

### Minimize Button
- **Default**: Semi-transparent white background
- **Hover**: Fully opaque white background
- **Active**: Slightly darker

## Message Layout

### Own Message (Right-aligned)
```
                    ┌─────────────────────┐
                    │ Message text here   │
                    │                     │
                    │             HH:MM   │
                    └─────────────────────┘
```

### Other Message (Left-aligned)
```
User Name
┌─────────────────────┐
│ Message text here   │
│                     │
│             HH:MM   │
└─────────────────────┘
```

## Dimensions

- **Width**: 380px (fixed)
- **Height**: 550px (fixed)
- **Position**: Fixed, bottom-right
- **Offset**: 20px from edges
- **Border radius**: 16px
- **Shadow**: `0 8px 32px rgba(0,0,0,0.15)`

### Minimized Button
- **Size**: 60px × 60px
- **Border radius**: 50% (circle)
- **Position**: Fixed, bottom-right
- **Offset**: 20px from edges

## Z-Index Layers

```
1000 - Chat box (highest)
 999 - Floating button
   1 - Calendar content
   0 - Background decorations
```

---

**The chat seamlessly integrates with the Capybara Tracker theme while providing a familiar, messenger-like experience! 🦫💬**
