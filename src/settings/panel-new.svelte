<script lang="ts">
    import { onMount } from 'svelte';
    import type { CalloutManagerV2 } from '../callout/manager-v2';
    import type CustomCalloutPlugin from '../index';
    import type { CalloutTypeConfig } from '../callout/types';
    import { DEFAULT_CALLOUT_TYPES } from '../callout/types';
    import { ConfigManager, type CalloutConfig } from '../callout/config';
    import EditDialog from './edit-dialog.svelte';
    import { showMessage } from 'siyuan';

    export let plugin: CustomCalloutPlugin;
    export let calloutManager: CalloutManagerV2;

    let config: CalloutConfig;
    let allTypes: CalloutTypeConfig[] = [];
    let showEditDialog = false;
    let editingType: CalloutTypeConfig | null = null;
    let isNewType = false;
    let loading = true;

    onMount(async () => {
        await loadConfig();
        loading = false;
    });

    async function loadConfig() {
        config = await ConfigManager.load(plugin);
        allTypes = ConfigManager.getAllTypes(config);
    }

    async function saveConfig() {
        await ConfigManager.save(plugin, config);
        allTypes = ConfigManager.getAllTypes(config);
        calloutManager.updateConfig(config);
        calloutManager.refresh();
    }

    function handleAddNew() {
        editingType = null;
        isNewType = true;
        showEditDialog = true;
    }

    function handleEdit(type: CalloutTypeConfig) {
        editingType = type;
        isNewType = false;
        showEditDialog = true;
    }

    async function handleSave(newConfig: CalloutTypeConfig) {
        try {
            if (isNewType) {
                // 检查ID是否已存在
                if (ConfigManager.isTypeIdExists(config, newConfig.type)) {
                    showMessage('该类型ID已存在', 3000, 'error');
                    return;
                }
                config = ConfigManager.addCustomType(config, newConfig);
                showMessage('添加成功', 2000, 'info');
            } else {
                // 判断是否是默认类型
                const isDefaultType = DEFAULT_CALLOUT_TYPES.some(t => t.type === editingType!.type);
                if (isDefaultType) {
                    config = ConfigManager.modifyDefaultType(config, editingType!.type, newConfig);
                    showMessage('修改成功', 2000, 'info');
                } else {
                    config = ConfigManager.updateCustomType(config, editingType!.type, newConfig);
                    showMessage('更新成功', 2000, 'info');
                }
            }

            await saveConfig();
            showEditDialog = false;
        } catch (error) {
            showMessage('保存失败: ' + error.message, 3000, 'error');
        }
    }

    async function handleDelete(type: CalloutTypeConfig) {
        const isDefaultType = DEFAULT_CALLOUT_TYPES.some(t => t.type === type.type);
        
        if (isDefaultType) {
            showMessage('无法删除预设类型，但可以重置它', 3000, 'error');
            return;
        }

        if (confirm(`确定要删除 "${type.displayName}" 吗？`)) {
            config = ConfigManager.deleteCustomType(config, type.type);
            await saveConfig();
            showMessage('删除成功', 2000, 'info');
        }
    }

    async function handleReset(type: CalloutTypeConfig) {
        const isDefaultType = DEFAULT_CALLOUT_TYPES.some(t => t.type === type.type);
        
        if (!isDefaultType) {
            showMessage('只能重置预设类型', 3000, 'error');
            return;
        }

        if (confirm(`确定要重置 "${type.displayName}" 为默认设置吗？`)) {
            config = ConfigManager.resetDefaultType(config, type.type);
            await saveConfig();
            showMessage('重置成功', 2000, 'info');
        }
    }

    function refreshAll() {
        calloutManager.refresh();
        showMessage('已刷新所有 Callout', 2000, 'info');
    }

    function isModified(type: CalloutTypeConfig): boolean {
        return config.modifiedDefaults.has(type.type);
    }

    function isCustom(type: CalloutTypeConfig): boolean {
        return config.customTypes.some(t => t.type === type.type);
    }

    function getExistingCommands(): string[] {
        return allTypes
            .filter(t => !editingType || t.type !== editingType.type)
            .flatMap(t => [t.command, t.zhCommand].filter(Boolean) as string[]);
    }
</script>

<div class="callout-settings-panel">
    {#if loading}
        <div class="loading">加载中...</div>
    {:else}
        <div class="settings-header">
            <h2>Callout 类型管理</h2>
            <div class="header-actions">
                <button class="b3-button b3-button--outline" on:click={refreshAll}>
                    <svg class="b3-button__icon"><use xlink:href="#iconRefresh"></use></svg>
                    刷新
                </button>
                <button class="b3-button b3-button--primary" on:click={handleAddNew}>
                    <svg class="b3-button__icon"><use xlink:href="#iconAdd"></use></svg>
                    新建类型
                </button>
            </div>
        </div>

        <div class="settings-description">
            <p>💡 你可以新建自定义 Callout 类型，或修改预设类型的样式。</p>
            <p>📝 当前共有 <strong>{allTypes.length}</strong> 个类型（{DEFAULT_CALLOUT_TYPES.length} 个预设 + {config.customTypes.length} 个自定义）</p>
        </div>

        <div class="types-list">
            {#each allTypes as calloutType}
                <div class="type-card" class:modified={isModified(calloutType)} class:custom={isCustom(calloutType)}>
                    <div class="type-header">
                        <div class="type-icon" style="color: {calloutType.color};">
                            {@html calloutType.icon}
                        </div>
                        <div class="type-info">
                            <div class="type-name" style="color: {calloutType.color};">
                                {calloutType.displayName}
                                {#if isModified(calloutType)}
                                    <span class="badge badge-modified">已修改</span>
                                {/if}
                                {#if isCustom(calloutType)}
                                    <span class="badge badge-custom">自定义</span>
                                {/if}
                            </div>
                            <div class="type-commands">
                                <code>{calloutType.command}</code>
                                {#if calloutType.zhCommand}
                                    <code>{calloutType.zhCommand}</code>
                                {/if}
                            </div>
                        </div>
                        <div class="type-actions">
                            <button class="action-btn" on:click={() => handleEdit(calloutType)} title="编辑">
                                <svg><use xlink:href="#iconEdit"></use></svg>
                            </button>
                            {#if isModified(calloutType)}
                                <button class="action-btn" on:click={() => handleReset(calloutType)} title="重置">
                                    <svg><use xlink:href="#iconUndo"></use></svg>
                                </button>
                            {/if}
                            {#if isCustom(calloutType)}
                                <button class="action-btn action-delete" on:click={() => handleDelete(calloutType)} title="删除">
                                    <svg><use xlink:href="#iconTrashcan"></use></svg>
                                </button>
                            {/if}
                        </div>
                    </div>

                    <div class="type-preview" style="background: {calloutType.bgGradient}; border-left-color: {calloutType.borderColor};">
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
    {/if}
</div>

{#if showEditDialog}
    <EditDialog
        config={editingType}
        {isNewType}
        onSave={handleSave}
        onCancel={() => showEditDialog = false}
        existingCommands={getExistingCommands()}
    />
{/if}

<style>
    .callout-settings-panel {
        padding: 20px;
        height: 100%;
        overflow-y: auto;
        box-sizing: border-box;
    }

    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 16px;
        color: var(--b3-theme-on-background);
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

    .header-actions {
        display: flex;
        gap: 8px;
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

    .types-list {
        display: grid;
        gap: 16px;
        margin-bottom: 24px;
    }

    .type-card {
        border: 1px solid var(--b3-border-color);
        border-radius: 6px;
        padding: 16px;
        background: var(--b3-theme-background);
        transition: all 0.2s ease;
    }

    .type-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .type-card.modified {
        border-left: 4px solid var(--b3-theme-primary);
    }

    .type-card.custom {
        border-left: 4px solid var(--b3-theme-secondary);
    }

    .type-header {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        align-items: center;
    }

    .type-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .type-icon :global(svg) {
        width: 24px;
        height: 24px;
    }

    .type-info {
        flex: 1;
        min-width: 0;
    }

    .type-name {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 500;
    }

    .badge-modified {
        background: var(--b3-theme-primary-lighter);
        color: var(--b3-theme-primary);
    }

    .badge-custom {
        background: var(--b3-theme-secondary-lighter);
        color: var(--b3-theme-secondary);
    }

    .type-commands {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .type-commands code {
        padding: 2px 8px;
        background: var(--b3-theme-surface);
        border-radius: 3px;
        font-size: 12px;
        color: var(--b3-theme-on-surface);
    }

    .type-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
    }

    .action-btn {
        width: 32px;
        height: 32px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background: var(--b3-theme-surface);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: all 0.2s;
    }

    .action-btn:hover {
        background: var(--b3-theme-primary-lighter);
        border-color: var(--b3-theme-primary);
        color: var(--b3-theme-primary);
    }

    .action-btn.action-delete:hover {
        background: var(--b3-theme-error-lighter);
        border-color: var(--b3-theme-error);
        color: var(--b3-theme-error);
    }

    .action-btn svg {
        width: 16px;
        height: 16px;
    }

    .type-preview {
        border: 1px solid #e5e7eb;
        border-left: 4px solid;
        border-radius: 4px;
        padding: 12px;
        margin-top: 12px;
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

