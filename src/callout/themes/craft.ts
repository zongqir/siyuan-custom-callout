import type { ThemeStyle } from './types';

/**
 * Craft 风格主题
 * 
 * 特点：
 * - 模仿 Craft 文档应用的设计
 * - 纯色背景，不使用渐变
 * - 细腻柔和的阴影
 * - 温暖的色调
 * - 精致的间距和留白
 * 
 * 适用场景：个人笔记、创意写作、设计文档
 */
export const craftTheme: ThemeStyle = {
    id: 'craft',
    name: 'Craft',
    description: '温暖精致的 Craft 风格，纯色设计',
    preview: '📝',
    
    // 基础样式
    borderRadius: '10px',
    borderWidth: '0px',
    leftBorderWidth: '0px',
    padding: '18px 20px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titlePadding: '0 0 10px 0',
    iconSize: '20px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.65',
    contentPadding: '0',
    
    // 视觉效果 - 纯色背景，柔和阴影
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.04)',
    backgroundOpacity: 1,
    hoverTransform: 'translateY(-1px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // 背景样式
    backgroundStyle: 'solid' as const
};

