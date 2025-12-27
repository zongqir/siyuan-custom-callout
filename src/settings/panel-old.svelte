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
    let draggedIndex: number | null = null;
    let dragOverIndex: number | null = null;

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

    async function handleToggleHide(type: CalloutTypeConfig) {
        const isHidden = ConfigManager.isTypeHidden(config, type.type);
        
        if (isHidden) {
            // 显示
            config = ConfigManager.showDefaultType(config, type.type);
            await saveConfig();
            showMessage('已显示', 2000, 'info');
        } else {
            // 隐藏
            config = ConfigManager.hideDefaultType(config, type.type);
            await saveConfig();
            showMessage('已隐藏', 2000, 'info');
        }
    }

    async function handleDelete(type: CalloutTypeConfig) {
        // 自定义类型：删除
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

    async function handleResetAll() {
        if (confirm('确定要重置所有配置吗？\n\n这将：\n• 恢复所有预设类型\n• 删除所有自定义类型\n• 清除所有修改记录\n\n此操作不可撤销！')) {
            config = ConfigManager.resetAll();
            await saveConfig();
            showMessage('已重置所有配置', 2000, 'info');
        }
    }

    function isModified(type: CalloutTypeConfig): boolean {
        return config.modifiedDefaults.has(type.type);
    }

    function isCustom(type: CalloutTypeConfig): boolean {
        return config.customTypes.some(t => t.type === type.type);
    }

    function isHidden(type: CalloutTypeConfig): boolean {
        return ConfigManager.isTypeHidden(config, type.type);
    }

    function getExistingCommands(): string[] {
        return allTypes
            .filter(t => !editingType || t.type !== editingType.type)
            .flatMap(t => [t.command, t.zhCommand].filter(Boolean) as string[]);
    }

    // 拖拽相关函数
    function handleDragStart(event: DragEvent, index: number) {
        draggedIndex = index;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', index.toString());
        }
    }

    function handleDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        dragOverIndex = index;
    }

    async function handleDrop(event: DragEvent, dropIndex: number) {
        event.preventDefault();
        
        if (draggedIndex === null || draggedIndex === dropIndex) {
            draggedIndex = null;
            return;
        }

        // 重新排序
        const newTypes = [...allTypes];
        const [draggedItem] = newTypes.splice(draggedIndex, 1);
        newTypes.splice(dropIndex, 0, draggedItem);

        // 更新顺序
        const newOrder = newTypes.map(t => t.type);
        config = ConfigManager.updateTypeOrder(config, newOrder);
        await saveConfig();

        draggedIndex = null;
    }

    function handleDragEnd() {
        draggedIndex = null;
        dragOverIndex = null;
    }

    function handleDragLeave() {
        dragOverIndex = null;
    }
</script>

<div class="callout-settings-panel">
    {#if loading}
        <div class="loading">加载中...</div>
    {:else}
        <div class="settings-header">
            <h2>Callout 类型管理</h2>
            <div class="header-actions">
                <button class="b3-button b3-button--text" on:click={handleResetAll} style="color: var(--b3-theme-error);">
                    <svg class="b3-button__icon"><use xlink:href="#iconUndo"></use></svg>
                    整体重置
                </button>
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
            <p>💡 你可以新建自定义 Callout 类型，修改预设类型的样式，或隐藏不需要的类型（隐藏后在命令菜单中不显示，但仍可在设置中查看和恢复）。</p>
            <p>🔀 拖拽卡片可以调整类型的显示顺序。</p>
            <p>📝 当前共有 <strong>{allTypes.length}</strong> 个类型（{ConfigManager.getVisibleDefaultTypesCount(config)} 个预设可用 + {config.customTypes.length} 个自定义{config.hiddenDefaults.size > 0 ? `，${config.hiddenDefaults.size} 个已隐藏` : ''}）</p>
        </div>

        <div class="types-list">
            {#each allTypes as calloutType, index}
                <div 
                    class="type-card" 
                    class:modified={isModified(calloutType)} 
                    class:custom={isCustom(calloutType)}
                    class:hidden={isHidden(calloutType)}
                    class:dragging={draggedIndex === index}
                    class:drag-over={dragOverIndex === index && draggedIndex !== index}
                    draggable="true"
                    on:dragstart={(e) => handleDragStart(e, index)}
                    on:dragover={(e) => handleDragOver(e, index)}
                    on:dragleave={handleDragLeave}
                    on:drop={(e) => handleDrop(e, index)}
                    on:dragend={handleDragEnd}
                >
                    <div class="type-header">
                        <div class="drag-handle" title="拖拽排序">
                            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        </div>
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
                                {#if isHidden(calloutType)}
                                    <span class="badge badge-hidden">已隐藏</span>
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
                                <button class="action-btn" on:click={() => handleReset(calloutType)} title="重置为默认">
                                    <svg><use xlink:href="#iconUndo"></use></svg>
                                </button>
                            {/if}
                            {#if !isCustom(calloutType)}
                                <!-- 预设类型：隐藏/显示 -->
                                <button class="action-btn" on:click={() => handleToggleHide(calloutType)} title={isHidden(calloutType) ? '显示' : '隐藏'}>
                                    <svg><use xlink:href={isHidden(calloutType) ? '#iconEye' : '#iconEyeoff'}></use></svg>
                                </button>
                            {:else}
                                <!-- 自定义类型：删除 -->
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
        isNew={isNewType}
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

    .type-card.hidden {
        opacity: 0.6;
        background: var(--b3-theme-surface-lighter);
    }

    .type-card.dragging {
        opacity: 0.4;
        transform: scale(0.95);
        border: 2px dashed var(--b3-theme-primary);
    }

    .type-card.drag-over {
        border-top: 3px solid var(--b3-theme-primary);
        margin-top: -3px;
        padding-top: 19px;
    }

    .type-card {
        cursor: grab;
        transition: all 0.2s ease;
    }

    .type-card:active {
        cursor: grabbing;
    }

    .drag-handle {
        width: 24px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        color: var(--b3-theme-on-surface);
        opacity: 0.4;
        flex-shrink: 0;
        margin-right: 8px;
    }

    .drag-handle:hover {
        opacity: 0.8;
    }

    .type-card:active .drag-handle {
        cursor: grabbing;
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

    .badge-hidden {
        background: var(--b3-theme-surface);
        color: var(--b3-theme-on-surface);
        border: 1px solid var(--b3-border-color);
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

