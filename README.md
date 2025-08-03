# 🐦 Who Unfollowed Me - Chrome Extension

A Chrome Extension that tracks who unfollowed you on X (formerly Twitter) by monitoring your followers and following lists.

## ⚠️ **IMPORTANT SAFETY WARNING**

**This extension may violate Twitter's Terms of Service and could potentially lead to account restrictions or bans. Use at your own risk.**

### 🚨 **Potential Risks:**
- **Account Suspension**: Twitter may detect automated behavior and suspend your account
- **Rate Limiting**: Making too many requests can trigger temporary or permanent restrictions
- **Terms of Service Violation**: Scraping data, even your own, may violate Twitter's ToS
- **IP Blocking**: Your IP address could be blocked from accessing Twitter

### 🛡️ **Safety Features Built-In:**
- **Daily Request Limits**: Maximum 100 requests per day
- **Human-like Behavior**: Random delays and scroll patterns
- **Conservative Auto-scroll**: Limited to 15 scrolls with 4-12 second delays
- **Safe Mode**: Reduced polling frequency and shorter collection times
- **Manual Override**: Users can control when data collection starts

### 📋 **Safe Usage Guidelines:**
1. **Use Sparingly**: Don't run the extension multiple times per day
2. **Manual Browsing**: Visit your followers/following pages manually first
3. **Small Accounts**: Safer for accounts with fewer followers (< 1000)
4. **Avoid Peak Hours**: Don't use during Twitter's busiest times
5. **Monitor Activity**: Watch for any unusual account behavior
6. **Educational Use**: This is primarily for learning purposes

---

## 🚀 Features

- **Real-time Data Collection**: Automatically collects follower/following data while you browse Twitter
- **Unfollower Detection**: Identifies users you follow who don't follow you back
- **Beautiful UI**: Modern, responsive popup interface
- **Data Persistence**: Stores data locally using Chrome's storage API
- **Auto-scroll**: Automatically scrolls through lists to collect complete data
- **Safety Mode**: Built-in protections to minimize detection risk

## 🛠 Tech Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Extension Format**: Manifest v3
- **Styling**: CSS with modern design

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Chrome browser

### Setup

1. **Clone or download this project**
   ```bash
   git clone <repository-url>
   cd who-unfollowed-me
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist/` folder from this project

## 🎯 How It Works

### Core Concept: Monkey-Patching

The extension uses a technique called "monkey-patching" to intercept Twitter's API calls:

1. **Content Script Injection**: The extension injects a content script into Twitter pages
2. **Fetch Interception**: It patches the `window.fetch` function to capture API responses
3. **Data Extraction**: When Twitter loads follower/following data, the extension captures it
4. **Comparison**: It compares the two lists to find unfollowers
5. **Storage**: Data is stored locally using Chrome's storage API

### Data Flow

```
Twitter Page → Content Script → Background Script → Popup UI
     ↓              ↓              ↓              ↓
API Calls → Fetch Interception → Data Processing → Display Results
```

## 🎨 Usage

### Basic Usage

1. **Install the extension** (see installation steps above)
2. **Navigate to Twitter**: Go to `https://twitter.com` or `https://x.com`
3. **Open the popup**: Click the extension icon in your Chrome toolbar
4. **Read safety warnings**: Review the safety notice before proceeding
5. **Sync data**: Click "Sync Data (Safe Mode)" to start collecting follower/following information
6. **View results**: The popup will show your unfollowers

### Advanced Usage

- **Manual Collection**: Visit your followers/following pages and scroll to collect data
- **Auto-scroll**: The extension can automatically scroll through lists to collect complete data
- **Data Persistence**: Your data is stored locally and persists between browser sessions

## 🔧 Development

### Project Structure

```
who-unfollowed-me/
├── public/
│   ├── manifest.json          # Extension manifest
│   └── icon*.png             # Extension icons
├── src/
│   ├── content.ts            # Content script (injected into Twitter)
│   ├── background.ts         # Background service worker
│   ├── main.tsx             # React entry point
│   ├── popup/
│   │   └── Popup.tsx        # Main popup component
│   ├── utils/
│   │   └── compare.ts       # Data comparison utilities
│   └── index.css            # Global styles
├── index.html               # Popup HTML
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies and scripts
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview build
npm run preview
```

### Key Files Explained

- **`src/content.ts`**: Content script that runs on Twitter pages and intercepts API calls
- **`src/background.ts`**: Background service worker that handles communication
- **`src/popup/Popup.tsx`**: Main UI component for the extension popup
- **`src/utils/compare.ts`**: Utilities for comparing follower/following lists
- **`public/manifest.json`**: Extension configuration and permissions

## 🔒 Privacy & Security

- **Local Storage**: All data is stored locally in your browser
- **No External Servers**: The extension doesn't send data to any external servers
- **Twitter API Only**: Only intercepts Twitter's own API calls
- **User Control**: You can clear data anytime through Chrome's extension settings

## 🚨 Limitations & Risks

- **Twitter Rate Limits**: Twitter may limit API calls if you scroll too quickly
- **Incomplete Data**: Very large follower/following lists may not be fully captured
- **Twitter Changes**: Twitter's API structure may change, requiring updates
- **Browser Only**: Only works in Chrome and Chromium-based browsers
- **Account Risk**: Using this extension may violate Twitter's Terms of Service

## 🛠 Troubleshooting

### Common Issues

1. **Extension not working on Twitter**
   - Make sure you're on `twitter.com` or `x.com`
   - Check that the extension is enabled
   - Try refreshing the page

2. **No data collected**
   - Visit your followers/following pages
   - Scroll down to load more data
   - Click "Sync Data" in the popup

3. **Build errors**
   - Make sure all dependencies are installed: `npm install`
   - Check TypeScript configuration
   - Verify Vite configuration

### Debug Mode

To enable debug logging:

1. Open Chrome DevTools
2. Go to the Console tab
3. Look for messages from "Who Unfollowed Me"

## 🔮 Future Improvements

- [ ] **Real-time Notifications**: Alert when someone unfollows you
- [ ] **Export Data**: Export unfollowers list as CSV
- [ ] **Analytics**: Track follower changes over time
- [ ] **Better UI**: More detailed user profiles and actions
- [ ] **Performance**: Optimize for large follower lists
- [ ] **Mobile Support**: Create a mobile companion app
- [ ] **Enhanced Safety**: Additional anti-detection measures

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

**This extension is for educational purposes only. Please respect Twitter's Terms of Service and use responsibly. The developers are not responsible for any misuse of this tool or any consequences that may arise from its use.**

**By using this extension, you acknowledge that:**
- You understand the risks involved
- You use it at your own risk
- You may violate Twitter's Terms of Service
- Your account could potentially be restricted or banned
- The developers are not liable for any damages

---

**Note**: This extension works by intercepting Twitter's API calls. Twitter may change their API structure at any time, which could break the extension's functionality. Additionally, Twitter actively monitors for automated behavior and may take action against accounts that appear to be using bots or automation tools. 