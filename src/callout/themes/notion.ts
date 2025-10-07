import type { ThemeStyle } from './types';

/**
 * Notion 风格主题
 * 
 * 特点：
 * - 模仿 Notion 的 Callout 设计
 * - 浅色纯色背景
 * - 无边框，无阴影
 * - 左侧图标较大
 * - 紧凑的内边距
 * - 中性色调
 * 
 * 适用场景：知识管理、团队协作、项目文档
 */
export const notionTheme: ThemeStyle = {
    id: 'notion',
    name: 'Notion',
    description: 'Notion 应用风格，简洁中性',
    preview: '📋',
    
    // 基础样式
    borderRadius: '4px',
    borderWidth: '0px',
    leftBorderWidth: '0px',
    padding: '14px 16px',
    
    // 标题样式
    titleFontSize: '14px',
    titleFontWeight: '500',
    titlePadding: '0 0 8px 0',
    iconSize: '22px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.6',
    contentPadding: '0',
    
    // 视觉效果 - 纯色背景，无阴影
    boxShadow: 'none',
    backgroundOpacity: 1,
    hoverTransform: 'none',
    transition: 'background 0.1s ease',
    
    backgroundStyle: 'solid' as const
};

