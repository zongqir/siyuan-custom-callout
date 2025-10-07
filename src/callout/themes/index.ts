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
// 新增风格主题
import { craftTheme } from './craft';
import { macosTheme } from './macos';
import { solidTheme } from './solid';
import { notionTheme } from './notion';
import { materialTheme } from './material';
import { githubTheme } from './github';
import { paperTheme } from './paper';
import { auroraTheme } from './aurora';

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
 * 
 * 分类说明：
 * - 基础风格：现代简约、卡片、扁平、经典、极简
 * - 纯色风格：Craft、macOS、纯色、Notion、GitHub
 * - 效果风格：毛玻璃、新拟态、霓虹、纸质
 * - 设计系统：Material Design
 */
export const THEME_STYLES: ThemeStyle[] = [
    // 基础通用风格
    modernTheme,
    cardTheme,
    flatTheme,
    classicTheme,
    minimalTheme,
    
    // 纯色风格（无渐变）
    craftTheme,
    macosTheme,
    solidTheme,
    notionTheme,
    githubTheme,
    
    // 设计系统
    materialTheme,
    
    // 特效风格
    glassmorphismTheme,
    neumorphismTheme,
    neonTheme,
    paperTheme,
    auroraTheme
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

