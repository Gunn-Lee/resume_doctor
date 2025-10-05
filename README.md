# Resume Doctor

A fully client-side resume analysis tool powered by Google's Gemini AI. Upload your resume, configure the analysis parameters, and get intelligent feedback—all without sending your data to any server.

## � Live Demo

**Production**: [https://resume-doctor-liard.vercel.app/](https://resume-doctor-liard.vercel.app/)

## �🌟 Features

- **Client-Only Architecture**: Your resume and API key never leave your browser
- **Multiple Input Methods**: Upload PDF/DOCX/MD files or paste text directly
- **Flexible Analysis**: Choose between compact or full analysis modes
- **Domain-Specific**: Tailor analysis for universal, technical, or non-technical roles
- **Secure API Key Storage**: Optional localStorage with explicit user consent
- **Modern UI**: Built with React 19, Tailwind CSS, and Lucide icons
- **Type-Safe**: Full TypeScript implementation with Zod validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- A Gemini API key ([Get one here](https://ai.google.dev/gemini-api/docs/api-key))
- A reCAPTCHA v3 site key ([Get one here](https://www.google.com/recaptcha/admin)) - **localhost is supported!**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Gunn-Lee/resume_doctor.git
   cd resume_doctor
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables** _(Optional but recommended)_

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your reCAPTCHA site key:

   ```bash
   VITE_RECAPTCHA_SITE_KEY=your_site_key_here
   ```

   > 📝 **Note**: When setting up reCAPTCHA, add `localhost` to your domains list.  
   > See [docs/RECAPTCHA_SETUP.md](./docs/RECAPTCHA_SETUP.md) for detailed instructions.

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage

1. **Upload Your Resume**

   - Drag and drop a file (PDF, DOCX, MD, TXT)
   - Or paste your resume text directly
   - Maximum file size: 1MB

2. **Configure Analysis**

   - Select analysis depth (Compact or Full)
   - Choose domain (Universal, Technical, or Non-Technical)
   - Enter target role and company
   - Optionally add geographic focus, special focus areas, and notes

3. **Enter API Key**

   - Paste your Gemini API key
   - Optionally choose to remember it in localStorage
   - Your key is never sent to our servers

4. **Analyze**
   - Click "Analyze Resume"
   - Wait for streaming results
   - Copy, download, or view in a new tab

## 🏗️ Project Structure

```
resume_doctor/
├── docs/                      # Documentation
│   ├── Dev Document.md        # Development guidelines
│   ├── Implementation Plan - Base Layer.md
│   └── prompts/               # Prompt templates
├── src/
│   ├── app/                   # Layout and routing
│   │   ├── AppShell.tsx       # Main layout with header/footer
│   │   └── Router.tsx         # React Router setup
│   ├── components/            # Reusable components
│   │   ├── ResumeDropzone.tsx # File upload & text input
│   │   ├── ParsedPreview.tsx  # Resume metadata display
│   │   ├── PromptConfigForm.tsx # Analysis configuration
│   │   ├── SubmitBar.tsx      # API key input & submit
│   │   └── ResultPane.tsx     # Results display
│   ├── lib/                   # Core business logic
│   │   ├── gemini.ts          # Gemini API integration [STUB]
│   │   ├── prompts.ts         # Prompt templates [STUB]
│   │   ├── buildPrompt.ts     # Prompt assembly [STUB]
│   │   └── utils.ts           # Utility functions
│   ├── pages/                 # Page components
│   │   └── Main.tsx           # Main application page
│   ├── store/                 # State management (Zustand)
│   │   ├── useSession.ts      # API key & preferences
│   │   └── useAppState.ts     # Resume data & analysis state
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── validation.ts      # Zod schemas
│   │   ├── storage.ts         # localStorage helpers
│   │   └── cooldown.ts        # Cooldown timer [STUB]
│   ├── workers/               # Web Workers
│   │   └── parser.worker.ts   # File parsing [STUB]
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔧 Technology Stack

- **Framework**: React 19
- **Build Tool**: Vite 5.4
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 4.5
- **Form Handling**: React Hook Form 7.52 + Zod 3.23
- **Icons**: Lucide React
- **Routing**: React Router DOM 6.26

## 🎯 Current Status: Base Layer (v0.1.0)

This is the **base layer implementation**. The following features are **working**:

✅ Full UI structure and layout  
✅ File upload interface (validation only)  
✅ Form validation with Zod  
✅ State management with Zustand  
✅ Responsive design  
✅ Type-safe TypeScript implementation

The following features are **stub implementations** (planned for future phases):

🚧 PDF/DOCX/MD file parsing  
🚧 Gemini API integration  
🚧 Prompt template hydration  
🚧 Streaming response handling  
🚧 Cooldown timer enforcement  
🚧 Google Identity Services authentication

## 🔜 Roadmap

### Phase A: File Parsing

- Integrate `pdfjs-dist` for PDF parsing
- Integrate `mammoth` for DOCX parsing
- Integrate `unified` + `remark-parse` for Markdown
- Implement Web Worker for background parsing

### Phase B: Prompt System

- Load prompt templates from JSON
- Implement prompt hydration with user data
- Add template versioning

### Phase C: Gemini Integration

- Integrate `@google/generative-ai` SDK
- Implement streaming response handler
- Add error handling and retry logic

### Phase D: Authentication (Optional)

- Integrate Google Identity Services
- Add user profile management
- Implement logout flow

### Phase E: Polish & Edge Cases

- Implement cooldown timer
- Add file size/word count validation
- Add autosave functionality
- Improve accessibility
- Add loading states and animations

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
VITE_APP_NAME=Resume Doctor
VITE_APP_VERSION=0.1.0
VITE_ENABLE_ANALYTICS=false
```

### Code Style

- Use TypeScript strict mode
- Follow React best practices (functional components, hooks)
- Use Tailwind for styling (avoid custom CSS)
- Validate all inputs with Zod
- Add proper TypeScript types for all props and state
- Handle errors gracefully

## 🔒 Security & Privacy

- **Client-Only**: All processing happens in your browser
- **No Server**: Your resume is never uploaded to our servers
- **API Key**: Stored only in your browser (optionally in localStorage)
- **No Logging**: API keys are never logged or transmitted except directly to Gemini

## 🤝 Contributing

This is currently a personal project. Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Powered by [Google Gemini AI](https://ai.google.dev)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)

## 📧 Contact

Gun Lee - [@Gunn-Lee](https://github.com/Gunn-Lee)

**Project Links**:

- Live App: [https://resume-doctor-liard.vercel.app/](https://resume-doctor-liard.vercel.app/)
- GitHub: [https://github.com/Gunn-Lee/resume_doctor](https://github.com/Gunn-Lee/resume_doctor)
- Documentation: [docs/README.md](./docs/README.md)

---

**Status**: v0.1.0 - Production Ready ✅  
**Deployment**: Live on Vercel  
**Last Updated**: October 5, 2025
