/**
 * 这是一个使用 V2 系统的示例入口文件
 * 
 * 使用方法：
 * 1. 将此文件内容复制到 src/index.ts
 * 2. 或者直接将 src/index.ts 重命名为 src/index-v1-backup.ts
 * 3. 然后将此文件重命名为 src/index.ts
 */

import {
    Plugin,
} from "siyuan";
import "./index.scss";

import { CalloutManagerV2 } from "./callout/manager-v2"; // 使用 V2 管理器
import SettingPanel from "./settings/panel-v2.svelte";
import CalloutOutlineDock from "./dock/callout-outline.svelte";
import { Dialog } from "siyuan";
import { logger } from "./libs/logger";
import { ConfigManager } from "./callout/config";

const STORAGE_NAME = "callout-config";
const DOCK_TYPE = "callout-outline-dock";

export default class CustomCalloutPlugin extends Plugin {
    private calloutManager: CalloutManagerV2 | null = null; // 改用 V2
    private isMobile: boolean;
    private dockPanel: CalloutOutlineDock | null = null;
    private currentOutlineThemeId: string = 'modern';

    async onload() {
        logger.log("[Plugin V2] 插件加载中...");

        const frontEnd = this.getFrontEnd();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 添加图标
        this.addIcons(`<symbol id="iconCallout" viewBox="0 0 32 32">
<path d="M4 6h24v4H4V6zm0 8h24v4H4v-4zm0 8h24v4H4v-4z" fill="currentColor"/>
<path d="M2 4v24h2V4H2zm26 0v24h2V4h-28z" fill="currentColor" opacity="0.5"/>
</symbol>`);

        // 初始化 Callout 管理器 V2
        this.calloutManager = new CalloutManagerV2(this);
        await this.calloutManager.initialize();

        // 加载大纲主题配置
        await this.loadOutlineTheme();

        logger.log("[Plugin V2] 插件加载完成 ✅");
        logger.log("[Plugin V2] 使用新的基于块属性的架构");
    }

    onLayoutReady() {
        // 添加顶栏按钮
        this.addTopBar({
            icon: "iconCallout",
            title: this.i18n.name + " (V2)",
            position: "right",
            callback: () => {
                this.openSettings();
            }
        });

        // 注册 Dock 面板
        this.addDock({
            config: {
                position: "RightBottom",
                size: { width: 320, height: 0 },
                icon: "iconCallout",
                title: (this.i18n.calloutOutline || "Callout 大纲") + " (V2)",
            },
            data: {
                text: ""
            },
            type: DOCK_TYPE,
            init: (dock) => {
                const container = document.createElement('div');
                container.style.height = '100%';
                dock.element.appendChild(container);

                // 创建 Svelte 组件
                this.dockPanel = new CalloutOutlineDock({
                    target: container,
                    props: {
                        plugin: this,
                        themeId: this.currentOutlineThemeId
                    }
                });
            },
            destroy: () => {
                if (this.dockPanel) {
                    this.dockPanel.$destroy();
                    this.dockPanel = null;
                }
            }
        });

        logger.log("[Plugin V2] 布局就绪");
    }

    async onunload() {
        logger.log("[Plugin V2] 插件卸载中...");

        // 销毁 Dock 面板
        if (this.dockPanel) {
            this.dockPanel.$destroy();
            this.dockPanel = null;
        }

        // 销毁 Callout 管理器
        if (this.calloutManager) {
            this.calloutManager.destroy();
            this.calloutManager = null;
        }

        logger.log("[Plugin V2] 插件已卸载 ✅");
    }

    /**
     * 打开设置面板
     */
    openSetting(): void {
        const dialog = new Dialog({
            title: this.i18n.name + " - " + this.i18n.settings + " (V2)",
            content: `<div id="CustomCalloutSettingPanel" style="height: 100%;"></div>`,
            width: "800px",
            height: "600px",
            destroyCallback: () => {
                panel.$destroy();
            }
        });

        const panel = new SettingPanel({
            target: dialog.element.querySelector("#CustomCalloutSettingPanel") as HTMLElement,
            props: {
                plugin: this,
                calloutManager: this.calloutManager
            }
        });
    }

    /**
     * 打开设置面板（别名方法）
     */
    openSettings() {
        this.openSetting();
    }

    /**
     * 加载大纲主题配置
     */
    private async loadOutlineTheme() {
        try {
            const config = await ConfigManager.load(this);
            this.currentOutlineThemeId = config.outlineThemeId || 'modern';
            logger.log('[Plugin V2] 大纲主题已加载:', this.currentOutlineThemeId);
        } catch (error) {
            logger.error('[Plugin V2] 加载大纲主题配置失败:', error);
            this.currentOutlineThemeId = 'modern';
        }
    }

    /**
     * 更新大纲主题
     */
    public async updateOutlineTheme(themeId: string) {
        this.currentOutlineThemeId = themeId;
        
        // 如果大纲面板已经创建，更新其主题
        if (this.dockPanel) {
            this.dockPanel.$set({ themeId: themeId });
            // 强制刷新样式
            if (this.dockPanel.updateStyles) {
                this.dockPanel.updateStyles();
            }
        }
        
        logger.log('[Plugin V2] 大纲主题已更新:', themeId);
    }
    
    /**
     * 刷新大纲样式（用于样式微调变化时）
     */
    public async refreshOutlineStyles() {
        if (this.dockPanel && this.dockPanel.updateStyles) {
            this.dockPanel.updateStyles();
            logger.log('[Plugin V2] 大纲样式已刷新');
        }
    }
    
    /**
     * 获取当前大纲主题ID
     */
    public getCurrentOutlineThemeId(): string {
        return this.currentOutlineThemeId;
    }

    /**
     * 获取前端环境
     */
    private getFrontEnd(): string {
        if (typeof window !== 'undefined') {
            const ua = window.navigator.userAgent.toLowerCase();
            if (ua.indexOf('mobile') > -1 || ua.indexOf('android') > -1 || ua.indexOf('iphone') > -1) {
                return window.innerWidth < 768 ? 'mobile' : 'browser-mobile';
            }
            return window.innerWidth < 768 ? 'browser-mobile' : 'browser-desktop';
        }
        return 'desktop';
    }

    /**
     * 获取 Callout 管理器（用于外部访问）
     */
    public getCalloutManager(): CalloutManagerV2 | null {
        return this.calloutManager;
    }

    /**
     * 刷新 Callout 样式（配置变化后调用）
     */
    public async refreshCalloutStyles() {
        if (this.calloutManager) {
            await this.calloutManager.refreshStyles();
            logger.log('[Plugin V2] Callout 样式已刷新');
        }
    }

    /**
     * 重新加载 Callout 配置
     */
    public async reloadCalloutConfig() {
        if (this.calloutManager) {
            await this.calloutManager.reloadConfig();
            logger.log('[Plugin V2] Callout 配置已重新加载');
        }
    }
}

