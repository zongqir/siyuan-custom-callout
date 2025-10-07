import type { ThemeStyle } from './types';

/**
 * 新拟态主题
 * 
 * 特点：
 * - 柔和的凸起或凹陷效果
 * - 双向阴影设计
 * - 超大圆角
 * - 立体浮雕感
 * 
 * 适用场景：创意设计、UI展示、艺术类内容
 */
export const neumorphismTheme: ThemeStyle = {
    id: 'neumorphism',
    name: '新拟态',
    description: '柔和的凸起或凹陷效果',
    preview: '🎭',
    
    // 基础样式
    borderRadius: '20px',
    borderWidth: '0px',
    leftBorderWidth: '0px',
    padding: '20px 24px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titlePadding: '0 0 14px 0',
    iconSize: '20px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.6',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)',
    backgroundOpacity: 1,
    hoverTransform: 'none',
    transition: 'all 0.3s ease'
};

