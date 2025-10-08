import type { ThemeStyle } from './types';

/**
 * macOS 风格主题
 * 
 * 特点：
 * - 模仿 macOS Big Sur/Ventura 的设计语言
 * - 大圆角
 * - 柔和的阴影和层次感
 * - 纯色背景，不使用渐变
 * - 细腻的边框
 * 
 * 适用场景：Mac 用户、系统级提示、专业文档
 */
export const macosTheme: ThemeStyle = {
    id: 'macos',
    name: 'macOS',
    description: 'macOS 系统风格，大圆角纯色设计',
    preview: '🍎',
    
    // 基础样式
    borderRadius: '14px',
    borderWidth: '1px',
    leftBorderWidth: '0px',
    padding: '16px 18px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titleHeight: 'auto',
    titlePadding: '0 0 10px 0',
    iconSize: '19px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.6',
    contentPadding: '0',
    
    // 视觉效果 - 纯色背景，macOS 风格阴影
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 10px rgba(0, 0, 0, 0.04)',
    backgroundOpacity: 1,
    hoverTransform: 'scale(1.005)',
    transition: 'all 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)',
    
    // 背景样式
    backgroundStyle: 'solid' as const
};

