<script lang="ts">
    import { DEFAULT_CALLOUT_TYPES, type CalloutTypeConfig } from '../callout/types';
    import type { CalloutManager } from '../callout/manager';
    import type CustomCalloutPlugin from '../index';

    export let plugin: CustomCalloutPlugin;
    export let calloutManager: CalloutManager;

    let calloutTypes: CalloutTypeConfig[] = DEFAULT_CALLOUT_TYPES;

    function refreshCallouts() {
        calloutManager.refresh();
    }
</script>

<div class="callout-settings-panel">
    <div class="settings-header">
        <h2>{plugin.i18n.calloutTypes}</h2>
        <button class="b3-button b3-button--outline" on:click={refreshCallouts}>
            <svg class="b3-button__icon"><use xlink:href="#iconRefresh"></use></svg>
            刷新所有Callout
        </button>
    </div>

    <div class="settings-description">
        <p>当前插件提供了以下 {calloutTypes.length} 种预设的 Callout 类型。在引用块中输入对应的命令即可使用。</p>
        <p>例如：在引用块的第一行输入 <code>@info</code> 或 <code>@信息</code>，即可创建信息说明类型的 Callout。</p>
    </div>

    <div class="callout-types-grid">
        {#each calloutTypes as calloutType}
            <div class="callout-type-card" style="border-left-color: {calloutType.color};">
                <div class="callout-type-header">
                    <div class="callout-type-icon" style="color: {calloutType.color};">
                        {@html calloutType.icon}
                    </div>
                    <div class="callout-type-info">
                        <div class="callout-type-name" style="color: {calloutType.color};">
                            {calloutType.displayName}
                        </div>
                        <div class="callout-type-commands">
                            <code>{calloutType.command}</code>
                            {#if calloutType.zhCommand}
                                <code>{calloutType.zhCommand}</code>
                            {/if}
                        </div>
                    </div>
                </div>
                <div class="callout-type-preview" style="background: {calloutType.bgGradient}; border-left-color: {calloutType.borderColor};">
                    <div class="preview-title" style="color: {calloutType.color};">
                        {@html calloutType.icon}
                        <span>{calloutType.displayName}</span>
                    </div>
                    <div class="preview-content">
                        这是一个示例文本，展示 {calloutType.displayName} 的样式效果。
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <div class="settings-footer">
        <div class="footer-info">
            <svg style="width: 16px; height: 16px;"><use xlink:href="#iconInfo"></use></svg>
            <span>点击 Callout 标题左侧的图标可以快速切换类型</span>
        </div>
        <div class="footer-info">
            <svg style="width: 16px; height: 16px;"><use xlink:href="#iconInfo"></use></svg>
            <span>点击 Callout 标题右侧区域可以折叠/展开内容</span>
        </div>
    </div>
</div>

<style>
    .callout-settings-panel {
        padding: 20px;
        height: 100%;
        overflow-y: auto;
        box-sizing: border-box;
    }

    .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--b3-border-color);
    }

    .settings-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
    }

    .settings-description {
        margin-bottom: 24px;
        padding: 12px;
        background: var(--b3-theme-background-light);
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.6;
    }

    .settings-description p {
        margin: 8px 0;
    }

    .settings-description code {
        padding: 2px 6px;
        background: var(--b3-theme-surface);
        border-radius: 3px;
        font-size: 13px;
        color: var(--b3-theme-primary);
    }

    .callout-types-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
    }

    .callout-type-card {
        border: 1px solid var(--b3-border-color);
        border-left: 4px solid;
        border-radius: 6px;
        padding: 16px;
        background: var(--b3-theme-background);
        transition: all 0.2s ease;
    }

    .callout-type-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .callout-type-header {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
    }

    .callout-type-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .callout-type-icon :global(svg) {
        width: 24px;
        height: 24px;
    }

    .callout-type-info {
        flex: 1;
    }

    .callout-type-name {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
    }

    .callout-type-commands {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .callout-type-commands code {
        padding: 2px 8px;
        background: var(--b3-theme-surface);
        border-radius: 3px;
        font-size: 12px;
        color: var(--b3-theme-on-surface);
    }

    .callout-type-preview {
        border: 1px solid var(--b3-border-color);
        border-left: 4px solid;
        border-radius: 4px;
        padding: 12px;
    }

    .preview-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 8px;
    }

    .preview-title :global(svg) {
        width: 18px;
        height: 18px;
    }

    .preview-content {
        font-size: 13px;
        color: var(--b3-theme-on-background);
        line-height: 1.6;
    }

    .settings-footer {
        padding-top: 16px;
        border-top: 1px solid var(--b3-border-color);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .footer-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--b3-theme-on-surface);
    }

    .footer-info svg {
        color: var(--b3-theme-primary);
    }
</style>

