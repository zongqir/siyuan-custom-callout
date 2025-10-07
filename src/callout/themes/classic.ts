import type { ThemeStyle } from './types';

/**
 * 经典传统主题
 * 
 * 特点：
 * - 传统引用块样式
 * - 稳重大气
 * - 无圆角，直角设计
 * - 细边框 + 中等左边框
 * 
 * 适用场景：学术论文、正式文档、传统出版物
 */
export const classicTheme: ThemeStyle = {
    id: 'classic',
    name: '经典传统',
    description: '传统引用块样式，稳重大气',
    preview: '📚',
    
    // 基础样式
    borderRadius: '0px',
    borderWidth: '1px',
    leftBorderWidth: '5px',
    padding: '12px 16px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titlePadding: '0 0 10px 0',
    iconSize: '18px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.5',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: 'none',
    backgroundOpacity: 0.95,
    hoverTransform: 'none',
    transition: 'none',
    
    backgroundStyle: 'gradient' as const
};

