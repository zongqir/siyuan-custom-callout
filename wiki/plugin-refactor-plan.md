# 资源插件 Callout 改造方案

> 基于思源原生 Callout 设计，重新定义插件的核心价值与实现策略

---

## 一、改造核心思路

### 1.1 插件定位调整

**原定位**（推测）：
- 插件可能自己实现了完整的 Callout DOM 结构
- 可能有自己的 CSS 样式体系
- 可能有自己的类型定义和渲染逻辑

**新定位**：
- **插件不再是"实现者"，而是"快捷入口"**
- 核心功能：提供快速输入 `[!XXX]` 语法的面板/工具
- 转换逻辑：完全依赖思源原生的 Lute 引擎自动转换
- 样式渲染：完全依赖思源原生 CSS 变量与样式

### 1.2 设计哲学转变

| 维度 | 旧思路（推测） | 新思路 |
|------|---------------|--------|
| **DOM 生成** | 插件生成完整 DOM | 插件仅输入 Markdown 语法 |
| **类型转换** | 插件负责识别和转换 | Lute 引擎自动识别 `[!TYPE]` |
| **样式控制** | 插件提供独立 CSS | 复用思源原生 CSS 变量 |
| **兼容性** | 可能与原生存在差异 | 100% 兼容原生行为 |
| **维护成本** | 需要跟随思源更新同步 | 只需维护面板逻辑 |

---

## 二、具体改造目标

### 2.1 目标 1：面板快速输入 Markdown 语法

**功能描述**：
- 提供一个快捷面板（快捷键/菜单/工具栏按钮触发）
- 展示所有可用的 Callout 类型（Note / Tip / Important / Warning / Caution / 自定义）
- 点击某个类型后：
  1. 在光标位置插入 `> [!TYPE] 标题`
  2. 自动换行并插入 `> ` 前缀
  3. 光标定位到内容编辑位置
  4. 用户按 Enter → 触发思源原生转换逻辑

**实现要点**：
```markdown
输入示例（插件生成）：
> [!NOTE] 这是一个笔记
> 在这里输入内容

用户按 Enter 后 → 思源 Lute 自动识别并转换为：
<div class="callout" data-type="NodeCallout" data-subtype="NOTE">
  <div class="callout-info">
    <span class="callout-icon">✏️</span>
    <span class="callout-title">这是一个笔记</span>
  </div>
  <div class="callout-content">
    <div class="p" data-type="NodeParagraph">在这里输入内容</div>
  </div>
  ...
</div>
```

**技术细节**：
- 不需要调用任何 DOM 操作或 Transaction API
- 仅需要在当前光标位置插入纯文本 Markdown
- 可以参考思源原生 `protyle.insert` 或 `document.execCommand('insertText', ...)` 等方式
- 光标定位可以用 `\n> |` 这样的占位符（`|` 表示光标位置）

### 2.2 目标 2：CSS 样式完全对齐思源原生

**原则**：
- **不再提供独立的 Callout 样式 CSS**
- 完全依赖思源原生的 CSS 变量和样式类
- 插件 CSS 应该是"零添加"或"极轻量补充"

**思源原生 CSS 变量参考**（需要验证）：
```css
/* 思源原生应该有类似这样的变量定义 */
--b3-callout-note: #某个颜色;
--b3-callout-tip: #某个颜色;
--b3-callout-important: #某个颜色;
--b3-callout-warning: #某个颜色;
--b3-callout-caution: #某个颜色;
```

**插件侧 CSS 策略**：

**情况 A：如果思源原生已经提供了完整的 Callout 样式**
- 插件完全不需要提供任何 CSS
- 删除所有与 Callout 渲染相关的样式文件

**情况 B：如果思源原生只提供了变量但没有完整样式**（不太可能）
- 插件只需要提供最基础的样式引用：
  ```css
  /* 插件 CSS（如果需要） */
  .callout[data-subtype="NOTE"] {
      border-left-color: var(--b3-callout-note);
  }
  .callout[data-subtype="TIP"] {
      border-left-color: var(--b3-callout-tip);
  }
  /* ... */
  ```

**情况 C：如果插件有自定义类型（超出原生 5 种）**
- 只为扩展类型提供 CSS 变量定义：
  ```css
  /* 插件自定义类型扩展 */
  :root {
      --b3-callout-custom1: #yourcolor;
      --b3-callout-custom2: #yourcolor;
  }
  .callout[data-subtype="CUSTOM1"] {
      border-left-color: var(--b3-callout-custom1);
  }
  ```

---

## 三、改造实施步骤

### 阶段 1：调研与清理（当前阶段）

**任务清单**：
- [ ] 1.1 列出插件当前所有与 Callout 相关的文件
  - TypeScript 源文件（逻辑）
  - CSS 样式文件
  - 配置文件
  - i18n 语言文件
  
- [ ] 1.2 分析插件当前实现方式
  - 是否自己生成 DOM？
  - 是否有独立的类型定义？
  - 是否有独立的样式系统？
  - 是否与思源原生有冲突？

- [ ] 1.3 验证思源原生 Callout CSS
  - 在思源中创建一个原生 Callout
  - 检查开发者工具中的 CSS 类名和变量
  - 确认是否所有样式都已由思源提供

### 阶段 2：核心逻辑重构

**任务清单**：
- [ ] 2.1 实现"快速输入面板"
  - 设计面板 UI（可以是弹窗/菜单/侧边栏）
  - 列出所有支持的 Callout 类型（含图标、名称、颜色预览）
  - 点击类型后，在光标位置插入对应的 Markdown 语法

- [ ] 2.2 实现 Markdown 语法插入逻辑
  ```typescript
  // 伪代码示例
  function insertCallout(type: string, title: string) {
      const markdown = `> [!${type.toUpperCase()}] ${title}\n> `;
      // 在当前光标位置插入
      insertTextAtCursor(markdown);
      // 可选：自动触发换行以激活转换
  }
  ```

- [ ] 2.3 移除旧的 DOM 生成逻辑
  - 删除或注释掉所有直接操作 DOM 的代码
  - 删除或注释掉所有调用 Transaction API 的代码
  - 删除与 NodeCallout 相关的手动处理逻辑

### 阶段 3：CSS 清理与对齐

**任务清单**：
- [ ] 3.1 清理插件自有 CSS
  - 删除所有 `.callout` 相关的独立样式定义
  - 删除所有自定义颜色/边框/背景等样式
  - 保留（如果有）：面板 UI 的样式

- [ ] 3.2 验证样式对齐
  - 在思源中通过插件创建 Callout
  - 对比插件生成的与手动创建的原生 Callout
  - 确保视觉效果完全一致

- [ ] 3.3 （可选）扩展自定义类型
  - 如果插件要支持原生 5 种之外的类型
  - 仅添加对应的 CSS 变量定义
  - 保持样式结构与原生一致

### 阶段 4：测试与优化

**任务清单**：
- [ ] 4.1 功能测试
  - 测试所有支持的 Callout 类型
  - 测试光标位置插入
  - 测试自动转换触发
  - 测试撤销/重做

- [ ] 4.2 兼容性测试
  - 测试与思源原生 Callout 的互操作性
  - 测试在不同主题下的显示效果
  - 测试导出（Markdown/PDF/HTML）

- [ ] 4.3 性能优化
  - 确保面板打开速度快
  - 确保没有不必要的事件监听
  - 确保没有内存泄漏

### 阶段 5：文档与发布

**任务清单**：
- [ ] 5.1 更新插件文档
  - 说明新的使用方式
  - 说明与原生 Callout 的关系
  - 提供快捷键/使用示例

- [ ] 5.2 迁移指南（如果有老用户）
  - 说明改造后的变化
  - 如果有旧数据，提供转换方案

- [ ] 5.3 发布新版本
  - 更新版本号
  - 编写 Changelog
  - 提交到思源插件市场

---

## 四、关键技术决策点

### 4.1 面板触发方式

**选项 A：快捷键**
- 优点：快速调用
- 缺点：需要用户记忆
- 建议：`Ctrl+Shift+C` 或自定义

**选项 B：编辑器工具栏按钮**
- 优点：可见性强
- 缺点：占用工具栏空间
- 建议：与思源原生按钮风格一致

**选项 C：斜杠命令 `/callout`**
- 优点：符合思源使用习惯
- 缺点：需要与思源斜杠命令系统集成
- 建议：如果可行，这是最佳方案

**选项 D：右键菜单**
- 优点：上下文相关
- 缺点：需要多次点击
- 建议：可作为补充方式

**推荐组合**：斜杠命令（主要）+ 快捷键（辅助）

### 4.2 类型选择 UI

**选项 A：列表式面板**
```
┌─────────────────────┐
│ 选择 Callout 类型   │
├─────────────────────┤
│ ✏️  Note            │
│ 💡 Tip              │
│ ❗ Important        │
│ ⚠️  Warning         │
│ 🚨 Caution          │
└─────────────────────┘
```

**选项 B：图标网格**
```
┌─────────────────────┐
│ [ ✏️ ] [ 💡] [ ❗ ]  │
│ [Note] [Tip] [Imp]  │
│                     │
│ [ ⚠️ ] [ 🚨]        │
│ [Warn] [Cau]        │
└─────────────────────┘
```

**推荐**：列表式面板，带颜色预览和描述

### 4.3 标题输入方式

**选项 A：使用默认标题**
- 直接插入 `> [!NOTE] Note`
- 用户可手动修改标题

**选项 B：弹出输入框**
- 选择类型后，弹框询问标题
- 用户输入后再插入

**选项 C：内联编辑**
- 插入后，标题部分自动选中
- 用户直接输入覆盖

**推荐**：选项 A（默认标题）+ 选项 C（自动选中）

---

## 五、代码示例（伪代码）

### 5.1 面板组件

```typescript
// src/components/CalloutPanel.ts
export class CalloutPanel {
    private types = [
        { type: 'NOTE', icon: '✏️', title: 'Note', color: 'var(--b3-callout-note)' },
        { type: 'TIP', icon: '💡', title: 'Tip', color: 'var(--b3-callout-tip)' },
        { type: 'IMPORTANT', icon: '❗', title: 'Important', color: 'var(--b3-callout-important)' },
        { type: 'WARNING', icon: '⚠️', title: 'Warning', color: 'var(--b3-callout-warning)' },
        { type: 'CAUTION', icon: '🚨', title: 'Caution', color: 'var(--b3-callout-caution)' },
    ];

    show(protyle: IProtyle) {
        // 创建面板 DOM
        const panel = this.createPanelDOM();
        
        // 绑定点击事件
        this.types.forEach(item => {
            panel.querySelector(`[data-type="${item.type}"]`).addEventListener('click', () => {
                this.insertCallout(protyle, item);
                panel.remove();
            });
        });
        
        // 显示面板
        document.body.appendChild(panel);
    }

    private insertCallout(protyle: IProtyle, item: CalloutType) {
        const markdown = `> [!${item.type}] ${item.title}\n> `;
        
        // 方案 1：使用思源插件 API
        // protyle.insert(markdown);
        
        // 方案 2：直接操作 DOM（需要获取当前编辑器实例）
        const range = getSelection().getRangeAt(0);
        const textNode = document.createTextNode(markdown);
        range.insertNode(textNode);
        
        // 触发思源的内容变化事件，让 Lute 处理转换
        // 具体 API 需要查阅思源插件文档
    }
}
```

### 5.2 插件入口

```typescript
// src/index.ts
import { Plugin } from 'siyuan';
import { CalloutPanel } from './components/CalloutPanel';

export default class CalloutPlugin extends Plugin {
    private panel: CalloutPanel;

    onload() {
        this.panel = new CalloutPanel();

        // 注册快捷键
        this.addCommand({
            langKey: 'insertCallout',
            hotkey: 'Ctrl+Shift+C',
            callback: () => {
                const protyle = this.getCurrentProtyle();
                if (protyle) {
                    this.panel.show(protyle);
                }
            }
        });

        // 注册斜杠命令（如果支持）
        this.registerSlashCommand({
            name: 'callout',
            description: '插入 Callout 块',
            callback: (protyle) => {
                this.panel.show(protyle);
            }
        });
    }

    onunload() {
        // 清理资源
    }
}
```

### 5.3 CSS（极简版）

```css
/* src/styles/panel.css - 仅面板 UI 样式 */
.callout-panel {
    position: fixed;
    z-index: 1000;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.callout-panel-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
}

.callout-panel-item:hover {
    background: var(--b3-list-hover);
}

.callout-panel-icon {
    font-size: 20px;
    margin-right: 8px;
}

.callout-panel-title {
    flex: 1;
    font-weight: 500;
}

/* 注意：不再包含任何 .callout 块本身的样式！ */
```

---

## 六、风险评估与应对

### 6.1 风险：思源 Lute 不识别某些语法

**场景**：
- 插件插入了 `> [!CUSTOM]` 但思源不识别

**应对**：
- 优先使用思源原生支持的 5 种类型
- 如需扩展，先验证思源 Lute 的支持范围
- 或者提供"降级方案"：生成普通引用块 + 特殊标记

### 6.2 风险：自动转换不触发

**场景**：
- 插入 Markdown 后，思源没有自动转换为 Callout DOM

**应对**：
- 研究思源转换的触发条件（可能是回车、失焦、特定事件）
- 在插入后主动触发对应事件
- 或者提供"手动转换"按钮

### 6.3 风险：与其他插件冲突

**场景**：
- 其他插件也修改了编辑器行为，导致冲突

**应对**：
- 尽量使用思源官方 API
- 避免直接修改全局对象
- 提供配置项允许用户禁用冲突功能

---

## 七、成功标准

改造完成后，应满足以下标准：

### 7.1 功能标准
- [ ] 插件提供的面板能快速打开（< 500ms）
- [ ] 选择类型后，能正确插入对应 Markdown 语法
- [ ] 思源能自动识别并转换为原生 Callout DOM
- [ ] 转换后的 Callout 与手动创建的完全一致

### 7.2 样式标准
- [ ] 插件不提供任何 Callout 块的独立样式
- [ ] 所有 Callout 块的显示完全依赖思源原生 CSS
- [ ] 在不同主题下显示正确（跟随主题变化）
- [ ] 导出时样式正确（Markdown/PDF/HTML）

### 7.3 兼容性标准
- [ ] 与思源原生 Callout 100% 兼容
- [ ] 支持思源的撤销/重做
- [ ] 支持思源的搜索/图谱/批量替换
- [ ] 不影响思源的其他功能

### 7.4 性能标准
- [ ] 插件加载不影响思源启动速度
- [ ] 面板打开无明显延迟
- [ ] 无内存泄漏（长时间使用后）
- [ ] 不产生不必要的网络请求

### 7.5 用户体验标准
- [ ] 提供清晰的使用文档
- [ ] 快捷键易于记忆和使用
- [ ] 错误提示友好
- [ ] 支持键盘导航（可选）

---

## 八、后续规划

### 8.1 v1.0（基础版）
- 支持思源原生 5 种 Callout 类型
- 提供快捷面板快速插入
- 完全依赖思源原生转换和样式

### 8.2 v1.1（增强版）
- 支持自定义 Callout 类型（需验证思源支持）
- 提供更多触发方式（斜杠命令、右键菜单等）
- 提供配置界面（自定义快捷键、默认类型等）

### 8.3 v1.2（优化版）
- 支持批量转换（选中多个块 → 一键包裹为 Callout）
- 支持模板（预设标题和内容）
- 支持导入导出配置

### 8.4 v2.0（生态版）
- 提供 API 供其他插件调用
- 支持与 AI 插件集成（自动生成 Callout）
- 支持主题作者扩展样式变量

---

## 九、下一步行动

1. **立即行动**：
   - 请提供插件当前的目录结构和关键代码文件
   - 我会帮你分析现有实现，标记需要修改的部分

2. **准备工作**：
   - 在思源中手动创建几个原生 Callout
   - 用开发者工具查看 DOM 结构和 CSS
   - 测试 `[!NOTE]` 等语法的转换行为

3. **技术验证**：
   - 确认思源插件 API 中是否有 `insert()` 等方法
   - 确认如何获取当前编辑器实例（protyle）
   - 确认如何触发思源的内容变化事件

---

**准备好了吗？把插件当前的代码结构发给我，我们开始具体改造！** 🚀
