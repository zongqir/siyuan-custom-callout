import type { ThemeStyle } from './types';

/**
 * 霓虹发光主题
 * 
 * 特点：
 * - 鲜艳的发光边框效果
 * - 外发光阴影
 * - 高对比度
 * - 悬停时缩放效果
 * 
 * 适用场景：游戏文档、科技主题、夜间模式
 */
export const neonTheme: ThemeStyle = {
    id: 'neon',
    name: '霓虹发光',
    description: '鲜艳的发光边框效果',
    preview: '💫',
    
    // 基础样式
    borderRadius: '10px',
    borderWidth: '2px',
    leftBorderWidth: '2px',
    padding: '16px 20px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '700',
    titlePadding: '0 0 12px 0',
    iconSize: '20px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.6',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: '0 0 20px rgba(var(--callout-color-rgb), 0.3)',
    backgroundOpacity: 0.95,
    hoverTransform: 'scale(1.02)',
    transition: 'all 0.2s ease',
    
    backgroundStyle: 'gradient' as const
};

