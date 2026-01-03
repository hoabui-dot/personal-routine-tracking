# Theme Settings Update - Implementation Guide

## What Was Done ✅

### 1. Updated ThemeContext (`web-frontend/contexts/ThemeContext.tsx`)
- Added support for multiple themes: `capybara-light`, `capybara-dark`, `christmas`
- Added `currentTheme` state and `setTheme()` function
- Created Christmas theme with festive colors (red, green, gold, winter blue)
- Maintained backward compatibility with old theme format

### 2. Created Snowflakes Component (`web-frontend/components/Snowflakes.tsx`)
- Animated snowflakes that fall from top to bottom
- 50 snowflakes with random properties (position, speed, size, opacity)
- Smooth CSS animation with rotation
- Only shows when Christmas theme is active

### 3. Updated Layout Component (`web-frontend/components/Layout.tsx`)
- Added Snowflakes component that renders when `currentTheme === 'christmas'`
- Wrapped layout in fragment to support snowflakes overlay

### 4. Updated Settings Page (`web-frontend/pages/settings.tsx`)
- Added `activeTab` state with 3 tabs: 'goals', 'cron', 'theme'
- Added tab navigation UI
- Imported `currentTheme` and `setTheme` from useTheme()

## What Needs to Be Done 🔧

### Settings Page Restructuring

The settings page needs to be manually restructured because it's too large for automated replacement. Here's what to do:

#### Step 1: Find the Cron Jobs Section
Look for this comment in `web-frontend/pages/settings.tsx`:
```tsx
{/* Cron Jobs Section */}
```

#### Step 2: Wrap Goals Section
Before the Cron Jobs Section, add a closing for the Goals tab:
```tsx
            </div>
            )}

            {/* Cron Jobs Tab */}
            {activeTab === 'cron' && (
```

#### Step 3: Close Cron Jobs Tab
At the end of the cron jobs section (before the closing divs), add:
```tsx
            </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
            <div style={{
              background: theme.surface,
              borderRadius: '1.5rem',
              boxShadow: `0 10px 25px ${theme.shadow}`,
              padding: '2.5rem',
              border: `1px solid ${theme.border}`
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: theme.text,
                marginBottom: '0.5rem'
              }}>
                🎨 Theme Settings
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: theme.textSecondary,
                marginBottom: '2rem'
              }}>
                Choose your favorite theme. Christmas theme includes animated snowflakes!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Capybara Light Theme */}
                <div
                  onClick={() => setTheme('capybara-light')}
                  style={{
                    background: currentTheme === 'capybara-light' ? theme.highlight : theme.background,
                    borderRadius: '1rem',
                    border: `3px solid ${currentTheme === 'capybara-light' ? theme.primary : theme.border}`,
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #f4e4d7 0%, #e8d5c4 50%, #d4b5a0 100%)',
                    border: '2px solid #d4845c',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: theme.text,
                      marginBottom: '0.25rem'
                    }}>
                      🦫 Capybara Light
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: theme.textSecondary,
                      margin: 0
                    }}>
                      Warm, earthy tones inspired by our favorite capybara friends
                    </p>
                  </div>
                  {currentTheme === 'capybara-light' && (
                    <div style={{
                      fontSize: '1.5rem',
                      color: theme.success
                    }}>
                      ✓
                    </div>
                  )}
                </div>

                {/* Capybara Dark Theme */}
                <div
                  onClick={() => setTheme('capybara-dark')}
                  style={{
                    background: currentTheme === 'capybara-dark' ? theme.highlight : theme.background,
                    borderRadius: '1rem',
                    border: `3px solid ${currentTheme === 'capybara-dark' ? theme.primary : theme.border}`,
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 50%, #5d4037 100%)',
                    border: '2px solid #ff9e6d',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: theme.text,
                      marginBottom: '0.25rem'
                    }}>
                      🌙 Capybara Dark
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: theme.textSecondary,
                      margin: 0
                    }}>
                      Cozy evening tones for comfortable night-time tracking
                    </p>
                  </div>
                  {currentTheme === 'capybara-dark' && (
                    <div style={{
                      fontSize: '1.5rem',
                      color: theme.success
                    }}>
                      ✓
                    </div>
                  )}
                </div>

                {/* Christmas Theme */}
                <div
                  onClick={() => setTheme('christmas')}
                  style={{
                    background: currentTheme === 'christmas' ? theme.highlight : theme.background,
                    borderRadius: '1rem',
                    border: `3px solid ${currentTheme === 'christmas' ? theme.primary : theme.border}`,
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
                    border: '2px solid #dc2626',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    ❄️
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: theme.text,
                      marginBottom: '0.25rem'
                    }}>
                      🎄 Merry Christmas
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: theme.textSecondary,
                      margin: 0
                    }}>
                      Festive theme with animated snowflakes falling on Christmas Day
                    </p>
                  </div>
                  {currentTheme === 'christmas' && (
                    <div style={{
                      fontSize: '1.5rem',
                      color: theme.success
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Preview */}
              {currentTheme === 'christmas' && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: theme.highlight,
                  borderRadius: '1rem',
                  border: `2px solid ${theme.primary}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    ❄️ ☃️ 🎄 🎅 🎁
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: theme.text,
                    margin: 0,
                    fontWeight: '600'
                  }}>
                    Snowflakes are now falling across your app! 🌨️
                  </p>
                </div>
              )}
            </div>
            )}
```

## Testing

1. **Restart the frontend**: `cd web-frontend && npm run dev`
2. **Navigate to Settings**: http://localhost:3000/settings
3. **Test Tabs**:
   - Click "Goals & Sub-Tasks" tab - should show goals
   - Click "Cron Jobs" tab - should show cron jobs
   - Click "Theme" tab - should show theme selector
4. **Test Themes**:
   - Click "Capybara Light" - warm brown/orange colors
   - Click "Capybara Dark" - dark brown colors
   - Click "Merry Christmas" - winter blue background with snowflakes falling!

## Features

### Christmas Theme
- ❄️ 50 animated snowflakes falling continuously
- 🎄 Festive red, green, and gold colors
- 🌨️ Winter night sky gradient background
- ⛄ Snowflakes rotate as they fall
- 🎅 Works across all pages when theme is active

### Theme Persistence
- Selected theme is saved to localStorage
- Theme persists across page reloads
- Backward compatible with old dark/light mode setting

---

**Status**: Ready for manual implementation of Theme tab in settings page
**Date**: 2026-01-04
