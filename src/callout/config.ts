import type { CalloutTypeConfig } from './types';
import { DEFAULT_CALLOUT_TYPES } from './types';

/**
 * 用户配置接口
 */
export interface CalloutConfig {
    version: string;
    customTypes: CalloutTypeConfig[];
    modifiedDefaults: Map<string, Partial<CalloutTypeConfig>>;
    hiddenDefaults: Set<string>; // 隐藏的预设类型ID
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
                hiddenDefaults: new Set(data.hiddenDefaults || [])
            };
        } catch (error) {
            console.error('[Callout Config] Error loading config:', error);
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
                hiddenDefaults: Array.from(config.hiddenDefaults)
            };
            await plugin.saveData(this.STORAGE_KEY, data);
        } catch (error) {
            console.error('[Callout Config] Error saving config:', error);
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
            hiddenDefaults: new Set()
        };
    }

    /**
     * 获取所有 Callout 类型（合并默认和自定义，排除隐藏的）
     */
    static getAllTypes(config: CalloutConfig): CalloutTypeConfig[] {
        const types: CalloutTypeConfig[] = [];

        // 添加修改后的默认类型（排除隐藏的）
        DEFAULT_CALLOUT_TYPES.forEach(defaultType => {
            if (!config.hiddenDefaults.has(defaultType.type)) {
                const modifications = config.modifiedDefaults.get(defaultType.type);
                if (modifications) {
                    types.push({ ...defaultType, ...modifications });
                } else {
                    types.push(defaultType);
                }
            }
        });

        // 添加自定义类型
        types.push(...config.customTypes);

        return types;
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
    static resetAll(): CalloutConfig {
        return this.getDefaultConfig();
    }

    /**
     * 获取可见的默认类型数量
     */
    static getVisibleDefaultTypesCount(config: CalloutConfig): number {
        return DEFAULT_CALLOUT_TYPES.length - config.hiddenDefaults.size;
    }
}

