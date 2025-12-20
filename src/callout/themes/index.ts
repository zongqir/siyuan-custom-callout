/**
 * Callout 主题系统（简化版）
 * 
 * 使用说明：
 * 1. 当前只保留 Craft 主题作为默认主题
 * 2. 自定义主题：复制 craft.ts，修改参数后导入
 * 3. 分享主题：使用 exportTheme() 导出为JSON，或 exportThemeAsCode() 导出为代码
 * 4. 导入主题：使用 importTheme() 从JSON导入
 */

// 类型定义
export type { ThemeStyle, ThemeExport } from './types';

// 导入 Craft 主题（唯一保留的预设主题）
import { craftTheme } from './craft';

// 工具函数
export {
    generateThemeCSS,
    exportTheme,
    exportThemeAsCode,
    importTheme,
    validateTheme
} from './utils';

import type { ThemeStyle } from './types';

/**
 * 所有预设主题（简化版）
 * 
 * 当前只保留 Craft 主题作为唯一预设主题
 * 如需更多主题，请自定义或导入
 */
export const THEME_STYLES: ThemeStyle[] = [
    craftTheme
];

/**
 * 获取默认主题
 */
export function getDefaultTheme(): ThemeStyle {
    return craftTheme;
}

/**
 * 根据ID获取主题
 */
export function getThemeById(id: string): ThemeStyle | undefined {
    return THEME_STYLES.find(theme => theme.id === id);
}

