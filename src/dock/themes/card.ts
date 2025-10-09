import type { OutlineThemeStyle } from './types';

/**
 * 卡片风格大纲主题
 * 
 * 特点：
 * - 明显的卡片阴影
 * - 纯白背景
 * - 大圆角设计
 * - 悬停抬起效果
 * 
 * 适用场景：现代应用、产品文档、重要内容展示
 */
export const cardOutlineTheme: OutlineThemeStyle = {
    id: 'card',
    name: '卡片风格',
    description: '带阴影的卡片设计，层次感更强',
    preview: '🃏',
    
    // 容器样式
    containerBackground: '#ffffff',
    containerBackdropFilter: 'none',
    
    // 头部样式
    headerBackground: '#f8f9fa',
    headerBackdropFilter: 'none',
    headerBorder: '1px solid #e9ecef',
    headerPadding: '16px 20px',
    headerTitleColor: '#212529',
    headerTitleFontSize: '15px',
    headerTitleFontWeight: '600',
    
    // 按钮样式
    buttonBackground: '#ffffff',
    buttonBorder: '1px solid #dee2e6',
    buttonBorderRadius: '8px',
    buttonHoverBackground: '#f8f9fa',
    buttonHoverBorder: '1px solid #adb5bd',
    buttonColor: '#6c757d',
    
    // 列表样式
    listBackground: 'transparent',
    listPadding: '16px',
    listGap: '12px',
    
    // 滚动条样式
    scrollbarWidth: '8px',
    scrollbarTrackBackground: 'rgba(0, 0, 0, 0.05)',
    scrollbarThumbBackground: 'rgba(0, 0, 0, 0.15)',
    scrollbarThumbHoverBackground: 'rgba(0, 0, 0, 0.25)',
    
    // 卡片样式
    cardBorderRadius: '12px',
    cardPadding: '16px 18px',
    cardBorder: '1px solid rgba(0, 0, 0, 0.08)',
    cardTransition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    cardHoverOpacity: 1,
    
    // 卡片头部样式
    cardHeaderGap: '12px',
    cardHeaderMarginBottom: '12px',
    
    // 图标样式
    iconSize: '22px',
    iconFilter: 'brightness(0) invert(1)',
    
    // 标签样式
    labelPadding: '4px 12px',
    labelBorderRadius: '6px',
    labelFontSize: '12px',
    labelFontWeight: '600',
    labelColor: '#fff',
    labelBackground: 'rgba(0, 0, 0, 0.15)',
    
    // 标题和内容样式
    titleFontSize: '15px',
    titleFontWeight: '600',
    titleColor: '#fff',
    titleMarginBottom: '8px',
    titleLineHeight: '1.5',
    
    contentFontSize: '14px',
    contentColor: 'rgba(255, 255, 255, 0.9)',
    contentLineHeight: '1.6',
    contentMarginBottom: '10px',
    
    // 脚部样式
    footerPaddingTop: '8px',
    footerBorder: '1px solid rgba(255, 255, 255, 0.2)',
    footerOpacity: 0,
    footerHoverOpacity: 1,
    footerIconColor: '#fff',
    footerIconOpacity: 0.7,
    footerIconHoverOpacity: 1,
    footerIconTransform: 'translateX(3px)',
    
    // 加载和空状态样式
    loadingSpinnerBorder: '3px solid #e9ecef',
    loadingSpinnerBorderTop: '3px solid var(--b3-theme-primary, #4493f8)',
    loadingTextColor: '#6c757d',
    emptyIconOpacity: 0.25,
    emptyTextColor: '#adb5bd'
};
