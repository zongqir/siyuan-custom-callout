import type { OutlineThemeStyle } from './types';

/**
 * 暗黑主题大纲
 * 
 * 特点：
 * - 深色背景配色
 * - 柔和的对比度
 * - 夜间友好的视觉效果
 * - 减少眼部疲劳
 * 
 * 适用场景：夜间工作、暗色主题界面、护眼需求
 */
export const darkOutlineTheme: OutlineThemeStyle = {
    id: 'dark',
    name: '暗黑主题',
    description: '深色配色，护眼舒适',
    preview: '🌙',
    
    // 容器样式
    containerBackground: 'rgba(30, 30, 30, 0.95)',
    containerBackdropFilter: 'blur(20px)',
    
    // 头部样式
    headerBackground: 'rgba(40, 40, 40, 0.8)',
    headerBackdropFilter: 'blur(10px)',
    headerBorder: '1px solid rgba(255, 255, 255, 0.1)',
    headerPadding: '12px 16px',
    headerTitleColor: '#e0e0e0',
    headerTitleFontSize: '14px',
    headerTitleFontWeight: '600',
    
    // 按钮样式
    buttonBackground: 'rgba(60, 60, 60, 0.8)',
    buttonBorder: '1px solid rgba(255, 255, 255, 0.15)',
    buttonBorderRadius: '6px',
    buttonHoverBackground: 'rgba(80, 80, 80, 0.9)',
    buttonHoverBorder: '1px solid rgba(255, 255, 255, 0.25)',
    buttonColor: '#b0b0b0',
    
    // 列表样式
    listBackground: 'transparent',
    listPadding: '12px',
    listGap: '10px',
    
    // 滚动条样式
    scrollbarWidth: '6px',
    scrollbarTrackBackground: 'rgba(255, 255, 255, 0.05)',
    scrollbarThumbBackground: 'rgba(255, 255, 255, 0.2)',
    scrollbarThumbHoverBackground: 'rgba(255, 255, 255, 0.3)',
    
    // 卡片样式
    cardBorderRadius: '8px',
    cardPadding: '14px 16px',
    cardBorder: '1px solid var(--callout-color)',
    cardTransition: 'all 0.15s ease',
    cardHoverOpacity: 0.9,
    
    // 卡片头部样式
    cardHeaderGap: '10px',
    cardHeaderMarginBottom: '10px',
    
    // 图标样式
    iconSize: '20px',
    iconFilter: 'brightness(0) invert(1)',
    
    // 标签样式
    labelPadding: '3px 10px',
    labelBorderRadius: '4px',
    labelFontSize: '12px',
    labelFontWeight: '600',
    labelColor: '#fff',
    labelBackground: 'rgba(0, 0, 0, 0.3)',
    
    // 标题和内容样式
    titleFontSize: '14px',
    titleFontWeight: '600',
    titleColor: '#fff',
    titleMarginBottom: '6px',
    titleLineHeight: '1.6',
    
    contentFontSize: '13px',
    contentColor: 'rgba(255, 255, 255, 0.85)',
    contentLineHeight: '1.7',
    contentMarginBottom: '8px',
    
    // 脚部样式
    footerPaddingTop: '6px',
    footerBorder: '1px solid rgba(255, 255, 255, 0.15)',
    footerOpacity: 0,
    footerHoverOpacity: 1,
    footerIconColor: '#fff',
    footerIconOpacity: 0.7,
    footerIconHoverOpacity: 1,
    footerIconTransform: 'translateX(2px)',
    
    // 加载和空状态样式
    loadingSpinnerBorder: '3px solid #404040',
    loadingSpinnerBorderTop: '3px solid var(--b3-theme-primary, #4493f8)',
    loadingTextColor: '#b0b0b0',
    emptyIconOpacity: 0.3,
    emptyTextColor: '#808080'
};
