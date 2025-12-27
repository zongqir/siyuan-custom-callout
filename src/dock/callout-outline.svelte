<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { type CalloutTypeConfig } from '../callout/types';
    import type { Plugin } from 'siyuan';
    import { logger } from '../libs/logger';
    import { getAllEditor } from 'siyuan';
    import { getDefaultOutlineTheme, generateOutlineThemeCSS, type OutlineThemeStyle } from './themes';
    import { ConfigManager } from '../callout/config';

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
        isExpanded?: boolean; // 🎯 单个卡片的展开状态（优先级最高）
    }

    let callouts: CalloutItem[] = [];
    let currentDocId: string = '';
    let isLoading = false;
    let lastUpdateTime = 0;
    const UPDATE_DEBOUNCE = 1000; // 防抖间隔
    
    // 主题相关
    let currentTheme: OutlineThemeStyle = getDefaultOutlineTheme();
    let themeCSS: string = '';
    let cardBackgroundStyle: 'default' | 'solid' | 'gradient' | 'colorful' | 'vivid' = 'default';
    let colorVibrancy: number = 1.0;
    let textColor: 'auto' | 'dark' | 'light' = 'auto';
    let contentMaxLines: number = 2;
    let hideContent: boolean = false;
    
    // 🎯 显示密度模式（纯前端临时状态，不持久化）
    // auto = 使用设置配置, minimal = 只标题, compact = 1行, full = 显示全部
    let densityMode: 'auto' | 'minimal' | 'compact' | 'full' = 'auto';
    
    // 🎯 当前激活的卡片索引（用于移动端显示按钮）
    let activeCardIndex: number | null = null;
    
    // 响应式更新主题
    $: updateTheme(themeId);
    
    async function updateTheme(id: string) {
        try {
            const themes = await import('./themes');
            const newTheme = themes.getOutlineThemeById(id) || getDefaultOutlineTheme();
            
            // 始终重新加载配置和生成CSS，不只是在主题ID变化时
            currentTheme = newTheme;
            
            // 加载样式覆盖配置
            const config = await ConfigManager.load(plugin);
            const outlineOverrides = config.outlineOverrides;
            
            // 获取卡片背景样式配置、色彩鲜艳度和文字颜色
            cardBackgroundStyle = outlineOverrides?.cardBackgroundStyle || 'default';
            colorVibrancy = outlineOverrides?.colorVibrancy || 1.0;
            textColor = outlineOverrides?.textColor || 'auto';
            contentMaxLines = outlineOverrides?.contentMaxLines || 2;
            hideContent = outlineOverrides?.hideContent || false;
            
            themeCSS = generateOutlineThemeCSS(currentTheme, outlineOverrides);
        } catch (error) {
            console.error('Failed to update outline theme:', error);
            themeCSS = generateOutlineThemeCSS(getDefaultOutlineTheme());
        }
    }
    
    // 添加一个专门的更新样式函数，供外部调用
    export async function updateStyles() {
        // 重新加载类型映射（包括配置更新）
        await initializeTypeMap();
        await updateTheme(themeId);
        
        // 强制刷新列表以应用新的配置
        lastUpdateTime = 0;
        currentDocId = '';
        loadCallouts();
    }
    
    // 获取卡片背景样式
    function getCardBackground(callout: CalloutItem): string {
        if (cardBackgroundStyle === 'solid') {
            // 纯色：从渐变中提取第一个颜色，应用鲜艳度
            const solidColor = extractSolidColorFromGradient(callout.config.bgGradient);
            return adjustColorVibrancy(solidColor, colorVibrancy);
        } else if (cardBackgroundStyle === 'gradient') {
            // 渐变：使用预设渐变，应用鲜艳度
            return adjustGradientVibrancy(callout.config.bgGradient, colorVibrancy);
        } else if (cardBackgroundStyle === 'colorful') {
            // 色彩：主题色半透明，应用鲜艳度
            const adjustedColor = adjustColorVibrancy(callout.config.color, colorVibrancy);
            const rgb = hexToRgb(adjustedColor);
            return `rgba(${rgb}, 0.15)`;
        } else if (cardBackgroundStyle === 'vivid') {
            // 浓烈：纯主题色（不透明），应用鲜艳度
            return adjustColorVibrancy(callout.config.color, colorVibrancy);
        } else {
            // 默认：使用当前的var(--callout-color)，由CSS控制
            return '';
        }
    }
    
    // 辅助函数：将十六进制颜色转换为RGB
    function hexToRgb(hex: string): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }
    
    // 从渐变字符串中提取纯色
    function extractSolidColorFromGradient(gradient: string): string {
        // 从 "linear-gradient(to bottom, #eff6ff, #ffffff)" 中提取 "#eff6ff"
        const match = gradient.match(/#[0-9a-fA-F]{6}/);
        return match ? match[0] : '#f0f0f0';
    }
    
    // RGB转HSL
    function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return [h * 360, s * 100, l * 100];
    }
    
    // HSL转RGB
    function hslToRgb(h: number, s: number, l: number): [number, number, number] {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    
    // 调整颜色鲜艳度（调整HSL饱和度）
    function adjustColorVibrancy(hex: string, vibrancy: number): string {
        if (vibrancy === 1.0) return hex;
        
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        let [h, s, l] = rgbToHsl(r, g, b);
        
        // 调整饱和度
        s = Math.max(0, Math.min(100, s * vibrancy));
        
        const [newR, newG, newB] = hslToRgb(h, s, l);
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    // 调整渐变字符串中的颜色鲜艳度
    function adjustGradientVibrancy(gradient: string, vibrancy: number): string {
        if (vibrancy === 1.0) return gradient;
        
        return gradient.replace(/#[0-9a-fA-F]{6}/g, (match) => adjustColorVibrancy(match, vibrancy));
    }

    // 创建类型映射（包括自定义类型）
    let typeMap = new Map<string, CalloutTypeConfig>();
    // 别名索引（type/zhCommand/displayName → 配置）
    let aliasIndex = new Map<string, CalloutTypeConfig>();
    function normalizeAlias(s: string): string {
        return (s || '')
            .replace(/^\[!|\]$/g, '')
            .replace(/\s+/g, '')
            .trim()
            .toLowerCase();
    }
    function rebuildAliasIndex() {
        aliasIndex.clear();
        typeMap.forEach(cfg => {
            aliasIndex.set(normalizeAlias(cfg.type), cfg);
            const zh = (cfg.zhCommand || '').replace(/^\[!|\]$/g, '');
            if (zh) aliasIndex.set(normalizeAlias(zh), cfg);
            if (cfg.displayName) aliasIndex.set(normalizeAlias(cfg.displayName), cfg);
        });
        // 原生 note 归并 info
        const infoCfg = typeMap.get('info');
        if (infoCfg && !aliasIndex.has('note')) aliasIndex.set('note', infoCfg);
    }
    
    // 初始化类型映射
    async function initializeTypeMap() {
        const config = await ConfigManager.load(plugin);
        const allTypes = ConfigManager.getAllTypes(config);
        typeMap.clear();
        allTypes.forEach(type => {
            typeMap.set(type.type, type);
        });
        rebuildAliasIndex();
    }

    onMount(async () => {
        // 首先初始化类型映射
        await initializeTypeMap();
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
        
        // 🎯 监听callout命令面板关闭事件，刷新大纲
        document.addEventListener('callout-menu-closed', handleMenuClosed);
        
        // 🎯 监听callout删除事件，刷新大纲
        document.addEventListener('callout-deleted', handleCalloutDeleted);
        
        // 🎯 监听全局点击，用于清除激活状态（移动端体验）
        document.addEventListener('click', handleGlobalClick);
    });

    onDestroy(() => {
        document.removeEventListener('click', handleDocumentSwitch);
        document.removeEventListener('callout-menu-closed', handleMenuClosed);
        document.removeEventListener('callout-deleted', handleCalloutDeleted);
        document.removeEventListener('click', handleGlobalClick);
    });
    
    /**
     * 🎯 处理全局点击，清除卡片激活状态
     */
    function handleGlobalClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        // 如果点击的不是卡片内部，清除激活状态
        if (!target.closest('.callout-card')) {
            activeCardIndex = null;
        }
    }
    
    /**
     * 处理命令面板关闭事件
     */
    function handleMenuClosed() {
        // 延迟刷新，确保callout已经处理完成
        setTimeout(() => {
            lastUpdateTime = 0; // 重置防抖时间
            currentDocId = ''; // 重置文档ID，强制刷新
            loadCallouts();
        }, 500);
    }
    
    /**
     * 处理callout删除事件
     */
    function handleCalloutDeleted() {
        // 延迟刷新，确保删除操作已完成
        setTimeout(() => {
            lastUpdateTime = 0; // 重置防抖时间
            currentDocId = ''; // 重置文档ID，强制刷新
            loadCallouts();
        }, 500);
    }

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
            // 兼容原生结构：查找 .callout[data-subtype]
            const calloutElements = docElement.querySelectorAll('.callout[data-subtype]');

            const newCallouts: CalloutItem[] = [];
            calloutElements.forEach((el) => {
                const item = parseNativeCalloutFromDOM(el as HTMLElement);
                if (item) newCallouts.push(item);
            });

            callouts = newCallouts;
        } catch (error) {
            console.error('Failed to load callouts:', error);
        } finally {
            isLoading = false;
        }
    }

    // 解析原生 .callout 结构
    function parseNativeCalloutFromDOM(calloutEl: HTMLElement): CalloutItem | null {
        // 优先使用 .callout 自身的 data-node-id，回退到最近的 .bq[data-node-id]
        let blockId = calloutEl.getAttribute('data-node-id');
        if (!blockId) {
            const bq = calloutEl.closest('.bq[data-node-id]') as HTMLElement | null;
            blockId = bq?.getAttribute('data-node-id') || '';
        }
        if (!blockId) return null;

        // 解析 subtype 并映射到配置
        let rawSubtype = calloutEl.getAttribute('data-subtype') || '';
        let sub = normalizeAlias(rawSubtype);
        if (sub === 'note') sub = 'info';
        const cfg = aliasIndex.get(sub) || typeMap.get(sub);
        if (!cfg) return null;

        // 标题：从 .callout-info 文本提取（去除图标）
        let title = cfg.displayName;
        const infoDiv = calloutEl.querySelector('.callout-info') as HTMLElement | null;
        if (infoDiv) {
            const clone = infoDiv.cloneNode(true) as HTMLElement;
            clone.querySelector('.callout-icon')?.remove();
            const t = (clone.textContent || '').trim();
            if (t) title = t;
        }

        // 内容预览：收集不在 .callout-info 内的段落文本
        let content = '';
        const paragraphs = calloutEl.querySelectorAll('div[data-type="NodeParagraph"]');
        paragraphs.forEach(p => {
            const el = p as HTMLElement;
            if (el.closest('.callout-info')) return;
            const text = (el.textContent || '').trim();
            if (text) content += text + ' ';
        });
        if (!content) {
            const bodyClone = calloutEl.cloneNode(true) as HTMLElement;
            bodyClone.querySelector('.callout-info')?.remove();
            content = (bodyClone.textContent || '').trim();
        }

        // 折叠状态：读取拥有该块 ID 的元素上的 fold 属性（优先 bq，其次 callout 本体）
        let isFolded = false;
        const ownerBq = calloutEl.closest('.bq[data-node-id]') as HTMLElement | null;
        if (ownerBq && ownerBq.getAttribute('data-node-id') === blockId) {
            isFolded = ownerBq.getAttribute('fold') === '1';
        } else if (calloutEl.getAttribute('data-node-id') === blockId) {
            isFolded = calloutEl.getAttribute('fold') === '1';
        }

        return {
            id: blockId,
            type: cfg.type,
            title: title,
            content: content.substring(0, 600),
            config: cfg,
            collapsed: isFolded
        };
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
        for (let i = 1; i < Math.min(paragraphs.length, 10); i++) {
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
            content: content.substring(0, 600), // 600字符确保能显示5行完整内容
            config: config,
            collapsed: collapsed
        };
    }

    /**
     * 🎯 处理卡片点击（支持移动端激活按钮显示）
     */
    function handleCardClick(event: MouseEvent, index: number, calloutId: string) {
        // 如果当前卡片未激活，先激活它（移动端场景）
        if (activeCardIndex !== index) {
            activeCardIndex = index;
            // 移动端：第一次点击只激活，不跳转
            // 检测是否为移动设备（简单判断：没有hover能力）
            const isMobile = !window.matchMedia('(hover: hover)').matches;
            if (isMobile) {
                event.stopPropagation();
                return;
            }
        }
        
        // 桌面端或第二次点击：执行跳转
        jumpToCallout(calloutId, event);
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

    async function handleRefresh() {
        // 重新加载类型映射（包括新添加的自定义类型）
        await initializeTypeMap();
        lastUpdateTime = 0; // 重置防抖时间
        currentDocId = ''; // 重置文档ID，强制刷新
        loadCallouts();
    }
    
    /**
     * 切换显示密度：自动 → 极简 → 紧凑 → 全部 → 极简...
     */
    function toggleDensity() {
        if (densityMode === 'auto') {
            densityMode = 'minimal';
        } else if (densityMode === 'minimal') {
            densityMode = 'compact';
        } else if (densityMode === 'compact') {
            densityMode = 'full';
        } else {
            densityMode = 'minimal';
        }
    }
    
    /**
     * 🎯 切换单个卡片的展开/折叠状态（优先级最高）
     */
    function toggleCardExpand(event: MouseEvent, index: number) {
        event.stopPropagation(); // 阻止冒泡，避免触发卡片点击跳转
        callouts = callouts.map((callout, i) => {
            if (i === index) {
                return {
                    ...callout,
                    isExpanded: callout.isExpanded === undefined ? true : !callout.isExpanded
                };
            }
            return callout;
        });
    }
</script>

<div class="callout-outline-dock" style={themeCSS}>
    <div class="callout-outline-header">
        <div class="header-title">
            <svg class="header-icon"><use xlink:href="#iconCallout"></use></svg>
            <span>{plugin.i18n.calloutOutline || 'Callout 大纲'}</span>
        </div>
        <div class="header-actions">
            <!-- 密度切换按钮 -->
            <button 
                class="density-btn" 
                on:click={toggleDensity}
                title={
                    densityMode === 'auto' ? `使用设置(${contentMaxLines}行) → 切换密度` :
                    densityMode === 'minimal' ? '仅标题 → 1行' : 
                    densityMode === 'compact' ? '1行 → 全部显示' : 
                    '全部显示 → 仅标题'
                }
            >
                {#if densityMode === 'auto'}
                    <!-- 自动：根据设置显示对应图标 -->
                    {#if hideContent}
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M3 11h18v2H3v-2z"/>
                        </svg>
                    {:else if contentMaxLines <= 1}
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M3 11h18v2H3v-2z"/>
                        </svg>
                    {:else if contentMaxLines <= 3}
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M3 7h18v2H3V7zm0 8h18v2H3v-2z"/>
                        </svg>
                    {:else}
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                        </svg>
                    {/if}
                {:else if densityMode === 'minimal'}
                    <!-- 极简：一条线 -->
                    <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M3 11h18v2H3v-2z"/>
                    </svg>
                {:else if densityMode === 'compact'}
                    <!-- 紧凑：两条线 -->
                    <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M3 7h18v2H3V7zm0 8h18v2H3v-2z"/>
                    </svg>
                {:else}
                    <!-- 全部：三条线 -->
                    <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                    </svg>
                {/if}
            </button>
            
            <!-- 刷新按钮 -->
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
            {#each callouts as callout, index (callout.id)}
                <div 
                    class="callout-card" 
                    style="
                        --callout-color: {callout.config.color}; 
                        --callout-bg-gradient: {callout.config.bgGradient};
                        {getCardBackground(callout) ? `background: ${getCardBackground(callout)} !important;` : ''}
                    "
                    data-background-style={cardBackgroundStyle}
                    data-text-color={textColor}
                    data-active={activeCardIndex === index}
                    on:click={(e) => handleCardClick(e, index, callout.id)}
                    on:keydown={(e) => e.key === 'Enter' && jumpToCallout(callout.id)}
                    role="button"
                    tabindex="0"
                    title="点击跳转到此 Callout"
                >
                    <!-- 🎯 浮动展开/折叠按钮（hover或激活时显示） -->
                    <button 
                        class="card-expand-btn" 
                        on:click={(e) => toggleCardExpand(e, index)}
                        title={callout.isExpanded ? '折叠内容' : '展开全部'}
                    >
                        {#if callout.isExpanded}
                            <!-- 折叠图标：向上箭头 -->
                            <svg viewBox="0 0 16 16" width="16" height="16">
                                <path fill="currentColor" d="M8 5l-5 5h10z"/>
                            </svg>
                        {:else}
                            <!-- 展开图标：向下箭头 -->
                            <svg viewBox="0 0 16 16" width="16" height="16">
                                <path fill="currentColor" d="M8 11l-5-5h10z"/>
                            </svg>
                        {/if}
                    </button>
                
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
                    
                    <!-- 🎯 内容显示逻辑（优先级：卡片展开状态 > 全局密度模式） -->
                    {#if callout.content}
                        {#if callout.isExpanded === true}
                            <!-- 🔥 优先级最高：单独展开此卡片，显示全部内容 -->
                            <div class="callout-preview" style="-webkit-line-clamp: 99; line-clamp: 99;">{callout.content}</div>
                        {:else if callout.isExpanded === false}
                            <!-- 🔥 优先级最高：单独折叠此卡片，不显示内容 -->
                        {:else if densityMode === 'auto'}
                            <!-- 自动模式：使用设置配置 -->
                            {#if !hideContent}
                                <div class="callout-preview" style="-webkit-line-clamp: {contentMaxLines}; line-clamp: {contentMaxLines};">{callout.content}</div>
                            {/if}
                        {:else if densityMode === 'minimal'}
                            <!-- 极简模式：不显示内容（仅标题） -->
                        {:else if densityMode === 'compact'}
                            <!-- 紧凑模式：固定1行 -->
                            <div class="callout-preview" style="-webkit-line-clamp: 1; line-clamp: 1;">{callout.content}</div>
                        {:else}
                            <!-- 全部模式：显示全部内容（99行，基本无限制） -->
                            <div class="callout-preview" style="-webkit-line-clamp: 99; line-clamp: 99;">{callout.content}</div>
                        {/if}
                    {/if}
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

    /* 隐藏大纲卡片中的折叠指示小箭头 */
    .callout-outline-dock .collapse-indicator {
        display: none !important;
    }

    .callout-outline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--outline-header-padding, 12px 16px);
        background: var(--outline-header-bg, rgba(255, 255, 255, 0.5));
        backdrop-filter: var(--outline-header-backdrop, blur(10px));
        -webkit-backdrop-filter: var(--outline-header-backdrop, blur(10px));
        border-bottom: var(--outline-header-border, 1px solid rgba(255, 255, 255, 0.3));
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

        .density-btn,
        .refresh-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border: var(--outline-button-border, 1px solid rgba(255, 255, 255, 0.5));
            border-radius: var(--outline-button-radius, 6px);
            background: var(--outline-button-bg, rgba(255, 255, 255, 0.6));
            backdrop-filter: var(--outline-header-backdrop, blur(10px));
            -webkit-backdrop-filter: var(--outline-header-backdrop, blur(10px));
            color: var(--outline-button-color, #666);
            cursor: pointer;
            transition: all 0.2s;

            &:hover:not(:disabled) {
                background: var(--outline-button-hover-bg, rgba(255, 255, 255, 0.8));
                border: var(--outline-button-hover-border, 1px solid rgba(255, 255, 255, 0.7));
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
            
            // 🎯 hover时显示展开/折叠按钮
            .card-expand-btn {
                opacity: 1;
                visibility: visible;
            }
        }

        &:active {
            opacity: 0.95;
        }
        
        // 🎯 激活状态（移动端点击后）也显示按钮
        &[data-active="true"] {
            .card-expand-btn {
                opacity: 1;
                visibility: visible;
            }
        }
    }
    
    // 🎯 浮动展开/折叠按钮
    .card-expand-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: none;
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(4px);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        z-index: 10;
        
        svg {
            width: 14px;
            height: 14px;
            fill: #fff;
        }
        
        &:hover {
            background: rgba(0, 0, 0, 0.35);
            transform: scale(1.1);
        }
        
        &:active {
            transform: scale(0.95);
        }
    }
    
    // 浅色背景下使用柔和的边框
    .callout-card[data-background-style="solid"],
    .callout-card[data-background-style="gradient"],
    .callout-card[data-background-style="colorful"] {
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        
        &:hover {
            border-color: rgba(255, 255, 255, 0.5) !important;
        }
        
        // 浅色背景下的按钮样式（使用主题色）
        .card-expand-btn {
            background: rgba(255, 255, 255, 0.6);
            
            svg {
                fill: var(--callout-color);
            }
            
            &:hover {
                background: rgba(255, 255, 255, 0.85);
            }
        }
    }
    
    // 浓烈风格：纯主题色背景，使用白色边框
    .callout-card[data-background-style="vivid"] {
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        
        &:hover {
            border-color: rgba(255, 255, 255, 0.5) !important;
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
    }
    
    // 浅色背景下的图标样式（纯色、渐变和色彩模式）
    .callout-card[data-background-style="solid"],
    .callout-card[data-background-style="gradient"],
    .callout-card[data-background-style="colorful"] {
        .callout-icon {
            :global(svg) {
                filter: none !important;
            }
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
    }
    
    // 浅色背景下的标签和折叠指示器样式（纯色、渐变和色彩模式）
    .callout-card[data-background-style="solid"],
    .callout-card[data-background-style="gradient"],
    .callout-card[data-background-style="colorful"] {
        .callout-type-label {
            color: var(--callout-color) !important;
            background: transparent !important;
            padding: 0 !important;
            font-weight: 700 !important;
        }

        .collapse-indicator {
            filter: none !important;
            fill: var(--callout-color) !important;
        }
    }
    
    // 浓烈风格：深色背景，使用白色文字和图标
    .callout-card[data-background-style="vivid"] {
        .callout-icon {
            :global(svg) {
                filter: brightness(0) invert(1) !important; // 白色图标
            }
        }
        
        .callout-type-label {
            background: transparent !important;
            color: #ffffff !important;
            padding: 0 !important;
            font-weight: 700 !important;
        }

        .collapse-indicator {
            fill: #ffffff !important;
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
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word; /* 允许单词内换行 */
        overflow-wrap: break-word; /* 长单词换行 */
        margin-bottom: var(--outline-content-margin-bottom, 8px);
        /* -webkit-line-clamp 通过内联样式动态设置，控制显示行数 */
    }
    
    // 浅色背景下的标题和内容样式（纯色、渐变和色彩模式）
    .callout-card[data-background-style="solid"],
    .callout-card[data-background-style="gradient"],
    .callout-card[data-background-style="colorful"] {
        .callout-title {
            color: #374151 !important;
        }
        
        .callout-preview {
            color: #6b7280 !important;
        }
    }
    
    // 浓烈风格下的标题和内容样式 - 使用白色文字
    .callout-card[data-background-style="vivid"] {
        .callout-title {
            color: #ffffff !important;
        }
        
        .callout-preview {
            color: rgba(255, 255, 255, 0.9) !important;
        }
    }
    
    // 文字颜色：黑色
    .callout-card[data-text-color="dark"] {
        .callout-icon {
            :global(svg) {
                filter: none !important;
            }
        }
        
        .callout-type-label {
            color: #374151 !important;
        }
        
        .callout-title {
            color: #374151 !important;
        }
        
        .callout-preview {
            color: #6b7280 !important;
        }
        
        .collapse-indicator {
            fill: #374151 !important;
        }
        
        // 深色文字模式下的按钮（使用浅色背景+深色图标）
        .card-expand-btn {
            background: rgba(255, 255, 255, 0.7);
            
            svg {
                fill: #374151;
            }
            
            &:hover {
                background: rgba(255, 255, 255, 0.9);
            }
        }
    }
    
    // 文字颜色：白色
    .callout-card[data-text-color="light"] {
        .callout-icon {
            :global(svg) {
                filter: brightness(0) invert(1) !important;
            }
        }
        
        .callout-type-label {
            color: #ffffff !important;
        }
        
        .callout-title {
            color: #ffffff !important;
        }
        
        .callout-preview {
            color: rgba(255, 255, 255, 0.9) !important;
        }
        
        .collapse-indicator {
            fill: #ffffff !important;
        }
    }
</style>

