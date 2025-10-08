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

1. Open SiYuan Notes
2. Go to `Settings` → `Marketplace` → `Plugins`
3. Search for "Custom Callout"
4. Download and enable

### Create Your First Callout

There are two ways to create callouts - choose your favorite:

#### Method 1: Visual Menu (Recommended)

1. Type `>` followed by space to create a blockquote
2. Wait 1-2 seconds for the command menu to appear automatically
3. Use **arrow keys** (↑↓←→) to select a type
4. Press `Enter` to confirm and start typing

![Command Menu Example](https://via.placeholder.com/600x300?text=Command+Menu)

#### Method 2: Quick Filter (Recommended for Power Users)

1. Type `>` followed by space to create a blockquote
2. After the menu appears, **type letters directly** to filter
3. For example, type `i` to filter `info`, type `tip` to filter `tip`
4. Use arrow keys to select, `Enter` to confirm

**Supports Chinese search**: Type `信` to match "信息", type `技` to match "技巧"

---

## 🎯 11 Preset Types

| Command | Chinese | Type Name | Use Case | Color |
|---------|---------|-----------|----------|-------|
| `@info` | `@信息` | Information | General information and explanations | 🔵 Blue |
| `@concept` | `@概念` | Concept | Define terms and explain concepts | 🟣 Purple |
| `@example` | `@示例` | Example | Code examples and use cases | 🟢 Green |
| `@tip` | `@技巧` | Tip | Practical tips and tricks | 🟡 Yellow-Green |
| `@best-practice` | `@最佳实践` | Best Practice | Recommended approaches and standards | 🌲 Dark Green |
| `@tradeoff` | `@权衡取舍` | Tradeoff | Pros/cons analysis and comparisons | 🟠 Orange |
| `@deep-dive` | `@深水区` | Deep Dive | In-depth exploration of advanced topics | 🔵 Dark Blue |
| `@comparison` | `@对比` | Comparison | Compare different approaches | 🟣 Indigo |
| `@summary` | `@总结` | Summary | Summarize key points | 🔷 Cyan |
| `@pitfall` | `@陷阱` | Pitfall | Warnings and cautions | 🔴 Red |
| `@highlight` | `@亮点` | Highlight | Emphasize important points | 🟡 Golden |

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

Click the Callout icon in the top bar, open settings panel, and select a theme in the "🎨 Theme Style" section:

### 1. Modern (Default)
**Features**: Clean and smooth, medium rounded corners, thin borders, no shadows  
**Best for**: Daily use, clean and fresh style

### 2. Card
**Features**: Large rounded corners, shadows, hover lift effect  
**Best for**: Notes requiring depth, prominent visual effect

### 3. Flat
**Features**: Solid flat colors, small rounded corners, thick left border  
**Best for**: Simple and direct expression, focus on content

### 4. Classic
**Features**: No rounded corners, medium borders, stable and elegant  
**Best for**: Formal documents, academic papers, serious notes

### 5. Minimal
**Features**: Extremely simple, thin borders, small icons, compact layout  
**Best for**: Minimalism lovers, high information density

### 6. Glassmorphism
**Features**: Semi-transparent background, blur effect, modern tech feel  
**Best for**: Modern design enthusiasts, glass texture lovers

### 7. Neumorphism
**Features**: Soft raised or depressed effects, dual shadows, 3D texture  
**Best for**: Unique visual experience, artistic notes

### 8. Neon
**Features**: Vibrant glowing borders, hover zoom effect  
**Best for**: Eye-catching alerts, important content emphasis

**How to Switch**:
1. Open settings panel
2. Click any theme card
3. All callouts instantly apply the new style!

---

## 🛠️ Customization Features

### Create Your Own Callout Types

1. **Open Settings**: Click the Callout icon in the top bar
2. **New Type**: Click "New Type" button in the top right
3. **Fill Information**:
   - **Type ID**: Unique identifier (e.g., `my-note`)
   - **Display Name**: Name shown in the title (e.g., `My Note`)
   - **Command**: Trigger command (e.g., `@my-note`)
   - **Chinese Command** (optional): Chinese alias (e.g., `@我的笔记`)
4. **Choose Icon**: Select from 70+ icons
5. **Choose Color**: Select from 18 preset colors or customize
6. **Save**: Click save, takes effect immediately!

### Edit Preset Types

Don't like the default icons or colors? You can modify them:

1. Find the type to modify in settings panel
2. Click the "Edit" button (pencil icon) on the right
3. Modify icon or color
4. Save

Not satisfied? Click "Reset" button to restore defaults.

### Hide Unused Types

If you don't use certain preset types, you can hide them:

1. Find the type to hide
2. Click the "Hide" button (eye icon)
3. The type no longer appears in the command menu

**Note**:
- Hidden types remain visible in settings panel (shown semi-transparent)
- Can be restored anytime by clicking "Show" button
- Hiding doesn't affect existing callouts

### Drag to Reorder

Want to adjust the display order in the menu? Just drag:

1. In settings panel, click and hold any type card
2. Drag to target position
3. Release mouse
4. Order is saved automatically, command menu updates instantly

### Full Reset

If you want to restore to initial state:

1. Click "Reset All" button in top right
2. Confirm the operation
3. All custom configurations cleared, back to defaults

**Reset Will Clear**:
- All custom types
- Modifications to preset types
- Hidden type list
- Custom display order

**Reset Will Preserve**:
- Theme style selection
- Grid column settings

---

## 🎯 Theme Quick Config

In the "Theme Style" tab, you can fine-tune current theme styles:

### Background Style
- **Solid**: Single color background
- **Gradient**: Gradient background (more depth)

### Border Radius
- No radius (0px) → Extra large (20px)
- 7 levels available

### Left Border Width
- No border (0px) → Extra thick (6px)
- Left accent border thickness

### Border Width
- No border (0px) → Extra thick (3px)

### Title Font Size
- Extra small (0.8em) → Extra large (1.2em)

### Title Font Weight
- Normal (400) → Extra bold (800)

### Icon Size
- Small (14px) → Extra large (24px)

### Advanced Options
- ☑️ **Hide Icon**: Show only text title
- ☑️ **Hide Title Text**: Show only icon
- ☑️ Both selected: Hide title completely, keep only content

**Usage Suggestions**:
- First select a close theme
- Then fine-tune details with quick config
- Real-time preview, what you see is what you get

---

## 📚 Practical Examples

### Scenario 1: Technical Documentation

```markdown
> @concept
> REST API is an architectural style for designing networked applications.

> @example
> GET /api/users/123
> Returns user information with ID 123

> @best-practice
> Recommend using HTTPS protocol to ensure data transmission security

> @pitfall
> ⚠️ Don't pass sensitive information in URLs, use request body or headers
```

### Scenario 2: Study Notes

```markdown
> @info
> Chapter 3: Memory and Cognition

> @concept
> Ebbinghaus Forgetting Curve: People quickly forget after learning, need timely review

> @tip
> Use Spaced Repetition to improve memory efficiency

> @summary
> Key Points:
> 1. Understand memory formation mechanisms
> 2. Master scientific review methods
> 3. Apply memory techniques to enhance learning
```

### Scenario 3: Project Documentation

```markdown
> @info
> Project built with TypeScript + Svelte + Vite

> @tradeoff
> Choosing Vite over Webpack:
> ✅ Pros: Faster hot updates, cleaner configuration
> ❌ Cons: Some legacy libraries may not be compatible

> @deep-dive
> In-depth analysis of build optimization:
> - Use Tree Shaking to reduce bundle size
> - Enable code splitting to improve load speed
> - Optimize static resource caching strategies
```

### Scenario 4: Resize for Layout Optimization

After creating Callouts, you can drag resize handles to adjust width and height for different content and layout needs.

```markdown
> @info
> 💡 This is a resizable info block
> 
> - Drag right edge to adjust width
> - Drag bottom edge to adjust height
> - Dimensions are saved automatically
```

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

### Tip 1: Quick Keyboard Flow

1. Type `>` + `space` to create blockquote
2. Wait for menu (or type `@` to trigger autocomplete)
3. Type first letter to filter (e.g., `i` matches info)
4. `Enter` to confirm
5. Start typing content

No mouse needed, extremely efficient!

### Tip 2: Batch Modify Existing Content

If you have many regular blockquotes to convert:

1. Add command at the beginning of each blockquote (e.g., `@info`)
2. Press `Enter`, styles apply automatically
3. Or use "Find and Replace" to batch add commands

### Tip 3: Combine Different Types

Use multiple types in the same document for clear hierarchy:

```markdown
> @info
> Basic information...

> @concept
> Core concepts...

> @example
> Practical examples...

> @tip
> Useful tips...

> @pitfall
> Cautions...

> @summary
> Summary...
```

### Tip 4: Resize for Layout Optimization

Adjust Callout dimensions based on content length:

```markdown
> @info
> 💭 My thoughts:
> This viewpoint is enlightening...
> (Drag right or bottom edge to resize)

> @highlight
> ⭐ Key point
> Need to review this
> (Can fix width or height)
```

### Tip 5: Create Custom Types for Specific Uses

Create dedicated types for specific purposes:

- `@todo` - Todo items (clipboard icon + orange)
- `@question` - Questions (question icon + purple)
- `@inspiration` - Inspirations (bulb icon + yellow)
- `@reference` - References (bookmark icon + blue)

### Tip 6: Use Themes to Set the Mood

- Daytime work: "Modern" or "Flat"
- Evening reading: "Minimal" or "Classic"
- Presentations: "Card" or "Glassmorphism"
- Emphasis: "Neon"

One-click switch, entire style changes instantly!

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

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Credits

- Thanks to [SiYuan Notes](https://github.com/siyuan-note/siyuan) for the powerful platform
- Icons from [Heroicons](https://heroicons.com/)

---

**Make your notes more beautiful and practical!** 🎉

For questions or suggestions, please provide feedback on [GitHub](https://github.com/zongqir/siyuan-custom-callout)!
