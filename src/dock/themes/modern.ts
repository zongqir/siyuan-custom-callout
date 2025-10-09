import type { OutlineThemeStyle } from './types';

/**
 * 现代毛玻璃大纲主题（默认）
 * 
 * 特点：
 * - 毛玻璃背景效果
 * - 半透明和模糊背景
 * - 现代化圆角设计
 * - 优雅的阴影和过渡效果
 * 
 * 适用场景：现代应用、Mac风格界面
 */
export const modernOutlineTheme: OutlineThemeStyle = {
    id: 'modern',
    name: '现代毛玻璃',
    description: '毛玻璃背景效果，现代化设计',
    preview: '🔮',
    
    // 容器样式
    containerBackground: 'rgba(255, 255, 255, 0.7)',
    containerBackdropFilter: 'blur(20px)',
    
    // 头部样式
    headerBackground: 'rgba(255, 255, 255, 0.5)',
    headerBackdropFilter: 'blur(10px)',
    headerBorder: '1px solid rgba(0, 0, 0, 0.08)',
    headerPadding: '12px 16px',
    headerTitleColor: '#333',
    headerTitleFontSize: '14px',
    headerTitleFontWeight: '600',
    
    // 按钮样式
    buttonBackground: 'rgba(255, 255, 255, 0.6)',
    buttonBorder: '1px solid rgba(0, 0, 0, 0.15)',
    buttonBorderRadius: '6px',
    buttonHoverBackground: 'rgba(255, 255, 255, 0.8)',
    buttonHoverBorder: '1px solid rgba(0, 0, 0, 0.25)',
    buttonColor: '#666',
    
    // 列表样式
    listBackground: 'transparent',
    listPadding: '12px',
    listGap: '10px',
    
    // 滚动条样式
    scrollbarWidth: '6px',
    scrollbarTrackBackground: 'rgba(0, 0, 0, 0.03)',
    scrollbarThumbBackground: 'rgba(0, 0, 0, 0.2)',
    scrollbarThumbHoverBackground: 'rgba(0, 0, 0, 0.3)',
    
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
    labelBackground: 'rgba(0, 0, 0, 0.15)',
    
    // 标题和内容样式
    titleFontSize: '14px',
    titleFontWeight: '600',
    titleColor: '#fff',
    titleMarginBottom: '6px',
    titleLineHeight: '1.6',
    
    contentFontSize: '13px',
    contentColor: 'rgba(255, 255, 255, 0.9)',
    contentLineHeight: '1.7',
    contentMarginBottom: '8px',
    
    // 脚部样式
    footerPaddingTop: '6px',
    footerBorder: '1px solid rgba(255, 255, 255, 0.2)',
    footerOpacity: 0,
    footerHoverOpacity: 1,
    footerIconColor: '#fff',
    footerIconOpacity: 0.8,
    footerIconHoverOpacity: 1,
    footerIconTransform: 'translateX(2px)',
    
    // 加载和空状态样式
    loadingSpinnerBorder: '3px solid #e0e0e0',
    loadingSpinnerBorderTop: '3px solid var(--b3-theme-primary, #4493f8)',
    loadingTextColor: '#666',
    emptyIconOpacity: 0.3,
    emptyTextColor: '#999'
};
