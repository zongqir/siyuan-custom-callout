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
}

/* ==================== Callout 通用样式 ==================== */

/* 标题图标区域可点击提示 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    cursor: pointer !important;
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

/* 确保callout有最小高度，方便点击编辑 */
.protyle-wysiwyg .bq[custom-callout] {
    min-height: 60px !important;
    padding-bottom: 8px !important;
    cursor: text !important;
}

/* 编辑状态：显示原始内容，隐藏友好名称 */
.protyle-wysiwyg .bq[custom-callout][data-editing="true"] [data-callout-title="true"] {
    user-select: text !important;
    cursor: text !important;
}

.protyle-wysiwyg .bq[custom-callout][data-editing="true"] [data-callout-title="true"] * {
    display: inline !important;
    visibility: visible !important;
}

.protyle-wysiwyg .bq[custom-callout][data-editing="true"] [data-callout-title="true"]::before,
.protyle-wysiwyg .bq[custom-callout][data-editing="true"] [data-callout-title="true"]::after {
    display: none !important;
}

.protyle-wysiwyg .bq[custom-callout][data-editing="true"] [data-callout-title="true"] {
    padding-left: 0 !important;
}


/* 折叠状态下隐藏内容 */
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

/* 覆盖思源原生引述块的边框样式 */
.protyle-wysiwyg .bq[custom-callout]::before {
    display: none !important;
}

.protyle-wysiwyg .bq[custom-callout] {
    border-left: none !important;
}

/* 标题行样式 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    font-weight: var(--callout-title-font-weight) !important;
    font-size: var(--callout-title-font-size) !important;
    margin-bottom: 12px !important;
    padding-left: calc(var(--callout-icon-size) + 12px) !important;
    position: relative !important;
    display: block !important;
    color: transparent !important;
    line-height: 1.5 !important;
}

/* 隐藏原始命令文本 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] * {
    display: none !important;
    visibility: hidden !important;
}

/* 显示友好的标题名称 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"]::after {
    content: attr(data-callout-display-name) !important;
    font-size: var(--callout-title-font-size) !important;
    font-weight: var(--callout-title-font-weight) !important;
    opacity: 1 !important;
    position: absolute !important;
    left: calc(var(--callout-icon-size) + 12px) !important;
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
.protyle-wysiwyg .bq[custom-callout="${config.type}"] {
    background: ${background} !important;
    border: var(--callout-border-width) solid #e5e7eb !important;
    border-left: var(--callout-left-border-width) solid ${config.borderColor} !important;
    border-radius: var(--callout-border-radius) !important;
    padding: var(--callout-padding) !important;
    margin: 12px 0 !important;
    box-shadow: var(--callout-box-shadow) !important;
    transition: var(--callout-transition) !important;
}

/* 确保没有内边框 */
.protyle-wysiwyg .bq[custom-callout="${config.type}"] > div {
    border: none !important;
}

.protyle-wysiwyg .bq[custom-callout="${config.type}"] > div::before {
    display: none !important;
}

.protyle-wysiwyg .bq[custom-callout="${config.type}"]:hover {
    transform: var(--callout-hover-transform) !important;
    box-shadow: 0 4px 12px ${hexToRgba(config.color, 0.12)} !important;
}

.protyle-wysiwyg .bq[custom-callout="${config.type}"] [data-callout-title="true"]::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: var(--callout-icon-size);
    height: var(--callout-icon-size);
    background: url('data:image/svg+xml,${encodedIcon}') center/contain no-repeat;
}

.protyle-wysiwyg .bq[custom-callout="${config.type}"] [data-callout-title="true"]::after {
    color: ${config.color} !important;
    font-size: var(--callout-title-font-size) !important;
    font-weight: var(--callout-title-font-weight) !important;
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
    z-index: 10 !important;
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

