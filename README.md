# Starter Web Vue Rsbuild

A modern Vue 3 frontend application built with Rsbuild, TypeScript, and Bun. This project serves as a starter template for building web applications with a focus on developer experience, type safety, and robust error handling.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Development](#development)
- [Testing](#testing)
- [Build and Deployment](#build-and-deployment)
- [Code Quality](#code-quality)
- [Documentation](#documentation)
- [License](#license)

## Features

- Vue 3 with Composition API
- TypeScript for type safety
- Rsbuild for fast builds and development
- Bun runtime for testing and package management
- Comprehensive error handling system
- Event bus for state management
- CSS Modules support
- Biome for linting and formatting
- WebUI integration support

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Vue 3.4+ |
| Build Tool | Rsbuild 0.7+ |
| Language | TypeScript 5.0+ |
| Runtime | Bun 1.0+ |
| Linting | Biome 2.3+ |
| Window Management | WinBox 0.2.82 |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Bun**: Version 1.0 or higher
  - Install via: `curl -fsSL https://bun.sh/install | bash`
- **Node.js**: Version 18 or higher (optional, Bun is preferred)

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd starter-web-vue-rsbuild
bun install
```

### Development Server

Start the development server:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

### Build

Create a production build:

```bash
bun run build:incremental
```

### Preview Production Build

Preview the production build locally:

```bash
bun run preview
```

## Project Structure

```
starter-web-vue-rsbuild/
├── src/
│   ├── components/       # Reusable Vue components
│   ├── composables/      # Vue composables (hooks)
│   ├── features/         # Feature modules
│   ├── infrastructure/   # Core infrastructure (error handling, event bus)
│   ├── lib/              # Utility libraries
│   ├── shared/           # Shared utilities and constants
│   ├── stores/           # State management stores
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript type definitions
│   ├── views/            # Page views and layouts
│   ├── main.ts           # Application entry point
│   └── shims-vue.d.ts    # Vue type declarations
├── tests/                # Test files
├── docs/                 # Documentation
├── dist/                 # Production build output
├── index.html            # HTML template
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── biome.json            # Biome linting configuration
├── rsbuild.config.ts     # Rsbuild base configuration
└── rsbuild.config.dev.ts # Rsbuild development configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Run production build (via external script) |
| `bun run build:incremental` | Run incremental production build |
| `bun run preview` | Preview production build |
| `bun run clean` | Clean dist and cache directories |
| `bun run lint` | Run linting on src directory |
| `bun run lint:fix` | Run linting and auto-fix issues |
| `bun run lint:ci` | Run linting with GitHub reporter |
| `bun run format` | Check formatting on src directory |
| `bun run format:fix` | Format code and fix issues |
| `bun run format:check` | Check formatting without changes |
| `bun run check` | Run lint and format checks |
| `bun run check:fix` | Run lint and format fixes |
| `bun run check:ci` | Run checks with GitHub reporter |
| `bun run validate` | Run all validation checks |
| `bun run validate:fix` | Run validation and fix issues |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:coverage` | Run tests with coverage |
| `bun run test:ci` | Run tests for CI with JUnit reporter |

## Development

### Editor Setup

This project uses TypeScript and Vue 3. Recommended editor extensions:

- Volar (Vue Language Features)
- TypeScript Vue Plugin

### Aliases

The project uses the following path aliases:

- `@/` - Resolves to `./src/`

### Environment Variables

Environment variables can be configured via `.env` files. Rsbuild supports:

- `.env` - Loaded in all modes
- `.env.local` - Loaded in all modes, ignored by git
- `.env.development` - Loaded in dev mode
- `.env.production` - Loaded in build mode

## Testing

Tests are written using Bun's built-in test runner:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

Test files should be placed in the `tests/` directory and follow the naming convention `*.test.ts`.

## Build and Deployment

### Production Build

The production build outputs to the `dist/` directory:

```bash
bun run build:incremental
```

### Build Output

- JavaScript files: `static/js/[name].[contenthash:8].js`
- CSS files: `static/css/[name].[contenthash:8].css`

### Deployment

Copy the contents of the `dist/` directory to your web server or hosting platform.

## Code Quality

### Linting

This project uses Biome for linting and formatting. The configuration is in `biome.json`.

```bash
# Check for issues
bun run lint

# Auto-fix issues
bun run lint:fix
```

### Formatting

```bash
# Check formatting
bun run format:check

# Format files
bun run format:fix
```

### Pre-commit Checks

It is recommended to run validation before committing:

```bash
bun run validate:fix
```

## Documentation

Additional documentation is available in the `docs/` directory:

- [Getting Started](./docs/getting-started.md) - Detailed setup instructions
- [Architecture](./docs/architecture.md) - Project architecture and design patterns
- [Development Guide](./docs/development.md) - Development workflow and best practices
- [Error Handling](./docs/error-handling.md) - Error handling system documentation
- [Testing Guide](./docs/testing.md) - Testing guidelines and examples
- [Deployment](./docs/deployment.md) - Deployment instructions

## License

This project is private and proprietary.
