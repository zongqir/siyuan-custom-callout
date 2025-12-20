import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig } from './types';
import { getThemeById, getDefaultTheme, generateThemeCSS } from './themes/index';
import type { ThemeOverrides } from './config';

/**
 * 生成Callout样式
 */
export function generateCalloutStyles(customTypes?: CalloutTypeConfig[], themeId?: string, themeOverrides?: ThemeOverrides): string {
    const styles: string[] = [];
    const types = customTypes || DEFAULT_CALLOUT_TYPES;
    let theme = themeId ? getThemeById(themeId) || getDefaultTheme() : getDefaultTheme();
    
    // 应用主题覆盖配置
    if (themeOverrides) {
        theme = { ...theme, ...themeOverrides };
    }

    // 处理隐藏选项
    const hideIcon = themeOverrides?.hideIcon || false;
    const hideTitle = themeOverrides?.hideTitle || false;

    // 主题CSS变量
    styles.push(`
/* ==================== Callout 主题变量 ==================== */
:root {
    ${generateThemeCSS(theme)}
    
    /* 动态计算的内部间距 - 基于padding值 */
    --callout-title-icon-gap: ${calculateIconGap(theme.padding)};
    --callout-title-margin-bottom: ${calculateTitleMargin(theme.padding)};
    --callout-list-indent: ${calculateListIndent(theme.padding)};
}

/* ==================== Callout 通用样式 ==================== */

/* 移除原生 callout 的左边竖线 */
.callout::before {
    background: transparent !important;
    width: 0 !important;
}

/* 标题区域只读样式 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    cursor: default !important;
    position: relative;
}

.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"]::before {
    cursor: pointer !important;
    transition: var(--callout-transition) !important;
}

.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"]:hover::before {
    transform: translateY(-50%) scale(1.1) !important;
    opacity: 0.8 !important;
}

/* 折叠功能样式 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    user-select: none !important;
}

/* 折叠状态下隐藏内容，但不影响按钮 */  
.protyle-wysiwyg .bq[custom-callout][data-collapsed="true"] > div:not(:first-child) {
    display: none !important;
}


/* 折叠状态下的视觉效果 */
.protyle-wysiwyg .bq[custom-callout][data-collapsed="true"] {
    padding: 4px 12px !important;
    cursor: pointer !important;
    margin: 4px 0 !important;
    min-height: auto !important;
}

.protyle-wysiwyg .bq[custom-callout][data-collapsed="true"] [data-callout-title="true"] {
    margin-bottom: 0 !important;
    line-height: 1.2 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}

.protyle-wysiwyg .bq[custom-callout][data-collapsed="true"]:hover {
    opacity: 0.85 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* 隐藏系统图标和原生边框 */
.protyle-wysiwyg .bq[custom-callout] .protyle-action,
.protyle-wysiwyg .bq[custom-callout] .block__icon {
    display: none !important;
}

/* 只让有橙色callout高亮按钮附近的段落按钮变得极不明显，避免误触 */
.protyle-gutters button.callout-gutter-highlight + button.ariaLabel[data-type="NodeParagraph"],
.protyle-gutters button.ariaLabel[data-type="NodeParagraph"] + button.callout-gutter-highlight ~ button.ariaLabel[data-type="NodeParagraph"] {
    opacity: 0.005 !important;  /* 几乎完全透明 */
    transition: opacity 0.4s ease !important;
    pointer-events: auto !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}

/* 悬停有橙色按钮的块标区域时稍微增加一点可见度 */
.protyle-gutters:has(button.callout-gutter-highlight):hover button.callout-gutter-highlight + button.ariaLabel[data-type="NodeParagraph"] {
    opacity: 0.015 !important;   /* 悬停时稍微增加一点点透明度 */
}

/* 直接悬停callout附近的段落按钮时需要长时间才会更明显 */
.protyle-gutters button.callout-gutter-highlight + button.ariaLabel[data-type="NodeParagraph"]:hover {
    opacity: 0.05 !important;   /* 直接悬停按钮时稍微增加透明度 */
    transition-delay: 1.5s !important;  /* 延迟1.5秒才生效，避免误触 */
}

/* 特别针对callout附近段落按钮的图标 */
.protyle-gutters button.callout-gutter-highlight + button.ariaLabel[data-type="NodeParagraph"] svg use[xlink:href="#iconParagraph"] {
    opacity: 0.005 !important;
    transition: opacity 0.4s ease !important;
}

.protyle-gutters button.callout-gutter-highlight + button.ariaLabel[data-type="NodeParagraph"]:hover svg use[xlink:href="#iconParagraph"] {
    opacity: 0.05 !important;
    transition-delay: 1.5s !important;
}

/* 覆盖思源原生引述块的边框样式 */
.protyle-wysiwyg .bq[custom-callout]::before {
    display: none !important;
}

.protyle-wysiwyg .bq[custom-callout] {
    border-left: none !important;
    overflow: visible !important;
}

/* 标题行样式 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    font-weight: var(--callout-title-font-weight) !important;
    font-size: var(--callout-title-font-size) !important;
    min-height: var(--callout-title-height) !important;
    margin-bottom: var(--callout-title-margin-bottom, 12px) !important;
    padding-left: calc(var(--callout-icon-size) + var(--callout-title-icon-gap, 12px)) !important;
    position: relative !important;
    display: block !important;
    color: transparent !important;
    line-height: 1.5 !important;
}

/* 修复Callout内列表样式 - 针对思源笔记的NodeList结构 */

/* 传统HTML列表样式（极少使用，主要是 NodeList 系统） */
.protyle-wysiwyg .bq[custom-callout] ul,
.protyle-wysiwyg .bq[custom-callout] ol {
    margin-left: 0 !important;
    padding-left: 24px !important; /* 与 .protyle-action 宽度保持一致 */
}

.protyle-wysiwyg .bq[custom-callout] li {
    margin: 2px 0 !important;
    padding-left: 0px !important;
}

/* 思源笔记的NodeList结构样式 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeList"] {
    margin: 8px 0 !important;
    padding-left: 0 !important;
    overflow: visible !important;
}

.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] {
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    /* 使用紧凑的间距：4px 代替原生的 8px */
    min-height: calc(1.625em + 4px) !important;
    margin: 2px 0 !important;
}

/* 🔥 核心修复：使用思源原生系统（点和线是整体），只调整尺寸以适应紧凑布局 */
/* 
 * 思源原生系统（保持不变的逻辑）：
 *   - .protyle-action 显示项目符号
 *   - 子元素有 margin-left 为 .protyle-action 腾出空间
 *   - 竖线在 .protyle-action 的中间（left: action宽度 / 2）
 * 
 * Callout 紧凑调整（只改尺寸）：
 *   - .protyle-action 宽度从 34px 缩小到 24px
 *   - 竖线对应在 12px（24px 的中间）
 *   - 间距从 8px 缩小到 4px
 */

/* 竖线样式：位置在缩小后的 .protyle-action 中间 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"]::before {
    content: "" !important;
    position: absolute !important;
    border-left: 0.5px solid var(--b3-theme-background-light) !important;
    /* 24px 宽度的一半 = 12px */
    left: 12px !important;
    /* 紧凑间距：4px 代替 12px */
    height: calc(100% - 1em * 1.625 - 4px) !important;
    top: calc(1em * 1.625 + 4px) !important;
}

/* 悬停时高亮竖线 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"]:hover::before {
    border-left-color: var(--b3-scroll-color) !important;
}

/* 折叠状态下隐藏竖线 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"][fold="1"]::before {
    content: none !important;
}

/* .protyle-action：显示项目符号的容器，缩小尺寸 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] > .protyle-action {
    left: 0 !important;
    position: absolute !important;
    /* 从 34px 缩小到 24px */
    width: 24px !important;
    top: 0 !important;
    transition: var(--b3-transition) !important;
    color: var(--b3-theme-on-surface) !important;
    justify-content: center !important;
    display: flex !important;
    align-items: center !important;
    word-break: keep-all !important;
    /* 高度适应紧凑间距 */
    height: calc(1.625em + 4px) !important;
    line-height: calc(1.625em + 4px) !important;
}

/* 子元素左边距：为缩小后的 .protyle-action 腾出空间 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] > [data-node-id] {
    margin-left: 24px !important;
}

/* NodeParagraph 不需要额外的 margin-left（已经通过父规则设置） */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] > div[data-type="NodeParagraph"] {
    margin-left: 24px !important;
    padding-left: 0px !important;
}


/* 有序列表、任务列表等：保持思源原生行为，通过 .protyle-action 显示标记 */
/* 不再使用 CSS 的 list-style-type，而是依赖思源的 JavaScript 和 .protyle-action 系统 */

/* 确保容器不会裁剪列表项目符号 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeList"],
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] {
    overflow: visible !important;
}

/* 嵌套列表样式（HTML ul/ol - 极少使用） */
.protyle-wysiwyg .bq[custom-callout] ul ul,
.protyle-wysiwyg .bq[custom-callout] ol ol {
    margin: 2px 0 !important;
}

/* 隐藏原始命令文本 - 只针对文本节点，不影响用户添加的HTML元素 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    color: transparent !important;
}

/* 显示友好的标题名称 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"]::after {
    content: attr(data-callout-display-name) !important;
    font-size: var(--callout-title-font-size) !important;
    font-weight: var(--callout-title-font-weight) !important;
    opacity: 1 !important;
    position: absolute !important;
    left: calc(var(--callout-icon-size) + var(--callout-title-icon-gap, 12px)) !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    line-height: 1 !important;
}
`);

    // 为每个Callout类型生成样式
    types.forEach(config => {
        const encodedIcon = encodeURIComponent(config.icon);
        
        // 根据主题决定背景样式：纯色或渐变
        const background = theme.backgroundStyle === 'solid' 
            ? `rgba(${hexToRgb(config.color)}, 0.08)` // 纯色：使用主题色的8%透明度
            : config.bgGradient; // 渐变：使用预设渐变

        styles.push(`
/* ${config.displayName} - ${config.color} */
.callout[data-subtype="${config.type}"] {
    background: ${background} !important;
    border: var(--callout-border-width) solid #e5e7eb !important;
    border-left: var(--callout-left-border-width) solid ${config.borderColor} !important;
    border-radius: var(--callout-border-radius) !important;
    padding: var(--callout-padding) !important;
    margin: 12px 0 !important;
    box-shadow: var(--callout-box-shadow) !important;
    transition: var(--callout-transition) !important;
    overflow: visible !important;
}

/* 确保没有内边框，并且不裁剪列表项目符号 */
.callout[data-subtype="${config.type}"] > div {
    border: none !important;
    overflow: visible !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
}

.callout[data-subtype="${config.type}"] > div::before {
    display: none !important;
}

.callout[data-subtype="${config.type}"]:hover {
    transform: var(--callout-hover-transform) !important;
    box-shadow: 0 4px 12px ${hexToRgba(config.color, 0.12)} !important;
}

.callout[data-subtype="${config.type}"] .callout-info {
    color: ${config.color} !important;
}
`);
    });

    // 应用全局隐藏设置
    if (hideIcon || hideTitle) {
        styles.push(`
/* ==================== 全局隐藏设置 ==================== */`);
        
        if (hideIcon) {
            styles.push(`
/* 全局隐藏图标 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"]::before {
    display: none !important;
}

.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    padding-left: 0 !important;
}

.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"]::after {
    left: 0 !important;
}
`);
        }
        
        if (hideTitle) {
            styles.push(`
/* 全局隐藏标题文字 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"]::after {
    display: none !important;
}

.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    min-height: 0 !important;
    margin-bottom: 0 !important;
}
`);
        }
        
        if (hideIcon && hideTitle) {
            styles.push(`
/* 同时隐藏图标和标题 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    display: none !important;
}
`);
        }
    }

    // 添加边注功能CSS
    styles.push(generateMarginNoteCSS());

    // 添加拖拽调整功能CSS
    styles.push(generateDragResizeCSS());

    // 添加代理按钮CSS
    styles.push(generateProxyButtonCSS());

    return styles.join('\n');
}

/**
 * 生成宽度设置功能CSS - 只保留宽度调整功能
 */
function generateMarginNoteCSS(): string {
    return `
/* ==================== 宽度设置功能样式 ==================== */

/* 宽度设置 - 只在设置了宽度后生效 */
.protyle-wysiwyg .bq[custom-callout][data-margin-width] {
    width: var(--margin-width, 100%) !important;
    max-width: var(--margin-width, 100%) !important;
    margin: 16px auto !important;
    display: block !important;
}

/* 响应式处理 - 小屏幕时恢复全宽 */
@media (max-width: 768px) {
    .protyle-wysiwyg .bq[custom-callout][data-margin-width] {
        width: 100% !important;
        max-width: none !important;
    }
}
`;
}

/**
 * 生成拖拽调整功能CSS
 */
function generateDragResizeCSS(): string {
    return `
/* ==================== 拖拽调整功能样式 ==================== */

/* 拖拽状态下的样式 */
.protyle-wysiwyg .bq[custom-callout].callout-resizing {
    transition: none !important;
    user-select: none !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
}

/* 拖拽手柄基础样式 */
.callout-resize-handle {
    position: absolute !important;
    right: -8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 16px !important;
    height: 40px !important;
    cursor: ew-resize !important;
    z-index: 2 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    opacity: 0 !important;
    transition: opacity 0.2s ease !important;
    background: rgba(0, 0, 0, 0.1) !important;
    border-radius: 8px !important;
    backdrop-filter: blur(4px) !important;
}

/* 拖拽手柄悬停效果 */
.callout-resize-handle:hover {
    opacity: 1 !important;
    background: rgba(0, 0, 0, 0.15) !important;
}

/* 拖拽手柄内部样式 */
.resize-handle-inner {
    width: 6px !important;
    height: 20px !important;
    background: #666 !important;
    border-radius: 3px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background 0.2s ease !important;
}

/* 拖拽手柄点状图案 */
.resize-handle-dots {
    width: 2px !important;
    height: 12px !important;
    background: repeating-linear-gradient(
        to bottom, 
        #fff 0, 
        #fff 1px, 
        transparent 1px, 
        transparent 3px
    ) !important;
    border-radius: 1px !important;
}

/* 拖拽时的全局样式 */
body.dragging-callout {
    cursor: ew-resize !important;
    user-select: none !important;
}

/* 只读模式下隐藏拖拽手柄 */
.protyle-wysiwyg[contenteditable="false"] .callout-resize-handle,
.protyle--readonly .callout-resize-handle {
    display: none !important;
}

/* 响应式：在小屏幕上隐藏拖拽手柄 */
@media (max-width: 768px) {
    .callout-resize-handle {
        display: none !important;
    }
}

/* 确保callout容器有相对定位 */
.protyle-wysiwyg .bq[custom-callout] {
    position: relative !important;
}

/* 拖拽时的手柄高亮效果 */
.callout-resize-handle.active {
    opacity: 1 !important;
    background: rgba(66, 153, 225, 0.2) !important;
}

.callout-resize-handle.active .resize-handle-inner {
    background: #4299e1 !important;
}
`;
}

/**
 * 生成块标高亮CSS
 */
function generateProxyButtonCSS(): string {
    return `
/* ==================== Callout 块标高亮样式 ==================== */

/* 高亮 callout 的块标按钮 */
.protyle-gutters button.callout-gutter-highlight {
    position: relative !important;
    background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%) !important;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35) !important;
    border: none !important;
    border-radius: 6px !important;
    cursor: grab !important;
    transition: all 0.25s ease !important;
    overflow: visible !important;
}

/* 拖动时的光标 */
.protyle-gutters button.callout-gutter-highlight:active {
    cursor: grabbing !important;
    transform: scale(0.95) !important;
}

/* 高亮按钮的 SVG 图标 */
.protyle-gutters button.callout-gutter-highlight svg {
    filter: brightness(0) invert(1) !important;
    opacity: 1 !important;
}

/* 悬停时加强效果 */
.protyle-gutters button.callout-gutter-highlight:hover {
    background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%) !important;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.45) !important;
    transform: translateY(-2px) !important;
}
`;
}

/**
 * 将十六进制颜色转换为RGB
 */
function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

/**
 * 将十六进制颜色转换为RGBA
 */
function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 根据padding值计算标题图标间距
 * padding越小，图标间距也越小
 */
function calculateIconGap(padding: string): string {
    // 解析padding值，提取水平方向的值
    const values = padding.split(' ').map(v => parseInt(v));
    const horizontalPadding = values.length === 2 ? values[1] : values[0];
    
    // 当padding为0-8时，gap为0-4px
    // 当padding为8-16时，gap为4-8px  
    // 当padding为16+时，gap为8-12px
    if (horizontalPadding <= 4) {
        return '0px';
    } else if (horizontalPadding <= 8) {
        return `${Math.round(horizontalPadding * 0.5)}px`;
    } else if (horizontalPadding <= 16) {
        return `${Math.round(4 + (horizontalPadding - 8) * 0.5)}px`;
    } else {
        return `${Math.min(12, Math.round(8 + (horizontalPadding - 16) * 0.25))}px`;
    }
}

/**
 * 根据padding值计算标题下方间距
 */
function calculateTitleMargin(padding: string): string {
    const values = padding.split(' ').map(v => parseInt(v));
    const verticalPadding = values[0];
    
    // 标题下方间距随垂直padding缩放，最小4px，最大12px
    if (verticalPadding <= 4) {
        return '4px';
    } else if (verticalPadding <= 16) {
        return `${Math.round(4 + (verticalPadding - 4) * 0.67)}px`;
    } else {
        return '12px';
    }
}

/**
 * 根据padding值计算列表缩进
 */
function calculateListIndent(padding: string): string {
    const values = padding.split(' ').map(v => parseInt(v));
    const horizontalPadding = values.length === 2 ? values[1] : values[0];
    
    // 列表缩进随水平padding缩放，最小4px，最大16px
    if (horizontalPadding <= 4) {
        return '4px';
    } else if (horizontalPadding <= 16) {
        return `${Math.round(4 + (horizontalPadding - 4) * 0.67)}px`;
    } else {
        return '12px';
    }
}

