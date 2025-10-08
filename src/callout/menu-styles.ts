/**
 * 菜单样式配置 - 完整版
 * 从menu.ts中抽离所有内联样式
 */

/**
 * 菜单容器样式
 */
export function getMenuContainerStyle(isDark: boolean): string {
    return `
        position: fixed;
        background: ${isDark ? '#1f2937' : '#ffffff'};
        border: 1px solid ${isDark ? '#374151' : '#d1d5db'};
        border-radius: 8px;
        box-shadow: 0 10px 25px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'};
        max-height: 600px;
        overflow-y: auto;
        z-index: 10000;
        font-size: 14px;
        min-width: 620px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        outline: none;
        color: ${isDark ? '#f3f4f6' : '#1f2937'};
    `;
}

/**
 * 关闭按钮样式
 */
export function getCloseButtonStyle(isDark: boolean): string {
    return `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${isDark ? '#374151' : '#f3f4f6'};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        color: ${isDark ? '#d1d5db' : '#6b7280'};
        transition: all 0.15s ease;
        z-index: 1;
    `;
}

/**
 * 标题栏样式
 */
export function getHeaderStyle(isDark: boolean): string {
    return `
        padding: 12px 40px 12px 16px;
        background: ${isDark ? '#111827' : '#f9fafb'};
        border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        font-size: 13px;
        color: ${isDark ? '#9ca3af' : '#6b7280'};
        font-weight: 600;
    `;
}

/**
 * 过滤输入框容器样式
 */
export function getFilterInputContainerStyle(isDark: boolean, display: string = 'none'): string {
    return `
        padding: 8px 16px 10px;
        background: linear-gradient(to bottom, ${isDark ? '#111827' : '#fafbfc'}, ${isDark ? '#0f172a' : '#f6f8fa'});
        border-bottom: 1px solid ${isDark ? '#374151' : '#e1e4e8'};
        display: ${display};
    `;
}

/**
 * 过滤输入框包装器样式
 */
export function getFilterInputWrapperStyle(isDark: boolean): string {
    return `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: ${isDark ? '#1f2937' : '#ffffff'};
        border-radius: 8px;
        border: 1.5px solid #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        transition: all 0.2s ease;
    `;
}

/**
 * 过滤输入框图标样式
 */
export function getFilterInputIconStyle(): string {
    return `
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `;
}

/**
 * 过滤输入框文本样式
 */
export function getFilterInputTextStyle(isDark: boolean): string {
    return `
        font-size: 14px;
        font-weight: 500;
        color: ${isDark ? '#f3f4f6' : '#1f2937'};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
        letter-spacing: 0.3px;
    `;
}

/**
 * 过滤输入框提示标签样式
 */
export function getFilterInputHintStyle(isDark: boolean): string {
    return `
        margin-left: auto;
        font-size: 11px;
        color: ${isDark ? '#6b7280' : '#9ca3af'};
        background: ${isDark ? '#374151' : '#f3f4f6'};
        padding: 2px 8px;
        border-radius: 4px;
    `;
}

/**
 * 菜单网格容器样式
 */
export function getMenuGridContainerStyle(): string {
    return `padding: 8px;`;
}

/**
 * 菜单网格样式
 */
export function getMenuGridStyle(columns: number): string {
    return `
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 4px;
        margin-bottom: 8px;
    `;
}

/**
 * 菜单网格样式（无底部边距）
 */
export function getMenuGridStyleNoMargin(columns: number): string {
    return `
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 4px;
    `;
}

/**
 * 边注工具栏标签样式
 */
export function getMarginToolbarLabelStyle(isDark: boolean): string {
    return `
        font-size: 11px;
        color: ${isDark ? '#9ca3af' : '#6b7280'};
        font-weight: 500;
        margin-right: 4px;
    `;
}

/**
 * 边注工具栏样式
 */
export function getMarginToolbarStyle(isDark: boolean): string {
    return `
        border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        padding: 6px 8px 4px;
        background: ${isDark ? '#111827' : '#fafbfc'};
        display: flex;
        align-items: center;
        gap: 6px;
    `;
}

/**
 * 边注工具栏按钮样式
 */
export function getMarginToolbarButtonStyle(isDark: boolean, position: string): string {
    let backgroundColor = isDark ? '#374151' : '#ffffff';
    if (position === 'left') {
        backgroundColor = isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5';
    } else if (position === 'right') {
        backgroundColor = isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7';
    }
    
    return `
        flex: 1;
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 3px 4px;
        border: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
        border-radius: 4px;
        background: ${backgroundColor};
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        color: ${isDark ? '#e5e7eb' : '#374151'};
        transition: all 0.15s ease;
        justify-content: center;
    `;
}

/**
 * 边注工具栏按钮悬停边框颜色
 */
export function getMarginToolbarButtonHoverBorderColor(isDark: boolean): string {
    return isDark ? '#6b7280' : '#9ca3af';
}

/**
 * 边注工具栏按钮正常边框颜色
 */
export function getMarginToolbarButtonNormalBorderColor(isDark: boolean): string {
    return isDark ? '#4b5563' : '#d1d5db';
}

/**
 * 菜单项样式
 */
export function getMenuItemStyle(isDark: boolean, options: any): string {
    const isMarginNote = options.command && (options.command.includes('-left') || options.command.includes('-right'));
    let marginNoteStyle = '';
    
    if (isMarginNote) {
        const isLeft = options.command.includes('-left');
        const borderColor = isLeft ? (isDark ? '#10b981' : '#059669') : (isDark ? '#f59e0b' : '#d97706');
        const bgGradient = isLeft 
            ? (isDark ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), #1f2937)' : 'linear-gradient(135deg, #ecfdf5, #ffffff)')
            : (isDark ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), #1f2937)' : 'linear-gradient(135deg, #fffbeb, #ffffff)');
        
        marginNoteStyle = `
            border-left: 3px solid ${borderColor};
            background: ${bgGradient};
        `;
    }
    
    return `
        padding: 10px 12px;
        cursor: pointer;
        border: 1px solid ${isDark ? '#374151' : '#f3f4f6'};
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background-color 0.1s ease, transform 0.1s ease, border-color 0.1s ease;
        background: ${isDark ? '#1f2937' : '#ffffff'};
        ${marginNoteStyle}
    `;
}

/**
 * 菜单项文字主标题颜色
 */
export function getMenuItemTitleColor(isDark: boolean): string {
    return isDark ? '#f3f4f6' : '#1f2937';
}

/**
 * 菜单项文字副标题颜色
 */
export function getMenuItemCommandColor(isDark: boolean): string {
    return isDark ? '#9ca3af' : '#6b7280';
}

/**
 * 菜单项图标容器样式
 */
export function getMenuItemIconStyle(): string {
    return `width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
}

/**
 * 菜单项内容容器样式
 */
export function getMenuItemContentStyle(): string {
    return `flex: 1; min-width: 0;`;
}

/**
 * 菜单项标题样式
 */
export function getMenuItemTitleStyle(): string {
    return `font-weight: 600; font-size: 14px; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
}

/**
 * 菜单项命令样式
 */
export function getMenuItemCommandStyle(): string {
    return `font-size: 10px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
}

/**
 * 紧凑菜单项样式
 */
export function getCompactMenuItemStyle(isDark: boolean, marginPosition: string): string {
    let backgroundColor = isDark ? '#1f2937' : '#ffffff';
    if (marginPosition === 'left') {
        backgroundColor = isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5';
    } else if (marginPosition === 'right') {
        backgroundColor = isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb';
    }
    
    return `
        padding: 6px 8px;
        cursor: pointer;
        border: 1px solid ${isDark ? '#374151' : '#f3f4f6'};
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: all 0.1s ease;
        font-size: 12px;
        min-height: 32px;
        background: ${backgroundColor};
    `;
}

/**
 * 紧凑菜单项文字颜色
 */
export function getCompactMenuItemTextColor(isDark: boolean): string {
    return isDark ? '#f3f4f6' : '#1f2937';
}

/**
 * 底部提示样式
 */
export function getFooterStyle(isDark: boolean): string {
    return `
        padding: 8px 16px;
        background: ${isDark ? '#111827' : '#f9fafb'};
        border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        font-size: 11px;
        color: ${isDark ? '#6b7280' : '#9ca3af'};
        text-align: center;
    `;
}

/**
 * 筛选行样式
 */
export function getFilterRowStyle(isDark: boolean): string {
    return `
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 8px;
        margin-bottom: 8px;
        align-items: stretch;
        min-height: 52px;
        padding: 6px;
        background: ${isDark ? '#111827' : '#f8f9fa'};
        border-radius: 8px;
        border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
    `;
}

/**
 * 占位符样式
 */
export function getPlaceholderStyle(isDark: boolean): string {
    return `
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${isDark ? '#6b7280' : '#9ca3af'};
        font-size: 11px;
        background: ${isDark ? '#0f172a' : '#f3f4f6'};
        border-radius: 6px;
        border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
    `;
}

/**
 * 菜单项点击后的高亮样式
 */
export function getMenuItemClickStyle(): { backgroundColor: string; color: string } {
    return {
        backgroundColor: '#dbeafe',
        color: '#1e40af'
    };
}
