import type { OutlineThemeStyle } from './types';

/**
 * 扁平设计大纲主题
 * 
 * 特点：
 * - 纯色背景，无阴影
 * - 小圆角设计
 * - 清晰的边框分割
 * - 简洁直接的视觉风格
 * 
 * 适用场景：简洁界面、极简设计、快速浏览
 */
export const flatOutlineTheme: OutlineThemeStyle = {
    id: 'flat',
    name: '扁平设计',
    description: '纯色扁平风格，简洁直接',
    preview: '⬜',
    
    // 容器样式
    containerBackground: '#ffffff',
    containerBackdropFilter: 'none',
    
    // 头部样式
    headerBackground: '#f5f5f5',
    headerBackdropFilter: 'none',
    headerBorder: '1px solid #e0e0e0',
    headerPadding: '10px 14px',
    headerTitleColor: '#333333',
    headerTitleFontSize: '13px',
    headerTitleFontWeight: '600',
    
    // 按钮样式
    buttonBackground: '#ffffff',  
    buttonBorder: '1px solid #d0d0d0',
    buttonBorderRadius: '4px',
    buttonHoverBackground: '#f0f0f0',
    buttonHoverBorder: '1px solid #b0b0b0',
    buttonColor: '#666666',
    
    // 列表样式
    listBackground: 'transparent',
    listPadding: '10px',
    listGap: '8px',
    
    // 滚动条样式
    scrollbarWidth: '8px',
    scrollbarTrackBackground: '#f0f0f0',
    scrollbarThumbBackground: '#c0c0c0',
    scrollbarThumbHoverBackground: '#a0a0a0',
    
    // 卡片样式
    cardBorderRadius: '4px',
    cardPadding: '12px 14px',
    cardBorder: '2px solid var(--callout-color)',
    cardTransition: 'all 0.2s ease',
    cardHoverOpacity: 0.85,
    
    // 卡片头部样式
    cardHeaderGap: '8px',
    cardHeaderMarginBottom: '8px',
    
    // 图标样式
    iconSize: '18px',
    iconFilter: 'brightness(0) invert(1)',
    
    // 标签样式
    labelPadding: '2px 8px',
    labelBorderRadius: '2px',
    labelFontSize: '11px',
    labelFontWeight: '700',
    labelColor: '#fff',
    labelBackground: 'rgba(0, 0, 0, 0.2)',
    
    // 标题和内容样式
    titleFontSize: '13px',
    titleFontWeight: '700',
    titleColor: '#fff',
    titleMarginBottom: '5px',
    titleLineHeight: '1.5',
    
    contentFontSize: '12px',
    contentColor: 'rgba(255, 255, 255, 0.95)',
    contentLineHeight: '1.6',  
    contentMarginBottom: '6px',
    
    // 脚部样式
    footerPaddingTop: '5px',
    footerBorder: '1px solid rgba(255, 255, 255, 0.3)',
    footerOpacity: 0,
    footerHoverOpacity: 1,
    footerIconColor: '#fff',
    footerIconOpacity: 0.9,
    footerIconHoverOpacity: 1,
    footerIconTransform: 'translateX(1px)',
    
    // 加载和空状态样式
    loadingSpinnerBorder: '2px solid #e0e0e0',
    loadingSpinnerBorderTop: '2px solid var(--b3-theme-primary, #4493f8)',
    loadingTextColor: '#666666',
    emptyIconOpacity: 0.2,
    emptyTextColor: '#999999'
};
