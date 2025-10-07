import type { ThemeStyle } from './types';

/**
 * 扁平设计主题
 * 
 * 特点：
 * - 纯色扁平风格
 * - 简单直接
 * - 粗左边框，无其他边框
 * - 无圆角或小圆角
 * 
 * 适用场景：技术文档、极简风格网站
 */
export const flatTheme: ThemeStyle = {
    id: 'flat',
    name: '扁平设计',
    description: '纯色扁平风格，简单直接',
    preview: '📐',
    
    // 基础样式
    borderRadius: '4px',
    borderWidth: '0px',
    leftBorderWidth: '6px',
    padding: '14px 18px',
    
    // 标题样式
    titleFontSize: '15px',
    titleFontWeight: '700',
    titlePadding: '0 0 10px 0',
    iconSize: '18px',
    
    // 内容样式
    contentFontSize: '13px',
    contentLineHeight: '1.6',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: 'none',
    backgroundOpacity: 0.9,
    hoverTransform: 'none',
    transition: 'all 0.15s ease'
};

