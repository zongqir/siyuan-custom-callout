import type { OutlineThemeStyle } from './types';

/**
 * 极简主义大纲主题
 * 
 * 特点：
 * - 最小化的视觉元素
 * - 紧凑的布局
 * - 细线边框
 * - 小字体和图标
 * 
 * 适用场景：信息密集、专业工具、代码编辑器风格
 */
export const minimalOutlineTheme: OutlineThemeStyle = {
    id: 'minimal',
    name: '极简主义',
    description: '极致简洁，紧凑布局',
    preview: '▫️',
    
    // 容器样式
    containerBackground: '#fafafa',
    containerBackdropFilter: 'none',
    
    // 头部样式
    headerBackground: '#ffffff',
    headerBackdropFilter: 'none',
    headerBorder: '1px solid #e5e5e5',
    headerPadding: '8px 12px',
    headerTitleColor: '#222222',
    headerTitleFontSize: '12px',
    headerTitleFontWeight: '500',
    
    // 按钮样式
    buttonBackground: 'transparent',
    buttonBorder: '1px solid #d5d5d5',
    buttonBorderRadius: '2px',
    buttonHoverBackground: '#f5f5f5',
    buttonHoverBorder: '1px solid #b5b5b5',
    buttonColor: '#777777',
    
    // 列表样式
    listBackground: 'transparent',
    listPadding: '8px',
    listGap: '6px',
    
    // 滚动条样式
    scrollbarWidth: '4px',
    scrollbarTrackBackground: 'transparent',
    scrollbarThumbBackground: 'rgba(0, 0, 0, 0.15)',
    scrollbarThumbHoverBackground: 'rgba(0, 0, 0, 0.25)',
    
    // 卡片样式
    cardBorderRadius: '2px',
    cardPadding: '10px 12px',
    cardBorder: '1px solid var(--callout-color)',
    cardTransition: 'all 0.1s ease',
    cardHoverOpacity: 0.9,
    
    // 卡片头部样式
    cardHeaderGap: '6px',
    cardHeaderMarginBottom: '6px',
    
    // 图标样式
    iconSize: '16px',
    iconFilter: 'brightness(0) invert(1)',
    
    // 标签样式
    labelPadding: '1px 6px',
    labelBorderRadius: '1px',
    labelFontSize: '10px',
    labelFontWeight: '600',
    labelColor: '#fff',
    labelBackground: 'rgba(0, 0, 0, 0.2)',
    
    // 标题和内容样式
    titleFontSize: '12px',
    titleFontWeight: '600',
    titleColor: '#fff',
    titleMarginBottom: '4px',
    titleLineHeight: '1.4',
    
    contentFontSize: '11px',
    contentColor: 'rgba(255, 255, 255, 0.9)',
    contentLineHeight: '1.5',
    contentMarginBottom: '5px',
    
    // 脚部样式
    footerPaddingTop: '4px',
    footerBorder: '1px solid rgba(255, 255, 255, 0.25)',
    footerOpacity: 0,
    footerHoverOpacity: 1,
    footerIconColor: '#fff',
    footerIconOpacity: 0.8,
    footerIconHoverOpacity: 1,
    footerIconTransform: 'translateX(1px)',
    
    // 加载和空状态样式
    loadingSpinnerBorder: '2px solid #e5e5e5',
    loadingSpinnerBorderTop: '2px solid var(--b3-theme-primary, #4493f8)',
    loadingTextColor: '#777777',
    emptyIconOpacity: 0.15,
    emptyTextColor: '#aaaaaa'
};
