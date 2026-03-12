# Prompt Pocket - Project Structure

```
prompt-pocket/
├── manifest.json                # Manifest V3 configuration
├── package.json                 # TypeScript dependencies
├── tsconfig.json               # TypeScript configuration
├── webpack.config.js           # Build configuration
├── README.md                   # Project documentation
│
├── src/
│   ├── types/
│   │   ├── index.ts           # TypeScript type definitions
│   │   ├── storage.ts         # Storage-related interfaces
│   │   └── messages.ts        # Message type definitions
│   │
│   ├── background/
│   │   └── background.ts      # Service worker
│   │
│   ├── content/
│   │   ├── contentScript.ts   # Main content script
│   │   ├── domObserver.ts     # DOM mutation observer
│   │   ├── uiInjector.ts      # Floating UI injection logic
│   │   └── chatgptDetector.ts # ChatGPT-specific detection
│   │
│   ├── popup/
│   │   ├── popup.tsx          # React popup component
│   │   ├── components/
│   │   │   ├── PromptList.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   ├── CategoryManager.tsx
│   │   │   └── Settings.tsx
│   │   └── styles/
│   │       └── popup.css
│   │
│   ├── storage/
│   │   ├── storage.ts         # Storage abstraction
│   │   ├── migrations.ts      # Data migration logic
│   │   └── schemas.ts         # Data validation schemas
│   │
│   └── utils/
│       ├── constants.ts       # Application constants
│       ├── messages.ts        # Message utilities
│       ├── dom.ts            # DOM manipulation helpers
│       └── validation.ts     # Input validation
│
├── static/
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── popup.html            # Popup HTML file
│   └── styles/
│       └── global.css        # Global styles
│
├── dist/                     # Build output directory
│
└── tests/
    ├── unit/
    └── integration/
```

## Key Files Description:

### Core Files:
- `manifest.json`: Manifest V3 configuration with minimal required permissions
- `src/background/background.ts`: Service worker handling extension lifecycle
- `src/content/contentScript.ts`: Content script injected into ChatGPT pages
- `src/popup/popup.tsx`: React-based popup UI for prompt management
- `src/storage/storage.ts`: Abstraction over chrome.storage.local with type safety

### Supporting Modules:
- `src/types/`: TypeScript interfaces for type safety
- `src/utils/`: Utility functions shared across modules
- `src/content/domObserver.ts`: MutationObserver for resilient DOM detection
- `src/content/uiInjector.ts`: Floating UI injection and management

### Static Assets:
- `static/popup.html`: HTML entry point for popup
- `static/icons/`: Extension icons for different sizes
- `static/styles/global.css`: Global CSS styles

### Build Configuration:
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript compiler settings
- `webpack.config.js`: Bundling configuration