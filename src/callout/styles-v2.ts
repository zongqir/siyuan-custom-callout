import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig } from './types';
import { getThemeById, getDefaultTheme, generateThemeCSS } from './themes/index';
import type { ThemeOverrides } from './config';

/**
 * 生成基于块属性的 Callout 样式
 * 
 * 核心改进：
 * 1. 使用 CSS 属性选择器 [custom-callout-type="xxx"] 而不是类名
 * 2. 更简洁的样式规则
 * 3. 更好的性能和可维护性
 */
export function generateCalloutStylesV2(
    customTypes?: CalloutTypeConfig[], 
    themeId?: string, 
    themeOverrides?: ThemeOverrides
): string {
    const styles: string[] = [];
    const types = customTypes || DEFAULT_CALLOUT_TYPES;
    let theme = themeId ? getThemeById(themeId) || getDefaultTheme() : getDefaultTheme();
    
    // 应用主题覆盖配置
    if (themeOverrides) {
        theme = { ...theme, ...themeOverrides };
    }

    // 处理隐藏选项
    const hideIcon = themeOverrides?.hideIcon || false;

    // ==================== 主题 CSS 变量 ====================
    styles.push(`
/* Callout V2 - 基于块属性的样式系统 */
:root {
    ${generateThemeCSS(theme)}
    
    /* 内部间距计算 */
    --callout-title-icon-gap: ${calculateIconGap(theme.padding)};
    --callout-title-margin-bottom: ${calculateTitleMargin(theme.padding)};
    --callout-list-indent: ${calculateListIndent(theme.padding)};
}
`);

    // （移除自定义属性路径，统一走原生 data-subtype）

    // ==================== Callout 通用样式 ====================
    styles.push(`
/* Callout 基础样式 */
.protyle-wysiwyg .bq[custom-callout] {
    position: relative;
    border-left: 4px solid var(--callout-border-color) !important;
    border-radius: var(--callout-border-radius) !important;
    padding: var(--callout-padding) !important;
    margin: 12px 0 !important;
    background: var(--callout-bg-gradient) !important;
    box-shadow: var(--callout-box-shadow) !important;
    transition: var(--callout-transition) !important;
}

/* 隐藏原生的 blockquote 装饰 */
.protyle-wysiwyg .bq[custom-callout] .protyle-action,
.protyle-wysiwyg .bq[custom-callout] .block__icon {
    display: none !important;
}

/* 隐藏原生 blockquote 的左侧竖线（伪元素）*/
.protyle-wysiwyg .bq[custom-callout]::before {
    display: none !important;
}

/* 保留原生的侧边栏拖拽按钮显示，不做额外隐藏 */

/* Callout 标题样式 */
.protyle-wysiwyg .bq[custom-callout] [data-callout-title="true"] {
    position: relative;
    font-weight: 600 !important;
    font-size: 15px !important;
    color: var(--callout-title-color) !important;
    margin-bottom: var(--callout-title-margin-bottom) !important;
    cursor: default !important;
    user-select: none !important;
    padding-left: 28px !important;
}

/* 图标容器 */
.protyle-wysiwyg .bq[custom-callout] .callout-icon {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    display: ${hideIcon ? 'none' : 'flex'} !important;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

/* 不自定义折叠按钮与折叠状态，沿用思源原生能力 */

/* Hover 效果 */
.protyle-wysiwyg .bq[custom-callout]:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    transform: translateY(-1px);
}

/* 列表样式优化 - 针对思源笔记的 NodeList 结构 */

/* 思源笔记的 NodeList 结构样式 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeList"] {
    margin: 8px 0 !important;
    padding-left: 0 !important;
    overflow: visible !important;
}

.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] {
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    min-height: calc(1.625em + 4px) !important;
    margin: 2px 0 !important;
    position: relative !important;
}

/* 列表竖线 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"]::before {
    content: "" !important;
    position: absolute !important;
    border-left: 0.5px solid var(--b3-theme-background-light) !important;
    left: 12px !important;
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

/* .protyle-action：显示列表项目符号（圆点、数字等） */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] > .protyle-action {
    left: 0 !important;
    position: absolute !important;
    width: 24px !important;
    top: 0 !important;
    transition: var(--b3-transition) !important;
    color: var(--b3-theme-on-surface) !important;
    justify-content: center !important;
    display: flex !important;
    align-items: center !important;
    word-break: keep-all !important;
    height: calc(1.625em + 4px) !important;
    line-height: calc(1.625em + 4px) !important;
}

/* 列表项内容左边距（为 .protyle-action 腾出空间） */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] > [data-node-id] {
    margin-left: 24px !important;
}

.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] > div[data-type="NodeParagraph"] {
    margin-left: 24px !important;
    padding-left: 0px !important;
}

/* 确保容器不会裁剪列表项目符号 */
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeList"],
.protyle-wysiwyg .bq[custom-callout] div[data-type="NodeListItem"] {
    overflow: visible !important;
}

/* 传统 HTML 列表样式（极少使用） */
.protyle-wysiwyg .bq[custom-callout] ul,
.protyle-wysiwyg .bq[custom-callout] ol {
    margin-left: 0 !important;
    padding-left: 24px !important;
}

.protyle-wysiwyg .bq[custom-callout] li {
    margin: 2px 0 !important;
    padding-left: 0px !important;
}
`);

    // （动态类型样式将放到文件后部，确保覆盖基础 reset）

    // ==================== 菜单样式 ====================
    styles.push(`
/* Callout 菜单 V2 */
.callout-menu-v2 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.callout-menu-v2:focus {
    outline: none;
}

.callout-menu-v2::-webkit-scrollbar {
    width: 6px;
}

.callout-menu-v2::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

.callout-menu-v2::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
    .callout-menu-v2 {
        background: #1f2937 !important;
        border-color: #374151 !important;
    }
    
    .callout-menu-title {
        color: #f9fafb !important;
        border-bottom-color: #374151 !important;
    }
    
    .callout-menu-item {
        border-color: #374151 !important;
    }
    
    .callout-menu-item:hover {
        background: #374151 !important;
    }
}
`);

    // ==================== 响应式设计 ====================
    styles.push(`
/* 移动端优化 */
@media (max-width: 768px) {
    .protyle-wysiwyg .bq[custom-callout] {
        padding: 12px !important;
    }
    
    .callout-menu-v2 {
        min-width: 90vw !important;
        max-width: 90vw !important;
    }
    
    .callout-menu-grid {
        grid-template-columns: repeat(2, 1fr) !important;
    }
}
`);

    // ==================== 打印样式 ====================
    styles.push(`
/* 打印优化（保持默认行为） */
@media print {
}
`);

    // ==================== 原生 callout 样式（基于 data-subtype） ====================
    styles.push(`
/* === 通用 callout 样式 === */
.callout {
    display: block;
    border-radius: 6px;
    padding: 10px 16px;
    margin: 8px 0;
    position: relative;
    background-color: white !important;
    color: var(--b3-theme-on-background);
    border-left: none !important;
    box-shadow: none !important;
}

/* 原生 callout 标题图标容器（与 .callout-info 文本并排） */
.protyle-wysiwyg .callout .callout-info .callout-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-right: 6px;
}
.protyle-wysiwyg .callout .callout-info .callout-icon svg {
    width: 20px;
    height: 20px;
}

/* === Note/Info —— 蓝色系 === */
.protyle-wysiwyg .callout[data-subtype="note" i],
.protyle-wysiwyg .callout[data-subtype="info" i] {
    border-left: 0.25em solid #1f6feb !important;
    background-color: rgba(247, 250, 255, 0.8) !important;
}
.protyle-wysiwyg .callout[data-subtype="note" i] .callout-info,
.protyle-wysiwyg .callout[data-subtype="info" i] .callout-info {
    color: #1f6feb;
}

/* === Tip —— 绿色系 === */
.protyle-wysiwyg .callout[data-subtype="tip" i] {
    border-left: 0.25em solid #238636 !important;
    background-color: rgba(238, 250, 240, 0.8) !important;
}
.protyle-wysiwyg .callout[data-subtype="tip" i] .callout-info {
    color: #238636;
}

/* === IMPORTANT —— 全新紫色系 (#9E75E7) === */
.protyle-wysiwyg .callout[data-subtype="important" i] {
    border-left: 0.25em solid #9E75E7 !important;
    background-color: rgba(158, 117, 231, 0.12) !important;
}
.protyle-wysiwyg .callout[data-subtype="important" i] .callout-info {
    color: #9E75E7;
}

/* === Warning —— 橙色系 === */
.protyle-wysiwyg .callout[data-subtype="warning" i] {
    border-left: 0.25em solid #e3b341 !important;
    background-color: rgba(255, 250, 235, 0.8) !important;
}
.protyle-wysiwyg .callout[data-subtype="warning" i] .callout-info {
    color: #e3b341;
}

/* === Caution —— 红色系 === */
.protyle-wysiwyg .callout[data-subtype="caution" i] {
    border-left: 0.25em solid #d1242f !important;
    background-color: rgba(255, 240, 240, 0.8) !important;
}
.protyle-wysiwyg .callout[data-subtype="caution" i] .callout-info {
    color: #d1242f;
}

/* === 移除默认 ::before 竖线 === */
.callout:before {
    background: transparent !important;
    width: 0 !important;
}
`);

    // 动态类型样式（原生 data-subtype，后置覆盖基础 reset）
    types.forEach(config => {
        const zh = (config.zhCommand || '').replace(/^\[!|\]$/g, '');
        const aliases: string[] = [config.type];
        if (zh) aliases.push(zh);
        if (config.displayName) aliases.push(config.displayName);
        const calloutSel = aliases.map(a => `.protyle-wysiwyg .callout[data-subtype="${a}" i]`).join(',\n');
        const calloutInfoSel = aliases.map(a => `.protyle-wysiwyg .callout[data-subtype="${a}" i] .callout-info`).join(',\n');
        styles.push(`
${calloutSel} {
    border-left: 0.25em solid ${config.borderColor} !important;
    background: ${config.bgGradient} !important;
}
${calloutInfoSel} {
    color: ${config.color};
}
`);
    });

    return styles.join('\n');
}

/**
 * 计算图标间距
 */
function calculateIconGap(padding: string): string {
    const paddingValue = parseInt(padding);
    return `${Math.max(8, paddingValue / 2)}px`;
}

/**
 * 计算标题下边距
 */
function calculateTitleMargin(padding: string): string {
    const paddingValue = parseInt(padding);
    return `${Math.max(8, paddingValue / 2)}px`;
}

/**
 * 计算列表缩进
 */
function calculateListIndent(padding: string): string {
    const paddingValue = parseInt(padding);
    return `${paddingValue}px`;
}

/**
 * 为单个 Callout 类型生成样式
 */
export function generateSingleTypeStyle(config: CalloutTypeConfig): string {
    return `
.protyle-wysiwyg .bq[custom-callout-type="${config.type}"] {
    --callout-border-color: ${config.borderColor};
    --callout-bg-gradient: ${config.bgGradient};
    --callout-title-color: ${config.color};
}
`;
}

/**
 * 动态更新样式
 */
export function updateCalloutStyles(
    styleElementId: string,
    customTypes?: CalloutTypeConfig[],
    themeId?: string,
    themeOverrides?: ThemeOverrides
) {
    let styleElement = document.getElementById(styleElementId) as HTMLStyleElement;
    
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleElementId;
        document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = generateCalloutStylesV2(customTypes, themeId, themeOverrides);
}

