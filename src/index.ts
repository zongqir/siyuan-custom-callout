import {
    Plugin,
} from "siyuan";
import "./index.scss";

import { CalloutManager } from "./callout";
import SettingPanel from "./settings/panel-v2.svelte";
import CalloutOutlineDock from "./dock/callout-outline.svelte";
import { Dialog } from "siyuan";
import { logger } from "./libs/logger";

const STORAGE_NAME = "callout-config";
const DOCK_TYPE = "callout-outline-dock";

export default class CustomCalloutPlugin extends Plugin {
    private calloutManager: CalloutManager | null = null;
    private isMobile: boolean;
    private dockPanel: CalloutOutlineDock | null = null;

    async onload() {
        logger.log("Plugin loading...");

        const frontEnd = this.getFrontEnd();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 添加图标
        this.addIcons(`<symbol id="iconCallout" viewBox="0 0 32 32">
<path d="M4 6h24v4H4V6zm0 8h24v4H4v-4zm0 8h24v4H4v-4z" fill="currentColor"/>
<path d="M2 4v24h2V4H2zm26 0v24h2V4h-28z" fill="currentColor" opacity="0.5"/>
</symbol>`);

        // 初始化Callout管理器
        this.calloutManager = new CalloutManager(this);
        await this.calloutManager.initialize();

        logger.log("Plugin loaded successfully");
    }

    onLayoutReady() {
        // 添加顶栏按钮
        this.addTopBar({
            icon: "iconCallout",
            title: this.i18n.name,
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
                title: this.i18n.calloutOutline || "Callout 大纲",
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
                        plugin: this
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
    }

    async onunload() {
        logger.log("Plugin unloading...");

        // 销毁 Dock 面板
        if (this.dockPanel) {
            this.dockPanel.$destroy();
            this.dockPanel = null;
        }

        // 销毁Callout管理器
        if (this.calloutManager) {
            this.calloutManager.destroy();
            this.calloutManager = null;
        }

        logger.log("Plugin unloaded");
    }

    /**
     * 打开设置面板
     */
    openSetting(): void {
        const dialog = new Dialog({
            title: this.i18n.name + " - " + this.i18n.settings,
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
}
