import {
    Plugin,
    showMessage,
} from "siyuan";
import "./index.scss";

import { CalloutManager } from "./callout";
import SettingPanel from "./settings/panel.svelte";
import { Dialog } from "siyuan";

const STORAGE_NAME = "callout-config";

export default class CustomCalloutPlugin extends Plugin {
    private calloutManager: CalloutManager | null = null;
    private isMobile: boolean;

    async onload() {
        console.log("=".repeat(60));
        console.log("[Custom Callout] 🚀 插件开始加载...");
        console.log("=".repeat(60));

        const frontEnd = this.getFrontEnd();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        console.log("[Custom Callout] 📱 设备类型:", frontEnd, "| 是否移动端:", this.isMobile);

        // 添加图标
        this.addIcons(`<symbol id="iconCallout" viewBox="0 0 32 32">
<path d="M4 6h24v4H4V6zm0 8h24v4H4v-4zm0 8h24v4H4v-4z" fill="currentColor"/>
<path d="M2 4v24h2V4H2zm26 0v24h2V4h-28z" fill="currentColor" opacity="0.5"/>
</symbol>`);
        console.log("[Custom Callout] ✅ 图标已添加");

        // 初始化Callout管理器
        console.log("[Custom Callout] 🔧 正在初始化 Callout 管理器...");
        this.calloutManager = new CalloutManager();
        this.calloutManager.initialize();

        console.log("=".repeat(60));
        console.log("[Custom Callout] ✅ 插件加载成功！");
        console.log("[Custom Callout] 💡 提示: 打开控制台查看详细日志");
        console.log("=".repeat(60));
        showMessage(this.i18n.name + " 已加载");
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
    }

    async onunload() {
        console.log("[Custom Callout] Plugin unloading...");

        // 销毁Callout管理器
        if (this.calloutManager) {
            this.calloutManager.destroy();
            this.calloutManager = null;
        }

        console.log("[Custom Callout] Plugin unloaded");
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
