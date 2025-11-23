# 🏛️ Prompt Temple - Temple of Wisdom Guide

## Overview

**Prompt Temple** is a professional wisdom library that transforms prompt management into a refined, temple-like experience. Built with a clean white aesthetic and professional design, it provides a sanctuary for your AI prompts with powerful enhancement capabilities.

## Features

### 🎯 Core Features

- **Wisdom Library** - Your personal collection of prompts displayed in a clean, professional grid
- **Side Panel Experience** - Always accessible wisdom temple alongside your AI chat interfaces
- **AI-Powered Enhancement** - Credit-based prompt optimization using GPT-4o and Claude 3.5
- **Professional Organization** - Categories, tags, collections, and advanced filtering
- **Offline Support** - Queue system with automatic retry for unreliable connections
- **Keyboard Shortcuts** - Quick access to all major functions
- **Clean White Theme** - Professional, distraction-free interface inspired by sacred spaces

### ✨ Enhancement System

Transform your prompts with AI-powered enhancement:

- **Multiple Models**: GPT-4o Mini, GPT-4o, Claude 3.5 Haiku, Claude 3.5 Sonnet
- **Enhancement Styles**:
  - **Balanced** - Optimal clarity and effectiveness
  - **Concise** - Direct and to the point
  - **Detailed** - Comprehensive with context
  - **Creative** - Imaginative and expressive
  - **Technical** - Precise and specific

- **Credit System**:
  - GPT-4o Mini: 0.10 credits
  - Claude 3.5 Haiku: 0.25 credits
  - GPT-4o: 0.50 credits
  - Claude 3.5 Sonnet: 0.75 credits

## Quick Start

### Opening the Temple

**Method 1: Keyboard Shortcut**
- Windows/Linux: `Ctrl + Shift + L`
- Mac: `Cmd + Shift + L`

**Method 2: Context Menu**
- Right-click on any AI chat website
- Select "Open Wisdom Temple 🏛️"

**Method 3: Extension Icon**
- Click the Prompt Temple icon in your browser toolbar
- Side panel opens automatically

### First Time Setup

1. **Open Settings Tab** - Click the ⚙️ Settings tab
2. **Connect Account** - Enter your API endpoint and connect
3. **Configure Preferences** - Set default model and enhancement style
4. **Purchase Credits** - (Optional) Buy credits for AI enhancement

## Using the Wisdom Library

### Creating Wisdom

**Method 1: Auto-Save from AI Chats**
- The extension automatically detects prompts on supported AI sites
- Click "Save to Temple" when prompted

**Method 2: Quick Create**
- Click the floating ✨ button (bottom-right)
- Or use `Ctrl/Cmd + Shift + N`
- Enter your prompt and metadata

**Method 3: From Content Scripts**
- Select text on any webpage
- Right-click → "Save as Wisdom"

### Browsing Your Wisdom

**Search & Filter**
- **Search Bar**: Search by keywords in prompts
- **Category Filter**: Filter by intent (Summary, Creative, Analysis, Code, etc.)
- **Source Filter**: Filter by origin (Extension, Web, API)
- **Date Range**: Filter by creation date
- **Tag Filter**: Filter by custom tags

**Advanced Filters** (click "Advanced ▼")
- Combine multiple filters
- Date range selection
- Tag-based filtering

### Wisdom Cards

Each wisdom card displays:
- **Title** - First 60 characters of the prompt
- **Date** - Relative time (e.g., "2h ago")
- **Preview** - First 100 characters
- **Badges** - Category, source, tags
- **Enhancement Status** - ✨ badge if enhanced
- **Actions** - Enhance, Copy, View, Delete

### Enhancing Wisdom

1. **Select Wisdom** - Click "✨ Enhance" on any unenhanced wisdom
2. **Choose Model** - Select AI model based on your needs
3. **Pick Style** - Choose enhancement style
4. **Confirm** - Review cost and click "Enhance Wisdom"
5. **Review Result** - Enhanced wisdom appears with original for comparison

**Keyboard Shortcut**: `Ctrl/Cmd + Shift + E` enhances the first unenhanced wisdom

### Managing Wisdom

**Copy**
- Click 📋 Copy to copy wisdom to clipboard
- Copies enhanced version if available, otherwise original

**View Details**
- Click 👁️ View or click anywhere on the card
- See full original and enhanced prompts
- View all metadata and enhancement stats

**Delete**
- Click 🗑️ Delete
- Confirms before soft-deleting (can be recovered from Archive)

## Views & Navigation

### 📚 Library View

Your main wisdom collection with full search and filtering capabilities.

**Features:**
- Grid layout with auto-sizing cards
- Pagination (20 wisdoms per page)
- Real-time search
- Multi-filter support
- Sorting by creation date (newest first)

### 🗂️ Collections View

Organize wisdom into themed collections.

**Coming Soon:**
- Create custom collections
- Drag-and-drop organization
- Share collections
- Collection templates

### 📜 Archive View

Browse your complete wisdom history in timeline format.

**Coming Soon:**
- Timeline visualization
- Restore deleted wisdoms
- Export wisdom bundles
- Historical analytics

### ⚙️ Settings View

Configure your Temple experience.

**Sections:**
- **Authentication** - API endpoint and account connection
- **Enhancement** - Default model and style preferences
- **Appearance** - Compact view, preview options
- **Credits & Billing** - Balance and purchase options

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + L` | Open Wisdom Temple |
| `Ctrl/Cmd + Shift + E` | Enhance first wisdom |
| `Ctrl/Cmd + Shift + N` | Create new wisdom |
| `Ctrl/Cmd + Shift + T` | Quick template |
| `Escape` | Close modals |

## Design Philosophy

### Clean White Theme

The Temple of Wisdom embraces a **minimalist, professional aesthetic**:

- **White Base** (#FFFFFF) - Clarity and simplicity
- **Subtle Shadows** - Gentle depth without clutter
- **Accent Colors** - Reserved for important actions
- **Typography** - Clean, readable Inter font family
- **Spacing** - Generous whitespace for breathing room
- **Animations** - Smooth, subtle transitions

### Color Palette

```css
/* Primary Colors */
--temple-white: #FFFFFF
--temple-snow: #FAFBFC
--temple-silver: #F5F7FA
--temple-cloud: #E8ECF0

/* Accent Colors */
--temple-azure: #3B82F6   /* Primary actions */
--temple-violet: #8B5CF6  /* Tags */
--temple-sage: #10B981    /* Success */
--temple-gold: #F6C445    /* Highlights */
--temple-rose: #EF4444    /* Danger */
```

### Gradients

- **Temple Gradient** - Purple to violet for enhanced content
- **Serenity Gradient** - Light purple to blue for enhanced wisdoms
- **Wisdom Gradient** - Pink to red for special highlights

## API Integration

### Authentication

The Temple connects to your Prompt History v2 API:

```javascript
// API Endpoint (set in Settings)
const API_URL = 'https://api.prompt-temple.com';

// JWT Authentication
Authorization: Bearer <your-jwt-token>
```

### Offline Queue

Requests are automatically queued when offline:

- **Auto-Retry** - 3 attempts with exponential backoff (2s, 4s, 8s)
- **Idempotency** - Prevents duplicate creates/enhancements
- **Background Sync** - Processes queue every minute

### Telemetry

Events tracked for analytics:

- `temple.initialized` - Temple opened
- `temple.view.changed` - Tab switched
- `wisdom.library.loaded` - Library refreshed
- `wisdom.enhance.start` - Enhancement requested
- `wisdom.enhance.success` - Enhancement completed
- `wisdom.enhance.error` - Enhancement failed
- `wisdom.created` - New wisdom saved
- `wisdom.deleted` - Wisdom removed

## Advanced Features

### Credits System

**How Credits Work:**
1. Purchase credits through Settings → Credits & Billing
2. Credits are debited when you enhance wisdom
3. Different models cost different amounts
4. Balance displayed in temple header
5. Insufficient credits shows upsell modal

**Credit Tiers** (Coming Soon):
- Starter: 100 credits - $10
- Professional: 500 credits - $40 (20% bonus)
- Enterprise: 2000 credits - $120 (40% bonus)

### Idempotency

All create and enhance operations use idempotency keys:

```http
X-Idempotency-Key: <uuid>
```

This prevents:
- Duplicate wisdom creation on retry
- Double-charging for same enhancement
- Race conditions in offline queue

### User-Bound Security

All wisdom is automatically bound to your user account:

- Can only see your own wisdoms
- Filters applied server-side
- No user ID in requests (uses JWT)
- Owner-only permissions enforced

## Browser Support

- ✅ Chrome 88+ (Recommended)
- ✅ Edge 88+
- ✅ Brave 1.20+
- ⚠️ Firefox (Limited - Side Panel API experimental)
- ❌ Safari (Not supported - Missing Side Panel API)

## Troubleshooting

### Side Panel Not Opening

**Issue**: Keyboard shortcut or context menu doesn't open panel

**Solutions**:
1. Ensure you're on a supported AI chat website
2. Check browser version (Chrome 114+ for side panel)
3. Reload the extension
4. Check for JavaScript errors in console

### Authentication Failed

**Issue**: "Please connect your account" message

**Solutions**:
1. Go to Settings → Authentication
2. Enter correct API endpoint
3. Click "Connect Account"
4. Verify JWT token is saved

### Enhancement Not Working

**Issue**: Enhancement button doesn't work or shows error

**Solutions**:
1. Check credit balance
2. Verify API connection
3. Try different model
4. Check network connection
5. Review API logs for errors

### Offline Queue Stuck

**Issue**: Wisdoms not syncing when back online

**Solutions**:
1. Open DevTools → Application → Storage
2. Check `history_offline_queue`
3. Clear failed requests
4. Retry manually

## Development

### File Structure

```
prompt_extension/
├── manifest.json              # Extension manifest with side panel
├── sidepanel.html            # Temple of Wisdom UI
├── temple-styles.css         # Clean white professional theme
├── temple-app.js             # Main application logic
├── background.js             # Background service worker
├── backend/                  # Django API
│   └── api/v2/history/      # Prompt History v2 API
└── frontend/                 # TypeScript/React components
    ├── lib/api/
    │   └── history.ts       # Type-safe API client
    ├── utils/
    │   ├── tokenStorage.ts  # JWT storage
    │   └── offlineQueue.ts  # Offline queue
    └── components/
        ├── HistoryList.tsx
        ├── HistoryRow.tsx
        └── EnhanceModal.tsx
```

### Building from Source

```bash
# Clone repository
git clone https://github.com/YourUsername/prompt_extension.git
cd prompt_extension

# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

### Testing

```bash
# Run tests
npm test

# Test API integration
npm run test:api

# Test UI components
npm run test:ui
```

## Contributing

We welcome contributions! Areas for improvement:

- **Collections System** - Full implementation
- **Archive Timeline** - Visual timeline view
- **Export/Import** - Wisdom backup/restore
- **Collaboration** - Share wisdoms with team
- **Analytics** - Usage insights dashboard
- **Mobile** - Responsive design improvements

## Support

- **Documentation**: This guide
- **API Reference**: `HISTORY_API_README.md`
- **Issues**: GitHub Issues
- **Email**: support@prompt-temple.com

## Changelog

### Version 2.0.0 (Current)

- ✨ Complete redesign as "Temple of Wisdom"
- 🏛️ Side panel implementation
- 🎨 Clean white professional theme
- ✨ AI-powered enhancement with multiple models
- 💳 Credit-based monetization system
- 🔍 Advanced search and filtering
- ⌨️ Comprehensive keyboard shortcuts
- 📱 Offline queue with auto-retry
- 🔐 JWT authentication and user-bound data
- 📊 Telemetry and analytics

### Version 1.0.0

- 📚 Basic prompt library
- ✏️ Manual prompt enhancement
- 🏷️ Simple tagging system

## License

MIT License - See LICENSE file for details

---

**Built with wisdom. Enhanced with AI. Crafted for professionals.**

🏛️ Welcome to your Temple of Wisdom.
