/**
 * 颜色预设方案
 */
export interface ColorScheme {
    id: string;
    name: string;
    color: string;
    bgGradient: string;
    borderColor: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
    {
        id: 'blue',
        name: '蓝色',
        color: '#4493f8',
        bgGradient: 'linear-gradient(to bottom, #eff6ff, #ffffff)',
        borderColor: '#4493f8'
    },
    {
        id: 'purple',
        name: '紫色',
        color: '#9333ea',
        bgGradient: 'linear-gradient(to bottom, #faf5ff, #ffffff)',
        borderColor: '#9333ea'
    },
    {
        id: 'green',
        name: '绿色',
        color: '#10b981',
        bgGradient: 'linear-gradient(to bottom, #f0fdf4, #ffffff)',
        borderColor: '#10b981'
    },
    {
        id: 'lime',
        name: '黄绿色',
        color: '#84cc16',
        bgGradient: 'linear-gradient(to bottom, #f7fee7, #ffffff)',
        borderColor: '#84cc16'
    },
    {
        id: 'emerald',
        name: '翡翠绿',
        color: '#059669',
        bgGradient: 'linear-gradient(to bottom, #ecfdf5, #ffffff)',
        borderColor: '#059669'
    },
    {
        id: 'orange',
        name: '橙色',
        color: '#ea580c',
        bgGradient: 'linear-gradient(to bottom, #fff7ed, #ffffff)',
        borderColor: '#ea580c'
    },
    {
        id: 'dark-blue',
        name: '深蓝色',
        color: '#1e40af',
        bgGradient: 'linear-gradient(to bottom, #eff6ff, #ffffff)',
        borderColor: '#1e40af'
    },
    {
        id: 'indigo',
        name: '靛蓝色',
        color: '#6366f1',
        bgGradient: 'linear-gradient(to bottom, #eef2ff, #ffffff)',
        borderColor: '#6366f1'
    },
    {
        id: 'cyan',
        name: '青色',
        color: '#06b6d4',
        bgGradient: 'linear-gradient(to bottom, #ecfeff, #ffffff)',
        borderColor: '#06b6d4'
    },
    {
        id: 'red',
        name: '红色',
        color: '#dc2626',
        bgGradient: 'linear-gradient(to bottom, #fef2f2, #ffffff)',
        borderColor: '#dc2626'
    },
    {
        id: 'amber',
        name: '琥珀色',
        color: '#f59e0b',
        bgGradient: 'linear-gradient(to bottom, #fffbeb, #ffffff)',
        borderColor: '#f59e0b'
    },
    {
        id: 'pink',
        name: '粉色',
        color: '#ec4899',
        bgGradient: 'linear-gradient(to bottom, #fdf2f8, #ffffff)',
        borderColor: '#ec4899'
    },
    {
        id: 'rose',
        name: '玫瑰色',
        color: '#f43f5e',
        bgGradient: 'linear-gradient(to bottom, #fff1f2, #ffffff)',
        borderColor: '#f43f5e'
    },
    {
        id: 'teal',
        name: '青绿色',
        color: '#14b8a6',
        bgGradient: 'linear-gradient(to bottom, #f0fdfa, #ffffff)',
        borderColor: '#14b8a6'
    },
    {
        id: 'violet',
        name: '紫罗兰',
        color: '#8b5cf6',
        bgGradient: 'linear-gradient(to bottom, #f5f3ff, #ffffff)',
        borderColor: '#8b5cf6'
    },
    {
        id: 'fuchsia',
        name: '紫红色',
        color: '#d946ef',
        bgGradient: 'linear-gradient(to bottom, #fdf4ff, #ffffff)',
        borderColor: '#d946ef'
    },
    {
        id: 'gray',
        name: '灰色',
        color: '#6b7280',
        bgGradient: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
        borderColor: '#6b7280'
    },
    {
        id: 'slate',
        name: '石板色',
        color: '#64748b',
        bgGradient: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
        borderColor: '#64748b'
    }
];

/**
 * 根据颜色ID获取颜色方案
 */
export function getColorScheme(colorId: string): ColorScheme | undefined {
    return COLOR_SCHEMES.find(c => c.id === colorId);
}

/**
 * 从十六进制颜色创建自定义颜色方案
 */
export function createCustomColorScheme(hex: string): ColorScheme {
    // 简单的颜色到背景渐变的转换
    const lightColor = adjustColor(hex, 90); // 更浅的颜色
    return {
        id: 'custom',
        name: '自定义',
        color: hex,
        bgGradient: `linear-gradient(to bottom, ${lightColor}, #ffffff)`,
        borderColor: hex
    };
}

/**
 * 调整颜色亮度
 */
function adjustColor(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100)));
    const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

