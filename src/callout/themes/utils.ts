import type { ThemeStyle, ThemeExport } from './types';

/**
 * 生成主题相关的CSS变量
 */
export function generateThemeCSS(theme: ThemeStyle): string {
    return `
        --callout-border-radius: ${theme.borderRadius};
        --callout-border-width: ${theme.borderWidth};
        --callout-left-border-width: ${theme.leftBorderWidth};
        --callout-padding: ${theme.padding};
        --callout-title-font-size: ${theme.titleFontSize};
        --callout-title-font-weight: ${theme.titleFontWeight};
        --callout-title-padding: ${theme.titlePadding};
        --callout-icon-size: ${theme.iconSize};
        --callout-content-font-size: ${theme.contentFontSize};
        --callout-content-line-height: ${theme.contentLineHeight};
        --callout-content-padding: ${theme.contentPadding};
        --callout-box-shadow: ${theme.boxShadow};
        --callout-background-opacity: ${theme.backgroundOpacity};
        --callout-hover-transform: ${theme.hoverTransform};
        --callout-transition: ${theme.transition};
    `.trim();
}

/**
 * 导出主题为JSON格式
 * 可用于分享和导入自定义主题
 */
export function exportTheme(theme: ThemeStyle, author?: string): ThemeExport {
    return {
        version: '1.0',
        theme: theme,
        createdAt: new Date().toISOString(),
        author: author
    };
}

/**
 * 导出主题为可读的TypeScript代码
 * 方便用户直接复制修改
 */
export function exportThemeAsCode(theme: ThemeStyle): string {
    return `import type { ThemeStyle } from './types';

/**
 * ${theme.name}
 * 
 * ${theme.description}
 */
export const customTheme: ThemeStyle = ${JSON.stringify(theme, null, 4)};
`;
}

/**
 * 从JSON导入主题
 */
export function importTheme(json: string): ThemeStyle | null {
    try {
        const data: ThemeExport = JSON.parse(json);
        if (!data.theme || !data.theme.id) {
            return null;
        }
        return data.theme;
    } catch (error) {
        console.error('导入主题失败:', error);
        return null;
    }
}

/**
 * 验证主题配置是否完整
 */
export function validateTheme(theme: Partial<ThemeStyle>): theme is ThemeStyle {
    const requiredFields: (keyof ThemeStyle)[] = [
        'id', 'name', 'description', 'preview',
        'borderRadius', 'borderWidth', 'leftBorderWidth', 'padding',
        'titleFontSize', 'titleFontWeight', 'titlePadding', 'iconSize',
        'contentFontSize', 'contentLineHeight', 'contentPadding',
        'boxShadow', 'backgroundOpacity', 'hoverTransform', 'transition'
    ];
    
    return requiredFields.every(field => theme[field] !== undefined && theme[field] !== null);
}

