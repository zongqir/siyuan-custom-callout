import type { ThemeStyle } from './types';

/**
 * GitHub 风格主题
 * 
 * 特点：
 * - 模仿 GitHub Markdown Alert 风格
 * - 纯色背景
 * - 细腻的边框
 * - 小圆角
 * - 左侧色块强调
 * - 清晰的色彩语义
 * 
 * 适用场景：开源项目文档、技术博客、README 文件
 */
export const githubTheme: ThemeStyle = {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub Alert 风格，开发者友好',
    preview: '🐙',
    
    // 基础样式
    borderRadius: '6px',
    borderWidth: '1px',
    leftBorderWidth: '4px',
    padding: '14px 16px',
    
    // 标题样式
    titleFontSize: '14px',
    titleFontWeight: '600',
    titleHeight: 'auto',
    titlePadding: '0 0 8px 0',
    iconSize: '18px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.5',
    contentPadding: '0',
    
    // 视觉效果 - 纯色背景，无阴影
    boxShadow: 'none',
    backgroundOpacity: 1,
    hoverTransform: 'none',
    transition: 'border-color 0.15s ease',
    
    backgroundStyle: 'solid' as const
};

