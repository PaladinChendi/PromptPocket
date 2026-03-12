# Prompt Pocket

A Chrome/Edge browser extension for managing and quickly inserting prompt templates into AI chat platforms.


## Features

### Core Features
- **Prompt Template Management**: Create, edit, delete, and organize prompt templates
- **Categories & Tags**: Organize prompts with categories and tags
- **Multi-Platform Support**: Works with ChatGPT, Gemini, Doubao, and more
- **Floating UI**: Injects a floating button on AI chat pages for quick access
- **Auto-fill**: One-click insertion of prompts into AI chat interfaces
- **Auto-submit**: Optional automatic submission after insertion
- **Variables**: Support for variable placeholders (e.g., `{{topic}}`)
- **Keyboard Shortcuts**: Quick access with Ctrl+Shift+P and Ctrl+Shift+U

### Data Management
- **Local Storage**: All data stored locally using `chrome.storage.local`
- **Import/Export**: Backup and restore prompts via JSON files
- **Categories**: Color-coded categorization system
- **Usage Tracking**: Tracks how often each prompt is used

### UI Features
- **Drag & Drop**: Reposition the floating button anywhere on screen
- **Responsive Design**: Works on both desktop and mobile Chrome
- **Dark Mode Support**: Follows system theme preferences
- **Search & Filter**: Quickly find prompts by title, tags, or category

## Installation

### Development Build
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load unpacked extension in Chrome/Edge:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Production Build
```bash
npm run package
# Creates prompt-pocket.zip in project root
```

## Architecture

### Project Structure
```
src/
├── background/          # Service worker (Manifest V3)
├── content/            # Content scripts for AI chat pages
├── popup/              # React-based popup UI
├── storage/            # Storage abstraction layer
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Components

1. **Background Service Worker** (`background.ts`):
   - Manages extension lifecycle
   - Handles message passing between components
   - Coordinates storage operations

2. **Content Script** (`contentScript.ts`):
   - Injected into AI chat pages
   - Detects platform interface elements
   - Manages platform detector factory
   - Injects floating UI components
   - Handles prompt insertion

3. **Storage Manager** (`storage.ts`):
   - Type-safe abstraction over `chrome.storage.local`
   - Data migration support
   - Change listeners for real-time updates

4. **Platform_detector Factory** (`detectorFactory.ts`):
   - Manages multiple platform detectors
   - Selects appropriate detector based on current URL
   - Handles platform switching

5. **Platform Detectors** (`chatGPTDetector.ts`, `geminiDetector.ts`, `doubaoDetector.ts`):
   - Resilient DOM detection using multiple strategies
   - MutationObserver for UI changes
   - Version-agnostic detection per platform

6. **UI Injector** (`uiInjector.ts`):
   - Manages floating button and panel injection
   - Drag & drop functionality
   - Keyboard shortcut handling

## Platform Detection Strategy

### Multi-layered Detection
The extension uses a resilient, multi-layered approach to detect AI chat interfaces:

1. **Primary Detection**: Data-testid attributes (most stable)
2. **Secondary Detection**: ID-based selectors
3. **Tertiary Detection**: Placeholder text matching
4. **Fallback Detection**: Generic textarea/contenteditable detection

### Resilience Features
- **Factory Pattern**: Manages multiple platform detectors dynamically
- **MutationObserver**: Watches for DOM changes and adapts
- **Version Detection**: Identifies different UI versions per platform
- **State Monitoring**: Detects when AI is "processing" or ready to submit
- **Backup Interval**: 2-second polling as fallback detection

### Supported Platforms

#### ChatGPT
- `https://chat.openai.com/*`
- `https://chatgpt.com/*`

#### Gemini (Google)
- `https://gemini.google.com/*`
- `https://bard.google.com/*`

#### Doubao (ByteDance)
- `https://doubao.com/*`
- `https://www.doubao.com/*`
- `https://bot.doubao.com/*`

#### More Coming Soon
Additional AI platforms will be supported in future releases.

## Permissions

### Required Permissions
- `storage`: For local data storage
- `activeTab`: For content script injection
- Host permissions for AI chat platform domains

### Security Model
- **No remote code execution**
- **No external API calls**
- **All data stored locally**
- **Principle of least privilege**

## Development

### Available Scripts
```bash
npm run build        # Build production bundle
npm run dev          # Development mode with watch
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run package      # Create ZIP for distribution
```

### Building
The extension uses:
- **TypeScript** for type safety
- **React** for popup UI
- **Webpack** for bundling
- **ESLint** for code quality

### Type System
- Full TypeScript support with strict mode
- Type-safe message passing between components
- Comprehensive interface definitions for all data structures

## Usage

### Basic Workflow
1. Click extension icon to open popup
2. Create prompt templates with variables (e.g., `{{topic}}`)
3. Visit an AI chat platform and click the floating button
4. Select a prompt to insert (with variable values if needed)
5. Optional: Enable auto-submit for instant execution

### Keyboard Shortcuts
- **Ctrl+Shift+P**: Open prompt panel on AI chat pages
- **Ctrl+Shift+U**: Toggle floating UI visibility
- **Ctrl+Shift+L**: Quick insert last used prompt

### Variables
Use `{{variable_name}}` in prompt content to create variables. When inserting:
1. Variables are automatically detected
2. User can provide values for each variable
3. Variables are replaced in the prompt content

## Extensibility

### Future Features
1. **Template Library**: Community-shared prompt templates
2. **Sync Support**: Cross-device synchronization
3. **AI Suggestions**: Smart prompt recommendations
4. **Formatting Tools**: Rich text formatting in prompts
5. **More Platforms**: Additional AI chat interfaces

### Plugin Architecture
The modular design allows for:
- Adding new prompt variable types
- Supporting additional AI chat interfaces
- Custom UI themes and layouts
- Integration with other productivity tools

## Security & Privacy

### Data Storage
- All data stored locally in browser storage
- No data sent to external servers
- Optional export/import for backups
- Clear data option available

### Permissions
- Minimal required permissions
- No access to user browsing history
- No access to ChatGPT account data
- No tracking or analytics

### Chrome Web Store Compliance
- Manifest V3 compliant
- No remote code execution
- Clear privacy policy
- Regular security updates

## Troubleshooting

### Common Issues
1. **Floating button not appearing**:
   - Ensure you're on a supported AI chat platform
   - Check extension is enabled
   - Try refreshing the page

2. **Prompt not inserting**:
   - Check AI chat interface is fully loaded
   - Verify input field is present
   - Try manually focusing the input field first

3. **Data not saving**:
   - Check browser storage permissions
   - Try exporting data as backup
   - Clear extension data and reconfigure

### Debugging
1. Open Chrome DevTools on an AI chat page
2. Check Console for extension logs
3. Look for elements with IDs starting with `prompt-pocket-`

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Style
- TypeScript with strict mode
- ESLint for code quality
- Prettier for formatting
- Comprehensive comments

### Testing
- Unit tests for core logic
- Integration tests for UI components
- Manual testing on AI chat interfaces

## License

MIT License - See LICENSE file for details

## Support

- GitHub Issues for bug reports
- Feature requests via Issues
- Documentation updates welcome

---

**Note**: This extension is not affiliated with or endorsed by OpenAI, Google, ByteDance, or any AI service providers.