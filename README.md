# PromptSocial (Prompty) 🚀

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![LibSQL / SQLite](https://img.shields.io/badge/LibSQL_/_SQLite-Database-003b57?style=flat-square&logo=sqlite)](https://github.com/tursodatabase/libsql)
[![JSON Web Tokens](https://img.shields.io/badge/JWT-Authentication-black?style=flat-square&logo=json-web-tokens)](https://jwt.io/)

**PromptSocial (Prompty)** is a modern, high-performance social catalog and collaboration platform for Prompt Engineers. It is designed to share, evaluate, version, and discuss system instructions and prompts. 

Built with Next.js 14 App Router, TypeScript, and a lightweight local LibSQL/SQLite architecture, this project represents an optimized, production-ready solution featuring advanced client-side behaviors like context-aware automated translations, client-side canvas image processors, and multi-version commentary trees.

---

## 🌟 Key Technical Accomplishments

*   **⚡ Context-Aware Auto-Translation (RU ↔ EN)**: Implemented an intelligent translation system utilizing the *MyMemory Translation API*. Instead of plain text conversion, the engine extracts a 450-character semantic slice of the system prompt and packages it as an isolated context window using custom structural delimiters (`|||`) to achieve natural translations of short titles based on actual intent.
*   **🌐 Lightweight Native Localization**: Designed a zero-dependency React Context Internationalization engine (`i18n.tsx`) with automated system language detection. It checks the user's browser language on first-time visits (mapping CIS locales correctly) and supports instant, persistent storage of manual overrides.
*   **🛠️ Incremental Prompt Versioning**: Includes a robust version ledger. Authors can update their prompts, automatically incrementing version identifiers (`v1`, `v2`, etc.), with the ability to roll back the prompt content to any past state from the history panel.
*   **💬 Targeted Multi-Version Discussions**: Comments and discussions are bound to specific prompt versions. This ensures that historical suggestions remain associated with the precise prompt text they were written for.
*   **👤 Comprehensive Profiles & Role Selection**: Users can choose specialized professional roles (such as Prompt Engineer, Full-Stack Developer, Copywriter, or Data Scientist) and upload profile avatars that are cropped and compressed into high-performance JPEG Base64 vectors directly inside an HTML5 Canvas on the client's device.
*   **👁️ Interactive Public Profiles**: Users can click on any author's name or avatar to open their public card, inspect their biography, and review a dynamically filtered list of all their active prompts on the platform.
*   **📱 Responsive & Fluid Glassmorphic UI**: Tailored with Tailwind CSS for high-end aesthetic satisfaction. Features responsive drawer menus, fluid transitions, safe-area mobile layouts, and a convenient contextual bottom navigation tab-bar.

---

## 📂 Project Structure

This directory structure highlights the modular organization of the client, backend, and utility modules of the codebase (excluding build directories):

```
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── agents           # Core API endpoints (creation, likes, versions, comments)
│   │   │   └── auth             # Authentication endpoints (login, logout, session, profile)
│   │   ├── globals.css          # Selection themes and glassmorphic designs
│   │   ├── layout.tsx           # Layout wrapper binding global Language Providers
│   │   └── page.tsx             # Interactive dashboard and feeds coordinator
│   ├── components
│   │   ├── AgentCard.tsx        # Compact display with copy, edit, delete, and translation utilities
│   │   ├── AuthModal.tsx        # Secure authentication overlay (Sign In / Register)
│   │   ├── DetailModal.tsx      # Prompt explorer (Instructions, Version History, Comments)
│   │   ├── PostModal.tsx        # Structured post creation flow with automated context translation
│   │   ├── ProfileModal.tsx     # Localized profile editor and HTML5 Canvas image compressor
│   │   ├── PublicProfileModal.tsx # Author card rendering active biography and portfolio
│   │   └── Sidebar.tsx          # Dual-column desktop navigation with role parser
│   └── lib
│       ├── auth.ts              # Secure JWT token emission and validation
│       ├── db.ts                # Database connector (SQLite/LibSQL instance)
│       ├── i18n.tsx             # Customized Internationalization Engine (RU/EN context)
│       └── utils.ts             # Date formatters and gradient generation utilities
├── next.config.mjs              # Framework config featuring customized hot-reloader options
├── tailwind.config.ts           # CSS framework configuration
└── tsconfig.json                # Strict TypeScript configuration
```

---

## 🛠️ Installation & Local Setup

### Prerequisites
*   Node.js (v18.x or higher)
*   npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/runas555/Prompty.git
cd Prompty
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the root directory:
```env
JWT_SECRET=your_jwt_secret_phrase
# SQLite / LibSQL local path configuration
DATABASE_URL=file:local.db
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to inspect the application.

---

## 🚀 Key Technologies & Libraries Used

*   **Next.js 14**: Leveraging Server-side rendering (SSR), optimized Client components (`use client`), API routes, and standard App Router file layouts.
*   **LibSQL / SQLite**: Lightweight, exceptionally fast serverless database layer perfect for low-latency configurations.
*   **Lucide React**: Clean, sharp SVG-icon pack designed for interactive indicators.
*   **Bcrypt.js & JWT**: Cryptographic hashing of passwords and JSON Web Token issuance for session state persistence.
*   **Canvas API**: Used for zero-dependency client-side image cropping and resizing to minimize database payload storage size.
