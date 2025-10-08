/**
 * Callout类型配置
 */
export interface CalloutTypeConfig {
    /** 类型ID（英文标识符） */
    type: string;
    /** 显示名称 */
    displayName: string;
    /** 触发命令 */
    command: string;
    /** 中文触发命令（可选） */
    zhCommand?: string;
    /** 主题色 */
    color: string;
    /** SVG图标 */
    icon: string;
    /** 背景渐变色 */
    bgGradient: string;
    /** 边框颜色 */
    borderColor: string;
}

/**
 * 解析后的Callout命令结果
 */
export interface ParsedCalloutCommand {
    /** 基础类型 */
    type: string;
    /** 原始配置 */
    config: CalloutTypeConfig;
    /** 边注位置 - 只保留normal */
    position: 'normal';
    /** 边注宽度 */
    width?: string;
    /** 边注间距 */
    spacing?: string;
    /** 原始命令文本 */
    originalCommand: string;
}

/**
 * 预设的Callout类型
 */
export const DEFAULT_CALLOUT_TYPES: CalloutTypeConfig[] = [
    {
        type: 'info',
        displayName: '信息说明',
        command: '[!info]',
        zhCommand: '[!信息]',
        color: '#4493f8',
        bgGradient: 'linear-gradient(to bottom, #eff6ff, #ffffff)',
        borderColor: '#4493f8',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#4493f8" stroke-width="1.7" fill="none"/><rect x="11" y="7" width="2" height="7" rx="1" fill="#4493f8"/><circle cx="12" cy="17" r="1.2" fill="#4493f8"/></svg>'
    },
    {
        type: 'concept',
        displayName: '概念解释',
        command: '[!concept]',
        zhCommand: '[!概念]',
        color: '#9333ea',
        bgGradient: 'linear-gradient(to bottom, #faf5ff, #ffffff)',
        borderColor: '#9333ea',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="#9333ea" stroke-width="1.5" fill="none"/></svg>'
    },
    {
        type: 'example',
        displayName: '示例演示',
        command: '[!example]',
        zhCommand: '[!示例]',
        color: '#10b981',
        bgGradient: 'linear-gradient(to bottom, #f0fdf4, #ffffff)',
        borderColor: '#10b981',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#10b981" stroke-width="1.5" fill="none"/><path d="M8 10h8M8 14h5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/></svg>'
    },
    {
        type: 'tip',
        displayName: '使用技巧',
        command: '[!tip]',
        zhCommand: '[!技巧]',
        color: '#84cc16',
        bgGradient: 'linear-gradient(to bottom, #f7fee7, #ffffff)',
        borderColor: '#84cc16',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="#84cc16" stroke-width="1.5" fill="none"/></svg>'
    },
    {
        type: 'best-practice',
        displayName: '最佳实践',
        command: '[!best-practice]',
        zhCommand: '[!最佳实践]',
        color: '#059669',
        bgGradient: 'linear-gradient(to bottom, #ecfdf5, #ffffff)',
        borderColor: '#059669',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#059669" stroke-width="1.5" fill="none"/></svg>'
    },
    {
        type: 'tradeoff',
        displayName: '权衡取舍',
        command: '[!tradeoff]',
        zhCommand: '[!权衡取舍]',
        color: '#ea580c',
        bgGradient: 'linear-gradient(to bottom, #fff7ed, #ffffff)',
        borderColor: '#ea580c',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h18M12 3v18" stroke="#ea580c" stroke-width="1.5"/><circle cx="7" cy="7" r="2" fill="#ea580c"/><circle cx="17" cy="17" r="2" fill="#ea580c"/></svg>'
    },
    {
        type: 'deep-dive',
        displayName: '深水区',
        command: '[!deep-dive]',
        zhCommand: '[!深水区]',
        color: '#1e40af',
        bgGradient: 'linear-gradient(to bottom, #eff6ff, #ffffff)',
        borderColor: '#1e40af',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v18m0 0l-6-6m6 6l6-6" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 8h18" stroke="#1e40af" stroke-width="1.5" stroke-linecap="round"/></svg>'
    },
    {
        type: 'comparison',
        displayName: '对比分析',
        command: '[!comparison]',
        zhCommand: '[!对比]',
        color: '#6366f1',
        bgGradient: 'linear-gradient(to bottom, #eef2ff, #ffffff)',
        borderColor: '#6366f1',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#6366f1" stroke-width="1.5" fill="none"/><path d="M9 12h6M9 16h6" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round"/></svg>'
    },
    {
        type: 'summary',
        displayName: '章节总结',
        command: '[!summary]',
        zhCommand: '[!总结]',
        color: '#06b6d4',
        bgGradient: 'linear-gradient(to bottom, #ecfeff, #ffffff)',
        borderColor: '#06b6d4',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#06b6d4" stroke-width="1.5" fill="none"/></svg>'
    },
    {
        type: 'pitfall',
        displayName: '常见陷阱',
        command: '[!pitfall]',
        zhCommand: '[!陷阱]',
        color: '#dc2626',
        bgGradient: 'linear-gradient(to bottom, #fef2f2, #ffffff)',
        borderColor: '#dc2626',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#dc2626" stroke-width="1.5" fill="none"/></svg>'
    },
    {
        type: 'highlight',
        displayName: '重要亮点',
        command: '[!highlight]',
        zhCommand: '[!亮点]',
        color: '#f59e0b',
        bgGradient: 'linear-gradient(to bottom, #fffbeb, #ffffff)',
        borderColor: '#f59e0b',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l2.163 6.636L21 12l-6.837 2.364L12 21l-2.163-6.636L3 12l6.837-2.364L12 3z" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"/></svg>'
    }
];

