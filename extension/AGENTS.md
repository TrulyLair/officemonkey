# OfficeMonkey Chrome Extension - Architecture Guide

## Overview

This Chrome extension converts two ViolentMonkey user scripts (`calendar.user.js` and `contact.user.js`) into a proper Chrome extension using TypeScript, Manifest V3, and comprehensive test coverage with Vitest.

## Architecture

### Technology Stack
- **Manifest V3**: Modern Chrome extension API
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and bundler
- **Vitest**: Modern testing framework with TDD approach
- **mise**: Development environment management

### Project Structure

```
extension/
├── manifest.json              # Chrome extension manifest (V3)
├── src/
│   ├── content/              # Content scripts (run on web pages)
│   │   ├── calendar.ts       # Calendar page enhancements
│   │   ├── contact.ts        # Contact page enhancements
│   │   └── shared.ts         # Shared utilities
│   ├── background/           # Background service worker
│   │   └── service-worker.ts
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   └── utils/                # Utility functions
│       ├── dom.ts            # DOM manipulation
│       ├── calendar.ts       # Calendar utilities
│       └── contact.ts        # Contact utilities
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── fixtures/             # Test fixtures
│   └── setup.ts              # Test setup and mocks
├── public/
│   └── icons/                # Extension icons
└── dist/                     # Built extension (generated)
```

### Content Scripts

Content scripts run in the context of web pages and can interact with the DOM.

1. **Calendar Script** (`src/content/calendar.ts`)
   - Runs on: `https://safeoffice.com/ApptCal.php*`
   - Replaces the default calendar view with FullCalendar
   - Handles event rendering, tooltips, and interactions

2. **Contact Script** (`src/content/contact.ts`)
   - Runs on: `https://safeoffice.com/*` (all pages)
   - Adds various UI enhancements: note sorting, hover effects, search, etc.

### Background Service Worker

The service worker (`src/background/service-worker.ts`) handles:
- Extension lifecycle events
- Cross-tab communication (if needed)
- Storage management

## Mapping from User Scripts

### Calendar Script (`calendar.user.js` → `src/content/calendar.ts`)

| User Script Feature | Extension Implementation |
|---------------------|--------------------------|
| `GM_addStyle` | `chrome.scripting.insertCSS` or inline styles |
| FullCalendar initialization | FullCalendar integration with scheduler |
| Event data transformation | `src/utils/calendar.ts` - `transformEventData()` |
| Tooltip (qtip2) | Modern tooltip solution or vanilla JS |
| Cookie storage | `chrome.storage.local` |
| jQuery `$y` | Vanilla JS or careful jQuery handling |
| Event filtering | `filterCanceledEvents()` utility |
| Resource management | Calendar resources configuration |

**Key Functions:**
- `init()` → `initializeCalendar()`
- `performCalendarScript()` → Main calendar setup
- `makeCalendar()` → FullCalendar initialization
- `getTooltip()` → Tooltip setup
- `eventDataTransform` → Event transformation logic

### Contact Script (`contact.user.js` → `src/content/contact.ts`)

| User Script Feature | Extension Implementation |
|---------------------|--------------------------|
| `GM.addStyle` | `chrome.scripting.insertCSS` |
| `GM.setClipboard` | `navigator.clipboard.writeText()` |
| `GM.openInTab` | `chrome.tabs.create()` |
| Note sorting | `sortNotes()` utility function |
| Hover effects | CSS classes + event listeners |
| Email click handlers | Gmail integration with clipboard |
| TopSearch (`/` key) | Keyboard event listener |
| Phone filtering | `filterPhoneResults()` utility |
| Amount calculator | `setupAmountCalculator()` function |
| Cookie storage | `chrome.storage.local` |

**Key Functions:**
- `init()` → `initializeContact()` 
- `performNoteSort()` → `sortNotes()`
- `hoverNotes()` → `setupNoteHover()`
- `hoverTableRows()` → `setupTableRowHover()`
- `createTopSearch()` → `setupTopSearch()`
- `fireTopSearch()` → `executeTopSearch()`
- `addGMailClickListeners()` → `setupGmailIntegration()`
- `formatEventDetails()` → `formatEventDetails()`
- `setupAmtCollectedCalculator()` → `setupAmountCalculator()`

## Testing Strategy

### Test-Driven Development (TDD)

We follow TDD principles:
1. **Write tests first** - Define expected behavior
2. **Implement feature** - Make tests pass
3. **Refactor** - Improve code while keeping tests green

### Test Structure

#### Unit Tests (`tests/unit/`)
- Test individual functions in isolation
- Mock dependencies (Chrome APIs, DOM)
- Fast execution
- High coverage target: 80%+

**Example:**
```typescript
// tests/unit/calendar.test.ts
describe('transformEventData', () => {
  it('should filter canceled events', () => {
    // Test implementation
  });
});
```

#### Integration Tests (`tests/integration/`)
- Test content script injection
- Test DOM manipulation scenarios
- Test user interactions
- Use JSDOM for realistic DOM environment

#### Test Fixtures (`tests/fixtures/`)
- Mock HTML structures
- Sample page content
- Reusable test data

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Mocking

- **Chrome APIs**: Mocked in `tests/setup.ts`
- **DOM**: JSDOM environment provided by Vitest
- **External libraries**: Mocked as needed

## Development Workflow

### Prerequisites

1. **Install mise**: Follow [mise installation guide](https://mise.jdx.dev/getting-started.html)
2. **Setup environment**: Run `mise install` in the extension directory
   - This installs Node.js version specified in `.mise.toml`

### Daily Development

1. **Start development**:
   ```bash
   cd extension
   mise install  # Ensure correct Node.js version
   npm install   # Install dependencies
   npm run dev   # Watch mode for building
   ```

2. **Write tests first** (TDD):
   ```bash
   npm test -- --watch
   ```

3. **Implement features** to make tests pass

4. **Load extension in Chrome**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist` directory

5. **Test manually** on `https://safeoffice.com`

### Build Process

```bash
# Development build (watch mode)
npm run dev

# Production build
npm run build
```

The build process:
1. Vite bundles TypeScript files
2. Outputs to `dist/` directory
3. Copies `manifest.json` and other assets
4. Content scripts are bundled separately

## Chrome Extension Concepts

### Manifest V3

Key differences from V2:
- **Service Workers** instead of background pages
- **Content Scripts** defined in manifest
- **Host Permissions** separate from permissions
- **Scripting API** for dynamic injection

### Content Scripts

- Run in isolated world (can't access page's JavaScript)
- Can access DOM
- Communicate via `postMessage` or `chrome.runtime.sendMessage`
- Run at `document_idle` by default

### Storage

- `chrome.storage.local` - Persistent storage
- `chrome.storage.sync` - Synced across devices (limited)
- Replaces cookie usage from user scripts

### Permissions

Required permissions:
- `storage` - For preferences
- `tabs` - For opening Gmail
- `scripting` - For CSS injection
- `clipboardWrite` - For copying event details

## Key Differences from User Scripts

### API Mappings

| User Script API | Chrome Extension API |
|----------------|---------------------|
| `GM.addStyle()` | `chrome.scripting.insertCSS()` |
| `GM.setClipboard()` | `navigator.clipboard.writeText()` |
| `GM.openInTab()` | `chrome.tabs.create()` |
| Cookies | `chrome.storage.local` |
| `@match` | `matches` in manifest |

### jQuery Handling

The original scripts use `jQuery.noConflict()` to avoid conflicts with the site's `$j` jQuery instance. In the extension:

- **Option 1**: Bundle jQuery and use carefully (not recommended)
- **Option 2**: Rewrite to vanilla JavaScript (preferred)
- **Option 3**: Use the site's existing jQuery if available

We prefer vanilla JavaScript for:
- Smaller bundle size
- Better performance
- No dependency conflicts
- Modern browser APIs

### Execution Context

- **User Scripts**: Run in page context, can access page's JavaScript
- **Content Scripts**: Run in isolated context, can't access page's JavaScript
- **Communication**: Use `postMessage` or message passing

## Development Tips

### Debugging

1. **Content Scripts**: Use `console.log` - appears in page's console
2. **Service Worker**: Check `chrome://extensions/` → "Service worker" link
3. **Storage**: Use `chrome.storage.local.get()` in console
4. **Breakpoints**: Use Chrome DevTools on the page

### Common Issues

1. **jQuery conflicts**: Use vanilla JS or namespace carefully
2. **Timing issues**: Wait for DOM with `DOMContentLoaded` or polling
3. **CSP violations**: Some sites block inline scripts - use external files
4. **Storage limits**: `chrome.storage.local` has 10MB limit

### Best Practices

1. **Error handling**: Always wrap risky operations in try-catch
2. **Type safety**: Use TypeScript types for Chrome APIs
3. **Testing**: Write tests before implementation (TDD)
4. **Documentation**: Comment complex logic
5. **Performance**: Minimize DOM queries, cache selectors

## Future Enhancements

- Bundle FullCalendar instead of CDN
- Add options page for user preferences
- Add popup UI for quick actions
- Implement error reporting
- Add analytics (privacy-respecting)
- Support for other browsers (Firefox, Edge)

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [mise Documentation](https://mise.jdx.dev/)
