# SiYuan Custom Callout

[中文版](./README_zh_CN.md)

A clean and elegant SiYuan plugin that renders ordinary blockquotes as beautiful Callout blocks.

> **⚠️ Important**: This plugin **does NOT modify your note content**. It only renders styles by parsing blockquote titles. All content is preserved and can be reverted to regular blockquotes anytime.

---

## ✅ Requirements

- SiYuan >= 3.5.0
- Plugin >= 2.0.0 (this document)

## 🚀 What's New in 2.0

- Uses native `.callout[data-subtype]` for styling. Supports arbitrary custom subtypes.
- Alias matching: `type` + `zhCommand` (without brackets) + `displayName` all map to the same style.
- Per-type icons synced with `data-subtype` (with native fallbacks).
- Higher CSS specificity and case-insensitive matching `[i]` to override themes safely.
- Stability improvements: fixed potential freeze and caret-loss when creating/confirming callouts.
- V2-only architecture; legacy V1 path fully removed.

---

## 📖 Quick Start

### Installation

Search for "Custom Callout" in SiYuan marketplace and install.

### How to Trigger Callouts

**Method 1: Auto Menu (Recommended)**

1. Type `>` + `space` to create a blockquote
2. Wait 1-2 seconds for the command menu to appear
3. Use **arrow keys** (↑↓←→) to select a type
4. Press `Enter` to confirm

**Method 2: Keyboard Filter (Efficient)**

1. Type `>` + `space` to create a blockquote
2. When menu appears, **type letters directly** to filter
3. Example: type `i` to filter `info`, type `tip` to filter `tip`
4. Chinese support: type `信` to match "信息", type `技` to match "技巧"

---

## ⌨️ Keyboard Shortcuts

### Command Menu

| Key | Function |
|-----|----------|
| `↑` `↓` `←` `→` | Navigate items |
| `Enter` | Confirm selection |
| `ESC` | Close menu |
| Letter/Number | Activate filter |

### Filter Mode

| Key | Function |
|-----|----------|
| Letter/Number | Add filter character |
| `Backspace` | Delete character |
| `ESC` | Exit filter |
| `↑` `↓` | Navigate results |
| `Enter` | Confirm selection |

---

## 💡 Core Features

- 🎨 **11 Preset Types** - Info, tip, example, pitfall, etc.
- ⌨️ **Full Keyboard Support** - Arrow navigation + letter filtering
- 🛠️ **Fully Customizable** - Custom icons, colors, types
- 🧩 **Native data-subtype** - Style any subtype value, including your custom ones
- 🖼️ **Per-type Icons** - Icons auto-match the resolved `data-subtype`
- 📐 **Drag to Resize** - Adjustable width and height
- 🔒 **Non-Intrusive** - No content modification, only style rendering

---

## 💖 Sponsor & Support

If this plugin makes your note-taking experience better, consider buying me a coffee! Your support motivates me to keep improving and maintaining this project ☕

<div align="center">
<img src="https://i0.hdslb.com/bfs/openplatform/3b4d37a5285096d3493d09ca88280d9acf90129e.png@1e_1c.webp" width="200" alt="Support QR Code"/>

**Scan to Support · Thank You!** 🙏

Every contribution is the greatest encouragement for open source projects!
</div>

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

**Make your notes more beautiful and practical!** 🎉
