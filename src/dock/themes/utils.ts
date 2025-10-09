import type { OutlineThemeStyle, OutlineThemeExport } from './types';

/**
 * 生成大纲主题的CSS变量字符串
 */
export function generateOutlineThemeCSS(theme: OutlineThemeStyle): string {
    return `
        --outline-container-bg: ${theme.containerBackground};
        --outline-container-backdrop: ${theme.containerBackdropFilter};
        
        --outline-header-bg: ${theme.headerBackground};
        --outline-header-backdrop: ${theme.headerBackdropFilter};
        --outline-header-border: ${theme.headerBorder};
        --outline-header-padding: ${theme.headerPadding};
        --outline-header-title-color: ${theme.headerTitleColor};
        --outline-header-title-size: ${theme.headerTitleFontSize};
        --outline-header-title-weight: ${theme.headerTitleFontWeight};
        
        --outline-button-bg: ${theme.buttonBackground};
        --outline-button-border: ${theme.buttonBorder};
        --outline-button-radius: ${theme.buttonBorderRadius};
        --outline-button-hover-bg: ${theme.buttonHoverBackground};
        --outline-button-hover-border: ${theme.buttonHoverBorder};
        --outline-button-color: ${theme.buttonColor};
        
        --outline-list-bg: ${theme.listBackground};
        --outline-list-padding: ${theme.listPadding};
        --outline-list-gap: ${theme.listGap};
        
        --outline-scrollbar-width: ${theme.scrollbarWidth};
        --outline-scrollbar-track-bg: ${theme.scrollbarTrackBackground};
        --outline-scrollbar-thumb-bg: ${theme.scrollbarThumbBackground};
        --outline-scrollbar-thumb-hover-bg: ${theme.scrollbarThumbHoverBackground};
        
        --outline-card-radius: ${theme.cardBorderRadius};
        --outline-card-padding: ${theme.cardPadding};
        --outline-card-border: ${theme.cardBorder};
        --outline-card-transition: ${theme.cardTransition};
        --outline-card-hover-opacity: ${theme.cardHoverOpacity};
        
        --outline-card-header-gap: ${theme.cardHeaderGap};
        --outline-card-header-margin-bottom: ${theme.cardHeaderMarginBottom};
        
        --outline-icon-size: ${theme.iconSize};
        --outline-icon-filter: ${theme.iconFilter};
        
        --outline-label-padding: ${theme.labelPadding};
        --outline-label-radius: ${theme.labelBorderRadius};
        --outline-label-size: ${theme.labelFontSize};
        --outline-label-weight: ${theme.labelFontWeight};
        --outline-label-color: ${theme.labelColor};
        --outline-label-bg: ${theme.labelBackground};
        
        --outline-title-size: ${theme.titleFontSize};
        --outline-title-weight: ${theme.titleFontWeight};
        --outline-title-color: ${theme.titleColor};
        --outline-title-margin-bottom: ${theme.titleMarginBottom};
        --outline-title-line-height: ${theme.titleLineHeight};
        
        --outline-content-size: ${theme.contentFontSize};
        --outline-content-color: ${theme.contentColor};
        --outline-content-line-height: ${theme.contentLineHeight};
        --outline-content-margin-bottom: ${theme.contentMarginBottom};
        
        --outline-footer-padding-top: ${theme.footerPaddingTop};
        --outline-footer-border: ${theme.footerBorder};
        --outline-footer-opacity: ${theme.footerOpacity};
        --outline-footer-hover-opacity: ${theme.footerHoverOpacity};
        --outline-footer-icon-color: ${theme.footerIconColor};
        --outline-footer-icon-opacity: ${theme.footerIconOpacity};
        --outline-footer-icon-hover-opacity: ${theme.footerIconHoverOpacity};
        --outline-footer-icon-transform: ${theme.footerIconTransform};
        
        --outline-loading-spinner-border: ${theme.loadingSpinnerBorder};
        --outline-loading-spinner-border-top: ${theme.loadingSpinnerBorderTop};
        --outline-loading-text-color: ${theme.loadingTextColor};
        --outline-empty-icon-opacity: ${theme.emptyIconOpacity};
        --outline-empty-text-color: ${theme.emptyTextColor};
    `.trim();
}

/**
 * 导出大纲主题为JSON格式
 */
export function exportOutlineTheme(theme: OutlineThemeStyle, author?: string): OutlineThemeExport {
    return {
        version: '1.0.0',
        theme: theme,
        createdAt: new Date().toISOString(),
        author: author
    };
}

/**
 * 从JSON导入大纲主题
 */
export function importOutlineTheme(jsonData: string): OutlineThemeStyle | null {
    try {
        const exported: OutlineThemeExport = JSON.parse(jsonData);
        
        if (!exported.theme || typeof exported.theme !== 'object') {
            throw new Error('Invalid theme data');
        }
        
        // 基本验证
        const theme = exported.theme;
        if (!theme.id || !theme.name || !theme.description) {
            throw new Error('Missing required theme properties');
        }
        
        return theme;
    } catch (error) {
        console.error('Failed to import outline theme:', error);
        return null;
    }
}

/**
 * 验证大纲主题配置
 */
export function validateOutlineTheme(theme: Partial<OutlineThemeStyle>): string[] {
    const errors: string[] = [];
    
    // 必需字段检查
    const requiredFields = ['id', 'name', 'description', 'preview'];
    for (const field of requiredFields) {
        if (!theme[field as keyof OutlineThemeStyle]) {
            errors.push(`Missing required field: ${field}`);
        }
    }
    
    // CSS值格式检查（简单验证）
    const cssFields = [
        'containerBackground', 'headerBackground', 'headerPadding',
        'buttonBackground', 'cardBorderRadius', 'iconSize'
    ];
    
    for (const field of cssFields) {
        const value = theme[field as keyof OutlineThemeStyle];
        if (value && typeof value === 'string' && value.trim() === '') {
            errors.push(`Empty CSS value for field: ${field}`);
        }
    }
    
    return errors;
}
