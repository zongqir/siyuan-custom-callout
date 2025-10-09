/**
 * Callout 大纲主题系统
 * 
 * 使用说明：
 * 1. 选择预设主题：从 OUTLINE_THEME_STYLES 数组中选择
 * 2. 自定义主题：复制任一主题文件，修改参数后导入
 * 3. 应用主题：使用 generateOutlineThemeCSS() 生成CSS变量
 */

// 类型定义
export type { OutlineThemeStyle, OutlineThemeExport } from './types';

// 导入所有预设主题
import { modernOutlineTheme } from './modern';
import { cardOutlineTheme } from './card';
import { flatOutlineTheme } from './flat';
import { minimalOutlineTheme } from './minimal';
import { darkOutlineTheme } from './dark';

// 工具函数
export { generateOutlineThemeCSS, exportOutlineTheme, importOutlineTheme } from './utils';

import type { OutlineThemeStyle } from './types';

/**
 * 所有预设大纲主题
 * 
 * 分类说明：
 * - 现代毛玻璃：半透明背景，模糊效果
 * - 卡片风格：明显阴影，纯白背景  
 * - 扁平设计：纯色背景，无阴影
 * - 极简主义：最小化元素，紧凑布局
 * - 暗黑主题：深色配色，护眼舒适
 */
export const OUTLINE_THEME_STYLES: OutlineThemeStyle[] = [
    modernOutlineTheme,
    cardOutlineTheme,
    flatOutlineTheme,
    minimalOutlineTheme,
    darkOutlineTheme
];

/**
 * 获取默认大纲主题
 */
export function getDefaultOutlineTheme(): OutlineThemeStyle {
    return modernOutlineTheme;
}

/**
 * 根据ID获取大纲主题
 */
export function getOutlineThemeById(id: string): OutlineThemeStyle | undefined {
    return OUTLINE_THEME_STYLES.find(theme => theme.id === id);
}
