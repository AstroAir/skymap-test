# SkyMap

A modern desktop star map and astronomy planning application built with **Next.js 16**, **React 19**, and **Tauri 2.9**. It integrates with the Stellarium Web Engine for sky visualization, observation planning, and astronomical calculations.

[中文文档](./README_zh.md)

## Features

- 🌌 **Star Map Visualization** - Integrated Stellarium Web Engine for real-time sky rendering
- 📅 **Observation Planning** - Tools for planning astronomy sessions and tracking targets
- 🔭 **Equipment Management** - Manage telescopes, cameras, and eyepieces
- 🖥️ **Desktop Native** - Built with Tauri 2.9 for high performance and system integration
- 🎨 **Modern UI** - Tailwind CSS v4 with Geist font and dark mode support
- 🧩 **shadcn/ui** - High-quality accessible components built on Radix UI
- 📦 **Zustand** - Lightweight and robust state management
- 🌍 **i18n Support** - Multi-language support (English/Chinese) via next-intl

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **State**: Zustand
- **Desktop**: Tauri 2.9 (Rust)
- **Astronomy**: Stellarium Web Engine, custom astronomical calculation libraries
- **i18n**: next-intl

## Prerequisites

Before you begin, ensure you have the following installed:

### For Web Development

- **Node.js** 20.x or later
- **pnpm** 9.x or later (recommended)

### For Desktop Development

- **Rust** 1.75 or later
- **System Dependencies**:
  - **Windows**: WebView2, Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: libwebkit2gtk-4.1, build-essential, curl, wget, etc.

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd skymap
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

## Development

### Web Development

```bash
pnpm dev
```

Starts the Next.js dev server at [http://localhost:3000](http://localhost:3000).

### Desktop Development

```bash
pnpm tauri dev
```

Launches the Tauri desktop app with hot-reloading for both Rust and Frontend.

## Building for Production

### Build Web Application (Static Export)

```bash
pnpm build
```

Outputs to the `out/` directory.

### Build Desktop Application

```bash
pnpm tauri build
```

Generates installers in `src-tauri/target/release/bundle/`.

## Project Structure

- `app/` - Next.js App Router (pages and layouts)
- `components/` - React components (UI and features)
- `lib/` - Core logic (astronomy calculations, stores, Tauri API)
- `src-tauri/` - Rust backend and Tauri configuration
- `public/` - Static assets including Stellarium engine
- `i18n/` - Internationalization configuration and messages

## Testing

- **Unit/Integration**: `pnpm test` (Jest)
- **E2E**: `pnpm exec playwright test`
- **Linting**: `pnpm lint` and `cargo clippy`

## License

MIT License
