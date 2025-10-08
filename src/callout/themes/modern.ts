import type { ThemeStyle } from './types';

/**
 * 现代简约主题
 * 
 * 特点：
 * - 简洁流畅的现代设计
 * - 适合日常使用
 * - 中等圆角，适度内边距
 * - 无阴影，清爽干净
 * 
 * 适用场景：通用文档、笔记、知识库
 */
export const modernTheme: ThemeStyle = {
    id: 'modern',
    name: '现代简约',
    description: '简洁流畅的现代设计，适合日常使用',
    preview: '🎨',
    
    // 基础样式
    borderRadius: '8px',
    borderWidth: '1px',
    leftBorderWidth: '4px',
    padding: '16px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titleHeight: 'auto',
    titlePadding: '0 0 12px 0',
    iconSize: '20px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.6',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: 'none',
    backgroundOpacity: 1,
    hoverTransform: 'none',
    transition: 'all 0.2s ease',
    
    // 背景样式
    backgroundStyle: 'gradient' as const
};

