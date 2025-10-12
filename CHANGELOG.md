# Changelog

## v1.3.5 2025-10-12

### 📝 文档优化

* **README 精简重构**: 大幅简化文档，聚焦核心功能
  - 移除冗余的 FAQ 章节
  - 移除过度详细的功能介绍
  - 突出强调非侵入式设计理念
  - 保留核心触发方式和键盘快捷键说明
  - 文档从 350+ 行精简至 75 行

### 🔧 修复

* **Callout 触发优化**: 修复 Callout 触发相关 BUG
  - 优化触发逻辑，提升稳定性
  - 改善用户交互体验

* **只读模式优化**: 禁止只读模式下显示拖拽滑轨
  - 添加只读模式检测逻辑，支持多种检测方式
  - 只读模式下不创建拖拽手柄元素
  - CSS 层面强制隐藏只读模式下的拖拽手柄
  - 双重保护机制，确保只读模式下无法拖拽调整

* **拖拽手柄层级优化**: 降低 z-index 避免层级冲突
  - 将拖拽手柄 z-index 从 10 降低到 2
  - 减少与其他 UI 元素的层级冲突
  - 保持更合理的层级结构

## v1.3.3 2025-10-11

### 🎯 少即是多

* **删除冗余按钮**: 简化界面，提升用户体验
  - 移除新增按钮：简化 Callout 交互，减少干扰
  - 移除删除按钮：使用系统原生删除操作，保持一致性
  - 移除折叠按钮：移除折叠功能及相关业务逻辑
  - 删除 553 行冗余代码，提升性能和可维护性
  - 界面更加简洁美观，专注内容本身

### 🔧 修复

* **列表排版优化**: 修复列表竖线错位问题
  - 优化 CSS 样式，改善列表显示效果
  - 移除冗余按钮相关样式，减少样式冲突

## v1.3.2 2025-10-09

### 🔧 修复

* **命令面板触发优化**: 修复切换只读模式时意外弹出命令面板的问题
  - 在焦点事件监听中添加200ms防抖延迟
  - 只有当焦点真正停留在空blockquote上时才显示菜单
  - 避免系统操作（如切换只读模式）导致的快速焦点切换触发菜单
  - 最小化改动，仅影响焦点事件处理逻辑

### ✨ 新功能

* **大纲密度切换**: 新增 4 档显示密度快速切换功能
  - 🔧 自动模式：使用设置中的配置
  - 📌 极简模式：仅显示标题
  - 📏 紧凑模式：固定显示 1 行内容
  - 📋 全部模式：显示全部内容
  - 一键切换，提升浏览效率

* **单卡片展开/折叠**: 每个 Callout 卡片独立控制
  - 浮动按钮设计，悬停或点击时显示
  - 优先级最高，覆盖全局密度设置
  - 完美支持移动端（点击激活）
  - 美观的毛玻璃效果和动画

* **内容显示行数配置**: 可在设置面板自定义内容显示
  - 支持 1-5 行或全部显示
  - 下拉选择，操作便捷
  - 实时生效，无需刷新

### 🎨 UI/交互优化

* **精简卡片布局**: 移除底部返回按钮，节省空间
  - 直接点击卡片即可跳转
  - 界面更加简洁美观
  - 提升内容展示密度

* **自适应按钮样式**: 根据背景自动调整按钮颜色
  - 深色背景：白色图标 + 半透明黑色背景
  - 浅色背景：主题色图标 + 半透明白色背景
  - 深色文字模式：深色图标 + 浅色背景

* **移动端体验优化**: 完善触摸设备交互
  - 智能检测设备类型（hover 能力）
  - 移动端点击激活显示按钮
  - 点击外部区域自动取消激活

### 🔧 改进与修复

* **自动刷新机制**: 大纲内容实时同步
  - 监听 Callout 命令面板关闭事件
  - 监听 Callout 删除事件
  - 自动刷新大纲列表

* **内容提取优化**: 提升内容显示质量
  - 增加内容字符限制到 600 字符
  - 确保 5 行内容完整显示
  - 优化文本换行和截断

* **样式细节调整**: 提升视觉体验
  - 优化按钮悬停和点击动画
  - 调整卡片间距和内边距
  - 完善各主题下的显示效果

---

## v1.3.0 2025-10-09

### ✨ 新功能

* **Callout Line 大纲支持**: 新增 Callout 内容在大纲面板中的显示支持
  - 在侧边栏大纲面板中可以快速查看和定位 Callout 内容
  - 优化大纲显示效果，提升使用体验

### 🎨 优化改进

* **侧边栏面板快速简略升级**: 优化侧边栏面板的交互体验
* 修复若干已知问题，提升插件稳定性

---

## v1.2.1 2025-01-08

### 🐛 Bug Fixes

* **资源泄漏修复**: 修复插件卸载时未能正确清理资源的问题
  - 移除所有事件监听器（全局和元素级别）
  - 清理定时器（setInterval）
  - 断开所有观察者（MutationObserver, ResizeObserver）
  - 取消主题订阅
  - 移除动态创建的 DOM 元素

### 🔧 改进

* 添加完善的资源清理机制，确保插件可以安全地卸载和重新加载
* 防止内存泄漏和僵尸事件处理
* 提高插件稳定性和性能

### 📝 技术细节

修复的文件：
- `src/callout/processor.ts` - Callout 元素事件监听器清理
- `src/callout/manager.ts` - 全局事件监听器清理
- `src/callout/menu.ts` - 菜单资源和主题订阅清理
- `src/callout/autocomplete.ts` - 自动补全监听器清理
- `src/callout/menu-theme.ts` - 媒体查询监听器清理
- `src/callout/drag-resize.ts` - 拖拽相关资源清理
- `src/callout/proxy-button.ts` - 块标高亮资源清理

---

## v0.3.5 2024-04-30

* [Add `direction` to plugin method `Setting.addItem`](https://github.com/siyuan-note/siyuan/issues/11183)


## 0.3.4 2024-02-20

* [Add plugin event bus `click-flashcard-action`](https://github.com/siyuan-note/siyuan/issues/10318)

## 0.3.3 2024-01-24

* Update dock icon class

## 0.3.2 2024-01-09

* [Add plugin `protyleOptions`](https://github.com/siyuan-note/siyuan/issues/10090)
* [Add plugin api `uninstall`](https://github.com/siyuan-note/siyuan/issues/10063)
* [Add plugin method `updateCards`](https://github.com/siyuan-note/siyuan/issues/10065)
* [Add plugin function `lockScreen`](https://github.com/siyuan-note/siyuan/issues/10063)
* [Add plugin event bus `lock-screen`](https://github.com/siyuan-note/siyuan/pull/9967)
* [Add plugin event bus `open-menu-inbox`](https://github.com/siyuan-note/siyuan/pull/9967)


## 0.3.1 2023-12-06

* [Support `Dock Plugin` and `Command Palette` on mobile](https://github.com/siyuan-note/siyuan/issues/9926)

## 0.3.0 2023-12-05

* Upgrade Siyuan to 0.9.0
* Support more platforms

## 0.2.9 2023-11-28

* [Add plugin method `openMobileFileById`](https://github.com/siyuan-note/siyuan/issues/9738)


## 0.2.8 2023-11-15

* [`resize` cannot be triggered after dragging to unpin the dock](https://github.com/siyuan-note/siyuan/issues/9640)

## 0.2.7 2023-10-31

* [Export `Constants` to plugin](https://github.com/siyuan-note/siyuan/issues/9555)
* [Add plugin `app.appId`](https://github.com/siyuan-note/siyuan/issues/9538)
* [Add plugin event bus `switch-protyle`](https://github.com/siyuan-note/siyuan/issues/9454)

## 0.2.6 2023-10-24

* [Deprecated `loaded-protyle` use `loaded-protyle-static` instead](https://github.com/siyuan-note/siyuan/issues/9468)

## 0.2.5 2023-10-10

* [Add plugin event bus `open-menu-doctree`](https://github.com/siyuan-note/siyuan/issues/9351)

## 0.2.4 2023-09-19

* Supports use in windows
* [Add plugin function `transaction`](https://github.com/siyuan-note/siyuan/issues/9172)

## 0.2.3 2023-09-05

* [Add plugin function `transaction`](https://github.com/siyuan-note/siyuan/issues/9172)
* [Plugin API add openWindow and command.globalCallback](https://github.com/siyuan-note/siyuan/issues/9032)

## 0.2.2 2023-08-29

* [Add plugin event bus `destroy-protyle`](https://github.com/siyuan-note/siyuan/issues/9033)
* [Add plugin event bus `loaded-protyle-dynamic`](https://github.com/siyuan-note/siyuan/issues/9021)

## 0.2.1 2023-08-21

* [Plugin API add getOpenedTab method](https://github.com/siyuan-note/siyuan/issues/9002)
* [Plugin API custom.fn => custom.id in openTab](https://github.com/siyuan-note/siyuan/issues/8944)

## 0.2.0 2023-08-15

* [Add plugin event bus `open-siyuan-url-plugin` and `open-siyuan-url-block`](https://github.com/siyuan-note/siyuan/pull/8927)


## 0.1.12 2023-08-01

* Upgrade siyuan to 0.7.9

## 0.1.11

* [Add `input-search` event bus to plugins](https://github.com/siyuan-note/siyuan/issues/8725)


## 0.1.10

* [Add `bind this` example for eventBus in plugins](https://github.com/siyuan-note/siyuan/issues/8668)
* [Add `open-menu-breadcrumbmore` event bus to plugins](https://github.com/siyuan-note/siyuan/issues/8666)

## 0.1.9

* [Add `open-menu-xxx` event bus for plugins ](https://github.com/siyuan-note/siyuan/issues/8617)

## 0.1.8

* [Add protyleSlash to the plugin](https://github.com/siyuan-note/siyuan/issues/8599)
* [Add plugin API protyle](https://github.com/siyuan-note/siyuan/issues/8445)

## 0.1.7

* [Support build js and json](https://github.com/siyuan-note/plugin-sample/pull/8)

## 0.1.6

* add `fetchPost` example
