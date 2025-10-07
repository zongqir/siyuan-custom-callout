# Callout 主题系统

## 📁 文件结构

```
themes/
├── index.ts              # 主入口，导出所有主题和工具
├── types.ts              # TypeScript 类型定义
├── utils.ts              # 工具函数（导出、导入、验证）
├── modern.ts             # 🎨 现代简约主题
├── card.ts               # 🃏 卡片风格主题
├── flat.ts               # 📐 扁平设计主题
├── classic.ts            # 📚 经典传统主题
├── minimal.ts            # ⚪ 极简主义主题
├── glassmorphism.ts      # 🔮 毛玻璃主题
├── neumorphism.ts        # 🎭 新拟态主题
└── neon.ts               # 💫 霓虹发光主题
```

## 🎨 如何自定义主题

### 方法一：修改现有主题文件

1. 打开任意主题文件（如 `modern.ts`）
2. 修改其中的参数值
3. 保存并重新编译插件

示例：修改现代简约主题的圆角大小

```typescript
// modern.ts
export const modernTheme: ThemeStyle = {
    // ...
    borderRadius: '8px',  // 改成 '16px' 增大圆角
    // ...
};
```

### 方法二：创建新的主题文件

1. 复制任一主题文件（如 `modern.ts`）
2. 重命名为 `my-theme.ts`
3. 修改所有参数
4. 在 `index.ts` 中导入并添加到 `THEME_STYLES` 数组

```typescript
// my-theme.ts
import type { ThemeStyle } from './types';

export const myTheme: ThemeStyle = {
    id: 'my-custom',          // 唯一ID
    name: '我的主题',          // 显示名称
    description: '个性化主题', // 描述
    preview: '🌟',            // emoji图标
    
    // 基础样式
    borderRadius: '10px',
    borderWidth: '2px',
    leftBorderWidth: '5px',
    padding: '18px',
    
    // 标题样式
    titleFontSize: '16px',
    titleFontWeight: '700',
    titlePadding: '0 0 12px 0',
    iconSize: '22px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.7',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    backgroundOpacity: 0.95,
    hoverTransform: 'translateY(-1px)',
    transition: 'all 0.25s ease'
};
```

```typescript
// index.ts
import { myTheme } from './my-theme';

export const THEME_STYLES = [
    modernTheme,
    cardTheme,
    // ...
    myTheme  // 添加你的主题
];
```

## 📤 如何导出主题（分享给别人）

### 导出为 JSON 格式

在插件代码中使用：

```typescript
import { exportTheme } from './themes/utils';
import { modernTheme } from './themes/modern';

// 导出主题
const themeJSON = exportTheme(modernTheme, 'Your Name');
console.log(JSON.stringify(themeJSON, null, 2));
```

输出示例：

```json
{
  "version": "1.0",
  "theme": {
    "id": "modern",
    "name": "现代简约",
    "borderRadius": "8px",
    ...
  },
  "createdAt": "2025-10-07T10:30:00.000Z",
  "author": "Your Name"
}
```

### 导出为 TypeScript 代码

```typescript
import { exportThemeAsCode } from './themes/utils';
import { modernTheme } from './themes/modern';

// 导出为代码
const themeCode = exportThemeAsCode(modernTheme);
console.log(themeCode);
```

输出可直接复制到新的 `.ts` 文件中。

## 📥 如何导入他人的主题

### 从 JSON 导入

```typescript
import { importTheme } from './themes/utils';

const jsonString = `{"version":"1.0","theme":{...}}`;
const theme = importTheme(jsonString);

if (theme) {
    // 使用导入的主题
    console.log('导入成功:', theme.name);
}
```

### 从 TypeScript 代码导入

直接将 `.ts` 文件放入 `themes/` 文件夹，然后在 `index.ts` 中导入。

## 🎨 主题参数说明

| 参数 | 说明 | 示例值 |
|------|------|--------|
| **基础样式** | | |
| `borderRadius` | 圆角大小 | `'8px'`, `'12px'`, `'0px'` |
| `borderWidth` | 边框粗细 | `'1px'`, `'2px'`, `'0px'` |
| `leftBorderWidth` | 左侧强调边框 | `'4px'`, `'6px'` |
| `padding` | 内边距 | `'16px'`, `'20px 24px'` |
| **标题样式** | | |
| `titleFontSize` | 标题字体大小 | `'15px'`, `'16px'` |
| `titleFontWeight` | 标题字体粗细 | `'600'`, `'700'` |
| `titlePadding` | 标题内边距 | `'0 0 12px 0'` |
| `iconSize` | 图标大小 | `'20px'`, `'22px'` |
| **内容样式** | | |
| `contentFontSize` | 内容字体大小 | `'14px'`, `'13px'` |
| `contentLineHeight` | 内容行高 | `'1.6'`, `'1.7'` |
| `contentPadding` | 内容内边距 | `'0'`, `'8px 0'` |
| **视觉效果** | | |
| `boxShadow` | 阴影效果 | `'none'`, `'0 2px 8px rgba(0,0,0,0.1)'` |
| `backgroundOpacity` | 背景透明度 | `1`, `0.95`, `0.7` |
| `hoverTransform` | 悬停变换 | `'none'`, `'translateY(-2px)'`, `'scale(1.02)'` |
| `transition` | 过渡动画 | `'all 0.2s ease'`, `'none'` |

## 💡 设计建议

### 1️⃣ 保持一致性
- 同一主题内，字体大小应有层次但不宜差距过大
- 圆角大小应与整体风格匹配
- 内边距应保持平衡

### 2️⃣ 考虑可读性
- 内容行高建议 `1.5` - `1.8` 之间
- 内容字体大小不小于 `13px`
- 背景透明度不低于 `0.7`（除非有特殊需求）

### 3️⃣ 适配场景
- **日常笔记**：简约、清爽（现代简约、极简主义）
- **重要提示**：醒目、立体（卡片、霓虹）
- **正式文档**：稳重、传统（经典、扁平）
- **创意设计**：特效、独特（毛玻璃、新拟态）

### 4️⃣ 性能考虑
- 复杂的 `boxShadow` 可能影响性能
- `transition` 动画不宜过长（建议 ≤ 0.3s）
- 避免使用过多的视觉效果叠加

## 🌟 分享你的主题

如果你创建了优秀的主题，欢迎分享！

1. 使用 `exportTheme()` 导出 JSON
2. 或使用 `exportThemeAsCode()` 导出代码
3. 在 GitHub Issue 或讨论区分享
4. 说明适用场景和设计理念

---

**快速开始**：直接修改 `modern.ts` 试试吧！ 🚀

