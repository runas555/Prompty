# PromptSocial 🚀
> Interactive catalog & community for AI Prompt Engineers to discover, version-control, discuss, and translate system prompts.

PromptSocial is a modern, full-stack web application designed for prompt developers to share, rate, version, and collaborate on system instructions. It features secure JWT authorization, database state tracking, automated bilingual translations (RU <-> EN) using prompt content as semantic context, client-side canvas photo compression, and gorgeous public creator profiles.

---

## 🌟 Key Features

- 🧑‍💻 **Interactive Prompt Catalog**: Explore and filter prompts by categories, target AI models (GPT-4, Claude, Gemini, LLaMA, etc.), or real-time search (by name, prompt text, authors, or hashtags).
- 🕒 **Strict Version Control**: Tracks revisions of prompts. View full revision history, copy older versions, and allow owners to instantly restore any previous version.
- 💬 **Bilingual Comment Discussions**: Connect with other engineers. Leave comments linked to a specific version of a prompt to maintain contextual feedback.
- 🌐 **Auto-Translation & Localization**: 
  - Live, context-aware RU <-> EN translation for prompt titles (utilizing prompt content as semantic translation context to prevent awkward industrial-dictionary bias).
  - Detection of user system language on first load (defaulting to English for international locales and Russian for Cyrillic-based devices).
- 👤 **Creator Public Profiles**: Click on any author to view their avatar, role, biography, and a beautiful list of all their active publications in the catalog.
- ⚙️ **User Account Customization**: Set up your professional role (Prompt Engineer, Developer, Copywriter, Designer, Marketer, or Data Scientist), upload your photo (automatically compressed on the client-side via HTML5 Canvas), and write a bio.
- 📱 **Responsive Mobile-First UI**: Looks gorgeous on all screen sizes, featuring a native-app-like bottom navigation bar on mobile devices.
- 🔒 **Secure Authorization**: Powered by JWT token authentication with bcrypt password hashing.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI & Components**: React 18, Tailwind CSS, Lucide React Icons
- **Database**: LibSQL / SQLite (Turso compatible)
- **Authentication**: JWT Cookies, bcryptjs
- **Language**: TypeScript, JavaScript (CommonJS for setup scripts)
- **Localization**: Native React Context Client-side i18n
- **Translation Service**: MyMemory API (No key required, highly generous translation limits)

---

## 📦 Directory Structure

```text
├── src
│   ├── app
│   │   ├── api          # Next.js API Routes (auth, agents, versioning, likes, comments)
│   │   ├── layout.tsx   # Global Layout with Localization Context
│   │   └── page.tsx     # Home Page Layout and State Controllers
│   ├── components       # Reusable UI Elements (Modals, Headers, Sidebar, Cards)
│   ├── lib              # Utility files (i18n helpers, JWT auth, database config)
│   └── globals.css      # Core Styles and Tailwind Imports
├── public               # Static Assets
├── package.json         # Dependency configuration
└── README.md            # You are here!
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/runas555/Prompty.git
   cd prompty
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Copy the sample environment file and configure your database and JWT secret keys.
   ```bash
   cp .env.example .env
   ```
   *Note: Enter your local SQLite/LibSQL database credentials or Turso connection tokens in `.env`.*

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the application live.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to open a Pull Request or report an issue. To contribute:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
