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
    },
    {
        id: 'sky',
        name: '天空蓝',
        color: '#0ea5e9',
        bgGradient: 'linear-gradient(to bottom, #f0f9ff, #ffffff)',
        borderColor: '#0ea5e9'
    },
    {
        id: 'light-blue',
        name: '浅蓝',
        color: '#38bdf8',
        bgGradient: 'linear-gradient(to bottom, #e0f2fe, #ffffff)',
        borderColor: '#38bdf8'
    },
    {
        id: 'ocean',
        name: '海蓝',
        color: '#0284c7',
        bgGradient: 'linear-gradient(to bottom, #e0f2fe, #ffffff)',
        borderColor: '#0284c7'
    },
    {
        id: 'navy',
        name: '海军蓝',
        color: '#0f172a',
        bgGradient: 'linear-gradient(to bottom, #f1f5f9, #ffffff)',
        borderColor: '#0f172a'
    },
    {
        id: 'yellow',
        name: '黄色',
        color: '#eab308',
        bgGradient: 'linear-gradient(to bottom, #fefce8, #ffffff)',
        borderColor: '#eab308'
    },
    {
        id: 'gold',
        name: '金色',
        color: '#ca8a04',
        bgGradient: 'linear-gradient(to bottom, #fffbeb, #ffffff)',
        borderColor: '#ca8a04'
    },
    {
        id: 'brown',
        name: '棕色',
        color: '#92400e',
        bgGradient: 'linear-gradient(to bottom, #fff7ed, #ffffff)',
        borderColor: '#92400e'
    },
    {
        id: 'mint',
        name: '薄荷绿',
        color: '#2dd4bf',
        bgGradient: 'linear-gradient(to bottom, #f0fdfa, #ffffff)',
        borderColor: '#2dd4bf'
    },
    {
        id: 'forest',
        name: '森林绿',
        color: '#166534',
        bgGradient: 'linear-gradient(to bottom, #ecfdf5, #ffffff)',
        borderColor: '#166534'
    },
    {
        id: 'steel',
        name: '钢蓝',
        color: '#475569',
        bgGradient: 'linear-gradient(to bottom, #f1f5f9, #ffffff)',
        borderColor: '#475569'
    },
    {
        id: 'graphite',
        name: '石墨灰',
        color: '#374151',
        bgGradient: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
        borderColor: '#374151'
    },
    {
        id: 'maroon',
        name: '栗色',
        color: '#7f1d1d',
        bgGradient: 'linear-gradient(to bottom, #fef2f2, #ffffff)',
        borderColor: '#7f1d1d'
    },
    {
        id: 'cobalt',
        name: '钴蓝',
        color: '#1d4ed8',
        bgGradient: 'linear-gradient(to bottom, #eff6ff, #ffffff)',
        borderColor: '#1d4ed8'
    },
    {
        id: 'royal',
        name: '皇家蓝',
        color: '#4f46e5',
        bgGradient: 'linear-gradient(to bottom, #eef2ff, #ffffff)',
        borderColor: '#4f46e5'
    },
    {
        id: 'turquoise',
        name: '绿松石',
        color: '#22d3ee',
        bgGradient: 'linear-gradient(to bottom, #ecfeff, #ffffff)',
        borderColor: '#22d3ee'
    },
    {
        id: 'peach',
        name: '蜜桃色',
        color: '#fdba74',
        bgGradient: 'linear-gradient(to bottom, #ffedd5, #ffffff)',
        borderColor: '#fdba74'
    },
    {
        id: 'salmon',
        name: '鲑红色',
        color: '#f87171',
        bgGradient: 'linear-gradient(to bottom, #fee2e2, #ffffff)',
        borderColor: '#f87171'
    },
    {
        id: 'olive',
        name: '橄榄绿',
        color: '#4d7c0f',
        bgGradient: 'linear-gradient(to bottom, #f7fee7, #ffffff)',
        borderColor: '#4d7c0f'
    },
    {
        id: 'sand',
        name: '沙色',
        color: '#d6b28d',
        bgGradient: 'linear-gradient(to bottom, #fef3c7, #ffffff)',
        borderColor: '#d6b28d'
    },
    {
        id: 'coffee',
        name: '咖色',
        color: '#6b4f4f',
        bgGradient: 'linear-gradient(to bottom, #f5f5f4, #ffffff)',
        borderColor: '#6b4f4f'
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

