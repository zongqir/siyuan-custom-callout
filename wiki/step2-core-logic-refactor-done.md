# 阶段 2 完成：核心逻辑改造 - 命令注册机制

> ✅ 已完成从 DOM 监听改为命令注册的核心重构

---

## 完成时间

2025-12-20

---

## 改造内容

### 1. Manager.ts - 初始化简化

**文件**：`src/callout/manager.ts`

#### 改动 1：简化 initialize() 方法

**改造前**（14 行）：
```typescript
async initialize() {
    // 加载配置
    if (this.plugin) { ... }

    // 注入样式
    this.injectStyles();

    // 初始化拖拽调整功能
    this.initializeDragResize();

    // 初始化块标高亮功能
    this.initializeGutterHighlight();

    // 处理现有的blockquote
    this.processor.processAllBlockquotes();

    // 设置监听器
    this.setupObserver();         // ❌ DOM 监听
    this.setupEventListeners();   // ❌ 事件监听
}
```

**改造后**（7 行）：
```typescript
async initialize() {
    // 加载配置
    if (this.plugin) { ... }

    // 注入样式（仅用于面板 UI 和自定义类型补充样式）
    this.injectStyles();

    // 🔧 新版：不再需要这些功能
    // - 不处理现有 blockquote（让思源原生处理）
    // - 不设置 DOM 监听器（改用命令触发）
    // - 不需要拖拽调整（思源原生不支持）
    // - 不需要块标高亮（简化功能）
}
```

**减少代码**：7 行（-50%）

---

#### 改动 2：新增 registerCommands() 方法

**新增代码**（37 行）：
```typescript
/**
 * 🆕 注册命令（取代 DOM 监听）
 * 通过插件系统注册快捷键命令，直接唤起 Callout 面板
 */
registerCommands() {
    if (!this.plugin) return;

    // 注册快捷键命令：插入 Callout
    this.plugin.addCommand({
        langKey: 'insertCallout',
        hotkey: '⌘⇧C', // Cmd+Shift+C (macOS) / Ctrl+Shift+C (Windows)
        callback: () => {
            this.showCalloutMenu();
        }
    });

    console.log('[Callout Manager] ✅ 命令已注册: ⌘⇧C 插入 Callout');
}

/**
 * 🎯 显示 Callout 选择菜单
 */
showCalloutMenu() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        console.log('[Callout Manager] ⚠️ 没有选区，无法显示菜单');
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 显示菜单（使用现有的 menu.showMenu 方法）
    // 注意：这里传入 null 作为 blockquote，因为我们不再修改现有块
    this.menu.showMenu(rect.left, rect.top, null, false, false);

    console.log('[Callout Manager] 🎯 菜单已显示于:', { x: rect.left, y: rect.top });
}
```

**核心逻辑**：
1. **注册快捷键**：`⌘⇧C` (Cmd+Shift+C)
2. **显示菜单**：在光标位置弹出选择面板
3. **不再绑定 DOM**：完全依赖命令触发

---

### 2. Index.ts - 调用命令注册

**文件**：`src/index.ts`

**改动**：
```typescript
// 初始化Callout管理器
this.calloutManager = new CalloutManager(this);
await this.calloutManager.initialize();

// 🆕 注册命令（新版：取代 DOM 监听）
this.calloutManager.registerCommands();
```

**说明**：
- 在 `initialize()` 后立即调用 `registerCommands()`
- 注册到思源插件系统

---

### 3. Menu.ts - 插入 Markdown + 自动转换

**文件**：`src/callout/menu.ts`

#### 改动 1：重写 handleSelectCallout() 方法

**改造前**（5 行 - 旧逻辑）：
```typescript
private handleSelectCallout(command: string, isEdit: boolean) {
    if (this.currentTargetBlockQuote) {
        this.insertCommand(command, this.currentTargetBlockQuote, isEdit);
    }
    setTimeout(() => this.hideMenu(true), 300);
}
```

**改造后**（33 行 - 新逻辑）：
```typescript
private handleSelectCallout(command: string, isEdit: boolean) {
    // 🆕 新版逻辑：不再修改现有 blockquote，而是插入 Markdown 文本
    // 让思源原生自动转换为 Callout
    
    // 获取当前选区
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        console.log('[Callout Menu] ⚠️ 没有选区，无法插入');
        this.hideMenu(true);
        return;
    }
    
    const range = selection.getRangeAt(0);
    
    // 查找对应的类型配置
    const typeConfig = this.calloutTypes.find(t => t.command === command);
    const displayName = typeConfig?.displayName || command;
    
    // 生成 Markdown 文本：> [!TYPE] 标题
    const markdown = `> [!${command.toUpperCase()}] ${displayName}\n> `;
    
    console.log('[Callout Menu] 📝 将插入 Markdown:', markdown);
    
    // 插入 Markdown 文本
    this.insertMarkdownAndConvert(markdown, range);
    
    // 隐藏菜单
    setTimeout(() => this.hideMenu(true), 100);
}
```

**核心变化**：
- ❌ 不再修改现有 blockquote
- ✅ 直接插入 Markdown 文本
- ✅ 让思源 Lute 引擎自动转换

---

#### 改动 2：新增 insertMarkdownAndConvert() 方法

**新增代码**（34 行）：
```typescript
/**
 * 🆕 插入 Markdown 文本并自动触发转换（模式 B）
 */
private insertMarkdownAndConvert(markdown: string, range: Range) {
    try {
        // 1. 删除当前选区内容
        range.deleteContents();
        
        // 2. 插入 Markdown 文本
        const textNode = document.createTextNode(markdown);
        range.insertNode(textNode);
        
        // 3. 设置光标位置（在文本末尾）
        range.setStart(textNode, markdown.length);
        range.collapse(true);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        console.log('[Callout Menu] ✅ Markdown 已插入，准备触发转换');
        
        // 4. 自动触发回车（模式 B）
        setTimeout(() => {
            this.triggerEnterKey();
        }, 100); // 稍微延迟确保 DOM 更新
        
    } catch (error) {
        console.error('[Callout Menu] ❌ 插入 Markdown 失败:', error);
    }
}
```

**流程**：
1. 删除选区内容
2. 插入 Markdown 文本（例如：`> [!NOTE] 笔记\n> `）
3. 设置光标到末尾
4. 自动触发回车键事件

---

#### 改动 3：新增 triggerEnterKey() 方法

**新增代码**（47 行）：
```typescript
/**
 * 🆕 触发回车键事件（模拟用户按回车）
 */
private triggerEnterKey() {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) {
        console.log('[Callout Menu] ⚠️ 没有激活元素，无法触发回车');
        return;
    }
    
    console.log('[Callout Menu] 🔑 触发 Enter 键事件于:', activeElement.tagName);
    
    // 创建并触发 keydown 事件
    const keydownEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true
    });
    
    activeElement.dispatchEvent(keydownEvent);
    
    // 触发 keypress 事件（某些框架可能需要）
    const keypressEvent = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true
    });
    
    activeElement.dispatchEvent(keypressEvent);
    
    // 触发 keyup 事件
    const keyupEvent = new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true
    });
    
    activeElement.dispatchEvent(keyupEvent);
    
    console.log('[Callout Menu] ✅ Enter 键事件已触发');
}
```

**说明**：
- 触发完整的键盘事件链：keydown → keypress → keyup
- 模拟用户真实按键
- 让思源 Lute 引擎识别并转换为原生 Callout

---

## 工作流程对比

### 改造前（DOM 监听模式）

```
页面加载
    ↓
MutationObserver 监听 DOM 变化
    ↓
检测到新的 <blockquote> 元素
    ↓
自动弹出 Callout 菜单
    ↓
用户选择类型
    ↓
修改 blockquote 的 DOM 属性
    ├─ 添加 custom-callout 属性
    ├─ 添加 data-callout-title 属性
    └─ 修改第一行文本为 [!TYPE]
    ↓
插件通过 CSS 渲染样式
    ├─ ::before 伪元素显示图标
    ├─ 左侧边框颜色
    └─ 背景色
    ↓
最终显示效果 ✨（插件渲染）
```

**问题**：
- ❌ 大量 DOM 监听
- ❌ 600+ 行自定义 CSS
- ❌ 与思源原生 Callout 不兼容
- ❌ 导出时可能丢失样式

---

### 改造后（命令注册模式）

```
用户按下快捷键 ⌘⇧C
    ↓
触发 registerCommands() 注册的回调
    ↓
显示 Callout 选择菜单
    ↓
用户选择类型
    ↓
生成 Markdown 文本
    例如：> [!NOTE] 笔记\n> 
    ↓
插入到光标位置
    ↓
自动触发回车键事件
    ↓
思源 Lute 引擎识别语法
    ↓
自动转换为原生 NodeCallout
    ├─ <div class="callout" data-subtype="NOTE">
    ├─ <div class="callout-info">
    │   ├─ <span class="callout-icon">✏️</span>
    │   └─ <span class="callout-title">笔记</span>
    └─ <div class="callout-content">...
    ↓
思源原生 CSS 渲染样式
    ├─ 使用 --b3-callout-note 变量
    ├─ 原生图标和颜色
    └─ 完整的功能支持
    ↓
最终显示效果 ✨（思源原生）
```

**优势**：
- ✅ 零 DOM 监听
- ✅ 极简 CSS（仅面板 UI）
- ✅ 完全兼容思源原生
- ✅ 导出时保留完整格式
- ✅ 支持搜索、图谱、导出

---

## 代码统计

### 修改文件

| 文件 | 行数变化 | 说明 |
|------|---------|------|
| `manager.ts` | +37 行, -14 行 | 新增命令注册，简化初始化 |
| `index.ts` | +3 行 | 调用命令注册 |
| `menu.ts` | +114 行, -5 行 | 新增 Markdown 插入逻辑 |
| **总计** | **+154 行, -19 行** | **净增 135 行** |

### 核心改动

- ✅ 删除了 `setupObserver()` 调用（不再需要 MutationObserver）
- ✅ 删除了 `setupEventListeners()` 调用（不再需要事件监听）
- ✅ 删除了 `processAllBlockquotes()` 调用（不再处理现有块）
- ✅ 删除了 `initializeDragResize()` 调用（暂时保留代码）
- ✅ 删除了 `initializeGutterHighlight()` 调用（暂时保留代码）
- ✅ 新增了 `registerCommands()` 方法（命令注册）
- ✅ 新增了 `showCalloutMenu()` 方法（显示菜单）
- ✅ 改写了 `handleSelectCallout()` 方法（插入 Markdown）
- ✅ 新增了 `insertMarkdownAndConvert()` 方法（插入并转换）
- ✅ 新增了 `triggerEnterKey()` 方法（触发回车）

---

## 待删除的代码（第 3 阶段）

这些功能不再需要，但代码还保留在文件中：

### Manager.ts

```typescript
// ❌ 待删除：MutationObserver 监听器
private setupObserver() { ... }  // 105-178 行

// ❌ 待删除：事件监听器
private setupEventListeners() { ... }  // 183-278 行

// ❌ 待删除：光标检测
private isCaretInFirstLine() { ... }  // 283-335 行

// ❌ 待删除：查找 blockquote
private findTargetBlockquote() { ... }  // 340-356 行

// ❌ 待删除：拖拽调整
private initializeDragResize() { ... }  // 362-364 行

// ❌ 待删除：块标高亮
private initializeGutterHighlight() { ... }  // 369-371 行
```

**预计可删除**：约 300 行

---

### Menu.ts

```typescript
// ❌ 待删除：旧的插入逻辑（已被 insertMarkdownAndConvert 取代）
private insertCommand() { ... }  // 739-870 行

// ❌ 待删除：旧的文本更新逻辑
private updateEditableText() { ... }  // 708-734 行

// ❌ 待删除：获取焦点 div
private getCurrentFocusedEditableDiv() { ... }  // 672-703 行

// ❌ 待删除：清除 Callout
private handleClearCallout() { ... }  // 612-657 行
```

**预计可删除**：约 250 行

---

## 测试清单

### 基础功能测试

- [ ] **快捷键触发**
  - [ ] 按下 `Cmd+Shift+C` (macOS) / `Ctrl+Shift+C` (Windows)
  - [ ] 菜单是否在光标位置弹出？

- [ ] **菜单显示**
  - [ ] 菜单是否正确显示所有配置的类型？
  - [ ] 菜单样式是否正常？
  - [ ] 键盘导航是否正常？

- [ ] **Markdown 插入**
  - [ ] 选择类型后是否插入正确的 Markdown 文本？
  - [ ] 格式是否正确：`> [!TYPE] 标题\n> `？

- [ ] **自动转换**
  - [ ] 插入后是否自动触发回车？
  - [ ] 思源是否成功转换为原生 Callout？
  - [ ] 转换后的 DOM 结构是否正确？

### 兼容性测试

- [ ] **思源原生类型**
  - [ ] NOTE 是否正常转换？
  - [ ] TIP 是否正常转换？
  - [ ] IMPORTANT 是否正常转换？
  - [ ] WARNING 是否正常转换？
  - [ ] CAUTION 是否正常转换？

- [ ] **自定义类型**
  - [ ] EXAMPLE 是否正常转换？
  - [ ] PITFALL 是否正常转换？
  - [ ] 其他自定义类型是否正常？

- [ ] **样式验证**
  - [ ] 转换后是否使用思源原生样式？
  - [ ] 自定义类型的补充样式是否生效？

### 边界情况测试

- [ ] **无选区**
  - [ ] 未选中任何内容时按快捷键，是否有提示？

- [ ] **光标位置**
  - [ ] 在段落中间按快捷键，插入是否正确？
  - [ ] 在段落开头按快捷键，插入是否正确？
  - [ ] 在段落结尾按快捷键，插入是否正确？

- [ ] **特殊场景**
  - [ ] 在代码块中按快捷键，是否阻止？
  - [ ] 在表格中按快捷键，是否正常？

---

## 已知问题

### 1. 回车事件可能无效

**问题**：某些场景下，`triggerEnterKey()` 触发的事件可能不会被思源识别。

**原因**：
- 思源可能使用自定义的事件处理逻辑
- 可能需要在特定的元素上触发事件
- 可能需要额外的事件属性

**解决方案**：
1. **方案 A**：使用 `document.execCommand('insertLineBreak')`
2. **方案 B**：直接操作 DOM，插入换行符
3. **方案 C**：使用思源 API（如果有插入文本的接口）

---

### 2. 自定义类型可能无样式

**问题**：思源原生只支持 5 种类型，自定义类型可能没有样式。

**原因**：
- 思源原生 CSS 只定义了 NOTE/TIP/IMPORTANT/WARNING/CAUTION
- 自定义类型如 EXAMPLE/PITFALL 没有对应的 CSS 变量

**解决方案**：
- 在插件 CSS 中为自定义类型添加补充样式
- 使用 `[data-subtype="EXAMPLE"]` 选择器
- 或者降级到思源原生的某个类型

---

## 下一步工作

### 优先级 1：测试与验证

1. **编译插件**
   ```bash
   cd c:\Users\Administrator\Documents\webstormProject\siyuan-custom-callout.git
   npm run build
   ```

2. **在思源中测试**
   - 重启思源
   - 按 `Cmd+Shift+C`
   - 选择类型
   - 验证转换

3. **调试回车事件**
   - 如果自动转换失败，尝试其他方案
   - 查看控制台日志
   - 检查事件是否触发

---

### 优先级 2：CSS 清理

1. **删除 Callout 块样式**
   - 保留面板 UI 样式
   - 保留自定义类型补充样式
   - 删除 95% 的样式代码

2. **验证原生样式**
   - 在思源中创建原生 Callout
   - 查看 CSS 变量
   - 确认是否需要补充

---

### 优先级 3：代码清理

1. **删除 manager.ts 中的旧代码**
   - `setupObserver()`
   - `setupEventListeners()`
   - 其他 DOM 操作方法

2. **删除 menu.ts 中的旧代码**
   - `insertCommand()`
   - `updateEditableText()`
   - 其他 blockquote 操作方法

3. **删除不需要的文件**
   - `processor.ts`（或大幅简化）
   - `drag-resize.ts`
   - `proxy-button.ts`

---

## 总结

### ✅ 已完成

1. **命令注册机制**：用快捷键触发代替 DOM 监听
2. **Markdown 插入**：生成并插入 `> [!TYPE]` 语法
3. **自动转换**：触发回车事件让思源转换
4. **初始化简化**：删除不必要的初始化步骤

### 📋 待测试

1. **快捷键触发**：是否正常弹出菜单
2. **Markdown 插入**：是否生成正确的文本
3. **自动转换**：思源是否成功识别并转换
4. **样式验证**：原生样式是否正常应用

### 🎯 核心成果

**从 DOM 操作模式 → Markdown 生成模式**

- ❌ 不再监听 DOM
- ❌ 不再修改 blockquote
- ❌ 不再应用自定义样式（95%）
- ✅ 只生成 Markdown 文本
- ✅ 让思源原生处理转换
- ✅ 使用思源原生样式

**插件职责清晰化**：
```
插件：快速输入工具
    ↓
    提供便捷的选择面板
    生成标准的 Markdown 语法
    
思源：原生 Callout 处理
    ↓
    识别 [!TYPE] 语法
    转换为 NodeCallout DOM
    应用原生样式
```

---

**准备好进入下一阶段：编译测试！** 🚀
