<script lang="ts">
    import { onMount } from 'svelte';
    import type { CalloutManager } from '../callout/manager';
    import type CustomCalloutPlugin from '../index';
    import type { CalloutTypeConfig } from '../callout/types';
    import { DEFAULT_CALLOUT_TYPES } from '../callout/types';
    import { ConfigManager, type CalloutConfig } from '../callout/config';
    import { THEME_STYLES } from '../callout/themes/index';
    import { OUTLINE_THEME_STYLES, getDefaultOutlineTheme } from '../dock/themes';
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
    let outlineThemeCollapsed = false;
    
    // 主题覆盖配置
    let backgroundStyle: 'solid' | 'gradient' | 'default' = 'default';
    let borderRadius: string = 'default';
    let leftBorderWidth: string = 'default';
    let borderWidth: string = 'default';
    let titleFontSize: string = 'default';
    let titleFontWeight: string = 'default';
    let titleHeight: string = 'default';
    let iconSize: string = 'default';
    let hideIcon: boolean = false;
    let hideTitle: boolean = false;
    
    // 监听列数变化并保存
    $: if (config && gridColumns !== config.gridColumns) {
        handleGridColumnsChange(gridColumns);
    }

    // 获取当前选中的主题
    $: currentTheme = THEME_STYLES.find(t => t.id === config?.themeId) || THEME_STYLES[0];
    
    // 大纲主题会在设置界面中直接使用，不需要单独的响应式变量

    // 计算预览样式（主题 + 样式微调）
    $: previewStyles = {
        background: backgroundStyle === 'solid' 
            ? 'rgba(68, 147, 248, 0.08)' 
            : (backgroundStyle === 'gradient' 
                ? 'linear-gradient(to bottom, #eff6ff, #ffffff)'
                : (currentTheme.backgroundStyle === 'solid'
                    ? 'rgba(68, 147, 248, 0.08)'
                    : 'linear-gradient(to bottom, #eff6ff, #ffffff)')),
        borderWidth: borderWidth !== 'default' ? borderWidth : currentTheme.borderWidth,
        leftBorderWidth: leftBorderWidth !== 'default' ? leftBorderWidth : currentTheme.leftBorderWidth,
        borderRadius: borderRadius !== 'default' ? borderRadius : currentTheme.borderRadius,
        padding: currentTheme.padding,
        boxShadow: currentTheme.boxShadow,
        titleFontSize: titleFontSize !== 'default' ? titleFontSize : currentTheme.titleFontSize,
        titleFontWeight: titleFontWeight !== 'default' ? titleFontWeight : currentTheme.titleFontWeight,
        titleHeight: titleHeight !== 'default' ? titleHeight : currentTheme.titleHeight,
        iconSize: iconSize !== 'default' ? iconSize : currentTheme.iconSize,
    };

    onMount(async () => {
        await loadConfig();
        loading = false;
    });

    async function loadConfig() {
        config = await ConfigManager.load(plugin);
        allTypes = ConfigManager.getAllTypes(config);
        gridColumns = config.gridColumns || 3;
        
        // 加载主题覆盖配置
        const overrides = config.themeOverrides || {};
        backgroundStyle = overrides.backgroundStyle || 'default';
        borderRadius = overrides.borderRadius || 'default';
        leftBorderWidth = overrides.leftBorderWidth || 'default';
        borderWidth = overrides.borderWidth || 'default';
        titleFontSize = overrides.titleFontSize || 'default';
        titleFontWeight = overrides.titleFontWeight || 'default';
        titleHeight = overrides.titleHeight || 'default';
        iconSize = overrides.iconSize || 'default';
        hideIcon = overrides.hideIcon || false;
        hideTitle = overrides.hideTitle || false;
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
    
    async function handleOutlineThemeChange(newThemeId: string) {
        if (!config) return;
        config = { ...config, outlineThemeId: newThemeId };
        await saveConfig();
        
        // 通知插件更新大纲主题
        if (plugin.updateOutlineTheme) {
            await plugin.updateOutlineTheme(newThemeId);
        }
        
        showMessage(`大纲已切换到「${OUTLINE_THEME_STYLES.find(t => t.id === newThemeId)?.name}」风格`, 2000, 'info');
    }
    
    async function handleOverrideChange() {
        if (!config) return;
        
        // 构建覆盖配置（只保存非默认值）
        const overrides: any = {};
        if (backgroundStyle !== 'default') overrides.backgroundStyle = backgroundStyle;
        if (borderRadius !== 'default') overrides.borderRadius = borderRadius;
        if (leftBorderWidth !== 'default') overrides.leftBorderWidth = leftBorderWidth;
        if (borderWidth !== 'default') overrides.borderWidth = borderWidth;
        if (titleFontSize !== 'default') overrides.titleFontSize = titleFontSize;
        if (titleFontWeight !== 'default') overrides.titleFontWeight = titleFontWeight;
        if (titleHeight !== 'default') overrides.titleHeight = titleHeight;
        if (iconSize !== 'default') overrides.iconSize = iconSize;
        if (hideIcon) overrides.hideIcon = hideIcon;
        if (hideTitle) overrides.hideTitle = hideTitle;
        
        config = { ...config, themeOverrides: overrides };
        await saveConfig();
        showMessage('样式已更新');
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

    async function handleResetOverrides() {
        if (confirm('确定要重置样式微调吗？\n\n这将恢复到当前主题的默认样式。')) {
            // 重置所有微调选项
            backgroundStyle = 'default';
            borderRadius = 'default';
            leftBorderWidth = 'default';
            borderWidth = 'default';
            titleFontSize = 'default';
            titleFontWeight = 'default';
            titleHeight = 'default';
            iconSize = 'default';
            hideIcon = false;
            hideTitle = false;
            
            // 清空配置中的微调设置
            config = { ...config, themeOverrides: {} };
            await saveConfig();
            showMessage('样式微调已重置', 2000, 'info');
        }
    }

    // 类型管理相关函数
    function isTypeHidden(typeId: string): boolean {
        return config?.hiddenDefaults?.has(typeId) || false;
    }
    
    async function toggleTypeVisibility(typeId: string) {
        if (!config) return;
        
        const hiddenDefaults = new Set(config.hiddenDefaults);
        if (hiddenDefaults.has(typeId)) {
            hiddenDefaults.delete(typeId);
        } else {
            hiddenDefaults.add(typeId);
        }
        
        config = { ...config, hiddenDefaults };
        await saveConfig();
        showMessage(`已${hiddenDefaults.has(typeId) ? '隐藏' : '显示'}「${typeId}」类型`, 2000, 'info');
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
            <h2>Callout 自定义设置</h2>
            <div class="header-actions">
                <button class="b3-button b3-button--text" on:click={handleResetAll} style="color: var(--b3-theme-error);">
                    <svg class="b3-button__icon"><use xlink:href="#iconUndo"></use></svg>
                    整体重置
                </button>
            </div>
        </div>

        <!-- 1. 命令菜单调整 -->
        <div class="menu-section">
            <div class="section-header clickable" on:click={() => menuPreviewCollapsed = !menuPreviewCollapsed}>
                <div class="header-left">
                    <h3><span class="section-number">1.</span> 命令菜单调整</h3>
                    <p>拖拽卡片调整顺序，点击眼睛图标切换隐藏（输入 <code>&gt;</code> 时显示此菜单）</p>
                </div>
                <div class="section-header-right">
                    <div class="column-selector">
                        <span style="font-size: 12px; color: var(--b3-theme-on-surface); margin-right: 8px;">列数：</span>
                        <button class="col-btn" class:active={gridColumns === 2} on:click|stopPropagation={() => gridColumns = 2}>2</button>
                        <button class="col-btn" class:active={gridColumns === 3} on:click|stopPropagation={() => gridColumns = 3}>3</button>
                        <button class="col-btn" class:active={gridColumns === 4} on:click|stopPropagation={() => gridColumns = 4}>4</button>
                    </div>
                    <button class="collapse-btn" class:collapsed={menuPreviewCollapsed}>
                        <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
                    </button>
                </div>
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

        <!-- 2. 主题风格选择 -->
        <div class="theme-section">
            <div class="section-header clickable" on:click={() => themeCollapsed = !themeCollapsed}>
                <div class="header-left">
                    <h3><span class="section-number">2.</span> 整体风格</h3>
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
                                        min-height: {theme.titleHeight};
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
        
        <!-- 3. 样式微调 -->
        {#if !themeCollapsed}
        <div class="override-section">
            <div class="section-header">
                <div class="header-left">
                    <h3><span class="section-number">3.</span> 样式微调</h3>
                    <p>覆盖当前主题的默认样式，精细控制每个细节</p>
                </div>
                <button class="reset-override-btn" on:click={handleResetOverrides} title="重置样式微调">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    重置微调
                </button>
            </div>
            
            <div class="override-content">
                <div class="override-grid">
                    <!-- 背景样式 -->
                    <div class="override-item">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 6px;">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M3 12h18" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            背景样式
                        </label>
                        <select bind:value={backgroundStyle} on:change={handleOverrideChange}>
                            <option value="default">⚙️ 默认</option>
                            <option value="solid">⬜ 纯色</option>
                            <option value="gradient">🌈 渐变</option>
                        </select>
                    </div>
                    
                    <!-- 圆角大小 -->
                    <div class="override-item">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 6px;">
                                <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            圆角大小
                        </label>
                        <select bind:value={borderRadius} on:change={handleOverrideChange}>
                            <option value="default">⚙️ 默认</option>
                            <option value="0px">▢ 无圆角 (0px)</option>
                            <option value="4px">◻️ 小圆角 (4px)</option>
                            <option value="8px">▢ 中圆角 (8px)</option>
                            <option value="12px">▢ 大圆角 (12px)</option>
                            <option value="16px">◉ 超大圆角 (16px)</option>
                        </select>
                    </div>
                    
                    <!-- 左侧条纹粗细 -->
                    <div class="override-item">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 6px;">
                                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                                <rect x="14" y="4" width="6" height="16" stroke="currentColor" stroke-width="1"/>
                            </svg>
                            左侧条纹
                        </label>
                        <select bind:value={leftBorderWidth} on:change={handleOverrideChange}>
                            <option value="default">⚙️ 默认</option>
                            <option value="0px">─ 无条纹</option>
                            <option value="2px">│ 细 (2px)</option>
                            <option value="4px">┃ 中 (4px)</option>
                            <option value="6px">┃ 粗 (6px)</option>
                            <option value="8px">█ 超粗 (8px)</option>
                        </select>
                    </div>
                    
                    <!-- 边框粗细 -->
                    <div class="override-item">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 6px;">
                                <rect x="4" y="4" width="16" height="16" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            边框粗细
                        </label>
                        <select bind:value={borderWidth} on:change={handleOverrideChange}>
                            <option value="default">⚙️ 默认</option>
                            <option value="0px">□ 无边框</option>
                            <option value="1px">▢ 细 (1px)</option>
                            <option value="2px">▢ 中 (2px)</option>
                            <option value="3px">▣ 粗 (3px)</option>
                        </select>
                    </div>
                    
                    <!-- 标题字体大小 -->
                    <div class="override-item">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 6px;">
                                <text x="4" y="16" font-size="14" fill="currentColor" font-weight="bold">A</text>
                            </svg>
                            标题字体大小
                        </label>
                        <select bind:value={titleFontSize} on:change={handleOverrideChange}>
                            <option value="default">⚙️ 默认</option>
                            <option value="0.8em">🔹 极小 (0.8em)</option>
                            <option value="0.85em">🔸 小 (0.85em)</option>
                            <option value="0.9em">🔸 偏小 (0.9em)</option>
                            <option value="0.95em">🔷 中 (0.95em)</option>
                            <option value="1em">🔶 标准 (1em)</option>
                            <option value="1.05em">🔶 偏大 (1.05em)</option>
                            <option value="1.1em">🔺 大 (1.1em)</option>
                            <option value="1.2em">🔴 超大 (1.2em)</option>
                        </select>
                    </div>
                    
                    <!-- 标题字体粗细 -->
                    <div class="override-item">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 6px;">
                                <text x="4" y="16" font-size="12" fill="currentColor" font-weight="800">B</text>
                            </svg>
                            标题字体粗细
                        </label>
                        <select bind:value={titleFontWeight} on:change={handleOverrideChange}>
                            <option value="default">⚙️ 默认</option>
                            <option value="400">▱ 正常 (400)</option>
                            <option value="500">▰ 稍粗 (500)</option>
                            <option value="600">▰ 粗体 (600)</option>
                            <option value="700">▰ 超粗 (700)</option>
                            <option value="800">▰ 特粗 (800)</option>
                        </select>
                    </div>

                    <!-- 标题栏高度 -->
                    <div class="override-item">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 6px;">
                                <rect x="4" y="6" width="16" height="12" stroke="currentColor" stroke-width="2" fill="none"/>
                                <path d="M4 10h16M4 14h16" stroke="currentColor" stroke-width="1"/>
                            </svg>
                            标题栏高度
                        </label>
                        <select bind:value={titleHeight} on:change={handleOverrideChange}>
                            <option value="default">⚙️ 默认</option>
                            <option value="auto">📏 自适应 (auto)</option>
                            <option value="20px">🔹 绝对紧凑 (20px)</option>
                            <option value="24px">🔸 超级紧凑 (24px)</option>
                            <option value="28px">📐 紧凑 (28px)</option>
                            <option value="32px">📐 标准 (32px)</option>
                            <option value="36px">📐 适中 (36px)</option>
                            <option value="40px">📐 宽松 (40px)</option>
                            <option value="44px">📐 超大 (44px)</option>
                            <option value="48px">📐 特大 (48px)</option>
                        </select>
                    </div>
                    
                    <!-- 图标大小 -->
                    <div class="override-item">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 6px;">
                                <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                            </svg>
                            图标大小
                        </label>
                        <select bind:value={iconSize} on:change={handleOverrideChange}>
                            <option value="default">⚙️ 默认</option>
                            <option value="14px">⚪ 小 (14px)</option>
                            <option value="16px">⚪ 中 (16px)</option>
                            <option value="18px">🔵 偏大 (18px)</option>
                            <option value="20px">🔵 大 (20px)</option>
                            <option value="22px">🟣 超大 (22px)</option>
                            <option value="24px">🟣 特大 (24px)</option>
                        </select>
                    </div>
                    
                    <!-- 隐藏图标 -->
                    <div class="override-item override-checkbox">
                        <label>
                            <input type="checkbox" bind:checked={hideIcon} on:change={handleOverrideChange} />
                            <span>隐藏图标</span>
                        </label>
                    </div>
                    
                    <!-- 隐藏标题文字 -->
                    <div class="override-item override-checkbox">
                        <label>
                            <input type="checkbox" bind:checked={hideTitle} on:change={handleOverrideChange} />
                            <span>隐藏标题文字</span>
                        </label>
                    </div>
                </div>
                
                <!-- 实时预览 -->
                <div class="override-preview">
                    <h4>实时预览 <span class="hint">(查看样式效果)</span></h4>
                    <div class="preview-container">
                        <div 
                            class="preview-callout"
                            style="
                                background: {previewStyles.background};
                                border: {previewStyles.borderWidth} solid #e5e7eb;
                                border-left: {previewStyles.leftBorderWidth} solid #4493f8;
                                border-radius: {previewStyles.borderRadius};
                                padding: {previewStyles.padding};
                                box-shadow: {previewStyles.boxShadow};
                                transition: all 0.3s ease;
                            "
                        >
                            <div 
                                class="preview-title"
                                style="
                                    font-size: {previewStyles.titleFontSize};
                                    font-weight: {previewStyles.titleFontWeight};
                                    min-height: {previewStyles.titleHeight};
                                    color: #4493f8;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                    margin-bottom: 8px;
                                "
                            >
                                {#if !hideIcon}
                                <svg 
                                    width="{previewStyles.iconSize}" 
                                    height="{previewStyles.iconSize}" 
                                    viewBox="0 0 24 24"
                                    style="flex-shrink: 0;"
                                >
                                    <circle cx="12" cy="12" r="10" stroke="#4493f8" stroke-width="1.7" fill="none"/>
                                    <rect x="11" y="7" width="2" height="7" rx="1" fill="#4493f8"/>
                                    <circle cx="12" cy="17" r="1.2" fill="#4493f8"/>
                                </svg>
                                {/if}
                                {#if !hideTitle}
                                <span>信息说明</span>
                                {/if}
                            </div>
                            <div 
                                class="preview-content"
                                style="
                                    font-size: 0.9em;
                                    color: #374151;
                                    line-height: 1.6;
                                "
                            >
                                这是一个示例 Callout 块，用于展示你的自定义样式效果。调整上方的配置选项，这里会实时显示最终效果。
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/if}

        <!-- 4. 大纲风格 -->
        <div class="theme-section">
            <div class="section-header clickable" on:click={() => outlineThemeCollapsed = !outlineThemeCollapsed}>
                <div class="header-left">
                    <h3><span class="section-number">4.</span> 大纲风格</h3>
                    <p>自定义 Callout 大纲面板的视觉样式</p>
                </div>
                <div class="expand-icon" class:expanded={!outlineThemeCollapsed}>
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path fill="currentColor" d="M8 4l-6 6h12z"/>
                    </svg>
                </div>
            </div>
            
            {#if !outlineThemeCollapsed}
            <div class="theme-grid">
                {#each OUTLINE_THEME_STYLES as theme}
                    <div 
                        class="theme-card outline-theme-card" 
                        class:active={config.outlineThemeId === theme.id}
                        on:click={() => handleOutlineThemeChange(theme.id)}
                    >
                        <div class="theme-header">
                            <div class="theme-emoji">{theme.preview}</div>
                            <div class="theme-name">{theme.name}</div>
                        </div>
                        
                        <div class="theme-description">
                            {theme.description}
                        </div>
                        
                        <!-- 大纲主题预览 -->
                        <div class="outline-theme-preview">
                            <div class="outline-preview-header" style="
                                background: {theme.headerBackground};
                                border-bottom: {theme.headerBorder};
                                padding: {theme.headerPadding};
                            ">
                                <div class="outline-preview-title" style="
                                    color: {theme.headerTitleColor};
                                    font-size: {theme.headerTitleFontSize};
                                    font-weight: {theme.headerTitleFontWeight};
                                ">
                                    📋 Callout 大纲
                                </div>
                            </div>
                            
                            <div class="outline-preview-list" style="
                                padding: {theme.listPadding};
                                gap: {theme.listGap};
                                background: {theme.listBackground};
                            ">
                                <div class="outline-preview-card" style="
                                    padding: {theme.cardPadding};
                                    border-radius: {theme.cardBorderRadius};
                                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                                    border: 1px solid #4f46e5;
                                ">
                                    <div class="outline-preview-card-header" style="
                                        gap: {theme.cardHeaderGap};
                                        margin-bottom: {theme.cardHeaderMarginBottom};
                                    ">
                                        <div class="outline-preview-icon" style="
                                            width: {theme.iconSize};
                                            height: {theme.iconSize};
                                        ">💡</div>
                                        <div class="outline-preview-label" style="
                                            padding: {theme.labelPadding};
                                            border-radius: {theme.labelBorderRadius};
                                            font-size: {theme.labelFontSize};
                                            background: {theme.labelBackground};
                                            color: {theme.labelColor};
                                        ">提示</div>
                                    </div>
                                    <div class="outline-preview-content" style="
                                        font-size: {theme.contentFontSize};
                                        color: {theme.contentColor};
                                        line-height: {theme.contentLineHeight};
                                    ">
                                        这是大纲预览内容
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {#if config.outlineThemeId === theme.id}
                            <div class="theme-check">✓</div>
                        {/if}
                    </div>
                {/each}
            </div>
            {/if}
        </div>
        
        <!-- 5. 类型预览 & 管理 -->
        <div class="types-section">
            <div class="section-header clickable" on:click={() => menuPreviewCollapsed = !menuPreviewCollapsed}>
                <div class="header-left">
                    <h3><span class="section-number">5.</span> 类型预览 & 管理</h3>
                    <p>查看所有可用的 Callout 类型，可以自定义、隐藏、重新排序</p>
                </div>
                <div class="expand-icon" class:expanded={!menuPreviewCollapsed}>
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path fill="currentColor" d="M8 4l-6 6h12z"/>
                    </svg>
                </div>
            </div>
            
            {#if !menuPreviewCollapsed}
            <div class="types-grid" style="--grid-columns: {gridColumns};">
                {#each allTypes as type, index (type.type)}
                    <div 
                        class="type-card"
                        class:hidden={isTypeHidden(type.type)}
                        draggable="true"
                        on:dragstart={(e) => handleDragStart(e, index)}
                        on:dragover={(e) => handleDragOver(e, index)}
                        on:dragleave={handleDragLeave}
                        on:drop={(e) => handleDrop(e, index)}
                        on:dragend={handleDragEnd}
                    >
                        <div class="type-header">
                            <div class="type-icon-section">
                                <div class="type-icon" style="color: {type.color};">
                                    {@html type.icon}
                                </div>
                                <div class="type-info">
                                    <div class="type-name">{type.displayName}</div>
                                    <div class="type-commands">
                                        <span class="command-tag primary">{type.command}</span>
                                        {#if type.alias}
                                            <span class="command-tag secondary">{type.alias}</span>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="type-actions">
                                <button 
                                    class="toggle-btn" 
                                    class:hidden-type={isTypeHidden(type.type)}
                                    on:click={() => toggleTypeVisibility(type.type)}
                                    title={isTypeHidden(type.type) ? '显示此类型' : '隐藏此类型'}
                                >
                                    {#if isTypeHidden(type.type)}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z"/>
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                                            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18"/>
                                        </svg>
                                    {:else}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z"/>
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                                        </svg>
                                    {/if}
                                </button>
                                
                                <button 
                                    class="edit-btn" 
                                    on:click={() => handleEdit(type)}
                                    title="编辑此类型"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="type-demo" style="background: {type.bgGradient}; border-left-color: {type.color};">
                            <div class="demo-title" style="color: {type.color};">
                                <div class="demo-icon" style="color: {type.color};">
                                    {@html type.icon}
                                </div>
                                <span>{type.displayName}</span>
                            </div>
                            <div class="demo-content">这是 {type.displayName} 类型的示例内容</div>
                        </div>
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
    
    /* 大纲主题预览样式 */
    .outline-theme-card {
        min-height: 200px;
    }
    
    .outline-theme-preview {
        margin-top: 12px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .outline-preview-header {
        display: flex;
        align-items: center;
        position: relative;
    }
    
    .outline-preview-title {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .outline-preview-list {
        display: flex;
        flex-direction: column;
        min-height: 60px;
    }
    
    .outline-preview-card {
        position: relative;
    }
    
    .outline-preview-card-header {
        display: flex;
        align-items: center;
    }
    
    .outline-preview-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .outline-preview-label {
        font-weight: 600;
        white-space: nowrap;
    }
    
    .outline-preview-content {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

    .section-header-right {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .section-header h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .section-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, var(--b3-theme-primary), var(--b3-theme-primary-light));
        color: white;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
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

    /* 样式微调区域 */
    .override-section {
        margin-bottom: 32px;
    }

    .reset-override-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: transparent;
        border: 1.5px solid var(--b3-border-color);
        border-radius: 8px;
        color: var(--b3-theme-on-background);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .reset-override-btn:hover {
        background: var(--b3-theme-error-lighter);
        border-color: var(--b3-theme-error);
        color: var(--b3-theme-error);
        transform: translateY(-1px);
    }

    .reset-override-btn svg {
        transition: transform 0.3s ease;
    }

    .reset-override-btn:hover svg {
        transform: rotate(-180deg);
    }

    .override-content {
        background: var(--b3-theme-surface);
        border: 1px solid var(--b3-border-color);
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .override-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
    }

    .override-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .override-item label {
        font-size: 13px;
        font-weight: 500;
        color: var(--b3-theme-on-background);
    }

    .override-item select {
        padding: 8px 12px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background: var(--b3-theme-background);
        color: var(--b3-theme-on-background);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .override-item select:hover {
        border-color: var(--b3-theme-primary);
    }

    .override-item select:focus {
        outline: none;
        border-color: var(--b3-theme-primary);
        box-shadow: 0 0 0 2px var(--b3-theme-primary-lighter);
    }

    /* 复选框样式 */
    .override-checkbox label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
    }

    .override-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--b3-theme-primary);
    }

    .override-checkbox span {
        font-size: 13px;
        font-weight: 500;
        color: var(--b3-theme-on-background);
    }

    /* 预览区域 */
    .override-preview {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--b3-border-color);
    }

    .override-preview h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--b3-theme-on-background);
    }

    .preview-container {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 24px;
    }

    .preview-callout {
        max-width: 600px;
        margin: 0 auto;
        transition: all 0.2s ease;
    }

    .preview-title {
        user-select: none;
    }

    .preview-content {
        user-select: none;
    }

    /* 类型预览和管理样式 */
    .types-section {
        margin-bottom: 32px;
    }

    .types-grid {
        display: grid;
        grid-template-columns: repeat(var(--grid-columns), 1fr);
        gap: 16px;
        padding: 16px;
        background: var(--b3-theme-surface);
        border-radius: 8px;
        border: 1px solid var(--b3-border-color);
    }

    .type-card {
        position: relative;
        background: white;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
        transition: all 0.2s ease;
        cursor: grab;
    }

    .type-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .type-card.hidden {
        opacity: 0.45;
    }

    .type-card:active {
        cursor: grabbing;
    }

    .type-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f8f9fa;
        border-bottom: 1px solid #e5e7eb;
    }

    .type-icon-section {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    .type-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .type-info {
        min-width: 0;
    }

    .type-name {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .type-commands {
        display: flex;
        gap: 4px;
    }

    .command-tag {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
    }

    .command-tag.primary {
        background: #e0f2fe;
        color: #0277bd;
    }

    .command-tag.secondary {
        background: #f3e5f5;
        color: #7b1fa2;
    }

    .type-actions {
        display: flex;
        gap: 6px;
    }

    .toggle-btn, .edit-btn {
        width: 24px;
        height: 24px;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        color: #6b7280;
    }

    .toggle-btn:hover, .edit-btn:hover {
        background: #e5e7eb;
        color: #374151;
    }

    .toggle-btn.hidden-type {
        color: #ef4444;
    }

    .type-demo {
        padding: 12px;
        margin: 8px;
        border-radius: 6px;
        border-left: 3px solid currentColor;
    }

    .demo-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 6px;
    }

    .demo-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .demo-content {
        font-size: 12px;
        color: #6b7280;
        line-height: 1.5;
    }

</style>

