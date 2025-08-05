# 🐦 Who Unfollowed Me

A simple browser extension to see who unfollowed you on Twitter/X. Just a fun little project to satisfy your curiosity! 😄

## 🚀 Quick Setup

1. Clone this repo
   ```bash
   git clone https://github.com/kanakk365/whoUnfollowedME.git
   cd whoUnfollowedME
   ```

2. Install & build
   ```bash
   npm install
   npm run build
   ```

3. Load in Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` folder

## ⚠️ Heads up!

This extension scrapes Twitter data, which might not be cool with Twitter's rules. Use it responsibly and don't go crazy with it. Your account could get in trouble if Twitter notices weird behavior.

**Keep it chill:**
- Don't use it too often
- Works better with smaller follower counts
- It's more of a fun experiment than a serious tool

## ✨ What it does

- Shows you who unfollowed you on Twitter/X
- Compares your followers vs following lists
- Stores everything locally (no data sent anywhere)
- Simple popup interface

## 🛠 How to use

1. Install the extension (steps above)
2. Go to Twitter/X
3. Click the extension icon
4. Click "Sync Data" and wait a bit
5. See who doesn't follow you back!

## 🤔 How it works

The extension watches Twitter's network requests as you browse and captures follower data. It then compares your followers and following lists to find the difference. Pretty simple!

## � Tech stuff

Built with React, TypeScript, and Vite. It's a Chrome extension using Manifest V3.

## 🤝 Want to contribute?

Cool! Just fork the repo, make your changes, and send a PR. Keep it simple and fun!

## � License

MIT License - do whatever you want with it!

---

Made by [@kanakk365](https://github.com/kanakk365) just for fun 🎉 