import type { ThemeStyle } from './types';

/**
 * 极简主义主题
 * 
 * 特点：
 * - 极致简洁
 * - 只保留必要元素
 * - 细边框，小图标
 * - 低对比度，轻透明
 * 
 * 适用场景：简约风笔记、个人博客、禅意设计
 */
export const minimalTheme: ThemeStyle = {
    id: 'minimal',
    name: '极简主义',
    description: '极致简洁，只保留必要元素',
    preview: '⚪',
    
    // 基础样式
    borderRadius: '6px',
    borderWidth: '0px',
    leftBorderWidth: '3px',
    padding: '12px 16px',
    
    // 标题样式
    titleFontSize: '14px',
    titleFontWeight: '500',
    titlePadding: '0 0 8px 0',
    iconSize: '16px',
    
    // 内容样式
    contentFontSize: '13px',
    contentLineHeight: '1.5',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: 'none',
    backgroundOpacity: 0.85,
    hoverTransform: 'none',
    transition: 'all 0.1s ease'
};

