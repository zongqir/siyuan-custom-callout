# Changelog

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
