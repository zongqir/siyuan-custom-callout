<script lang="ts">
    import { ICON_LIBRARY, getIconSvg } from '../callout/icons';
    import { COLOR_SCHEMES, createCustomColorScheme } from '../callout/colors';
    import type { CalloutTypeConfig } from '../callout/types';

    export let config: CalloutTypeConfig | null = null;
    export let isNew: boolean = false;
    export let onSave: (config: CalloutTypeConfig) => void;
    export let onCancel: () => void;
    export let existingCommands: string[] = [];

    let type = config?.type || '';
    let displayName = config?.displayName || '';
    let command = config?.command || '';
    let selectedIconId = config ? ICON_LIBRARY.find(i => i.svg.includes(config!.icon.split('currentColor')[0]))?.id || 'info-circle' : 'info-circle';
    let selectedColorId = config ? COLOR_SCHEMES.find(c => c.color === config!.color)?.id || 'blue' : 'blue';
    let customColor = config?.color || '#4493f8';
    let useCustomColor = config ? !COLOR_SCHEMES.some(c => c.color === config!.color) : false;

    let showIconPicker = false;
    let iconSearchTerm = '';
    let errors: Record<string, string> = {};

    $: filteredIcons = ICON_LIBRARY.filter(icon =>
        icon.name.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
        icon.id.toLowerCase().includes(iconSearchTerm.toLowerCase())
    );

    $: currentColor = useCustomColor ? customColor : (COLOR_SCHEMES.find(c => c.id === selectedColorId)?.color || '#4493f8');
    $: currentIconSvg = getIconSvg(selectedIconId, currentColor);

    function validate(): boolean {
        errors = {};

        if (!type.trim()) {
            errors.type = '类型ID不能为空';
        } else if (!/^[a-z0-9-]+$/.test(type)) {
            errors.type = '类型ID只能包含小写字母、数字和连字符';
        }

        if (!displayName.trim()) {
            errors.displayName = '显示名称不能为空';
        }

        if (!command.trim()) {
            errors.command = '命令不能为空';
        } else if (!command.startsWith('[!') || !command.endsWith(']')) {
            errors.command = '命令格式必须是 [!命令名]，例如 [!info]';
        } else if (existingCommands.includes(command)) {
            errors.command = '该命令已被使用';
        }

        // 移除中文命令校验

        if (useCustomColor && !/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
            errors.customColor = '请输入有效的十六进制颜色代码';
        }

        return Object.keys(errors).length === 0;
    }

    function handleSave() {
        if (!validate()) return;

        const colorScheme = useCustomColor
            ? createCustomColorScheme(customColor)
            : COLOR_SCHEMES.find(c => c.id === selectedColorId)!;

        const newConfig: CalloutTypeConfig = {
            type,
            displayName,
            command,
            // 不再保存中文命令
            color: colorScheme.color,
            bgGradient: colorScheme.bgGradient,
            borderColor: colorScheme.borderColor,
            icon: currentIconSvg
        };

        onSave(newConfig);
    }
</script>

<div class="edit-dialog-overlay" on:click={onCancel}>
    <div class="edit-dialog" on:click|stopPropagation>
        <div class="dialog-header">
            <h3>{isNew ? '新建 Callout 类型' : '编辑 Callout 类型'}</h3>
            <button class="close-btn" on:click={onCancel}>×</button>
        </div>

        <div class="dialog-body">
            <!-- 使用说明 -->
            <div class="usage-hint">
                <div class="hint-icon">💡</div>
                <div class="hint-text">
                    <strong>简单三步：</strong>①填写名称 ②选择图标和颜色 ③保存后就能在笔记中使用啦！
                </div>
            </div>

            <!-- 预览 -->
            <div class="preview-section">
                <label>实时预览</label>
                <div class="callout-preview" style="background: {useCustomColor ? createCustomColorScheme(customColor).bgGradient : COLOR_SCHEMES.find(c => c.id === selectedColorId)?.bgGradient}; border-left-color: {currentColor};">
                    <div class="preview-title" style="color: {currentColor};">
                        {@html currentIconSvg}
                        <span>{displayName || '显示名称'}</span>
                    </div>
                    <div class="preview-content">这是一个示例文本</div>
                </div>
            </div>

            <!-- 基本信息 -->
            <div class="form-group">
                <label>
                    内部标识 *
                    <span class="label-hint">（系统用的ID，创建后不能改）</span>
                </label>
                <input
                    type="text"
                    bind:value={type}
                    placeholder="my-note（只能用小写字母、数字和横线-）"
                    disabled={!isNew}
                    class:error={errors.type}
                />
                {#if errors.type}<span class="error-msg">{errors.type}</span>{/if}
                {#if !isNew}<div class="field-hint">⚠️ 这个ID创建后就不能修改了哦</div>{/if}
            </div>

            <div class="form-group">
                <label>
                    显示名称 *
                    <span class="label-hint">（会显示在引述块标题上）</span>
                </label>
                <input
                    type="text"
                    bind:value={displayName}
                    placeholder="我的笔记"
                    class:error={errors.displayName}
                />
                {#if errors.displayName}<span class="error-msg">{errors.displayName}</span>{/if}
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>
                        英文命令 *
                        <span class="label-hint">（输入此命令创建 callout）</span>
                    </label>
                    <input
                        type="text"
                        bind:value={command}
                        placeholder="[!my-note]"
                        class:error={errors.command}
                    />
                    {#if errors.command}<span class="error-msg">{errors.command}</span>{/if}
                </div>

                
            </div>

            <!-- 图标选择 -->
            <div class="form-group">
                <label>图标 *</label>
                <button class="icon-select-btn" on:click={() => showIconPicker = !showIconPicker}>
                    <div class="selected-icon" style="color: {currentColor};">
                        {@html currentIconSvg}
                    </div>
                    <span>{ICON_LIBRARY.find(i => i.id === selectedIconId)?.name || '选择图标'}</span>
                </button>

                {#if showIconPicker}
                    <div class="icon-picker">
                        <input
                            type="text"
                            bind:value={iconSearchTerm}
                            placeholder="搜索图标..."
                            class="icon-search"
                        />
                        <div class="icon-grid">
                            {#each filteredIcons as icon}
                                <button
                                    class="icon-option"
                                    class:selected={selectedIconId === icon.id}
                                    on:click={() => { selectedIconId = icon.id; showIconPicker = false; }}
                                    title={icon.name}
                                >
                                    <div style="color: {currentColor};">
                                        {@html getIconSvg(icon.id, currentColor)}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- 颜色选择 -->
            <div class="form-group">
                <label>颜色方案 *</label>
                <div class="color-options">
                    {#each COLOR_SCHEMES as colorScheme}
                        <button
                            class="color-option"
                            class:selected={!useCustomColor && selectedColorId === colorScheme.id}
                            style="background: {colorScheme.color};"
                            on:click={() => { selectedColorId = colorScheme.id; useCustomColor = false; }}
                            title={colorScheme.name}
                        />
                    {/each}
                </div>

                <div class="custom-color-section">
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={useCustomColor} />
                        <span>使用自定义颜色</span>
                    </label>
                    {#if useCustomColor}
                        <div class="color-input-group">
                            <input
                                type="color"
                                bind:value={customColor}
                                class="color-picker"
                            />
                            <input
                                type="text"
                                bind:value={customColor}
                                placeholder="#4493f8"
                                class="color-text"
                                class:error={errors.customColor}
                            />
                        </div>
                        {#if errors.customColor}<span class="error-msg">{errors.customColor}</span>{/if}
                    {/if}
                </div>
            </div>
        </div>

        <div class="dialog-footer">
            <button class="btn-cancel" on:click={onCancel}>取消</button>
            <button class="btn-save" on:click={handleSave}>保存</button>
        </div>
    </div>
</div>

<style>
    .edit-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .edit-dialog {
        background: var(--b3-theme-background);
        border-radius: 8px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--b3-border-color);
    }

    .dialog-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--b3-theme-on-background);
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
    }

    .close-btn:hover {
        background: var(--b3-theme-error-lighter);
        color: var(--b3-theme-error);
    }

    .dialog-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }

    .usage-hint {
        display: flex;
        gap: 12px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        margin-bottom: 20px;
        align-items: flex-start;
    }

    .hint-icon {
        font-size: 20px;
        line-height: 1;
        flex-shrink: 0;
    }

    .hint-text {
        font-size: 13px;
        color: #1e40af;
        line-height: 1.5;
    }

    .hint-text strong {
        color: #1e3a8a;
    }

    .label-hint {
        font-size: 11px;
        font-weight: 400;
        color: var(--b3-theme-on-surface);
        opacity: 0.7;
        margin-left: 4px;
    }

    .field-hint {
        margin-top: 8px;
        font-size: 12px;
        color: #6366f1;
        background: #eef2ff;
        padding: 8px 12px;
        border-radius: 6px;
        border-left: 3px solid #6366f1;
    }

    .preview-section {
        margin-bottom: 24px;
    }

    .preview-section label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--b3-theme-on-background);
    }

    .callout-preview {
        border: 1px solid #e5e7eb;
        border-left: 4px solid;
        border-radius: 6px;
        padding: 16px;
    }

    .preview-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 8px;
    }

    .preview-title :global(svg) {
        width: 20px;
        height: 20px;
    }

    .preview-content {
        color: var(--b3-theme-on-background);
        font-size: 14px;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--b3-theme-on-background);
    }

    .form-group input[type="text"] {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background: var(--b3-theme-surface);
        color: var(--b3-theme-on-surface);
        font-size: 14px;
    }

    .form-group input[type="text"]:disabled {
        background: var(--b3-theme-background-light);
        cursor: not-allowed;
    }

    .form-group input.error {
        border-color: var(--b3-theme-error);
    }

    .error-msg {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: var(--b3-theme-error);
    }

    .icon-select-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background: var(--b3-theme-surface);
        cursor: pointer;
        text-align: left;
    }

    .icon-select-btn:hover {
        border-color: var(--b3-theme-primary);
    }

    .selected-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .selected-icon :global(svg) {
        width: 20px;
        height: 20px;
    }

    .icon-picker {
        margin-top: 8px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        padding: 12px;
        background: var(--b3-theme-surface);
        max-height: 300px;
        overflow-y: auto;
    }

    .icon-search {
        width: 100%;
        padding: 8px;
        margin-bottom: 12px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background: var(--b3-theme-background);
    }

    .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
        gap: 8px;
    }

    .icon-option {
        width: 40px;
        height: 40px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background: var(--b3-theme-background);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    }

    .icon-option:hover {
        border-color: var(--b3-theme-primary);
        background: var(--b3-theme-primary-lighter);
    }

    .icon-option.selected {
        border-color: var(--b3-theme-primary);
        background: var(--b3-theme-primary-light);
        box-shadow: 0 0 0 2px var(--b3-theme-primary-lighter);
    }

    .icon-option :global(svg) {
        width: 20px;
        height: 20px;
    }

    .color-options {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
        gap: 6px;
        margin-bottom: 12px;
        max-height: 200px;
        overflow-y: auto;
    }

    .color-option {
        width: 28px;
        height: 28px;
        border: 2px solid transparent;
        border-radius: 50%;
        cursor: pointer;
        padding: 0;
        transition: all 0.2s;
    }

    .color-option:hover {
        transform: scale(1.1);
    }

    .color-option.selected {
        border-color: var(--b3-theme-on-background);
        box-shadow: 0 0 0 3px var(--b3-theme-primary-lighter);
    }

    .custom-color-section {
        padding-top: 12px;
        border-top: 1px solid var(--b3-border-color);
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        margin-bottom: 12px;
    }

    .checkbox-label input[type="checkbox"] {
        cursor: pointer;
    }

    .color-input-group {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .color-picker {
        width: 60px;
        height: 40px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        cursor: pointer;
    }

    .color-text {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background: var(--b3-theme-surface);
        font-family: monospace;
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid var(--b3-border-color);
    }

    .btn-cancel,
    .btn-save {
        padding: 8px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-cancel {
        background: var(--b3-theme-surface);
        color: var(--b3-theme-on-surface);
        border: 1px solid var(--b3-border-color);
    }

    .btn-cancel:hover {
        background: var(--b3-theme-background-light);
    }

    .btn-save {
        background: var(--b3-theme-primary);
        color: white;
    }

    .btn-save:hover {
        background: var(--b3-theme-primary-hover);
    }
</style>

