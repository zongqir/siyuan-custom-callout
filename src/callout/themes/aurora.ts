import type { ThemeStyle } from './types';

/**
 * Aurora 极光主题
 * 
 * 特点：
 * - 炫彩渐变背景
 * - 柔和的阴影
 * - 现代圆角
 * - 动态光效
 */
export const auroraTheme: ThemeStyle = {
    id: 'aurora',
    name: 'Aurora 极光',
    description: '炫彩渐变，如极光般绚丽',
    preview: '🌈',
    
    // 基础样式
    borderRadius: '16px',
    borderWidth: '0px',
    leftBorderWidth: '5px',
    padding: '18px 20px',
    
    // 标题样式
    titleFontSize: '1em',
    titleFontWeight: '700',
    titleHeight: 'auto',
    titlePadding: '0',
    iconSize: '22px',
    
    // 内容样式
    contentFontSize: '0.95em',
    contentLineHeight: '1.8',
    contentPadding: '12px 0 0 0',
    
    // 视觉效果
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 0 40px rgba(99, 102, 241, 0.1)',
    backgroundOpacity: 1,
    hoverTransform: 'translateY(-2px) scale(1.005)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // 背景样式
    backgroundStyle: 'gradient'
};

