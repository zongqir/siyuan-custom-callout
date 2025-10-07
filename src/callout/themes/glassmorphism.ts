import type { ThemeStyle } from './types';

/**
 * 毛玻璃主题
 * 
 * 特点：
 * - 模糊背景的现代玻璃质感
 * - 半透明效果
 * - 大圆角，柔和阴影
 * - 悬停时微缩放
 * 
 * 适用场景：现代UI设计、Mac风格应用、时尚内容
 */
export const glassmorphismTheme: ThemeStyle = {
    id: 'glassmorphism',
    name: '毛玻璃',
    description: '模糊背景的现代玻璃质感',
    preview: '🔮',
    
    // 基础样式
    borderRadius: '16px',
    borderWidth: '1px',
    leftBorderWidth: '0px',
    padding: '18px 20px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titlePadding: '0 0 12px 0',
    iconSize: '20px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.6',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backgroundOpacity: 0.7,
    hoverTransform: 'scale(1.01)',
    transition: 'all 0.3s ease'
};

