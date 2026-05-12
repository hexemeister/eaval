## 2025-05-09 - [SearchBar Accessibility and Utility]
**Learning:** Icon-only buttons (like help and clear search) must have explicit ARIA labels and focus rings to be accessible. Contextual help is better as a dedicated icon than a broad tooltip on the whole form.
**Action:** Always provide `aria-label` for icon buttons and use `Tooltip` components for subtle guidance without cluttering the UI.

## 2025-05-09 - [Custom Theme Solution]
**Learning:** External dependencies for theme management can introduce synchronization bugs and hydration mismatches. A custom provider using the View Transitions API can achieve similar delight with more control and fewer bugs.
**Action:** Prefer lightweight, internal state management for theme persistence (localStorage + Cookies) to keep SSR and Client-side in sync.

## 2025-05-11 - [Administrative Content Spacing]
**Learning:** Content in administrative layouts using a sidebar often needs a wrapper with consistent padding (e.g., `p-4 md:p-6`) to prevent elements from being "glued" to navigation components.
**Action:** Centralize content spacing in the main layout component (`AppSidebarLayout`) instead of repeating it in every page.
