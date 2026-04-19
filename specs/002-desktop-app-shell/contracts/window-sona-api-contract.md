# Contract: `window.sona` API Surface

## Purpose

Defines the typed preload bridge exposed to the renderer for the desktop shell phase. The contract is intentionally narrow: it exposes shell bootstrap data and theme-setting operations only.

## Type Definitions

```ts
type ThemePreferenceMode = 'system' | 'dark' | 'light'
type ResolvedTheme = 'dark' | 'light'
type NavigationDestinationId = 'dashboard' | 'library' | 'review' | 'settings'

interface NavigationDestination {
  id: NavigationDestinationId
  label: string
  order: number
}

interface ShellBootstrapState {
  appName: 'Sona'
  navigation: NavigationDestination[]
  themePreference: ThemePreferenceMode
  resolvedTheme: ResolvedTheme
  systemTheme: ResolvedTheme
}

interface ThemeUpdateResult {
  themePreference: ThemePreferenceMode
  resolvedTheme: ResolvedTheme
}
```

## Surface

```ts
interface WindowSona {
  shell: {
    getBootstrapState(): Promise<ShellBootstrapState>
  }
  settings: {
    getThemePreference(): Promise<ThemePreferenceMode>
    setThemePreference(mode: ThemePreferenceMode): Promise<ThemeUpdateResult>
    subscribeThemeChanges(listener: (update: ThemeUpdateResult) => void): () => void
  }
}
```

## Behavior Rules

- The renderer receives only typed data and must not receive raw database handles, filesystem handles, or generic IPC access.
- `getBootstrapState()` returns enough information for the renderer to render the shell before feature-specific content exists.
- `setThemePreference()` persists the new mode through the main-process settings service and returns the resolved theme that should be applied immediately.
- `subscribeThemeChanges()` emits updates when the resolved theme changes because the learner changed the preference or, while in `system` mode, the OS theme changed.
- Invalid input values are rejected by the preload bridge before they reach the database layer.

## Error Model

- Theme-setting operations return normalized, user-safe errors instead of leaking SQLite or Electron internals.
- Bootstrap failure falls back to the dark shell theme and the static navigation list, while logging the underlying error in the main process.

## Security Rules

- `contextIsolation` remains enabled.
- The preload script exposes only `window.sona` and no direct `ipcRenderer` primitives.
- All IPC channels backing this contract are private implementation details and are not part of the renderer-facing API.