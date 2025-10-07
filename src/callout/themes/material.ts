import type { ThemeStyle } from './types';

/**
 * Material Design 风格主题
 * 
 * 特点：
 * - 遵循 Google Material Design 3 规范
 * - 纯色背景
 * - 柔和的阴影（elevation）
 * - 小圆角
 * - 标准的间距系统（8dp grid）
 * 
 * 适用场景：Android 应用文档、Google 风格设计、现代 Web 应用
 */
export const materialTheme: ThemeStyle = {
    id: 'material',
    name: 'Material Design',
    description: 'Google Material Design 风格',
    preview: '🎯',
    
    // 基础样式
    borderRadius: '12px',
    borderWidth: '0px',
    leftBorderWidth: '0px',
    padding: '16px',
    
    // 标题样式
    titleFontSize: '14px',
    titleFontWeight: '600',
    titlePadding: '0 0 8px 0',
    iconSize: '20px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.5',
    contentPadding: '0',
    
    // 视觉效果 - Material elevation level 1
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    backgroundOpacity: 1,
    hoverTransform: 'translateY(-1px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    
    backgroundStyle: 'solid' as const
};

