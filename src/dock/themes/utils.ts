import type { OutlineThemeStyle, OutlineThemeExport } from './types';
import type { OutlineOverrides } from '../../callout/config';

/**
 * 生成大纲主题的CSS变量字符串
 */
export function generateOutlineThemeCSS(theme: OutlineThemeStyle, overrides?: OutlineOverrides): string {
    // 应用样式覆盖
    const finalTheme = applyOutlineOverrides(theme, overrides);

    return `
        --outline-container-bg: ${finalTheme.containerBackground};
        --outline-container-backdrop: ${finalTheme.containerBackdropFilter};
        
        --outline-header-bg: ${finalTheme.headerBackground};
        --outline-header-backdrop: ${finalTheme.headerBackdropFilter};
        --outline-header-border: ${finalTheme.headerBorder};
        --outline-header-padding: ${finalTheme.headerPadding};
        --outline-header-title-color: ${finalTheme.headerTitleColor};
        --outline-header-title-size: ${finalTheme.headerTitleFontSize};
        --outline-header-title-weight: ${finalTheme.headerTitleFontWeight};
        
        --outline-button-bg: ${finalTheme.buttonBackground};
        --outline-button-border: ${finalTheme.buttonBorder};
        --outline-button-radius: ${finalTheme.buttonBorderRadius};
        --outline-button-hover-bg: ${finalTheme.buttonHoverBackground};
        --outline-button-hover-border: ${finalTheme.buttonHoverBorder};
        --outline-button-color: ${finalTheme.buttonColor};
        
        --outline-list-bg: ${finalTheme.listBackground};
        --outline-list-padding: ${finalTheme.listPadding};
        --outline-list-gap: ${finalTheme.listGap};
        
        --outline-scrollbar-width: ${finalTheme.scrollbarWidth};
        --outline-scrollbar-track-bg: ${finalTheme.scrollbarTrackBackground};
        --outline-scrollbar-thumb-bg: ${finalTheme.scrollbarThumbBackground};
        --outline-scrollbar-thumb-hover-bg: ${finalTheme.scrollbarThumbHoverBackground};
        
        --outline-card-radius: ${finalTheme.cardBorderRadius};
        --outline-card-padding: ${finalTheme.cardPadding};
        --outline-card-border: ${finalTheme.cardBorder};
        --outline-card-transition: ${finalTheme.cardTransition};
        --outline-card-hover-opacity: ${finalTheme.cardHoverOpacity};
        
        --outline-card-header-gap: ${finalTheme.cardHeaderGap};
        --outline-card-header-margin-bottom: ${finalTheme.cardHeaderMarginBottom};
        
        --outline-icon-size: ${finalTheme.iconSize};
        --outline-icon-filter: ${finalTheme.iconFilter};
        
        --outline-label-padding: ${finalTheme.labelPadding};
        --outline-label-radius: ${finalTheme.labelBorderRadius};
        --outline-label-size: ${finalTheme.labelFontSize};
        --outline-label-weight: ${finalTheme.labelFontWeight};
        --outline-label-color: ${finalTheme.labelColor};
        --outline-label-bg: ${finalTheme.labelBackground};
        
        --outline-title-size: ${finalTheme.titleFontSize};
        --outline-title-weight: ${finalTheme.titleFontWeight};
        --outline-title-color: ${finalTheme.titleColor};
        --outline-title-margin-bottom: ${finalTheme.titleMarginBottom};
        --outline-title-line-height: ${finalTheme.titleLineHeight};
        
        --outline-content-size: ${finalTheme.contentFontSize};
        --outline-content-color: ${finalTheme.contentColor};
        --outline-content-line-height: ${finalTheme.contentLineHeight};
        --outline-content-margin-bottom: ${finalTheme.contentMarginBottom};
        
        --outline-footer-padding-top: ${finalTheme.footerPaddingTop};
        --outline-footer-border: ${finalTheme.footerBorder};
        --outline-footer-opacity: ${finalTheme.footerOpacity};
        --outline-footer-hover-opacity: ${finalTheme.footerHoverOpacity};
        --outline-footer-icon-color: ${finalTheme.footerIconColor};
        --outline-footer-icon-opacity: ${finalTheme.footerIconOpacity};
        --outline-footer-icon-hover-opacity: ${finalTheme.footerIconHoverOpacity};
        --outline-footer-icon-transform: ${finalTheme.footerIconTransform};
        
        --outline-loading-spinner-border: ${finalTheme.loadingSpinnerBorder};
        --outline-loading-spinner-border-top: ${finalTheme.loadingSpinnerBorderTop};
        --outline-loading-text-color: ${finalTheme.loadingTextColor};
        --outline-empty-icon-opacity: ${finalTheme.emptyIconOpacity};
        --outline-empty-text-color: ${finalTheme.emptyTextColor};
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

/**
 * 应用大纲样式覆盖
 */
function applyOutlineOverrides(theme: OutlineThemeStyle, overrides?: OutlineOverrides): OutlineThemeStyle {
    if (!overrides) return theme;
    
    console.log('Applying outline overrides:', overrides);
    
    const result = { ...theme };
    
    // 卡片大小调整 - 只影响垂直方向，实现极窄卡片
    if (overrides.cardSize && overrides.cardSize !== 'default') {
        const sizeMap = {
            'compact': { 
                padding: '6px 14px',     // 极窄：只压缩垂直padding
                gap: '4px',              // 卡片间距
                headerGap: '6px',        // 卡片头部间距
                marginBottom: '4px'      // 卡片头部下边距
            },
            'normal': { 
                padding: '12px 14px',    // 标准：正常垂直padding
                gap: '8px',
                headerGap: '8px',
                marginBottom: '8px'
            },
            'large': { 
                padding: '18px 14px',    // 宽松：增加垂直padding
                gap: '12px',
                headerGap: '12px',
                marginBottom: '12px'
            }
        };
        
        const size = sizeMap[overrides.cardSize];
        if (size) {
            result.cardPadding = size.padding;
            result.listGap = size.gap;
            result.cardHeaderGap = size.headerGap;
            result.cardHeaderMarginBottom = size.marginBottom;
            console.log('Applied card size:', overrides.cardSize, size);
        }
    }
    
    // 整个dock的背景透明度调整 - 包括容器和标题
    if (overrides.backgroundOpacity && overrides.backgroundOpacity !== 1.0) {
        result.containerBackground = adjustOpacity(result.containerBackground, overrides.backgroundOpacity);
        result.headerBackground = adjustOpacity(result.headerBackground, overrides.backgroundOpacity);
        console.log('Applied dock background opacity:', overrides.backgroundOpacity);
    }
    
    // 字体大小覆盖 - 直接应用数值
    if (overrides.titleFontSize && overrides.titleFontSize !== 'default') {
        result.titleFontSize = overrides.titleFontSize + 'px';
        console.log('Applied title font size:', overrides.titleFontSize + 'px');
    }
    if (overrides.contentFontSize && overrides.contentFontSize !== 'default') {
        result.contentFontSize = overrides.contentFontSize + 'px';
        console.log('Applied content font size:', overrides.contentFontSize + 'px');
    }
    if (overrides.iconSize && overrides.iconSize !== 'default') {
        result.iconSize = overrides.iconSize + 'px';
        console.log('Applied icon size:', overrides.iconSize + 'px');
    }
    
    // 其他覆盖
    if (overrides.cardPadding) result.cardPadding = overrides.cardPadding;
    if (overrides.cardBorderRadius) result.cardBorderRadius = overrides.cardBorderRadius;
    if (overrides.cardGap) result.listGap = overrides.cardGap;
    if (overrides.listPadding) result.listPadding = overrides.listPadding;
    if (overrides.headerPadding) result.headerPadding = overrides.headerPadding;
    
    // 视觉效果
    if (overrides.showBorder === false) {
        result.cardBorder = 'none';
        result.headerBorder = 'none';
        console.log('Disabled border');
    }
    
    if (overrides.compactMode) {
        result.cardPadding = '4px 12px';  // 极度紧凑的垂直间距
        result.listGap = '3px';
        result.listPadding = '6px';
        result.headerPadding = '6px 10px';
        result.titleFontSize = '12px';
        result.contentFontSize = '11px';
        result.iconSize = '16px';
        console.log('Applied compact mode');
    }
    
    console.log('Final theme result:', result);
    return result;
}

/**
 * 调整颜色透明度
 */
function adjustOpacity(color: string, opacity: number): string {
    // 简单的透明度调整，实际实现可能需要更复杂的颜色处理
    if (color.startsWith('rgba(')) {
        return color.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
    } else if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
    }
    return color;
}

/**
 * 从背景色中提取纯色
 */
function extractSolidColor(background: string): string {
    if (background.startsWith('rgba(')) {
        // 从 rgba(255, 255, 255, 0.7) 提取基础颜色
        const match = background.match(/rgba?\(([^)]+)\)/);
        if (match) {
            const values = match[1].split(',').map(v => v.trim());
            return `rgba(${values[0]}, ${values[1]}, ${values[2]}, 0.9)`;
        }
    } else if (background.startsWith('rgb(')) {
        return background.replace('rgb(', 'rgba(').replace(')', ', 0.9)');
    }
    return background;
}

/**
 * 调整颜色亮度
 */
function adjustBrightness(color: string, factor: number): string {
    if (color.startsWith('rgba(')) {
        const match = color.match(/rgba?\(([^)]+)\)/);
        if (match) {
            const values = match[1].split(',').map(v => parseFloat(v.trim()));
            const r = Math.round(values[0] * factor);
            const g = Math.round(values[1] * factor);
            const b = Math.round(values[2] * factor);
            const a = values[3] || 1;
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
    }
    return color;
}
