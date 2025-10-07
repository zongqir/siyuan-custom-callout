import type { ThemeStyle } from './types';

/**
 * 卡片风格主题
 * 
 * 特点：
 * - 带阴影的卡片设计
 * - 层次感更强
 * - 大圆角，较大内边距
 * - 悬停时上浮效果
 * 
 * 适用场景：重要提示、产品文档、营销材料
 */
export const cardTheme: ThemeStyle = {
    id: 'card',
    name: '卡片风格',
    description: '带阴影的卡片设计，层次感更强',
    preview: '🃏',
    
    // 基础样式
    borderRadius: '12px',
    borderWidth: '0px',
    leftBorderWidth: '0px',
    padding: '20px',
    
    // 标题样式
    titleFontSize: '16px',
    titleFontWeight: '600',
    titlePadding: '0 0 14px 0',
    iconSize: '22px',
    
    // 内容样式
    contentFontSize: '14px',
    contentLineHeight: '1.7',
    contentPadding: '0',
    
    // 视觉效果
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    backgroundOpacity: 1,
    hoverTransform: 'translateY(-2px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
};

