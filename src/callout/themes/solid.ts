import type { ThemeStyle } from './types';

/**
 * 纯色风格主题
 * 
 * 特点：
 * - 纯色背景，不使用任何渐变
 * - 无阴影，极简设计
 * - 中等圆角
 * - 细边框勾勒
 * - 清晰的色彩区分
 * 
 * 适用场景：色彩敏感设计、儿童教育、彩色编码系统
 */
export const solidTheme: ThemeStyle = {
    id: 'solid',
    name: '纯色',
    description: '纯色背景，不使用渐变',
    preview: '🎨',
    
    // 基础样式
    borderRadius: '8px',
    borderWidth: '1px',
    leftBorderWidth: '0px',
    padding: '16px 18px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titlePadding: '0 0 12px 0',
    iconSize: '20px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.6',
    contentPadding: '0',
    
    // 视觉效果 - 纯色，无阴影
    boxShadow: 'none',
    backgroundOpacity: 1,
    hoverTransform: 'none',
    transition: 'all 0.15s ease',
    
    // 背景样式
    backgroundStyle: 'solid' as const
};

