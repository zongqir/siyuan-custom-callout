# 🎉 新功能：Callout Dock 大纲面板

## 功能概述

新增了一个优雅的 Dock 侧边栏面板，用于展示当前文档中的所有 Callout，提供快速浏览和跳转功能。

## 主要特性

### ✨ 美观的设计

- **卡片式布局**：每个 Callout 以精美卡片形式展示
- **保留原有主题**：使用 Callout 的原始图标、颜色和渐变背景
- **视觉层次**：左侧色条、类型标签、折叠指示器等细节
- **响应式交互**：Hover 悬浮、点击动画、高亮跳转

### 📋 内容展示

- **类型标识**：显示 Callout 类型图标和名称
- **标题显示**：智能提取标题（最多2行）
- **内容预览**：显示内容摘要（最多3行）
- **折叠状态**：展示是否折叠的视觉标记
- **数量统计**：顶部显示 Callout 总数徽章

### 🚀 智能功能

- **实时同步**：自动检测文档切换，每2秒自动刷新
- **防抖优化**：避免频繁重复查询，提升性能
- **手动刷新**：提供刷新按钮，支持手动更新
- **快速跳转**：点击卡片平滑滚动到目标位置
- **高亮反馈**：跳转后高亮显示2秒，带脉冲动画

### 🎯 交互体验

- **平滑滚动**：使用 `scrollIntoView` 平滑跳转
- **高亮效果**：思源内置的选中样式
- **脉冲动画**：轻微缩放效果增强反馈
- **加载状态**：旋转动画提示加载中
- **空状态**：友好的空白提示

## 技术实现

### 文件结构

```
src/
├── dock/
│   └── callout-outline.svelte    # Dock 面板组件
├── index.ts                        # 插件主文件（已更新）
public/
└── i18n/
    ├── zh_CN.json                 # 中文国际化（已更新）
    └── en_US.json                 # 英文国际化（已更新）
```

### 核心代码

#### 1. Dock 注册（`src/index.ts`）

```typescript
// 注册 Dock 面板
this.addDock({
    config: {
        position: "RightBottom",
        size: { width: 320, height: 0 },
        icon: "iconCallout",
        title: this.i18n.calloutOutline || "Callout 大纲",
    },
    type: DOCK_TYPE,
    init: (dock) => {
        // 创建 Svelte 组件
        this.dockPanel = new CalloutOutlineDock({
            target: container,
            props: { plugin: this }
        });
    }
});
```

#### 2. 数据查询（SQL）

```sql
SELECT b.id, b.content, b.markdown 
FROM blocks b 
WHERE b.root_id = '{docId}' 
AND b.type = 'b'
ORDER BY b.created ASC
```

#### 3. Callout 解析

- 支持标准格式：`[!type]` 或 `[!type|params]`
- 提取折叠标记：`+` 或 `-`
- 解析标题和内容
- 匹配类型配置

#### 4. 跳转动画

```typescript
// 平滑滚动
targetBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });

// 高亮效果
targetBlock.classList.add('protyle-wysiwyg--select');

// 脉冲动画
targetBlock.style.transform = 'scale(1.02)';
setTimeout(() => targetBlock.style.transform = 'scale(1)', 300);
```

### 性能优化

1. **防抖机制**：1秒内不重复查询
2. **按需加载**：只查询当前文档
3. **缓存文档ID**：避免无效更新
4. **错误容错**：查询失败不清空现有数据

## 设计亮点

### 🎨 视觉设计

1. **层次分明**
   - 头部：标题 + 操作按钮 + 数量徽章
   - 列表：滚动区域，间距合理
   - 卡片：左色条 + 图标 + 类型 + 标题 + 内容

2. **色彩系统**
   - 使用 Callout 原有的11种主题色
   - 半透明背景和渐变效果
   - 主题色边框和左侧色条

3. **动画细节**
   - Hover 悬浮：上移 2px + 阴影
   - 点击反馈：瞬间复位
   - 加载状态：旋转动画
   - 跳转动画：平滑滚动 + 高亮 + 脉冲

### 🔧 交互设计

1. **多种触发方式**
   - 点击卡片跳转
   - 键盘 Enter 跳转
   - 手动刷新按钮

2. **状态反馈**
   - 加载中：禁用刷新按钮，显示旋转图标
   - 空状态：友好的图标和文字提示
   - 错误处理：控制台警告，不影响使用

3. **用户友好**
   - Tooltip 提示
   - 无障碍支持（role, tabindex）
   - 响应式滚动条

## 使用场景

### 📚 长文档导航

在长篇文档中快速定位特定类型的 Callout：
- 重要提示 `[!info]`
- 概念解释 `[!concept]`
- 示例代码 `[!example]`
- 最佳实践 `[!best-practice]`

### 📝 内容审查

查看文档中所有 Callout 的概览：
- 检查是否遗漏重要说明
- 统计各类型 Callout 的数量
- 快速扫描关键信息

### 🔍 知识提取

提取文档的核心信息：
- 所有技巧 `[!tip]`
- 所有陷阱 `[!pitfall]`
- 所有总结 `[!summary]`

## 配置说明

### 国际化文本

**中文（zh_CN.json）**
```json
{
    "calloutOutline": "Callout 大纲",
    "noCallouts": "当前文档没有 Callout"
}
```

**英文（en_US.json）**
```json
{
    "calloutOutline": "Callout Outline",
    "noCallouts": "No callouts in current document"
}
```

### Dock 配置

- **位置**：右下角（RightBottom）
- **宽度**：320px
- **高度**：自适应
- **图标**：使用插件图标
- **类型**：`callout-outline-dock`

## 兼容性

- ✅ 思源笔记 v2.0+
- ✅ 所有 Callout 类型（11种）
- ✅ 中英文界面
- ✅ 明暗主题自适应
- ✅ 桌面端和移动端

## 后续优化计划

### 短期计划

- [ ] 添加搜索过滤功能
- [ ] 支持按类型分组显示
- [ ] 添加排序选项（创建时间、类型、标题）
- [ ] 显示 Callout 在文档中的位置（百分比）

### 长期计划

- [ ] 虚拟滚动优化（超过100个 Callout）
- [ ] 拖拽重排 Callout
- [ ] 导出 Callout 列表
- [ ] 批量操作（展开/折叠）
- [ ] 统计分析功能

## 开发者笔记

### 关键技术点

1. **Svelte 组件开发**
   - Props 传递插件实例
   - 生命周期管理（onMount, onDestroy）
   - 响应式状态更新

2. **思源 API 使用**
   - SQL 查询块数据
   - DOM 选择器查找元素
   - 平滑滚动和高亮

3. **性能优化**
   - 防抖避免频繁查询
   - 缓存减少重复加载
   - 错误容错保持体验

4. **TypeScript 类型**
   - 定义 CalloutItem 接口
   - 使用泛型和类型断言
   - 严格的类型检查

### 代码质量

- ✅ 无 linter 错误
- ✅ TypeScript 类型完整
- ✅ 代码注释清晰
- ✅ 遵循 Svelte 最佳实践

## 反馈与改进

欢迎提供使用反馈和改进建议！

- 🐛 Bug 反馈：提交 Issue
- 💡 功能建议：提交 Feature Request
- 📖 使用问题：查看使用说明文档

---

**开发者：** AI Assistant  
**版本：** v1.0.0  
**日期：** 2025-10-08  
**状态：** ✅ 已完成并测试

