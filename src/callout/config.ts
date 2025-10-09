import type { CalloutTypeConfig } from './types';
import { DEFAULT_CALLOUT_TYPES } from './types';
import { logger } from '../libs/logger';

/**
 * 主题样式覆盖配置
 */
export interface ThemeOverrides {
    backgroundStyle?: 'solid' | 'gradient';  // 纯色/渐变
    borderRadius?: string;                   // 圆角大小
    leftBorderWidth?: string;                // 左侧条纹粗细
    borderWidth?: string;                    // 整体边框粗细
    titleFontSize?: string;                  // 标题字体大小
    titleFontWeight?: string;                // 标题字体粗细
    titleHeight?: string;                    // 标题栏高度
    iconSize?: string;                       // 图标大小
    hideIcon?: boolean;                      // 隐藏图标
    hideTitle?: boolean;                     // 隐藏标题文字
}

/**
 * 用户配置接口
 */
export interface CalloutConfig {
    version: string;
    customTypes: CalloutTypeConfig[];
    modifiedDefaults: Map<string, Partial<CalloutTypeConfig>>;
    hiddenDefaults: Set<string>; // 隐藏的预设类型ID（在命令菜单中不显示）
    typeOrder: string[]; // 类型显示顺序（类型ID列表）
    gridColumns: number; // 网格列数（2/3/4）
    themeId: string; // 当前使用的主题ID
    outlineThemeId?: string; // 大纲主题ID
    themeOverrides?: ThemeOverrides; // 主题样式覆盖
}

/**
 * 配置管理器
 */
export class ConfigManager {
    private static readonly STORAGE_KEY = 'callout-custom-config';
    private static readonly CONFIG_VERSION = '1.0.0';

    /**
     * 加载配置
     */
    static async load(plugin: any): Promise<CalloutConfig> {
        try {
            const data = await plugin.loadData(this.STORAGE_KEY);
            if (!data) {
                return this.getDefaultConfig();
            }

            return {
                version: data.version || this.CONFIG_VERSION,
                customTypes: data.customTypes || [],
                modifiedDefaults: new Map(Object.entries(data.modifiedDefaults || {})),
                hiddenDefaults: new Set(data.hiddenDefaults || []),
                typeOrder: data.typeOrder || [],
                gridColumns: data.gridColumns || 3,
                themeId: data.themeId || 'modern',
                outlineThemeId: data.outlineThemeId || 'modern',
                themeOverrides: data.themeOverrides || {}
            };
        } catch (error) {
            logger.error('[Callout Config] Error loading config:', error);
            return this.getDefaultConfig();
        }
    }

    /**
     * 保存配置
     */
    static async save(plugin: any, config: CalloutConfig): Promise<void> {
        try {
            const data = {
                version: config.version,
                customTypes: config.customTypes,
                modifiedDefaults: Object.fromEntries(config.modifiedDefaults),
                hiddenDefaults: Array.from(config.hiddenDefaults),
                typeOrder: config.typeOrder,
                gridColumns: config.gridColumns,
                themeId: config.themeId,
                themeOverrides: config.themeOverrides || {}
            };
            await plugin.saveData(this.STORAGE_KEY, data);
        } catch (error) {
            logger.error('[Callout Config] Error saving config:', error);
            throw error;
        }
    }

    /**
     * 获取默认配置
     */
    static getDefaultConfig(): CalloutConfig {
        return {
            version: this.CONFIG_VERSION,
            customTypes: [],
            modifiedDefaults: new Map(),
            hiddenDefaults: new Set(),
            typeOrder: [],
            gridColumns: 3,
            themeId: 'modern',
            outlineThemeId: 'modern',
            themeOverrides: {}
        };
    }

    /**
     * 获取所有 Callout 类型（合并默认和自定义，设置面板显示所有类型）
     */
    static getAllTypes(config: CalloutConfig): CalloutTypeConfig[] {
        const typesMap = new Map<string, CalloutTypeConfig>();

        // 添加修改后的默认类型（包括隐藏的）
        DEFAULT_CALLOUT_TYPES.forEach(defaultType => {
            const modifications = config.modifiedDefaults.get(defaultType.type);
            if (modifications) {
                typesMap.set(defaultType.type, { ...defaultType, ...modifications });
            } else {
                typesMap.set(defaultType.type, defaultType);
            }
        });

        // 添加自定义类型
        config.customTypes.forEach(customType => {
            typesMap.set(customType.type, customType);
        });

        // 按照保存的顺序排序
        if (config.typeOrder.length > 0) {
            const orderedTypes: CalloutTypeConfig[] = [];
            const remainingTypes = new Set(typesMap.keys());

            // 先按顺序添加
            config.typeOrder.forEach(typeId => {
                if (typesMap.has(typeId)) {
                    orderedTypes.push(typesMap.get(typeId)!);
                    remainingTypes.delete(typeId);
                }
            });

            // 添加不在顺序列表中的新类型
            remainingTypes.forEach(typeId => {
                orderedTypes.push(typesMap.get(typeId)!);
            });

            return orderedTypes;
        }

        return Array.from(typesMap.values());
    }

    /**
     * 获取可用的 Callout 类型（排除隐藏的，用于命令菜单）
     */
    static getAvailableTypes(config: CalloutConfig): CalloutTypeConfig[] {
        return this.getAllTypes(config).filter(type => !config.hiddenDefaults.has(type.type));
    }

    /**
     * 添加自定义类型
     */
    static addCustomType(config: CalloutConfig, newType: CalloutTypeConfig): CalloutConfig {
        return {
            ...config,
            customTypes: [...config.customTypes, newType]
        };
    }

    /**
     * 更新自定义类型
     */
    static updateCustomType(config: CalloutConfig, typeId: string, updates: Partial<CalloutTypeConfig>): CalloutConfig {
        return {
            ...config,
            customTypes: config.customTypes.map(t =>
                t.type === typeId ? { ...t, ...updates } : t
            )
        };
    }

    /**
     * 删除自定义类型
     */
    static deleteCustomType(config: CalloutConfig, typeId: string): CalloutConfig {
        return {
            ...config,
            customTypes: config.customTypes.filter(t => t.type !== typeId)
        };
    }

    /**
     * 修改默认类型
     */
    static modifyDefaultType(config: CalloutConfig, typeId: string, modifications: Partial<CalloutTypeConfig>): CalloutConfig {
        const newModifiedDefaults = new Map(config.modifiedDefaults);
        newModifiedDefaults.set(typeId, modifications);
        return {
            ...config,
            modifiedDefaults: newModifiedDefaults
        };
    }

    /**
     * 重置默认类型
     */
    static resetDefaultType(config: CalloutConfig, typeId: string): CalloutConfig {
        const newModifiedDefaults = new Map(config.modifiedDefaults);
        newModifiedDefaults.delete(typeId);
        return {
            ...config,
            modifiedDefaults: newModifiedDefaults
        };
    }

    /**
     * 检查类型ID是否已存在
     */
    static isTypeIdExists(config: CalloutConfig, typeId: string): boolean {
        // 检查默认类型
        if (DEFAULT_CALLOUT_TYPES.some(t => t.type === typeId)) {
            return true;
        }
        // 检查自定义类型
        return config.customTypes.some(t => t.type === typeId);
    }

    /**
     * 检查命令是否已存在
     */
    static isCommandExists(config: CalloutConfig, command: string, excludeTypeId?: string): boolean {
        const allTypes = this.getAllTypes(config);
        return allTypes.some(t => 
            t.type !== excludeTypeId && 
            (t.command === command || t.zhCommand === command)
        );
    }

    /**
     * 隐藏默认类型
     */
    static hideDefaultType(config: CalloutConfig, typeId: string): CalloutConfig {
        const newHiddenDefaults = new Set(config.hiddenDefaults);
        newHiddenDefaults.add(typeId);
        return {
            ...config,
            hiddenDefaults: newHiddenDefaults
        };
    }

    /**
     * 显示默认类型
     */
    static showDefaultType(config: CalloutConfig, typeId: string): CalloutConfig {
        const newHiddenDefaults = new Set(config.hiddenDefaults);
        newHiddenDefaults.delete(typeId);
        return {
            ...config,
            hiddenDefaults: newHiddenDefaults
        };
    }

    /**
     * 重置所有配置（恢复默认）
     */
    static resetAll(preserveSettings: boolean = false, currentConfig?: CalloutConfig): CalloutConfig {
        const defaultConfig = this.getDefaultConfig();
        if (preserveSettings && currentConfig) {
            defaultConfig.gridColumns = currentConfig.gridColumns;
            defaultConfig.themeId = currentConfig.themeId;
            defaultConfig.outlineThemeId = currentConfig.outlineThemeId || 'modern';
        }
        return defaultConfig;
    }

    /**
     * 获取可见的默认类型数量
     */
    static getVisibleDefaultTypesCount(config: CalloutConfig): number {
        return DEFAULT_CALLOUT_TYPES.length - config.hiddenDefaults.size;
    }

    /**
     * 更新类型顺序
     */
    static updateTypeOrder(config: CalloutConfig, typeOrder: string[]): CalloutConfig {
        return {
            ...config,
            typeOrder
        };
    }

    /**
     * 检查类型是否被隐藏
     */
    static isTypeHidden(config: CalloutConfig, typeId: string): boolean {
        return config.hiddenDefaults.has(typeId);
    }
}

