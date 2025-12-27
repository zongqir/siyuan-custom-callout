import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig, FIXED_CALLOUT_SVG } from './types';
import { appendBlock, foldBlock, unfoldBlock, deleteBlock } from '../api';
import { logger } from '../libs/logger';

/**
 * CalloutProcessorV2 - 基于块属性的全新 Callout 处理器
 * 
 * 核心理念：
 * 1. 使用块属性存储 callout 状态，而不是解析文档内容
 * 2. 通过 CSS 属性选择器应用样式
 * 3. 简化的 DOM 操作，更可靠的状态管理
 * 
 * 块属性约定：
 * - custom-callout-type: callout 类型（如 "info", "warning" 等）
 * - custom-callout-title: 自定义标题（可选）
 * - custom-callout-collapsed: 折叠状态（"true" 或 "false"）
 */
export class CalloutProcessorV2 {
    private calloutTypes: Map<string, CalloutTypeConfig> = new Map();
    private observer: MutationObserver | null = null;
    private processedBlocks: Set<string> = new Set();
    private isInitialLoad: boolean = true;
    private processingNow: WeakSet<HTMLElement> = new WeakSet();
    private aliasIndex: Map<string, CalloutTypeConfig> = new Map();
    private overlayButtons: Map<string, HTMLButtonElement> = new Map();
    private overlayStates: Map<string, { overCallout: boolean; overBtn: boolean; hideTimer: number | null }> = new Map();
    private overlayPositions: Map<string, { l: number; t: number; raf: number | null }> = new Map();
    private scrollResizeBound: boolean = false;
    private onScrollResize = () => {
        try {
            this.overlayButtons.forEach((btn, nodeId) => {
                const owner = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                if (!owner) {
                    this.removeOverlayForNode(nodeId);
                    return;
                }
                const callout = owner.classList.contains('callout') ? owner : (owner.querySelector('.callout') as HTMLElement | null);
                const info = callout?.querySelector('.callout-info') as HTMLElement | null;
                if (!callout || !info) return;
                const r = info.getBoundingClientRect();
                const offscreen = (r.width === 0 && r.height === 0) || r.bottom < 0 || r.top > (window.innerHeight || 0);
                if (offscreen) {
                    const st = this.overlayStates.get(nodeId);
                    if (st && !st.overBtn && !st.overCallout) {
                        btn.style.opacity = '0';
                        btn.style.pointerEvents = 'none';
                    }
                    return;
                }
                this.schedulePosition(nodeId, info, btn);
            });
        } catch {}
    };
    
    // 新建 blockquote 自动显示菜单的回调
    public onNewBlockquoteCreated: ((blockquote: HTMLElement) => void) | null = null;

    constructor() {
        this.loadDefaultTypes();
        
        // 2秒后结束初始加载状态
        setTimeout(() => {
            this.isInitialLoad = false;
        }, 2000);
    }

    /**
     * 加载默认的 Callout 类型
     */
    private loadDefaultTypes() {
        DEFAULT_CALLOUT_TYPES.forEach(config => {
            this.calloutTypes.set(config.type, config);
        });
        this.rebuildAliasIndex();
    }

    // 负责图标兜底并按类型渲染：处理原生 .callout 结构，创建/更新类型图标
    private ensureNativeIcon(blockquote: HTMLElement) {
        try {
            const callout = blockquote.classList.contains('callout')
                ? blockquote
                : (blockquote.querySelector('.callout') as HTMLElement | null);
            if (!callout) return;
            const info = callout.querySelector('.callout-info') as HTMLElement | null;
            if (!info) return;

            // 解析原生 data-subtype，并通过别名索引解析到配置
            let subtypeRaw = callout.getAttribute('data-subtype') || '';
            const subtype = this.normalizeAlias(subtypeRaw);
            const mapped = subtype === 'note' ? 'info' : subtype; // 原生 note 归并为 info
            const cfg = this.getConfigBySubtype(mapped);
            const svg = (cfg && cfg.icon) ? cfg.icon : FIXED_CALLOUT_SVG;

            let icon = info.querySelector('.callout-icon') as HTMLElement | null;
            if (!icon) {
                icon = document.createElement('span');
                icon.className = 'callout-icon';
                info.insertBefore(icon, info.firstChild);
            }

            // 去重：如果 .callout-info 下出现多个 .callout-icon，优先保留原生（非 data-mask-icon）
            try {
                const icons = Array.from(info.querySelectorAll('.callout-icon')) as HTMLElement[];
                if (icons.length > 1) {
                    const others = icons.filter(i => !i.hasAttribute('data-mask-icon'));
                    const plugins = icons.filter(i => i.hasAttribute('data-mask-icon'));
                    if (others.length > 0) {
                        plugins.forEach(i => i.remove());
                        icon = others[0];
                    } else {
                        // 只有插件图标时，保留一个，移除其余
                        icon = icons[0];
                        icons.slice(1).forEach(i => i.remove());
                    }
                }
            } catch {}

            const current = (icon.textContent || '').trim();
            if (current && icon.getAttribute('data-mask-icon')) {
                (icon.style as any).webkitMaskImage = '';
                (icon.style as any).maskImage = '';
                (icon.style as any).webkitMaskRepeat = '';
                (icon.style as any).maskRepeat = '';
                (icon.style as any).webkitMaskSize = '';
                (icon.style as any).maskSize = '';
                (icon.style as any).webkitMaskPosition = '';
                (icon.style as any).maskPosition = '';
                icon.style.backgroundColor = '';
                icon.removeAttribute('data-mask-icon');
                const svgs = icon.querySelectorAll('svg') as NodeListOf<SVGElement>;
                svgs.forEach(el => el.remove());
            }
            if (!current && !icon.getAttribute('data-mask-icon')) {
                icon.textContent = '';
                const url = this.svgToDataUrl(svg);
                if (url) {
                    (icon.style as any).webkitMaskImage = url;
                    (icon.style as any).maskImage = url;
                    (icon.style as any).webkitMaskRepeat = 'no-repeat';
                    (icon.style as any).maskRepeat = 'no-repeat';
                    (icon.style as any).webkitMaskSize = 'contain';
                    (icon.style as any).maskSize = 'contain';
                    (icon.style as any).webkitMaskPosition = 'center';
                    (icon.style as any).maskPosition = 'center';
                    icon.style.backgroundColor = 'currentColor';
                    icon.setAttribute('data-mask-icon', '1');
                    // 二次校验：若之后原生写入了文本图标，立即清理我们设置的 mask，避免混合显示
                    const tryClearMask = () => {
                        try {
                            const t = (icon!.textContent || '').trim();
                            if (t && icon!.getAttribute('data-mask-icon')) {
                                (icon!.style as any).webkitMaskImage = '';
                                (icon!.style as any).maskImage = '';
                                (icon!.style as any).webkitMaskRepeat = '';
                                (icon!.style as any).maskRepeat = '';
                                (icon!.style as any).webkitMaskSize = '';
                                (icon!.style as any).maskSize = '';
                                (icon!.style as any).webkitMaskPosition = '';
                                (icon!.style as any).maskPosition = '';
                                icon!.style.backgroundColor = '';
                                icon!.removeAttribute('data-mask-icon');
                                const svgs2 = icon!.querySelectorAll('svg') as NodeListOf<SVGElement>;
                                svgs2.forEach(el => el.remove());
                            }
                        } catch {}
                    };
                    try { requestAnimationFrame(tryClearMask); } catch { tryClearMask(); }
                    setTimeout(tryClearMask, 120);
                }
            }
        } catch {}
    }

    private ensureFoldToggleButton(blockquote: HTMLElement) {
        try {
            const callout = blockquote.classList.contains('callout')
                ? blockquote
                : (blockquote.querySelector('.callout') as HTMLElement | null);
            if (!callout) return;

            const info = callout.querySelector('.callout-info') as HTMLElement | null;
            if (!info) return;

            const owner = (blockquote.getAttribute('data-node-id') ? blockquote
                : (callout.getAttribute('data-node-id') ? callout
                : (callout.closest('.bq[data-node-id]') as HTMLElement | null)));
            if (!owner) return;

            const nodeId = owner.getAttribute('data-node-id');
            if (!nodeId) return;

            const btn = this.getOrCreateOverlayButton(nodeId);
            const isFolded = owner.getAttribute('fold') === '1';
            const svgExpand = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const svgCollapse = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const desired = isFolded ? svgExpand : svgCollapse;
            if ((btn.innerHTML || '').trim() !== desired) {
                btn.innerHTML = desired;
                const svgEl = btn.querySelector('svg') as SVGElement | null;
                if (svgEl) {
                    (svgEl.style as any).width = '12px';
                    (svgEl.style as any).height = '12px';
                    (svgEl.style as any).display = 'block';
                }
            }
            btn.setAttribute('data-folded', isFolded ? '1' : '0');
            btn.setAttribute('data-node-id', nodeId);
            if (!btn.getAttribute('data-bound')) {
                btn.setAttribute('data-bound', '1');
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (btn.getAttribute('data-busy') === '1') return;
                    btn.setAttribute('data-busy', '1');
                    try {
                        const foldedNow = owner.getAttribute('fold') === '1';
                        if (foldedNow) {
                            await unfoldBlock(nodeId as any);
                        } else {
                            await foldBlock(nodeId as any);
                        }
                    } catch {}
                    btn.removeAttribute('data-busy');
                };
            }

            // 以标题区域 .callout-info 为锚点，垂直居中对齐
            const infoRect = info.getBoundingClientRect();
            btn.style.position = 'fixed';
            btn.style.left = `${Math.max(0, infoRect.right - 30)}px`;
            btn.style.top = `${Math.max(0, Math.round(infoRect.top + Math.max(0, (infoRect.height - 22) / 2)))}px`;
            btn.style.width = '22px';
            btn.style.height = '22px';
            btn.style.zIndex = '2147483647';
            btn.style.display = 'grid';
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
            btn.style.lineHeight = '0';
            btn.style.borderRadius = '6px';
            btn.style.alignItems = 'center';
            (btn.style as any).justifyItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.color = getComputedStyle(callout).color || 'var(--b3-theme-on-background)';
            btn.style.border = 'none';
            btn.style.boxShadow = 'none';
            // subtle transparent background; will increase on hover
            ;(btn.style as any).background = 'color-mix(in srgb, currentColor 16%, transparent)';
            btn.style.transition = 'background 120ms ease, opacity 120ms ease';

            if (!callout.getAttribute('data-overlay-bound')) {
                callout.setAttribute('data-overlay-bound', '1');
                callout.addEventListener('pointerenter', (_ev: PointerEvent) => {
                    const state = this.ensureOverlayState(nodeId);
                    state.overCallout = true;
                    if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
                    this.schedulePosition(nodeId, info, btn);
                    // 只显示当前这一个覆盖按钮
                    this.hideAllOverlaysExcept(nodeId);
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                }, true);
                // 根据指针位置动态判定“靠近右上角”
                callout.addEventListener('pointermove', (ev: PointerEvent) => {
                    const state = this.ensureOverlayState(nodeId);
                    this.schedulePosition(nodeId, info, btn);
                    // 在 callout 内移动：始终保持可见，取消隐藏计时
                    if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                    // 保证同一时间只显示一个
                    this.hideAllOverlaysExcept(nodeId);
                    // 仅用于视觉强调：热区内加深背景，非热区恢复
                    if (this.isInHotZone(callout, info, ev.clientX, ev.clientY)) {
                        (btn!.style as any).background = 'color-mix(in srgb, currentColor 26%, transparent)';
                    } else {
                        (btn!.style as any).background = 'color-mix(in srgb, currentColor 16%, transparent)';
                    }
                }, true);
                callout.addEventListener('pointerleave', (ev: PointerEvent) => {
                    const state = this.ensureOverlayState(nodeId);
                    state.overCallout = false;
                    // 若鼠标已处于按钮区域，不隐藏
                    const bx = ev.clientX, by = ev.clientY;
                    const br = btn.getBoundingClientRect();
                    const margin = 6;
                    const inBtn = bx >= br.left - margin && bx <= br.right + margin && by >= br.top - margin && by <= br.bottom + margin;
                    if (inBtn) {
                        state.overBtn = true;
                        btn.style.opacity = '1';
                        btn.style.pointerEvents = 'auto';
                        return;
                    }
                    if (!state.overBtn) {
                        btn.style.opacity = '0';
                        btn.style.pointerEvents = 'none';
                        state.hideTimer = null;
                    }
                }, true);
            }

            const inlineBtns = callout.querySelectorAll('.callout-fold-toggle:not([data-overlay="1"])');
            inlineBtns.forEach(el => (el as HTMLElement).remove());

            // 清理历史遗留：正文中被注入并持久化的 HTMLBlock（包含 callout-fold-toggle）
            const htmlBlocks = callout.querySelectorAll('.render-node[data-type="NodeHTMLBlock"]') as NodeListOf<HTMLElement>;
            htmlBlocks.forEach(async (blockEl) => {
                try {
                    const placeholder = blockEl.querySelector('protyle-html') as HTMLElement | null;
                    const raw = placeholder?.getAttribute('data-content') || '';
                    if (raw.includes('callout-fold-toggle')) {
                        const badId = blockEl.getAttribute('data-node-id');
                        blockEl.remove();
                        if (badId) {
                            await deleteBlock(badId as any);
                        }
                    }
                } catch {}
            });
        } catch {}
    }

    // 将别名标准化：去掉 [! ]、去空格、小写
    private normalizeAlias(s: string): string {
        return (s || '')
            .replace(/^\[!|\]$/g, '')
            .replace(/\s+/g, '')
            .trim()
            .toLowerCase();
    }

    // 重建别名索引（type、zhCommand 去括号、displayName）
    private rebuildAliasIndex() {
        const idx = new Map<string, CalloutTypeConfig>();
        this.calloutTypes.forEach(cfg => {
            idx.set(this.normalizeAlias(cfg.type), cfg);
            const zh = (cfg.zhCommand || '').replace(/^\[!|\]$/g, '');
            if (zh) idx.set(this.normalizeAlias(zh), cfg);
            if (cfg.displayName) idx.set(this.normalizeAlias(cfg.displayName), cfg);
        });
        // 原生 note 归并 info
        const infoCfg = this.calloutTypes.get('info');
        if (infoCfg && !idx.has('note')) idx.set('note', infoCfg);
        this.aliasIndex = idx;
    }

    // 根据 data-subtype 获取配置（支持别名）
    private getConfigBySubtype(sub: string): CalloutTypeConfig | null {
        const key = this.normalizeAlias(sub === 'note' ? 'info' : sub);
        return this.aliasIndex.get(key) || null;
    }

    

    private svgToDataUrl(svg: string): string {
        try {
            const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
            return `url("data:image/svg+xml,${encoded}")`;
        } catch {
            return '';
        }
    }

    private getOrCreateOverlayButton(nodeId: string): HTMLButtonElement {
        let btn = this.overlayButtons.get(nodeId) as HTMLButtonElement | undefined;
        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'callout-fold-toggle';
            btn.type = 'button';
            btn.setAttribute('aria-label', '折叠/展开');
            btn.setAttribute('title', '折叠/展开');
            btn.setAttribute('data-overlay', '1');
            document.body.appendChild(btn);
            this.overlayButtons.set(nodeId, btn);
        }
        if (!btn.getAttribute('data-hover-bound')) {
            btn.setAttribute('data-hover-bound', '1');
            btn.addEventListener('pointerenter', () => {
                const state = this.ensureOverlayState(nodeId);
                state.overBtn = true;
                if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
                // stronger background on hover
                ;(btn!.style as any).background = 'color-mix(in srgb, currentColor 26%, transparent)';
                // reposition in case of scroll while hidden
                const owner = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                const callout = owner?.classList?.contains('callout') ? owner : owner?.querySelector?.('.callout');
                if (callout) {
                    const info = (callout as HTMLElement).querySelector('.callout-info') as HTMLElement | null;
                    const r = (info || callout as HTMLElement).getBoundingClientRect();
                    btn!.style.left = `${Math.max(0, r.right - 30)}px`;
                    btn!.style.top = `${Math.max(0, Math.round(r.top + Math.max(0, (r.height - 22) / 2)))}px`;
                }
                // 只显示当前这一个覆盖按钮
                this.hideAllOverlaysExcept(nodeId);
                btn!.style.opacity = '1';
                btn!.style.pointerEvents = 'auto';
            }, true);
            btn.addEventListener('pointerleave', () => {
                const state = this.ensureOverlayState(nodeId);
                state.overBtn = false;
                ;(btn!.style as any).background = 'color-mix(in srgb, currentColor 16%, transparent)';
                if (!state.overCallout) {
                    btn!.style.opacity = '0';
                    btn!.style.pointerEvents = 'none';
                    state.hideTimer = null;
                }
            }, true);
        }
        return btn;
    }

    // rAF 节流定位：同帧只写一次 left/top
    private schedulePosition(nodeId: string, info: HTMLElement, btn: HTMLButtonElement) {
        try {
            const r = info.getBoundingClientRect();
            const l = Math.max(0, r.right - 30);
            const t = Math.max(0, Math.round(r.top + Math.max(0, (r.height - 22) / 2)));
            let st = this.overlayPositions.get(nodeId);
            if (!st) {
                st = { l, t, raf: null };
                this.overlayPositions.set(nodeId, st);
            } else {
                st.l = l; st.t = t;
            }
            if (st.raf != null) return;
            st.raf = requestAnimationFrame(() => {
                try {
                    btn.style.left = `${st!.l}px`;
                    btn.style.top = `${st!.t}px`;
                } catch {}
                st!.raf = null;
            });
        } catch {}
    }

    private removeOverlayForNode(nodeId: string) {
        try {
            const btn = this.overlayButtons.get(nodeId);
            if (btn) {
                btn.remove();
                this.overlayButtons.delete(nodeId);
            }
            this.overlayStates.delete(nodeId);
            const pos = this.overlayPositions.get(nodeId);
            if (pos && pos.raf != null) {
                try { cancelAnimationFrame(pos.raf); } catch {}
            }
            this.overlayPositions.delete(nodeId);
        } catch {}
    }

    // 判定指针是否在“靠近右上角”的较大热区内
    private isInHotZone(callout: HTMLElement, info: HTMLElement, x: number, y: number): boolean {
        try {
            const cr = callout.getBoundingClientRect();
            const ir = info.getBoundingClientRect();
            const zoneRight = Math.max(ir.right, cr.right);
            const zoneLeft = zoneRight - 80; // 横向 80px 范围
            const zoneTop = Math.min(ir.top, cr.top) - 6; // 上方留 6px 缓冲
            const zoneBottom = ir.top + Math.max(40, ir.height + 12); // 至少 40px 高度
            return x >= zoneLeft && x <= zoneRight + 8 && y >= zoneTop && y <= zoneBottom;
        } catch {
            return false;
        }
    }
    private ensureOverlayState(nodeId: string) {
        let st = this.overlayStates.get(nodeId);
        if (!st) {
            st = { overCallout: false, overBtn: false, hideTimer: null };
            this.overlayStates.set(nodeId, st);
        }
        return st;
    }

    // 同时只显示一个覆盖按钮：隐藏其他所有 overlay 按钮
    private hideAllOverlaysExcept(currentId: string) {
        try {
            this.overlayButtons.forEach((button, key) => {
                if (key !== currentId) {
                    button.style.opacity = '0';
                    button.style.pointerEvents = 'none';
                    const st = this.overlayStates.get(key);
                    if (st) {
                        st.overBtn = false;
                        st.overCallout = false;
                        if (st.hideTimer) { clearTimeout(st.hideTimer); st.hideTimer = null; }
                    }
                }
            });
        } catch {}
    }


    /**
     * 更新 Callout 类型配置
     */
    updateTypes(types: CalloutTypeConfig[]) {
        this.calloutTypes.clear();
        types.forEach(config => {
            this.calloutTypes.set(config.type, config);
        });
        this.rebuildAliasIndex();
    }

    /**
     * 获取所有 Callout 类型
     */
    getTypes(): CalloutTypeConfig[] {
        return Array.from(this.calloutTypes.values());
    }

    /**
     * 根据类型获取配置
     */
    getTypeConfig(type: string): CalloutTypeConfig | null {
        return this.calloutTypes.get(type) || null;
    }

    /**
     * 初始化处理器 - 启动 DOM 监听
     */
    initialize() {
        logger.log('[ProcessorV2] 初始化处理器');
        
        if (!this.scrollResizeBound) {
            try {
                window.addEventListener('scroll', this.onScrollResize, true);
                window.addEventListener('resize', this.onScrollResize, true);
                this.scrollResizeBound = true;
            } catch {}
        }

        // 处理现有的所有 blockquote
        this.processAllBlockquotes();
        
        // 启动 MutationObserver 监听 DOM 变化
        this.startObserver();
    }

    /**
     * 销毁处理器
     */
    destroy() {
        logger.log('[ProcessorV2] 销毁处理器');
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        try {
            if (this.scrollResizeBound) {
                window.removeEventListener('scroll', this.onScrollResize, true);
                window.removeEventListener('resize', this.onScrollResize, true);
                this.scrollResizeBound = false;
            }
        } catch {}

        // 清理所有 overlay 按钮与状态
        try {
            this.overlayButtons.forEach((btn) => btn.remove());
            this.overlayButtons.clear();
            this.overlayStates.clear();
            this.overlayPositions.clear();
        } catch {}

        this.processedBlocks.clear();
    }

    /**
     * 处理所有编辑器中的 blockquote
     */
    private processAllBlockquotes() {
        const editors = document.querySelectorAll('.protyle-wysiwyg');
        editors.forEach(editor => {
            // 同时处理：有 data-node-id 的 .bq，以及任意 .callout（无论是否有 data-node-id）
            const nodes = editor.querySelectorAll('.bq[data-node-id], .callout');
            nodes.forEach(el => {
                this.processBlockquote(el as HTMLElement);
            });
        });
    }

    /**
     * 启动 MutationObserver 监听 DOM 变化
     */
    private startObserver() {
        this.observer = new MutationObserver((mutations) => {
            const newBlockquotes: HTMLElement[] = [];
            
            for (const mutation of mutations) {
                // 处理新增的节点
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        
                        // 如果是 blockquote 或原生 callout 本身
                        if (element.classList?.contains('bq') || element.classList?.contains('callout')) {
                            newBlockquotes.push(element);
                        }
                        
                        // 如果包含 blockquote 或原生 callout
                        const nodes = element.querySelectorAll?.('.bq[data-node-id], .callout[data-node-id]');
                        nodes?.forEach(n => {
                            newBlockquotes.push(n as HTMLElement);
                        });
                    } else if (mutation.type === 'childList' && node.nodeType === Node.TEXT_NODE) {
                        // 文本节点被添加：向上寻找最近的 bq/callout 并处理
                        let el: HTMLElement | null = (mutation.target as HTMLElement) || null;
                        while (el && el !== document.body) {
                            if (el.classList?.contains('bq') || el.classList?.contains('callout')) {
                                const bq = el.classList.contains('bq') ? el : (el.closest('.bq[data-node-id]') as HTMLElement | null);
                                if (bq) this.processBlockquote(bq);
                                break;
                            }
                            el = el.parentElement;
                        }
                    }
                });

                // 处理被移除的节点：清理对应 overlay
                if (mutation.type === 'childList' && (mutation as any).removedNodes) {
                    (mutation as any).removedNodes.forEach((node: Node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as HTMLElement;
                            const candidates: HTMLElement[] = [];
                            if (element.matches?.('.bq[data-node-id], .callout[data-node-id]')) {
                                candidates.push(element);
                            }
                            element.querySelectorAll?.('.bq[data-node-id], .callout[data-node-id]')?.forEach(el => candidates.push(el as HTMLElement));
                            candidates.forEach(el => {
                                const nid = el.getAttribute('data-node-id');
                                if (nid) this.removeOverlayForNode(nid);
                            });
                        }
                    });
                }

                // 处理属性变化（用于当原生完成解析并设置结构时我们兜底图标）
                if (mutation.type === 'attributes' && mutation.target) {
                    const element = mutation.target as HTMLElement;
                    if (element.classList?.contains('bq') || element.classList?.contains('callout')) {
                        const target = element.classList.contains('bq') ? element : element;
                        this.processBlockquote(target);
                    }
                }

                // 处理文本变化：在编辑过程中同步自定义子类型
                if (mutation.type === 'characterData' && mutation.target) {
                    const node = mutation.target as Node;
                    let el: HTMLElement | null = (node as any).parentElement || null;
                    while (el && el !== document.body) {
                        if (el.classList?.contains('bq')) {
                            this.processBlockquote(el);
                            break;
                        }
                        if (el.classList?.contains('callout')) {
                            this.processBlockquote(el);
                            break;
                        }
                        el = el.parentElement;
                    }
                }
            }
            
            // 处理新增的 blockquote
            if (newBlockquotes.length > 0) {
                // 去重
                const uniqueBlockquotes = [...new Set(newBlockquotes)];
                
                setTimeout(() => {
                    uniqueBlockquotes.forEach(bq => {
                        const nodeId = bq.getAttribute('data-node-id');
                        if (!nodeId) return;
                        
                        // 标记为已处理
                        this.processedBlocks.add(nodeId);
                        
                        // 如果不是初始加载 且 blockquote 是空的，触发回调显示菜单
                        if (!this.isInitialLoad && this.isBlockquoteEmpty(bq)) {
                            const rect = bq.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0 && this.onNewBlockquoteCreated) {
                                this.onNewBlockquoteCreated(bq);
                            }
                        }
                        
                        // 处理 blockquote
                        this.processBlockquote(bq);
                    });
                }, 50);
            }
        });

        // 监听整个文档
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeFilter: ['fold', 'data-subtype', 'class', 'data-node-id']
        });
    }

    /**
     * 处理单个 blockquote 元素
     */
    private async processBlockquote(blockquote: HTMLElement) {
        if (this.processingNow.has(blockquote)) return;
        this.processingNow.add(blockquote);
        try {
            // 仅做图标兜底，不写入任何属性，完全交由原生 data-subtype
            this.ensureNativeIcon(blockquote);
            this.ensureFoldToggleButton(blockquote);
        } catch {}
        this.processingNow.delete(blockquote);
    }

    /**
     * 移除 callout 样式
     */
    private removeCalloutStyle(blockquote: HTMLElement) {
        // 不再移除任何原生样式，仅清理我们可能注入的标题标记与图标
        const titleDiv = blockquote.querySelector('[data-callout-title]');
        if (titleDiv) {
            titleDiv.removeAttribute('data-callout-title');
            const icon = titleDiv.querySelector('.callout-icon');
            icon?.remove();
        }
    }


    /**
     * 创建新的 callout
     */
    async createCallout(blockquote: HTMLElement, type: string, title?: string) {
        const firstPara = blockquote.querySelector('div[data-type="NodeParagraph"]') as HTMLElement | null;
        const firstEditable = firstPara?.querySelector('div[contenteditable]') as HTMLElement | null;
        const cfg = this.getTypeConfig(type);
        if (!firstEditable || !cfg) return;
        try {
            const displayTitle = title || cfg.displayName;
            // 清空文本节点并写入命令行
            const texts: ChildNode[] = [];
            firstEditable.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) texts.push(n); });
            texts.forEach(n => n.remove());
            firstEditable.appendChild(document.createTextNode(`[!${type}] ${displayTitle}`));
            // 交给原生，通过回车解析
            firstEditable.focus();
            this.simulateEnter(firstEditable);
        } catch {}
    }

    /**
     * 删除 callout
     */
    async removeCallout(blockquote: HTMLElement) {
        try {
            const firstPara = blockquote.querySelector('div[data-type="NodeParagraph"]') as HTMLElement | null;
            const firstEditable = firstPara?.querySelector('div[contenteditable]') as HTMLElement | null;
            if (firstEditable) {
                // 清空首行文本，移除我们可能注入的图标标记
                const texts: ChildNode[] = [];
                firstEditable.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) texts.push(n); });
                texts.forEach(n => n.remove());
                this.removeCalloutStyle(blockquote);
            }
        } catch {}
    }

    /**
     * 更新 callout 类型
     */
    async updateCalloutType(blockquote: HTMLElement, newType: string) {
        const cfg = this.getTypeConfig(newType);
        const firstPara = blockquote.querySelector('div[data-type="NodeParagraph"]') as HTMLElement | null;
        const firstEditable = firstPara?.querySelector('div[contenteditable]') as HTMLElement | null;
        if (!cfg || !firstEditable) return;
        try {
            let titleText = '';
            firstEditable.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) titleText += n.textContent || ''; });
            titleText = (titleText || '').trim();
            if (!titleText) titleText = cfg.displayName;
            const texts: ChildNode[] = [];
            firstEditable.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) texts.push(n); });
            texts.forEach(n => n.remove());
            firstEditable.appendChild(document.createTextNode(`[!${newType}] ${titleText}`));
            firstEditable.focus();
            this.simulateEnter(firstEditable);
        } catch {}
    }

    /**
     * 检查一个 blockquote 是否是 callout
     */
    async isCallout(blockquote: HTMLElement): Promise<boolean> {
        // 以是否存在原生 .callout-icon 来粗略判断
        const icon = blockquote.querySelector('.callout-icon');
        return !!icon;
    }

    /**
     * 获取 callout 的类型
     */
    async getCalloutType(_blockquote: HTMLElement): Promise<string | null> {
        // 不干预原生，不提供类型解析
        return null;
    }

    private simulateEnter(el: HTMLElement) {
        try {
            // 触发原生解析：先尝试 insertParagraph，再派发键盘事件
            try { document.execCommand('insertParagraph', false); } catch {}
            const opts: any = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true };
            el.dispatchEvent(new KeyboardEvent('keydown', opts));
            el.dispatchEvent(new KeyboardEvent('keypress', opts));
            el.dispatchEvent(new KeyboardEvent('keyup', opts));
        } catch {}
    }

    /**
     * 检查 blockquote 是否为空
     */
    private isBlockquoteEmpty(blockquote: HTMLElement): boolean {
        const firstParagraph = blockquote.querySelector('div[data-type="NodeParagraph"]');
        if (!firstParagraph) return true;

        const contentDiv = firstParagraph.querySelector('div[contenteditable]');
        if (!contentDiv) return true;

        const text = contentDiv.textContent?.trim() || '';
        return text === '' || text === '\n';
    }



    async ensureSecondParagraphWithAPI(blockquote: HTMLElement) {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) return;
        const paras = blockquote.querySelectorAll('div[data-type="NodeParagraph"]');
        if (paras.length >= 2) return;
        try {
            await appendBlock('markdown', ' ', nodeId as any);
        } catch {}
    }
}

