# SiYuan Custom Callout

[中文版](./README_zh_CN.md)

A powerful plugin for SiYuan Notes that transforms your blockquotes into beautiful, functional callout blocks with rich features and high customizability!

## ✨ Core Features

- 🎨 **11 Preset Types** - Beautiful styles for every use case
- 🎭 **8 Theme Styles** - From modern minimalist to neon glow
- 🛠️ **Fully Customizable** - Create your own callout types with custom icons and colors
- 📐 **Smart Margin System** - Support for left/right margins with drag-to-resize
- ⚡ **3 Creation Methods** - Visual menu, command input, or smart autocomplete
- 🎯 **Rich Interactions** - Collapse/expand, type switching, drag-to-resize
- 📱 **Cross-Platform** - Works on desktop, mobile, and browser

---

## 📖 Quick Start

### Install Plugin

Search for "Custom Callout" in SiYuan marketplace and install.

### Create Your First Callout

There are two ways to create callouts - choose your favorite:

#### Method 1: Visual Menu (Recommended)

1. Type `>` followed by space to create a blockquote
2. Wait 1-2 seconds for the command menu to appear automatically
3. Use **arrow keys** (↑↓←→) to select a type
4. Press `Enter` to confirm and start typing


#### Method 2: Quick Filter (Recommended for Power Users)

1. Type `>` followed by space to create a blockquote
2. After the menu appears, **type letters directly** to filter
3. For example, type `i` to filter `info`, type `tip` to filter `tip`
4. Use arrow keys to select, `Enter` to confirm

**Supports Chinese search**: Type `信` to match "信息", type `技` to match "技巧"

---

## 🎯 11 Preset Types

Includes info, concept, example, tip, best-practice, tradeoff, deep-dive, comparison, summary, pitfall, and highlight types for various note-taking scenarios.

---

## 🎨 Interactive Features

### 1. Collapse & Expand

**Click directly on the Callout title** to collapse or expand content:

```
┌─────────────────────────┐
│ 💡 Tip                  │ ← Click title to collapse
├─────────────────────────┤
│ Content goes here...     │
│ Multiple lines...        │
└─────────────────────────┘

       ↓ Collapsed ↓

┌─────────────────────────┐
│ 💡 Tip                  │ ← Click again to expand
└─────────────────────────┘
```

**Use Cases**:
- Temporarily hide content when organizing long documents
- Control progressive disclosure during presentations
- Save screen space and focus on current content

### 2. Quick Type Switching

Click on the **icon area** on the left (about 40px wide) to switch types:

1. Click the icon area
2. Type selection menu appears
3. Select a new type
4. Content stays the same, style updates instantly

**Use Cases**:
- Adjust content positioning: change "info" to "tip"
- Adjust importance: change "note" to "warning"
- Quickly experiment with different visual effects

### 3. Resize by Dragging

Callout supports **drag-to-resize width and height**:

**Resize Width**:
1. Move mouse to the **right edge** of the Callout
2. A semi-transparent resize handle appears
3. Click and drag to desired width
4. Release mouse, changes saved automatically

**Resize Height**:
1. Move mouse to the **bottom edge** of the Callout
2. A semi-transparent resize handle appears
3. Click and drag to desired height
4. Release mouse, changes saved automatically

**Use Cases**:
- Adjust display width based on content
- Fix height to maintain consistent page layout
- Optimize display for different screen sizes

**Real-time Feedback**:
- Shows current dimensions while dragging
- Green success notification after completion
- Automatically hidden on small screens (prevent accidental touches)


---

## 🎨 8 Theme Styles

Offers modern, card, flat, classic, minimal, glassmorphism, neumorphism, and neon themes to suit different aesthetic preferences.


---

## ⌨️ Keyboard Shortcuts

### In Command Menu

| Key | Function |
|-----|----------|
| `↑` `↓` `←` `→` | Navigate menu items |
| `Enter` | Confirm selection |
| `ESC` | Close menu |
| Letter/Number keys | Activate filter mode |

### In Filter Mode

| Key | Function |
|-----|----------|
| Letter/Number keys | Add filter character |
| `Backspace` | Delete last character |
| `ESC` | Exit filter mode |
| `↑` `↓` | Navigate filtered results |
| `Enter` | Confirm selection |


---

## 💡 Usage Tips

### Quick Keyboard Operations
1. Type `>` + `space` to create blockquote
2. Use arrow keys or type letters to filter and select
3. Press `Enter` to confirm

### Batch Conversion
Add commands (like `info`) at the beginning of existing blockquotes to convert them to Callouts.

### Size Adjustment
Drag the right or bottom edge of Callouts to adjust width and height.

---

## ❓ FAQ

### Q1: Why doesn't the command menu appear automatically?

**A**: Please check:
- ✅ Is the blockquote empty (no content)?
- ✅ Did you wait 1-2 seconds (plugin initialization time)?
- ✅ Is the plugin enabled?
- ✅ Are you in edit mode (not preview mode)?

### Q2: How to remove callout style and restore regular blockquote?

**A**: Two methods:
1. Click the icon on the left of title, select "Native Style"
2. Directly delete the command text (e.g., delete `@info`)

### Q3: Will custom types and settings be lost?

**A**: No! All configurations are saved in plugin data, including:
- Custom types
- Modifications to preset types
- Hidden types
- Display order
- Theme selection
- Quick config

Backup plugin data before uninstalling.

### Q4: Can I export notes with callouts?

**A**: Yes! Callout styles are preserved when exporting:
- ✅ Export as PDF - Perfect style preservation
- ✅ Export as HTML - Style preserved
- ✅ Export as Markdown - Command format preserved

### Q5: How does drag-to-resize work on mobile?

**A**: Mobile adapts automatically:
- On small screens, resize handles are automatically hidden (prevent accidental touches)
- Callouts maintain responsive width
- All other features work normally

### Q6: How to backup custom configurations?

**A**: 
1. Go to `workspace/data/storage/petal/siyuan-custom-callout/`
2. Copy config files (`callout-custom-config`)
3. Restore by placing back in original location

### Q7: What if commands conflict?

**A**: When creating custom types, the system checks automatically:
- ❌ Type IDs cannot duplicate
- ❌ Commands cannot duplicate (including English and Chinese)
- ✅ If conflict exists, error message appears

### Q8: Can I nest other blocks inside callouts?

**A**: Yes! Callouts can contain:
- ✅ Lists (ordered, unordered, task lists)
- ✅ Code blocks
- ✅ Tables
- ✅ Images
- ✅ Other block elements

### Q9: Do theme styles affect all callouts?

**A**: Yes!
- Theme style: Controls overall visual style (corners, shadows, spacing, etc.)
- Type settings: Controls colors and icons for each type
- Quick config: Fine-tunes details based on theme

Switch theme, all callouts instantly apply new style.

### Q10: How to get more icons or colors?

**A**: Current version provides:
- 70+ selected icons (Heroicons style)
- 18 preset color schemes
- Custom color support

For more options, feel free to request on GitHub!

---

## 🔄 Changelog

### v0.4.1 (Latest)
- ✨ Added 8 theme style system
- ✨ Added theme quick config feature
- ✨ Added drag-to-resize width and height
- ✨ Added keyboard filter feature
- 🎨 Optimized command menu layout and styles
- 🐛 Fixed multiple known issues

### v0.4.0
- ✨ Added complete customization features (create, edit, delete types)
- ✨ Added 70+ icon library and 18 color schemes
- ✨ Added drag-to-reorder feature
- ✨ Added hide/show types feature
- 🎨 New settings panel UI

### v0.3.0
- ✨ Added keyboard filter search feature
- 🎨 Optimized command menu display

### v0.2.0
- ✨ Added collapse/expand feature
- ✨ Added type switching feature
- ✨ Added drag-to-resize feature

### v0.1.0
- 🎉 Initial release
- ✨ 11 preset callout types
- ✨ Automatic command menu
- ✨ Manual command input

---

## 🤝 Feedback & Support

### Having Issues?

1. **Check Documentation**: Review this README and project documentation
2. **Submit Issue**: [GitHub Issues](https://github.com/zongqir/siyuan-custom-callout/issues)
3. **Feature Requests**: We welcome new ideas!

### Support the Project

If this plugin helps you:

- ⭐ Star on GitHub
- 📢 Share with other SiYuan users
- 💬 Share your experience in the community

### Contribute

Contributions of code or documentation are welcome! Check [Contributing Guide](CONTRIBUTING.md) (if available)

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

## 🙏 Credits

- Thanks to [SiYuan Notes](https://github.com/siyuan-note/siyuan) for the powerful platform
- Icons from [Heroicons](https://heroicons.com/)

---

**Make your notes more beautiful and practical!** 🎉

For questions or suggestions, please provide feedback on [GitHub](https://github.com/zongqir/siyuan-custom-callout)!
