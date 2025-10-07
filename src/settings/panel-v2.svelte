<script lang="ts">
    import { onMount } from 'svelte';
    import type { CalloutManager } from '../callout/manager';
    import type CustomCalloutPlugin from '../index';
    import type { CalloutTypeConfig } from '../callout/types';
    import { DEFAULT_CALLOUT_TYPES } from '../callout/types';
    import { ConfigManager, type CalloutConfig } from '../callout/config';
    import { THEME_STYLES } from '../callout/themes/index';
    import EditDialog from './edit-dialog.svelte';
    import { showMessage } from 'siyuan';

    export let plugin: CustomCalloutPlugin;
    export let calloutManager: CalloutManager;

    let config: CalloutConfig;
    let allTypes: CalloutTypeConfig[] = [];
    let showEditDialog = false;
    let editingType: CalloutTypeConfig | null = null;
    let isNewType = false;
    let loading = true;
    let draggedIndex: number | null = null;
    let dragOverIndex: number | null = null;
    let gridColumns: number = 3; // 可选：2, 3, 4
    
    // 折叠状态
    let menuPreviewCollapsed = false;
    let themeCollapsed = false;
    
    // 监听列数变化并保存
    $: if (config && gridColumns !== config.gridColumns) {
        handleGridColumnsChange(gridColumns);
    }

    onMount(async () => {
        await loadConfig();
        loading = false;
    });

    async function loadConfig() {
        config = await ConfigManager.load(plugin);
        allTypes = ConfigManager.getAllTypes(config);
        gridColumns = config.gridColumns || 3;
    }
    
    async function handleGridColumnsChange(newColumns: number) {
        if (!config) return;
        config = { ...config, gridColumns: newColumns };
        await saveConfig();
    }

    async function handleThemeChange(newThemeId: string) {
        if (!config) return;
        config = { ...config, themeId: newThemeId };
        await saveConfig();
        showMessage(`已切换到「${THEME_STYLES.find(t => t.id === newThemeId)?.name}」风格`, 2000, 'info');
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
                if (ConfigManager.isTypeIdExists(config, newConfig.type)) {
                    showMessage('该类型ID已存在', 3000, 'error');
                    return;
                }
                config = ConfigManager.addCustomType(config, newConfig);
                showMessage('添加成功', 2000, 'info');
            } else {
                const isDefaultType = DEFAULT_CALLOUT_TYPES.some(t => t.type === editingType!.type);
                if (isDefaultType) {
                    config = ConfigManager.modifyDefaultType(config, editingType!.type, newConfig);
                } else {
                    config = ConfigManager.updateCustomType(config, editingType!.type, newConfig);
                }
                showMessage('保存成功', 2000, 'info');
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
            config = ConfigManager.showDefaultType(config, type.type);
            await saveConfig();
            showMessage('已显示', 1500, 'info');
        } else {
            config = ConfigManager.hideDefaultType(config, type.type);
            await saveConfig();
            showMessage('已隐藏', 1500, 'info');
        }
    }

    async function handleDelete(type: CalloutTypeConfig) {
        if (confirm(`确定要删除 "${type.displayName}" 吗？`)) {
            config = ConfigManager.deleteCustomType(config, type.type);
            await saveConfig();
            showMessage('删除成功', 2000, 'info');
        }
    }

    async function handleReset(type: CalloutTypeConfig) {
        if (confirm(`确定要重置 "${type.displayName}" 为默认设置吗？`)) {
            config = ConfigManager.resetDefaultType(config, type.type);
            await saveConfig();
            showMessage('重置成功', 2000, 'info');
        }
    }

    async function handleResetAll() {
        if (confirm('确定要重置所有配置吗？\n\n这将：\n• 恢复所有预设类型\n• 删除所有自定义类型\n• 清除所有修改记录\n• 保留网格列数设置\n\n此操作不可撤销！')) {
            config = ConfigManager.resetAll(true, config);
            await saveConfig();
            showMessage('已重置所有配置', 2000, 'info');
        }
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
            dragOverIndex = null;
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
        dragOverIndex = null;
    }

    function handleDragEnd() {
        draggedIndex = null;
        dragOverIndex = null;
    }

    function handleDragLeave() {
        dragOverIndex = null;
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
</script>

<div class="callout-settings-v2">
    {#if loading}
        <div class="loading">加载中...</div>
    {:else}
        <div class="settings-header">
            <h2>Callout 类型管理</h2>
            <div class="header-actions">
                <div class="column-selector">
                    <span style="font-size: 13px; color: var(--b3-theme-on-surface);">列数：</span>
                    <button class="col-btn" class:active={gridColumns === 2} on:click={() => gridColumns = 2}>2</button>
                    <button class="col-btn" class:active={gridColumns === 3} on:click={() => gridColumns = 3}>3</button>
                    <button class="col-btn" class:active={gridColumns === 4} on:click={() => gridColumns = 4}>4</button>
                </div>
                <button class="b3-button b3-button--text" on:click={handleResetAll} style="color: var(--b3-theme-error);">
                    <svg class="b3-button__icon"><use xlink:href="#iconUndo"></use></svg>
                    整体重置
                </button>
            </div>
        </div>

        <!-- 命令菜单模拟区域 -->
        <div class="menu-section">
            <div class="section-header clickable" on:click={() => menuPreviewCollapsed = !menuPreviewCollapsed}>
                <div class="header-left">
                    <h3>📋 命令菜单预览</h3>
                    <p>拖拽卡片调整顺序，点击眼睛图标切换隐藏（输入 <code>&gt;</code> 时显示此菜单）</p>
                </div>
                <button class="collapse-btn" class:collapsed={menuPreviewCollapsed}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
                </button>
            </div>

            {#if !menuPreviewCollapsed}
            <div class="menu-grid" style="grid-template-columns: repeat({gridColumns}, 1fr);">
                <!-- 原生样式选项 -->
                <div class="menu-item none-item">
                    <div class="menu-item-content" style="background: linear-gradient(to bottom, #f9fafb, #ffffff); border-left-color: #9ca3af;">
                        <div class="menu-item-icon" style="color: #6b7280;">
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                        </div>
                        <div class="menu-item-name" style="color: #6b7280;">原生样式</div>
                    </div>
                </div>

                <!-- 所有类型 -->
                {#each allTypes as calloutType, index}
                    <div 
                        class="menu-item" 
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
                        <div class="menu-item-content" style="background: {calloutType.bgGradient}; border-left-color: {calloutType.borderColor};">
                            <div class="drag-indicator">⋮⋮</div>
                            <div class="menu-item-icon" style="color: {calloutType.color};">
                                {@html calloutType.icon}
                            </div>
                            <div class="menu-item-name" style="color: {calloutType.color};">
                                {calloutType.displayName}
                            </div>
                        </div>
                        
                        <div class="menu-item-controls">
                            <button class="edit-btn" on:click|stopPropagation={() => handleEdit(calloutType)} title="编辑">
                                <svg width="16" height="16"><use xlink:href="#iconEdit"></use></svg>
                            </button>
                            <button class="hide-btn" on:click|stopPropagation={() => handleToggleHide(calloutType)} title={isHidden(calloutType) ? '显示' : '隐藏'}>
                                <svg width="16" height="16"><use xlink:href={isHidden(calloutType) ? '#iconEye' : '#iconEyeoff'}></use></svg>
                            </button>
                        </div>
                    </div>
                {/each}

                <!-- 添加新类型按钮 -->
                <div class="menu-item add-item" on:click={handleAddNew}>
                    <div class="add-content">
                        <div class="add-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                        </div>
                        <div class="add-text">新建类型</div>
                    </div>
                </div>
            </div>
            {/if}
        </div>

        <!-- 主题风格选择 -->
        <div class="theme-section">
            <div class="section-header clickable" on:click={() => themeCollapsed = !themeCollapsed}>
                <div class="header-left">
                    <h3>🎨 整体风格</h3>
                    <p>点击任意风格即可切换</p>
                </div>
                <button class="collapse-btn" class:collapsed={themeCollapsed}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
                </button>
            </div>

            {#if !themeCollapsed}
            <div class="theme-grid">
                {#each THEME_STYLES as theme}
                    <div 
                        class="theme-card" 
                        class:active={config.themeId === theme.id}
                        on:click={() => handleThemeChange(theme.id)}
                    >
                        <div class="theme-header">
                            <div class="theme-emoji">{theme.preview}</div>
                            <div class="theme-name">{theme.name}</div>
                        </div>
                        
                        <!-- 实时预览 -->
                        <div class="theme-preview-box">
                            <div 
                                class="mini-callout"
                                style="
                                    background: linear-gradient(to bottom, #eff6ff, #ffffff);
                                    border: {theme.borderWidth} solid #e5e7eb;
                                    border-left: {theme.leftBorderWidth} solid #4493f8;
                                    border-radius: {theme.borderRadius};
                                    padding: {theme.padding};
                                    box-shadow: {theme.boxShadow};
                                    transition: {theme.transition};
                                "
                            >
                                <div 
                                    class="mini-title"
                                    style="
                                        font-size: {theme.titleFontSize};
                                        font-weight: {theme.titleFontWeight};
                                        padding: {theme.titlePadding};
                                        color: #4493f8;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                    "
                                >
                                    <svg width="{theme.iconSize}" height="{theme.iconSize}" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="#4493f8" stroke-width="1.7"/>
                                        <rect x="11" y="7" width="2" height="7" rx="1" fill="#4493f8"/>
                                        <circle cx="12" cy="17" r="1.2" fill="#4493f8"/>
                                    </svg>
                                    <span>信息说明</span>
                                </div>
                                <div 
                                    class="mini-content"
                                    style="
                                        font-size: {theme.contentFontSize};
                                        line-height: {theme.contentLineHeight};
                                        padding: {theme.contentPadding};
                                        color: #374151;
                                    "
                                >
                                    这是示例内容
                                </div>
                            </div>
                        </div>
                        
                        {#if config.themeId === theme.id}
                            <div class="theme-check">✓</div>
                        {/if}
                    </div>
                {/each}
            </div>
            {/if}
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
    .callout-settings-v2 {
        padding: 20px;
        height: 100%;
        overflow-y: auto;
    }

    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
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
        align-items: center;
        gap: 16px;
    }

    .column-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        background: var(--b3-theme-surface);
        border-radius: 6px;
        border: 1px solid var(--b3-border-color);
    }

    .col-btn {
        width: 32px;
        height: 28px;
        border: 1px solid var(--b3-border-color);
        background: var(--b3-theme-background);
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
    }

    .col-btn:hover {
        border-color: var(--b3-theme-primary);
        color: var(--b3-theme-primary);
    }

    .col-btn.active {
        background: var(--b3-theme-primary);
        color: white;
        border-color: var(--b3-theme-primary);
    }

    /* 主题选择区域 */
    .theme-section {
        margin-bottom: 32px;
    }

    .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
    }

    .theme-card {
        position: relative;
        padding: 0;
        border: 2px solid var(--b3-border-color);
        border-radius: 12px;
        background: var(--b3-theme-background);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    }

    .theme-card:hover {
        border-color: var(--b3-theme-primary);
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .theme-card.active {
        border-color: var(--b3-theme-primary);
        border-width: 3px;
        background: linear-gradient(135deg, var(--b3-theme-primary-lighter) 0%, var(--b3-theme-background) 100%);
        box-shadow: 0 8px 24px rgba(var(--b3-theme-primary), 0.2);
    }

    .theme-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: linear-gradient(135deg, var(--b3-theme-surface) 0%, var(--b3-theme-background) 100%);
        border-bottom: 1px solid var(--b3-border-color);
    }

    .theme-emoji {
        font-size: 24px;
        line-height: 1;
        flex-shrink: 0;
    }

    .theme-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--b3-theme-on-background);
        flex: 1;
    }

    .theme-preview-box {
        padding: 16px;
        background: #f9fafb;
    }

    .mini-callout {
        transition: transform 0.2s;
    }

    .theme-card:hover .mini-callout {
        transform: scale(1.02);
    }

    .mini-title {
        margin-bottom: 6px;
    }

    .mini-content {
        opacity: 0.85;
    }

    .theme-check {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 28px;
        height: 28px;
        background: var(--b3-theme-primary);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 10;
    }

    /* 菜单模拟区域 */
    .menu-section {
        margin-bottom: 32px;
    }

    .section-header {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .section-header.clickable {
        cursor: pointer;
        user-select: none;
        padding: 8px 12px;
        margin: -8px -12px 16px -12px;
        border-radius: 6px;
        transition: background 0.2s;
    }

    .section-header.clickable:hover {
        background: var(--b3-theme-surface);
    }

    .header-left {
        flex: 1;
        min-width: 0;
    }

    .section-header h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
    }

    .section-header p {
        margin: 0;
        font-size: 13px;
        color: var(--b3-theme-on-surface);
    }

    .section-header code {
        padding: 2px 6px;
        background: var(--b3-theme-surface);
        border-radius: 3px;
        font-size: 12px;
    }

    .collapse-btn {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
        color: var(--b3-theme-on-surface);
    }

    .collapse-btn:hover {
        background: var(--b3-theme-primary-lighter);
        color: var(--b3-theme-primary);
    }

    .collapse-btn svg {
        transition: transform 0.2s;
    }

    .collapse-btn.collapsed svg {
        transform: rotate(-90deg);
    }

    .menu-grid {
        display: grid;
        gap: 12px;
        padding: 16px;
        background: var(--b3-theme-surface);
        border-radius: 8px;
        border: 1px solid var(--b3-border-color);
    }

    .menu-item {
        position: relative;
        border-radius: 6px;
        overflow: visible;
        transition: all 0.2s;
        cursor: grab;
    }

    .menu-item:not(.none-item):not(.add-item):active {
        cursor: grabbing;
    }

    .menu-item:not(.none-item):not(.add-item):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .menu-item.hidden {
        opacity: 0.45;
    }

    .menu-item.dragging {
        opacity: 0.5;
        transform: scale(0.95);
    }

    .menu-item.drag-over {
        border: 2px dashed var(--b3-theme-primary);
        background: var(--b3-theme-primary-lighter);
    }

    .menu-item.none-item,
    .menu-item.add-item {
        cursor: default;
    }

    .menu-item-content {
        padding: 14px 16px;
        border: 1px solid #e5e7eb;
        border-left: 4px solid;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 64px;
        position: relative;
    }

    .drag-indicator {
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
        color: var(--b3-theme-on-surface);
        opacity: 0.3;
        line-height: 1;
        letter-spacing: -2px;
        cursor: grab;
    }

    .menu-item:not(.none-item):not(.add-item):hover .drag-indicator {
        opacity: 0.6;
    }

    .menu-item:not(.none-item):not(.add-item):active .drag-indicator {
        cursor: grabbing;
    }

    .menu-item-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .menu-item-icon :global(svg) {
        width: 20px;
        height: 20px;
    }

    .menu-item-name {
        font-size: 14px;
        font-weight: 600;
        flex: 1;
    }

    .menu-item-controls {
        position: absolute;
        top: 6px;
        right: 6px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 10;
    }

    .menu-item:hover .menu-item-controls {
        opacity: 1;
    }

    .edit-btn,
    .hide-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: all 0.2s;
    }

    .edit-btn:hover {
        background: var(--b3-theme-secondary);
        color: white;
        transform: scale(1.1);
    }

    .hide-btn:hover {
        background: var(--b3-theme-primary);
        color: white;
        transform: scale(1.1);
    }

    .edit-btn svg,
    .hide-btn svg {
        width: 16px;
        height: 16px;
    }

    /* 原生样式 */
    .none-item {
        cursor: default !important;
    }

    .none-item .menu-item-content {
        opacity: 0.9;
    }

    /* 添加按钮 */
    .add-item {
        border: 2px dashed var(--b3-border-color);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 64px;
        cursor: pointer !important;
        transition: all 0.2s;
        background: var(--b3-theme-background-light);
    }

    .add-item:hover {
        border-color: var(--b3-theme-primary);
        background: var(--b3-theme-primary-lighter);
        transform: translateY(-2px);
    }

    .add-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }

    .add-icon {
        color: var(--b3-theme-primary);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .add-text {
        font-size: 13px;
        font-weight: 600;
        color: var(--b3-theme-primary);
    }

</style>

