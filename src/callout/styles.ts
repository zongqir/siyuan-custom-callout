import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig } from './types';
import { getThemeById, getDefaultTheme, generateThemeCSS, type ThemeStyle } from './themes/index';
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

/* 覆盖思源原生引用块的边框样式 */
.protyle-wysiwyg .bq[custom-callout]::before {
    display: none !important;
}

.protyle-wysiwyg .bq[custom-callout] {
    border-left: none !important;
}

/* 标题行样式 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    font-weight: 600 !important;
    font-size: 0.95em !important;
    margin-bottom: 12px !important;
    padding-left: 28px !important;
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
    font-size: 0.95em !important;
    font-weight: 600 !important;
    opacity: 1 !important;
    position: absolute !important;
    left: 28px !important;
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

    return styles.join('\n');
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

