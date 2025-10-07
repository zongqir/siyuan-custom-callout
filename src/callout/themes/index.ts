/**
 * Callout 主题系统
 * 
 * 使用说明：
 * 1. 选择预设主题：直接从 THEME_STYLES 数组中选择
 * 2. 自定义主题：复制任一主题文件，修改参数后导入
 * 3. 分享主题：使用 exportTheme() 导出为JSON，或 exportThemeAsCode() 导出为代码
 * 4. 导入主题：使用 importTheme() 从JSON导入
 */

// 类型定义
export type { ThemeStyle, ThemeExport } from './types';

// 导入所有预设主题
import { modernTheme } from './modern';
import { cardTheme } from './card';
import { flatTheme } from './flat';
import { classicTheme } from './classic';
import { minimalTheme } from './minimal';
import { glassmorphismTheme } from './glassmorphism';
import { neumorphismTheme } from './neumorphism';
import { neonTheme } from './neon';

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
 * 所有预设主题
 */
export const THEME_STYLES: ThemeStyle[] = [
    modernTheme,
    cardTheme,
    flatTheme,
    classicTheme,
    minimalTheme,
    glassmorphismTheme,
    neumorphismTheme,
    neonTheme
];

/**
 * 获取默认主题
 */
export function getDefaultTheme(): ThemeStyle {
    return modernTheme;
}

/**
 * 根据ID获取主题
 */
export function getThemeById(id: string): ThemeStyle | undefined {
    return THEME_STYLES.find(theme => theme.id === id);
}

