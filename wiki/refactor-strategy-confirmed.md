# 插件改造策略确认版（基于技术验证）

> ✅ 验证结果：思源原生支持 `> [!NOTE]` 自动转换为 Callout
> 
> 改造方案：轻量化设计，聚焦面板快速输入

---

## 一、核心改造思路（三点共识）

### 1️⃣ 面板功能定位：快速输出 + 人工触发

**你的理解**：
> "面板目的只是当我们选中之后，它快速给我们进行一次输出，然后在此基础上，再给我们人工触发一次回车"

**我的理解与补充**：

✅ **完全赞同**！这是最优雅的实现方式：

**工作流程**：
```
用户操作：快捷键（Ctrl+Shift+C）或斜杠命令 /callout
    ↓
弹出面板：显示所有 Callout 类型（复用现有菜单 UI）
    ↓
选择类型：键盘导航 / 字母过滤（复用现有交互逻辑）
    ↓
插入文本：> [!NOTE] Note
         > |光标在这里
    ↓
用户输入：继续输入内容
    ↓
按回车键：思源 Lute 自动识别并转换为原生 Callout DOM
    ↓
完成！
```

**关键优势**：
- ✅ 插件职责清晰：只负责"快速输入文本"
- ✅ 转换由思源负责：100% 兼容原生行为
- ✅ 用户体验自然：符合 Markdown 编辑习惯
- ✅ 代码极简：不需要处理复杂的 DOM 操作

**补充细节**：

**选项 A：插入后不自动触发回车**（推荐）
```typescript
// 插入的内容
const markdown = `> [!NOTE] Note\n> `;
//                              ↑ 光标停在这里
// 用户可以：
// 1. 直接输入内容
// 2. 修改标题
// 3. 按回车触发转换
```

**优点**：
- 用户有机会修改标题
- 符合 Markdown 编辑习惯
- 更灵活

**选项 B：插入后自动触发回车**（可选）
```typescript
// 插入后自动触发 Enter 事件
insertMarkdown(markdown);
triggerEnterKey(); // 自动转换
```

**优点**：
- 一步到位，更快
- 适合熟练用户

**缺点**：
- 无法修改标题
- 需要额外的事件模拟代码

**建议**：先实现选项 A（用户手动回车），后续可以通过配置项支持选项 B

---

### 2️⃣ CSS 逻辑对齐原生

**你的要求**：
> "原有的 CSS 逻辑还是要和原生的进行匹配"

**我的理解与补充**：

✅ **完全赞同**！具体策略如下：

#### 策略 A：完全删除自定义 Callout 样式（推荐）

**删除内容**：
```css
/* ❌ 全部删除 - 思源原生已经提供 */
.bq[custom-callout] { ... }                              // 600+ 行
.bq[custom-callout="note"] { ... }
.bq[custom-callout] [data-callout-title]::before { ... }
.bq[custom-callout] [data-callout-title]::after { ... }
/* ... 所有类型的样式 */
```

**保留内容**：
```css
/* ✅ 只保留面板 UI 样式 */
.callout-menu { ... }              // 菜单弹窗
.callout-menu-item { ... }         // 菜单项
.callout-menu-filter { ... }       // 过滤框
.callout-menu-item:hover { ... }   // 悬停效果
/* ... 其他面板相关样式 */
```

**验证方法**：
1. 在思源中手动创建一个原生 Callout
2. 用开发者工具查看应用的 CSS 类和变量
3. 确认思源原生样式已经足够完善
4. 如果有不足，再考虑"最小化补充"

#### 策略 B：最小化补充（如果原生样式不够）

**如果发现思源原生样式有以下问题**：
- 颜色不够丰富
- 图标显示不正确
- 某些类型缺失

**则保留最小化的补充样式**：
```css
/* ✅ 仅补充原生不足的部分 */
:root {
    /* 如果思源没有定义这些变量，则补充 */
    --b3-callout-custom1: #your-color;
    --b3-callout-custom2: #your-color;
}

.callout[data-subtype="CUSTOM1"] {
    /* 仅为自定义类型添加样式 */
    border-left-color: var(--b3-callout-custom1);
}
```

**原则**：
- 只补充，不覆盖
- 只扩展，不替换
- 保持与原生风格一致

---

### 3️⃣ 删除冗余代码 + 保证现有逻辑

**你的策略**：
> "后续删除一些冗余的代码，但我们先保证现有的逻辑"

**我的理解与补充**：

✅ **完全赞同**！这是稳妥的迭代策略。

#### 分阶段删除计划

**第一阶段：核心逻辑改造**（保守，风险低）
- ✅ 保留所有现有代码
- ✅ 只修改最核心的两个文件：
  - `manager.ts`：改变触发方式（从监听改为命令）
  - `menu.ts`：改变应用逻辑（从修改 DOM 改为插入文本）
- ✅ 其他代码暂时不动
- ✅ 完成后充分测试

**第二阶段：CSS 清理**（中等风险）
- 删除 `styles.ts` 中的 Callout 块样式
- 保留面板 UI 样式
- 删除主题系统文件
- 测试样式是否正常

**第三阶段：代码清理**（低风险）
- 删除 `processor.ts`（DOM 处理逻辑）
- 删除 `drag-resize.ts`（拖拽功能）
- 删除 `proxy-button.ts`（块标高亮）
- 清理不再使用的配置项

**每个阶段的原则**：
- ✅ 改完一点，测试一点
- ✅ 确认可用后再进入下一阶段
- ✅ 出问题随时回滚
- ✅ 保留 Git 分支记录

---

## 二、技术实施细节补充

### 核心修改点 1：命令注册（manager.ts）

**当前逻辑**：
```typescript
// ❌ 旧方式：监听 DOM 变化
setupEventListeners() {
    document.addEventListener('input', this.handleInput);
    document.addEventListener('focusin', this.handleFocusin);
    // ... 监听各种事件
}
```

**新逻辑**：
```typescript
// ✅ 新方式：注册命令
async initialize() {
    // ... 其他初始化

    // 注册快捷键命令
    this.plugin.addCommand({
        langKey: 'insertCallout',
        hotkey: '⌘⇧C', // Mac: Cmd+Shift+C, Windows: Ctrl+Shift+C
        callback: () => {
            this.showCalloutMenu();
        }
    });

    // TODO: 研究如何注册斜杠命令
    // this.plugin.addSlashCommand(...);
}

showCalloutMenu() {
    // 获取当前光标位置
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return;
    }
    const range = selection.getRangeAt(0);

    // 显示菜单（复用现有 CalloutMenu）
    this.menu.show(range);
}
```

**保留的功能**：
- ✅ 菜单 UI（完全复用）
- ✅ 键盘导航（完全复用）
- ✅ 过滤功能（完全复用）

**删除的功能**：
- ❌ DOM 监听器（不再需要）
- ❌ 引述块检测（不再需要）

---

### 核心修改点 2：应用逻辑（menu.ts）

**当前逻辑**：
```typescript
// ❌ 旧方式：修改现有引述块
applyCallout(type: CalloutTypeConfig) {
    const blockquote = this.currentBlockquote;
    const titleDiv = blockquote.querySelector('[data-callout-title]');
    titleDiv.textContent = `[!${type.command}] ${type.displayName}`;
    this.processor.processBlockquote(blockquote);
}
```

**新逻辑**：
```typescript
// ✅ 新方式：插入 Markdown 文本
applyCallout(type: CalloutTypeConfig, range: Range) {
    // 1. 构造 Markdown 文本
    const markdown = `> [!${type.command.toUpperCase()}] ${type.displayName}\n> `;
    
    // 2. 在光标位置插入文本
    this.insertMarkdown(markdown, range);
    
    // 3. 关闭菜单
    this.hide();
}

// 辅助方法：插入 Markdown
private insertMarkdown(markdown: string, range: Range) {
    // 方案 1：如果思源提供了 API
    // if (this.plugin.protyle?.insert) {
    //     this.plugin.protyle.insert(markdown);
    //     return;
    // }
    
    // 方案 2：直接 DOM 操作（兼容方案）
    const textNode = document.createTextNode(markdown);
    range.deleteContents();
    range.insertNode(textNode);
    
    // 设置光标位置（在第二行的 > 后面）
    range.setStart(textNode, markdown.lastIndexOf('>') + 2);
    range.collapse(true);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}
```

**保留的功能**：
- ✅ 类型选择逻辑（完全复用）
- ✅ 菜单交互（完全复用）

**修改的内容**：
- 🔄 应用方式：从"修改 DOM"改为"插入文本"
- 🔄 参数传递：从"blockquote 元素"改为"range 对象"

---

### 需要验证的 API 问题

**问题 1：思源是否提供文本插入 API？**

需要查文档确认：
```typescript
// 可能的 API 形式
protyle.insert(text: string): void
protyle.insertText(text: string): void
protyle.lute.insertMarkdown(text: string): void
```

**如果没有**：使用上面的 DOM 操作方案（可靠但略繁琐）

---

**问题 2：如何注册斜杠命令？**

需要查文档确认：
```typescript
// 可能的 API 形式
plugin.addSlashCommand({
    name: 'callout',
    description: '插入 Callout 块',
    callback: (protyle) => {
        this.showCalloutMenu();
    }
});
```

**如果不支持**：只用快捷键也可以

---

**问题 3：自动触发回车是否需要？**

如果用户要求"自动转换"，可能需要模拟回车：
```typescript
// 模拟回车键（可选功能）
private triggerEnter(element: HTMLElement) {
    const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(event);
}
```

**建议**：先不实现，让用户手动回车更灵活

---

## 三、代码改动量评估（保守方案）

### 第一阶段改动（最小改动）

**修改的文件**：
```
src/callout/
├── ✏️ manager.ts        - 约 50 行修改（注册命令，删除监听器）
└── ✏️ menu.ts           - 约 30 行修改（改变应用逻辑）
```

**保持不变**：
```
src/callout/
├── ✅ autocomplete.ts   - 完全不动
├── ✅ menu-styles.ts    - 完全不动
├── ✅ config.ts         - 完全不动
├── ✅ types.ts          - 完全不动
├── ✅ icons.ts          - 完全不动
├── ✅ colors.ts         - 完全不动
├── ⏸️ processor.ts      - 暂时保留（后续删除）
├── ⏸️ drag-resize.ts    - 暂时保留（后续删除）
├── ⏸️ proxy-button.ts   - 暂时保留（后续删除）
└── ⏸️ styles.ts         - 暂时保留（后续简化）
```

**风险评估**：
- 🟢 低风险：只改两个文件的核心逻辑
- 🟢 易回滚：改动少，容易恢复
- 🟢 易测试：功能单一，测试简单

---

### 第二阶段改动（CSS 清理）

**修改的文件**：
```
src/callout/
└── ✏️ styles.ts         - 删除 95% 内容，只保留面板样式
```

**删除的文件**：
```
src/callout/themes/
├── ❌ modern.ts
├── ❌ minimal.ts
├── ❌ ... (18 个主题文件)
└── ❌ index.ts
```

**风险评估**：
- 🟡 中风险：样式问题可能影响显示
- 🟢 易验证：直接看显示效果
- 🟢 易回滚：Git 可恢复

---

### 第三阶段改动（代码清理）

**删除的文件**：
```
src/callout/
├── ❌ processor.ts      (27.7KB)
├── ❌ drag-resize.ts    (49.6KB)
└── ❌ proxy-button.ts   (5.9KB)
```

**清理的配置**：
```typescript
// config.ts 中删除的配置项
export interface CalloutConfig {
    // ❌ 删除
    // themeId?: string;
    // themeOverrides?: ThemeOverrides;
    // hideIcon?: boolean;
    // hideTitle?: boolean;
    
    // ✅ 保留
    types: CalloutTypeConfig[];
    hiddenTypes?: string[];
    gridColumns?: number;
}
```

**风险评估**：
- 🟢 低风险：这些功能不再使用
- 🟢 易验证：功能测试
- 🟢 易回滚：Git 可恢复

---

## 四、测试清单（每阶段必做）

### 第一阶段测试（核心功能）

**功能测试**：
- [ ] 快捷键能否正常触发菜单？
- [ ] 菜单是否正常显示？
- [ ] 键盘导航是否正常？
- [ ] 字母过滤是否正常？
- [ ] 选择类型后是否插入正确的 Markdown？
- [ ] 光标位置是否正确？
- [ ] 用户按回车后，是否自动转换为 Callout？

**兼容性测试**：
- [ ] 在不同位置插入（文档开头、中间、末尾）
- [ ] 在列表中插入
- [ ] 在引述块中插入
- [ ] 在代码块后插入

**性能测试**：
- [ ] 菜单弹出速度是否够快？（< 200ms）
- [ ] 插入操作是否流畅？
- [ ] 无明显卡顿

---

### 第二阶段测试（样式验证）

**显示测试**：
- [ ] 转换后的 Callout 是否正常显示？
- [ ] 颜色是否正确？
- [ ] 图标是否正确？
- [ ] 标题是否正确？
- [ ] 内容格式是否正确？

**主题测试**：
- [ ] 在亮色主题下显示是否正常？
- [ ] 在暗色主题下显示是否正常？
- [ ] 切换主题后是否自动适配？

**类型测试**：
- [ ] 所有 5 种原生类型是否都正常？
- [ ] 如果有自定义类型，是否正常？

---

### 第三阶段测试（完整性验证）

**功能完整性**：
- [ ] 插件的核心功能是否都正常？
- [ ] 配置界面是否正常？
- [ ] 快捷键是否正常？

**系统集成**：
- [ ] 搜索功能是否能找到 Callout？
- [ ] 图谱是否显示 Callout 节点？
- [ ] 导出 Markdown 是否正确？
- [ ] 导出 PDF 是否正确？

**性能测试**：
- [ ] 插件加载速度是否正常？
- [ ] 长时间使用是否有内存泄漏？

---

## 五、总结与下一步

### 你的三点策略（我完全赞同）

1. ✅ **面板快速输出 + 人工触发回车**
   - 轻量化设计
   - 职责清晰
   - 用户体验自然

2. ✅ **CSS 对齐原生**
   - 删除自定义样式
   - 依赖思源原生
   - 保持一致性

3. ✅ **保守迭代，逐步删除冗余**
   - 先改核心逻辑
   - 充分测试后再删除
   - 分阶段进行

### 补充建议

**优先级排序**：
1. 🔴 **最高优先级**：第一阶段改造（核心逻辑）
2. 🟡 **中等优先级**：第二阶段改造（CSS 清理）
3. 🟢 **低优先级**：第三阶段改造（代码清理）

**风险控制**：
- 每个阶段都创建 Git 分支
- 每个阶段都充分测试
- 出问题立即回滚
- 保留详细的改动记录

**文档更新**：
- 同步更新用户文档
- 记录破坏性变更
- 提供迁移指南（如果需要）

---

## 六、现在可以开始吗？

**我的建议是：先不着急执行（你说得对）**

**下一步应该做的**：
1. ✅ 你再仔细看看这份文档
2. ✅ 确认是否还有遗漏或疑问
3. ✅ 确认技术方案的细节
4. ✅ 准备好测试环境
5. ✅ 创建开发分支

**然后再开始执行**：
- 我会帮你逐文件写出具体的修改代码
- 提供完整的测试清单
- 随时解答技术问题

---

**你觉得这个方案怎么样？还有什么需要补充或调整的吗？** 🤔
