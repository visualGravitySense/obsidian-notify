# obsidian-notify

📢 A simple plugin to display custom toast-style notifications inside [Obsidian](https://obsidian.md).

## ✨ Features

- Show customizable in-app notifications
- Supports use with [Templater](https://github.com/SilentVoid13/Templater), custom JS scripts, and other plugins
- Lightweight and easy to use

## 📦 Installation

### From GitHub

1. Download the latest release from the [Releases](https://github.com/chi1180/obsidian-notify/releases) page:
   - `main.js`
   - `manifest.json`
   - (if available) `styles.css`
2. Place the files in your vault's `.obsidian/plugins/obsidian-notify/` folder
3. Reload Obsidian and enable the plugin via **Settings > Community Plugins**

### From Obsidian (if published)

Search for `obsidian-notify` in **Settings > Community Plugins > Browse** and click "Install".

> Note: If the plugin is not yet published in the Obsidian plugin directory, use manual installation.

## 🚀 Usage

You can trigger notifications using custom JavaScript. The main method is:

```js
window.notify("Your message here", duration)


* **`message`**: The text you want to display.
* **`duration`** *(optional)*: How long the notification stays visible (in milliseconds). Default: `4000`.

### Examples

#### Basic Notification

```js
window.notify("Note created successfully!");
```

#### With Duration

```js
window.notify("This will disappear in 8 seconds", 8000);
```

#### In a Templater Template

```js
<%* window.notify("Templater script executed!") %>
```

## 🔧 Developer Info

If you want to extend or modify the plugin:

```bash
git clone https://github.com/chi1180/obsidian-notify.git
cd obsidian-notify
npm install
npm run build
```

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

## 🙏 Credits

Created by [chi1180](https://github.com/chi1180)
