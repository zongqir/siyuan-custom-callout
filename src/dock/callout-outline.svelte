<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { DEFAULT_CALLOUT_TYPES, type CalloutTypeConfig } from '../callout/types';
    import type { Plugin } from 'siyuan';
    import { logger } from '../libs/logger';
    import { getAllEditor } from 'siyuan';
    import { getDefaultOutlineTheme, generateOutlineThemeCSS, type OutlineThemeStyle } from './themes';

    export let plugin: Plugin;
    export let themeId: string = 'modern'; // 外部传入的主题ID

    // 🔥 关闭日志，提升性能
    logger.setEnabled(false);

    interface CalloutItem {
        id: string;
        type: string;
        title: string;
        content: string;
        config: CalloutTypeConfig;
        collapsed: boolean;
    }

    let callouts: CalloutItem[] = [];
    let currentDocId: string = '';
    let isLoading = false;
    let lastUpdateTime = 0;
    const UPDATE_DEBOUNCE = 1000; // 防抖间隔
    
    // 主题相关
    let currentTheme: OutlineThemeStyle = getDefaultOutlineTheme();
    let themeCSS: string = '';
    
    // 响应式更新主题
    $: updateTheme(themeId);
    
    function updateTheme(id: string) {
        import('./themes').then(themes => {
            const newTheme = themes.getOutlineThemeById(id) || getDefaultOutlineTheme();
            if (newTheme.id !== currentTheme.id) {
                currentTheme = newTheme;
                themeCSS = generateOutlineThemeCSS(currentTheme);
            }
        });
    }

    // 创建类型映射
    const typeMap = new Map<string, CalloutTypeConfig>();
    DEFAULT_CALLOUT_TYPES.forEach(config => {
        typeMap.set(config.type, config);
    });

    onMount(() => {
        // 初始化主题
        updateTheme(themeId);
        
        // 延迟加载，确保 DOM 和 callout processor 都已准备好
        // 使用多次尝试策略，确保能够成功加载
        setTimeout(() => {
            lastUpdateTime = 0;
            currentDocId = '';
            loadCallouts();
        }, 800);
        
        // 第二次尝试（如果第一次失败）
        setTimeout(() => {
            if (callouts.length === 0) {
                lastUpdateTime = 0;
                currentDocId = '';
                loadCallouts();
            }
        }, 2000);
        
        // 监听点击事件，检测文档切换
        document.addEventListener('click', handleDocumentSwitch);
    });

    onDestroy(() => {
        document.removeEventListener('click', handleDocumentSwitch);
    });

    function handleDocumentSwitch() {
        // 短暂延迟后重新加载，确保文档已切换
        setTimeout(loadCallouts, 300);
    }

    /**
     * 获取当前活跃的编辑器（参考 windows焦点.md）
     */
    function getCurrentActiveEditor(): any {
        const editors = getAllEditor();
        
        if (editors.length === 0) return null;
        if (editors.length === 1) return editors[0];
        
        // 策略1: 找到具有焦点的编辑器
        for (const editor of editors) {
            if (editor?.protyle?.element?.contains(document.activeElement)) {
                return editor;
            }
        }
        
        // 策略2: 找到可见的编辑器
        for (const editor of editors) {
            if (editor?.protyle?.element) {
                const rect = editor.protyle.element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    return editor;
                }
            }
        }
        
        // 策略3: 返回第一个有效的编辑器
        return editors.find(editor => editor?.protyle?.block) || editors[0];
    }

    async function loadCallouts() {
        // 防抖：避免频繁更新
        const now = Date.now();
        if (now - lastUpdateTime < UPDATE_DEBOUNCE) {
            return;
        }
        lastUpdateTime = now;

        // 🎯 使用 getAllEditor() API 获取编辑器
        const editor = getCurrentActiveEditor();
        
        if (!editor?.protyle?.block) {
            if (callouts.length > 0 || currentDocId) {
                callouts = [];
                currentDocId = '';
            }
            return;
        }

        // 获取文档ID
        const docId = editor.protyle.block.rootID;
        if (!docId) {
            if (callouts.length > 0 || currentDocId) {
                callouts = [];
                currentDocId = '';
            }
            return;
        }

        // 获取编辑器内容区域
        const docElement = editor.protyle.wysiwyg?.element;
        if (!docElement) {
            if (callouts.length > 0 || currentDocId) {
                callouts = [];
                currentDocId = '';
            }
            return;
        }

        // 如果文档未改变且已有数据，跳过
        if (docId === currentDocId && callouts.length > 0) {
            return;
        }
        
        currentDocId = docId;
        isLoading = true;

        try {
            // 直接从 DOM 中查找所有带 custom-callout 属性的引述块
            const calloutElements = docElement.querySelectorAll('.bq[custom-callout]');
            
            // 解析 callout
            const newCallouts: CalloutItem[] = [];
            
            calloutElements.forEach((element) => {
                const calloutInfo = parseCalloutFromDOM(element as HTMLElement);
                if (calloutInfo) {
                    newCallouts.push(calloutInfo);
                }
            });
            
            callouts = newCallouts;
        } catch (error) {
            console.error('Failed to load callouts:', error);
        } finally {
            isLoading = false;
        }
    }

    function parseCalloutFromDOM(element: HTMLElement): CalloutItem | null {
        // 获取 callout 类型
        const calloutType = element.getAttribute('custom-callout');
        if (!calloutType) return null;

        // 获取配置
        const config = typeMap.get(calloutType);
        if (!config) return null;

        // 获取块 ID
        const blockId = element.getAttribute('data-node-id');
        if (!blockId) return null;

        // 获取折叠状态
        const collapsed = element.getAttribute('data-collapsed') === 'true';

        // 获取标题
        const titleDiv = element.querySelector('[data-callout-title="true"]') as HTMLElement;
        let title = config.displayName;
        if (titleDiv) {
            const displayName = titleDiv.getAttribute('data-callout-display-name');
            if (displayName) {
                title = displayName;
            }
        }

        // 获取内容预览
        let content = '';
        const paragraphs = element.querySelectorAll('[data-type="NodeParagraph"]');
        
        // 跳过第一个段落（通常是标题）
        for (let i = 1; i < Math.min(paragraphs.length, 4); i++) {
            const p = paragraphs[i] as HTMLElement;
            const text = p.textContent?.trim() || '';
            if (text) {
                content += text + ' ';
            }
        }

        // 如果没有内容，尝试获取第一个段落
        if (!content && paragraphs.length > 0) {
            const firstP = paragraphs[0] as HTMLElement;
            const text = firstP.textContent?.trim() || '';
            const cleanText = text.replace(/^\[!.*?\]/, '').trim();
            if (cleanText && cleanText !== title) {
                content = cleanText;
            }
        }

        return {
            id: blockId,
            type: calloutType,
            title: title,
            content: content.substring(0, 150),
            config: config,
            collapsed: collapsed
        };
    }

    async function jumpToCallout(calloutId: string, event?: MouseEvent) {
        // 防止事件冒泡
        if (event) {
            event.stopPropagation();
        }

        // 使用思源的 API 跳转到指定块
        const targetBlock = document.querySelector(`[data-node-id="${calloutId}"]`) as HTMLElement;
        if (targetBlock) {
            // 平滑滚动到目标
            targetBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // 添加高亮效果
            targetBlock.classList.add('protyle-wysiwyg--select');
            
            // 添加脉冲动画
            targetBlock.style.transition = 'transform 0.3s ease';
            targetBlock.style.transform = 'scale(1.02)';
            
            setTimeout(() => {
                targetBlock.style.transform = 'scale(1)';
            }, 300);
            
            setTimeout(() => {
                targetBlock.classList.remove('protyle-wysiwyg--select');
                targetBlock.style.transition = '';
            }, 2000);
        } else {
            // 如果找不到目标，提示用户
            console.warn(`Callout with id ${calloutId} not found in DOM`);
        }
    }

    function getTypeIcon(config: CalloutTypeConfig): string {
        return config.icon;
    }

    function handleRefresh() {
        lastUpdateTime = 0; // 重置防抖时间
        currentDocId = ''; // 重置文档ID，强制刷新
        loadCallouts();
    }
</script>

<div class="callout-outline-dock" style={themeCSS}>
    <div class="callout-outline-header">
        <div class="header-title">
            <svg class="header-icon"><use xlink:href="#iconCallout"></use></svg>
            <span>{plugin.i18n.calloutOutline || 'Callout 大纲'}</span>
        </div>
        <div class="header-actions">
            <button 
                class="refresh-btn" 
                on:click={handleRefresh}
                title="刷新列表"
                disabled={isLoading}
            >
                <svg viewBox="0 0 24 24" class:spinning={isLoading}>
                    <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
            </button>
            <div class="header-count">{callouts.length}</div>
        </div>
    </div>

    {#if isLoading}
        <div class="loading-indicator">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
        </div>
    {:else if callouts.length === 0}
        <div class="empty-state">
            <svg viewBox="0 0 24 24" class="empty-icon">
                <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
            </svg>
            <p>{plugin.i18n.noCallouts || '当前文档没有 Callout'}</p>
        </div>
    {:else}
        <div class="callout-list">
            {#each callouts as callout (callout.id)}
                <div 
                    class="callout-card" 
                    style="--callout-color: {callout.config.color}; --callout-bg: {callout.config.bgGradient};"
                    on:click={(e) => jumpToCallout(callout.id, e)}
                    on:keydown={(e) => e.key === 'Enter' && jumpToCallout(callout.id)}
                    role="button"
                    tabindex="0"
                    title="点击跳转到此 Callout"
                >
                    <div class="callout-card-header">
                        <div class="callout-icon" style="color: {callout.config.color}">
                            {@html getTypeIcon(callout.config)}
                        </div>
                        <div class="callout-title-section">
                            <div class="callout-type-label" style="background: {callout.config.color}">
                                {callout.config.displayName}
                            </div>
                            {#if callout.collapsed}
                                <svg class="collapse-indicator" viewBox="0 0 16 16" width="12" height="12">
                                    <path fill="currentColor" d="M8 4l-6 6h12z"/>
                                </svg>
                            {/if}
                        </div>
                    </div>
                    
                    {#if callout.title && callout.title !== callout.config.displayName}
                        <div class="callout-title">{callout.title}</div>
                    {/if}
                    
                    {#if callout.content}
                        <div class="callout-preview">{callout.content}</div>
                    {/if}

                    <div class="callout-card-footer">
                        <svg class="jump-icon" viewBox="0 0 16 16" width="14" height="14">
                            <path fill="currentColor" d="M8.5 1.5l5 5-5 5-1-1 3.5-3.5H1v-1.5h10L7.5 2.5z"/>
                        </svg>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .callout-outline-dock {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--outline-container-bg, rgba(255, 255, 255, 0.7));
        backdrop-filter: var(--outline-container-backdrop, blur(20px));
        -webkit-backdrop-filter: var(--outline-container-backdrop, blur(20px));
        overflow: hidden;
    }

    .callout-outline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--outline-header-padding, 12px 16px);
        background: var(--outline-header-bg, rgba(255, 255, 255, 0.5));
        backdrop-filter: var(--outline-header-backdrop, blur(10px));
        -webkit-backdrop-filter: var(--outline-header-backdrop, blur(10px));
        border-bottom: var(--outline-header-border, 1px solid rgba(0, 0, 0, 0.08));
        flex-shrink: 0;

        .header-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: var(--outline-header-title-weight, 600);
            font-size: var(--outline-header-title-size, 14px);
            color: var(--outline-header-title-color, #333);

            .header-icon {
                width: 18px;
                height: 18px;
            }
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .refresh-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border: var(--outline-button-border, 1px solid rgba(0, 0, 0, 0.15));
            border-radius: var(--outline-button-radius, 6px);
            background: var(--outline-button-bg, rgba(255, 255, 255, 0.6));
            backdrop-filter: var(--outline-header-backdrop, blur(10px));
            -webkit-backdrop-filter: var(--outline-header-backdrop, blur(10px));
            color: var(--outline-button-color, #666);
            cursor: pointer;
            transition: all 0.2s;

            &:hover:not(:disabled) {
                background: var(--outline-button-hover-bg, rgba(255, 255, 255, 0.8));
                border: var(--outline-button-hover-border, 1px solid rgba(0, 0, 0, 0.25));
            }

            &:active:not(:disabled) {
                background: var(--outline-button-hover-bg, rgba(255, 255, 255, 0.9));
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            svg {
                width: 14px;
                height: 14px;
                transition: transform 0.3s ease;

                &.spinning {
                    animation: spin 1s linear infinite;
                }
            }
        }

        .header-count {
            display: none;
        }
    }

    .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        gap: 12px;

        .loading-spinner {
            width: 32px;
            height: 32px;
            border: var(--outline-loading-spinner-border, 3px solid #e0e0e0);
            border-top: var(--outline-loading-spinner-border-top, 3px solid var(--b3-theme-primary, #4493f8));
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        span {
            font-size: 13px;
            color: var(--outline-loading-text-color, #666);
        }
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;

        .empty-icon {
            width: 64px;
            height: 64px;
            opacity: var(--outline-empty-icon-opacity, 0.3);
            margin-bottom: 16px;
        }

        p {
            margin: 0;
            font-size: 14px;
            color: var(--outline-empty-text-color, #999);
        }
    }

    .callout-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--outline-list-padding, 12px);
        background: var(--outline-list-bg, transparent);
        display: flex;
        flex-direction: column;
        gap: var(--outline-list-gap, 10px);

        &::-webkit-scrollbar {
            width: var(--outline-scrollbar-width, 6px);
        }

        &::-webkit-scrollbar-track {
            background: var(--outline-scrollbar-track-bg, rgba(0, 0, 0, 0.03));
            border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--outline-scrollbar-thumb-bg, rgba(0, 0, 0, 0.2));
            border-radius: 3px;

            &:hover {
                background: var(--outline-scrollbar-thumb-hover-bg, rgba(0, 0, 0, 0.3));
            }
        }
    }

    .callout-card {
        position: relative;
        padding: var(--outline-card-padding, 14px 16px);
        border-radius: var(--outline-card-radius, 8px);
        background: var(--callout-color);
        cursor: pointer;
        transition: var(--outline-card-transition, all 0.15s ease);
        border: var(--outline-card-border, 1px solid var(--callout-color));

        &:hover {
            opacity: var(--outline-card-hover-opacity, 0.9);
            border-color: color-mix(in srgb, var(--callout-color) 80%, #000 20%);
        }

        &:active {
            opacity: 0.95;
        }
    }

    .callout-card-header {
        display: flex;
        align-items: center;
        gap: var(--outline-card-header-gap, 10px);
        margin-bottom: var(--outline-card-header-margin-bottom, 10px);

        .callout-icon {
            flex-shrink: 0;
            width: var(--outline-icon-size, 20px);
            height: var(--outline-icon-size, 20px);
            display: flex;
            align-items: center;
            justify-content: center;

            :global(svg) {
                width: 100%;
                height: 100%;
                filter: var(--outline-icon-filter, brightness(0) invert(1));
            }
        }

        .callout-title-section {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .callout-type-label {
            padding: var(--outline-label-padding, 3px 10px);
            border-radius: var(--outline-label-radius, 4px);
            font-size: var(--outline-label-size, 12px);
            font-weight: var(--outline-label-weight, 600);
            color: var(--outline-label-color, #fff);
            background: var(--outline-label-bg, rgba(0, 0, 0, 0.15));
            white-space: nowrap;
        }

        .collapse-indicator {
            opacity: 0.8;
            margin-left: 4px;
            filter: var(--outline-icon-filter, brightness(0) invert(1));
        }
    }

    .callout-title {
        font-size: var(--outline-title-size, 14px);
        font-weight: var(--outline-title-weight, 600);
        color: var(--outline-title-color, #fff);
        margin-bottom: var(--outline-title-margin-bottom, 6px);
        line-height: var(--outline-title-line-height, 1.6);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .callout-preview {
        font-size: var(--outline-content-size, 13px);
        color: var(--outline-content-color, rgba(255, 255, 255, 0.9));
        line-height: var(--outline-content-line-height, 1.7);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: var(--outline-content-margin-bottom, 8px);
    }

    .callout-card-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding-top: var(--outline-footer-padding-top, 6px);
        border-top: var(--outline-footer-border, 1px solid rgba(255, 255, 255, 0.2));
        opacity: var(--outline-footer-opacity, 0);
        transition: opacity 0.15s;

        .jump-icon {
            color: var(--outline-footer-icon-color, #fff);
            opacity: var(--outline-footer-icon-opacity, 0.8);
            transition: all 0.15s;
        }
    }

    .callout-card:hover .callout-card-footer {
        opacity: var(--outline-footer-hover-opacity, 1);

        .jump-icon {
            opacity: var(--outline-footer-icon-hover-opacity, 1);
            transform: var(--outline-footer-icon-transform, translateX(2px));
        }
    }
</style>

