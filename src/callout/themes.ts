/**
 * Callout 主题风格系统
 */

export interface ThemeStyle {
    id: string;
    name: string;
    description: string;
    preview: string; // emoji预览
    
    // 基础样式
    borderRadius: string;          // 圆角大小
    borderWidth: string;           // 边框粗细
    leftBorderWidth: string;       // 左侧强调边框粗细
    padding: string;               // 内边距
    
    // 标题样式
    titleFontSize: string;         // 标题字体大小
    titleFontWeight: string;       // 标题字体粗细
    titlePadding: string;          // 标题内边距
    iconSize: string;              // 图标大小
    
    // 内容样式
    contentFontSize: string;       // 内容字体大小
    contentLineHeight: string;     // 内容行高
    contentPadding: string;        // 内容内边距
    
    // 视觉效果
    boxShadow: string;             // 阴影效果
    backgroundOpacity: number;     // 背景透明度 (0-1)
    hoverTransform: string;        // 悬停变换效果
    transition: string;            // 过渡动画
}

/**
 * 预设主题风格
 */
export const THEME_STYLES: ThemeStyle[] = [
    {
        id: 'modern',
        name: '现代简约',
        description: '简洁流畅的现代设计，适合日常使用',
        preview: '🎨',
        borderRadius: '8px',
        borderWidth: '1px',
        leftBorderWidth: '4px',
        padding: '16px',
        titleFontSize: '15px',
        titleFontWeight: '600',
        titlePadding: '0 0 12px 0',
        iconSize: '20px',
        contentFontSize: '14px',
        contentLineHeight: '1.6',
        contentPadding: '0',
        boxShadow: 'none',
        backgroundOpacity: 1,
        hoverTransform: 'none',
        transition: 'all 0.2s ease'
    },
    {
        id: 'card',
        name: '卡片风格',
        description: '带阴影的卡片设计，层次感更强',
        preview: '🃏',
        borderRadius: '12px',
        borderWidth: '0px',
        leftBorderWidth: '0px',
        padding: '20px',
        titleFontSize: '16px',
        titleFontWeight: '600',
        titlePadding: '0 0 14px 0',
        iconSize: '22px',
        contentFontSize: '14px',
        contentLineHeight: '1.7',
        contentPadding: '0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        backgroundOpacity: 1,
        hoverTransform: 'translateY(-2px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    {
        id: 'flat',
        name: '扁平设计',
        description: '纯色扁平风格，简单直接',
        preview: '📐',
        borderRadius: '4px',
        borderWidth: '0px',
        leftBorderWidth: '6px',
        padding: '14px 18px',
        titleFontSize: '15px',
        titleFontWeight: '700',
        titlePadding: '0 0 10px 0',
        iconSize: '18px',
        contentFontSize: '13px',
        contentLineHeight: '1.6',
        contentPadding: '0',
        boxShadow: 'none',
        backgroundOpacity: 0.9,
        hoverTransform: 'none',
        transition: 'all 0.15s ease'
    },
    {
        id: 'classic',
        name: '经典传统',
        description: '传统引用块样式，稳重大气',
        preview: '📚',
        borderRadius: '0px',
        borderWidth: '1px',
        leftBorderWidth: '5px',
        padding: '12px 16px',
        titleFontSize: '15px',
        titleFontWeight: '600',
        titlePadding: '0 0 10px 0',
        iconSize: '18px',
        contentFontSize: '14px',
        contentLineHeight: '1.5',
        contentPadding: '0',
        boxShadow: 'none',
        backgroundOpacity: 0.95,
        hoverTransform: 'none',
        transition: 'none'
    },
    {
        id: 'minimal',
        name: '极简主义',
        description: '极致简洁，只保留必要元素',
        preview: '⚪',
        borderRadius: '6px',
        borderWidth: '0px',
        leftBorderWidth: '3px',
        padding: '12px 16px',
        titleFontSize: '14px',
        titleFontWeight: '500',
        titlePadding: '0 0 8px 0',
        iconSize: '16px',
        contentFontSize: '13px',
        contentLineHeight: '1.5',
        contentPadding: '0',
        boxShadow: 'none',
        backgroundOpacity: 0.85,
        hoverTransform: 'none',
        transition: 'all 0.1s ease'
    },
    {
        id: 'glassmorphism',
        name: '毛玻璃',
        description: '模糊背景的现代玻璃质感',
        preview: '🔮',
        borderRadius: '16px',
        borderWidth: '1px',
        leftBorderWidth: '0px',
        padding: '18px 20px',
        titleFontSize: '15px',
        titleFontWeight: '600',
        titlePadding: '0 0 12px 0',
        iconSize: '20px',
        contentFontSize: '14px',
        contentLineHeight: '1.6',
        contentPadding: '0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backgroundOpacity: 0.7,
        hoverTransform: 'scale(1.01)',
        transition: 'all 0.3s ease'
    },
    {
        id: 'neumorphism',
        name: '新拟态',
        description: '柔和的凸起或凹陷效果',
        preview: '🎭',
        borderRadius: '20px',
        borderWidth: '0px',
        leftBorderWidth: '0px',
        padding: '20px 24px',
        titleFontSize: '15px',
        titleFontWeight: '600',
        titlePadding: '0 0 14px 0',
        iconSize: '20px',
        contentFontSize: '14px',
        contentLineHeight: '1.6',
        contentPadding: '0',
        boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)',
        backgroundOpacity: 1,
        hoverTransform: 'none',
        transition: 'all 0.3s ease'
    },
    {
        id: 'neon',
        name: '霓虹发光',
        description: '鲜艳的发光边框效果',
        preview: '💫',
        borderRadius: '10px',
        borderWidth: '2px',
        leftBorderWidth: '2px',
        padding: '16px 20px',
        titleFontSize: '15px',
        titleFontWeight: '700',
        titlePadding: '0 0 12px 0',
        iconSize: '20px',
        contentFontSize: '14px',
        contentLineHeight: '1.6',
        contentPadding: '0',
        boxShadow: '0 0 20px rgba(var(--callout-color-rgb), 0.3)',
        backgroundOpacity: 0.95,
        hoverTransform: 'scale(1.02)',
        transition: 'all 0.2s ease'
    }
];

/**
 * 获取默认主题
 */
export function getDefaultTheme(): ThemeStyle {
    return THEME_STYLES[0]; // 现代简约
}

/**
 * 根据ID获取主题
 */
export function getThemeById(id: string): ThemeStyle | undefined {
    return THEME_STYLES.find(theme => theme.id === id);
}

/**
 * 生成主题相关的CSS变量
 */
export function generateThemeCSS(theme: ThemeStyle): string {
    return `
        --callout-border-radius: ${theme.borderRadius};
        --callout-border-width: ${theme.borderWidth};
        --callout-left-border-width: ${theme.leftBorderWidth};
        --callout-padding: ${theme.padding};
        --callout-title-font-size: ${theme.titleFontSize};
        --callout-title-font-weight: ${theme.titleFontWeight};
        --callout-title-padding: ${theme.titlePadding};
        --callout-icon-size: ${theme.iconSize};
        --callout-content-font-size: ${theme.contentFontSize};
        --callout-content-line-height: ${theme.contentLineHeight};
        --callout-content-padding: ${theme.contentPadding};
        --callout-box-shadow: ${theme.boxShadow};
        --callout-background-opacity: ${theme.backgroundOpacity};
        --callout-hover-transform: ${theme.hoverTransform};
        --callout-transition: ${theme.transition};
    `.trim();
}

