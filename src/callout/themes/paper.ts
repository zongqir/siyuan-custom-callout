import type { ThemeStyle } from './types';

/**
 * Paper 纸质风格主题
 * 
 * 特点：
 * - 模拟纸张质感
 * - 纯色背景
 * - 柔和的下方阴影（纸张浮起效果）
 * - 无边框或细边框
 * - 温暖的色调
 * - 舒适的阅读体验
 * 
 * 适用场景：长文阅读、印刷风格文档、文学创作
 */
export const paperTheme: ThemeStyle = {
    id: 'paper',
    name: '纸质',
    description: '纸张质感，温暖舒适',
    preview: '📄',
    
    // 基础样式
    borderRadius: '2px',
    borderWidth: '0px',
    leftBorderWidth: '0px',
    padding: '18px 20px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titleHeight: 'auto',
    titlePadding: '0 0 12px 0',
    iconSize: '20px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.7',
    contentPadding: '0',
    
    // 视觉效果 - 纸张浮起效果
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06)',
    backgroundOpacity: 1,
    hoverTransform: 'translateY(-2px)',
    transition: 'all 0.25s ease',
    
    backgroundStyle: 'solid' as const
};

