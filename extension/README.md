# OfficeMonkey Chrome Extension

Chrome extension that enhances OfficeMonkey calendar and contact pages. Converted from ViolentMonkey user scripts.

## Development

### Prerequisites

- [mise](https://mise.jdx.dev/) for development environment management
- Node.js (version specified in `.mise.toml`)

### Setup

```bash
# Install mise if not already installed
# See https://mise.jdx.dev/getting-started.html

# Install Node.js version
mise install

# Install dependencies
npm install
```

### Development Commands

```bash
# Build in watch mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Type check
npm run lint
```

### Loading the Extension

1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension/dist` directory

## Testing

This project uses Test-Driven Development (TDD) with Vitest. See `AGENTS.md` for detailed architecture and testing information.

## License

MIT
