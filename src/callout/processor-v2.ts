import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig, FIXED_CALLOUT_SVG } from './types';
import { appendBlock, foldBlock, unfoldBlock, deleteBlock, request } from '../api';
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
    private overlayStates: Map<string, { overCallout: boolean; overBtn: boolean; hideTimer: number | null; graceUntil: number | null }> = new Map();
    private overlayPositions: Map<string, { l: number; t: number; raf: number | null }> = new Map();
    private overlayCardButtons: Map<string, HTMLButtonElement> = new Map();
    private overlayCardPositions: Map<string, { l: number; t: number; raf: number | null }> = new Map();
    private scrollResizeBound: boolean = false;
    private overlayObservers: Map<string, IntersectionObserver> = new Map();
    private processQueue: Set<HTMLElement> = new Set();
    private processQueueRaf: number | null = null;
    private overlayBoundCallouts: WeakSet<HTMLElement> = new WeakSet();
    private readonly QUICK_DECK_ID = '20230218211946-2kw8jgx';
    private readonly CUSTOM_RIFF_DECKS = 'custom-riff-decks';
    private onScrollResize = () => {
        try {
            this.overlayButtons.forEach((btn, nodeId) => {
                // 限定在编辑器正文中查找，避免命中侧栏/大纲
                const owner = document.querySelector(`.protyle-wysiwyg [data-node-id="${nodeId}"]`) as HTMLElement | null;
                if (!owner) {
                    this.removeOverlayForNode(nodeId);
                    return;
                }
                const callout = owner.classList.contains('callout') ? owner : (owner.querySelector('.callout') as HTMLElement | null);
                const info = callout?.querySelector('.callout-info') as HTMLElement | null;
                if (!callout) return;
                const anchor = (info || callout) as HTMLElement;
                const r = anchor.getBoundingClientRect();
                const offscreen = (r.width === 0 && r.height === 0) || r.bottom < 0 || r.top > (window.innerHeight || 0);
                if (offscreen) {
                    const st = this.overlayStates.get(nodeId);
                    const inGrace = !!(st && st.graceUntil && Date.now() < st.graceUntil);
                    const foldedNow = owner.getAttribute('fold') === '1';
                    if (st && !st.overBtn && !st.overCallout && !inGrace && !foldedNow) {
                        btn.style.opacity = '0';
                        btn.style.pointerEvents = 'none';
                        const qbtn = this.overlayCardButtons.get(nodeId);
                        if (qbtn) {
                            qbtn.style.opacity = '0';
                            qbtn.style.pointerEvents = 'none';
                        }
                    }
                    return;
                }
                // 折叠态：滚动/缩放后也保持可见，确保用户能随时展开
                try {
                    const foldedNow = owner.getAttribute('fold') === '1';
                    if (foldedNow) this.setBtnVisible(btn, true);
                    const qbtn = this.overlayCardButtons.get(nodeId);
                    if (qbtn && foldedNow) this.setBtnVisible(qbtn, true);
                } catch {}
                this.schedulePosition(nodeId, anchor, btn);
                const qbtn = this.overlayCardButtons.get(nodeId);
                if (qbtn) this.scheduleCardPosition(nodeId, anchor, qbtn);
            });
            this.overlayCardButtons.forEach((qbtn, nodeId) => {
                if (this.overlayButtons.has(nodeId)) return;
                const owner = document.querySelector(`.protyle-wysiwyg [data-node-id="${nodeId}"]`) as HTMLElement | null;
                if (!owner) {
                    this.removeOverlayForNode(nodeId);
                    return;
                }
                const callout = owner.classList.contains('callout') ? owner : (owner.querySelector('.callout') as HTMLElement | null);
                const info = callout?.querySelector('.callout-info') as HTMLElement | null;
                if (!callout) return;
                const anchor = (info || callout) as HTMLElement;
                const r = anchor.getBoundingClientRect();
                const offscreen = (r.width === 0 && r.height === 0) || r.bottom < 0 || r.top > (window.innerHeight || 0);
                if (offscreen) {
                    const st = this.overlayStates.get(nodeId);
                    const inGrace = !!(st && st.graceUntil && Date.now() < st.graceUntil);
                    const foldedNow = owner.getAttribute('fold') === '1';
                    if (st && !st.overBtn && !st.overCallout && !inGrace && !foldedNow) {
                        qbtn.style.opacity = '0';
                        qbtn.style.pointerEvents = 'none';
                    }
                    return;
                }
                try {
                    const foldedNow = owner.getAttribute('fold') === '1';
                    if (foldedNow) this.setBtnVisible(qbtn, true);
                } catch {}
                this.scheduleCardPosition(nodeId, anchor, qbtn);
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
            const anchorInit = (info || callout) as HTMLElement;

            const owner = (blockquote.getAttribute('data-node-id') ? blockquote
                : (callout.getAttribute('data-node-id') ? callout
                : (callout.closest('.bq[data-node-id]') as HTMLElement | null)));
            if (!owner) { this.enqueueProcess(blockquote); return; }

            const nodeId = owner.getAttribute('data-node-id');
            if (!nodeId) { this.enqueueProcess(blockquote); return; }

            const btn = this.getOrCreateOverlayButton(nodeId);
            const qbtn = this.getOrCreateQuickButton(nodeId);
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
            qbtn.setAttribute('data-node-id', nodeId);
            const starOn = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>';
            const starOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.834 6.631 7.166.593-5.44 4.707 1.64 7.069L12 17.27 5.8 21 7.44 13.93 2 9.224l7.166-.593L12 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const quickOn = this.getQuickCardState(nodeId);
            const desiredQ = quickOn ? starOn : starOff;
            if ((qbtn.innerHTML || '').trim() !== desiredQ) {
                qbtn.innerHTML = desiredQ;
                const svgElQ = qbtn.querySelector('svg') as SVGElement | null;
                if (svgElQ) {
                    (svgElQ.style as any).width = '12px';
                    (svgElQ.style as any).height = '12px';
                    (svgElQ.style as any).display = 'block';
                }
            }
            qbtn.setAttribute('data-on', quickOn ? '1' : '0');
            if (!btn.getAttribute('data-bound')) {
                btn.setAttribute('data-bound', '1');
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (btn.getAttribute('data-busy') === '1') return;
                    btn.setAttribute('data-busy', '1');
                    try {
                        const st = this.ensureOverlayState(nodeId);
                        st.graceUntil = Date.now() + 900;
                        const root = (owner.closest('.protyle-wysiwyg') as HTMLElement | null) || document;
                        const ownerNow = root.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                        const baseOwner = (ownerNow || owner) as HTMLElement;
                        const calloutNow = (baseOwner.classList.contains('callout') ? baseOwner : (baseOwner.querySelector('.callout') as HTMLElement | null)) as HTMLElement | null;
                        const infoNow = calloutNow?.querySelector('.callout-info') as HTMLElement | null;
                        const anchorNow = (infoNow || calloutNow || baseOwner) as HTMLElement;
                        this.schedulePosition(nodeId, anchorNow, btn);
                        this.scheduleCardPosition(nodeId, anchorNow, qbtn);
                        this.ensureVisibilityObserver(nodeId, anchorNow, btn);
                        this.setBtnVisible(btn, true);
                        this.setBtnVisible(qbtn, true);
                        this.hideAllOverlaysExcept(nodeId);
                        const foldedNow = !!(ownerNow && ownerNow.getAttribute('fold') === '1');
                        if (foldedNow) {
                            await unfoldBlock(nodeId as any);
                        } else {
                            await foldBlock(nodeId as any);
                        }
                        // 连续两帧再次按最新 DOM 锚点定位，规避折叠/展开后的异步重排
                        for (let i = 0; i < 2; i++) {
                            try {
                                await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
                                const ownerLatest = root.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                                const baseLatest = (ownerLatest || baseOwner) as HTMLElement;
                                const calloutLatest = (baseLatest.classList.contains('callout') ? baseLatest : (baseLatest.querySelector('.callout') as HTMLElement | null)) as HTMLElement | null;
                                const infoLatest = calloutLatest?.querySelector('.callout-info') as HTMLElement | null;
                                const anchorLatest = (infoLatest || calloutLatest || baseLatest) as HTMLElement;
                                this.schedulePosition(nodeId, anchorLatest, btn);
                                this.scheduleCardPosition(nodeId, anchorLatest, qbtn);
                                this.ensureVisibilityObserver(nodeId, anchorLatest, btn);
                                this.setBtnVisible(btn, true);
                                this.setBtnVisible(qbtn, true);
                            } catch {}
                        }
                    } catch {}
                    btn.removeAttribute('data-busy');
                };
            }

            // 以标题区域 .callout-info 为锚点，垂直居中对齐
            const infoRect = anchorInit.getBoundingClientRect();
            btn.style.position = 'fixed';
            btn.style.left = `${Math.max(0, infoRect.right - 30)}px`;
            btn.style.top = `${Math.max(0, Math.round(infoRect.top + Math.max(0, (infoRect.height - 22) / 2)))}px`;
            btn.style.width = '22px';
            btn.style.height = '22px';
            btn.style.zIndex = '2147483647';
            btn.style.display = 'none';
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
            // subtle transparent background with fallback; will increase on hover
            this.setBtnBackground(btn, false);
            try {
                const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                btn.style.transition = reduce ? 'none' : 'background 120ms ease, opacity 120ms ease';
            } catch { btn.style.transition = 'background 120ms ease, opacity 120ms ease'; }

            qbtn.style.position = 'fixed';
            qbtn.style.left = `${Math.max(0, infoRect.right - 30 - 26)}px`;
            qbtn.style.top = `${Math.max(0, Math.round(infoRect.top + Math.max(0, (infoRect.height - 22) / 2)))}px`;
            qbtn.style.width = '22px';
            qbtn.style.height = '22px';
            qbtn.style.zIndex = '2147483647';
            qbtn.style.display = 'none';
            qbtn.style.opacity = '0';
            qbtn.style.pointerEvents = 'none';
            qbtn.style.lineHeight = '0';
            qbtn.style.borderRadius = '6px';
            qbtn.style.alignItems = 'center';
            (qbtn.style as any).justifyItems = 'center';
            qbtn.style.justifyContent = 'center';
            qbtn.style.color = getComputedStyle(callout).color || 'var(--b3-theme-on-background)';
            qbtn.style.border = 'none';
            qbtn.style.boxShadow = 'none';
            this.setBtnBackground(qbtn, false);
            try {
                const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                qbtn.style.transition = reduce ? 'none' : 'background 120ms ease, opacity 120ms ease';
            } catch { qbtn.style.transition = 'background 120ms ease, opacity 120ms ease'; }

            // 离屏可见性观察（不可见时自动隐藏）
            this.ensureVisibilityObserver(nodeId, anchorInit, btn);

            if (!this.overlayBoundCallouts.has(owner)) {
                this.overlayBoundCallouts.add(owner);
                owner.addEventListener('pointerenter', (_ev: PointerEvent) => {
                    const state = this.ensureOverlayState(nodeId);
                    state.overCallout = true;
                    if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
                    const calloutNow = (owner.classList.contains('callout') ? owner : (owner.querySelector('.callout') as HTMLElement | null)) as HTMLElement | null;
                    const infoNow = calloutNow?.querySelector('.callout-info') as HTMLElement | null;
                    const anchor = (infoNow || calloutNow || owner) as HTMLElement;
                    this.schedulePosition(nodeId, anchor, btn);
                    this.scheduleCardPosition(nodeId, anchor, qbtn);
                    this.ensureVisibilityObserver(nodeId, anchor, btn);
                    // 只显示当前这一个覆盖按钮
                    this.hideAllOverlaysExcept(nodeId);
                    const foldedNowX = owner.getAttribute('fold') === '1';
                    this.setBtnVisible(btn, !foldedNowX);
                    this.setBtnVisible(qbtn, !foldedNowX);
                }, true);
                // 根据指针位置动态判定“靠近右上角”
                owner.addEventListener('pointermove', (ev: PointerEvent) => {
                    const state = this.ensureOverlayState(nodeId);
                    const calloutNow = (owner.classList.contains('callout') ? owner : (owner.querySelector('.callout') as HTMLElement | null)) as HTMLElement | null;
                    const infoNow = calloutNow?.querySelector('.callout-info') as HTMLElement | null;
                    const anchor = (infoNow || calloutNow || owner) as HTMLElement;
                    this.schedulePosition(nodeId, anchor, btn);
                    this.scheduleCardPosition(nodeId, anchor, qbtn);
                    this.ensureVisibilityObserver(nodeId, anchor, btn);
                    // 在 callout 内移动：始终保持可见，取消隐藏计时
                    if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
                    const foldedNowY = owner.getAttribute('fold') === '1';
                    this.setBtnVisible(btn, !foldedNowY);
                    this.setBtnVisible(qbtn, !foldedNowY);
                    // 保证同一时间只显示一个
                    this.hideAllOverlaysExcept(nodeId);
                    // 仅用于视觉强调：热区内加深背景，非热区恢复
                    this.setBtnBackground(btn, this.isInHotZone((calloutNow || owner) as HTMLElement, anchor, ev.clientX, ev.clientY));
                    this.setBtnBackground(qbtn, this.isInHotZone((calloutNow || owner) as HTMLElement, anchor, ev.clientX, ev.clientY));
                }, true);
                owner.addEventListener('pointerleave', (ev: PointerEvent) => {
                    const state = this.ensureOverlayState(nodeId);
                    state.overCallout = false;
                    // 若鼠标已处于按钮区域，不隐藏
                    const bx = ev.clientX, by = ev.clientY;
                    const br = btn.getBoundingClientRect();
                    const qr = qbtn.getBoundingClientRect();
                    const margin = 6;
                    const inBtn = bx >= br.left - margin && bx <= br.right + margin && by >= br.top - margin && by <= br.bottom + margin;
                    const inQ = bx >= qr.left - margin && bx <= qr.right + margin && by >= qr.top - margin && by <= qr.bottom + margin;
                    if (inBtn || inQ) {
                        state.overBtn = true;
                        this.setBtnVisible(btn, true);
                        this.setBtnVisible(qbtn, true);
                        return;
                    }
                    const inGrace = !!(state.graceUntil && Date.now() < state.graceUntil);
                    let foldedNow = false;
                    try {
                        const ownerNow = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                        foldedNow = !!(ownerNow && ownerNow.getAttribute('fold') === '1');
                    } catch {}
                    if (!state.overBtn && !inGrace && !foldedNow) {
                        this.setBtnVisible(btn, false);
                        this.setBtnVisible(qbtn, false);
                        state.hideTimer = null;
                    }
                }, true);
            }

            // 确保折叠态下始终有内嵌按钮贴合右上角
            let inlineBtn = callout.querySelector('.callout-fold-toggle:not([data-overlay="1"])') as HTMLButtonElement | null;
            if (!inlineBtn) {
                inlineBtn = document.createElement('button');
                inlineBtn.className = 'callout-fold-toggle';
                inlineBtn.type = 'button';
                inlineBtn.setAttribute('aria-label', '折叠/展开');
                inlineBtn.setAttribute('title', '折叠/展开');
                inlineBtn.setAttribute('contenteditable', 'false');
                inlineBtn.setAttribute('draggable', 'false');
                inlineBtn.setAttribute('spellcheck', 'false');
                try { (inlineBtn as any).tabIndex = -1; } catch {}
                callout.appendChild(inlineBtn);
                inlineBtn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inlineBtn!.getAttribute('data-busy') === '1') return;
                    inlineBtn!.setAttribute('data-busy', '1');
                    try {
                        const root = (callout.closest('.protyle-wysiwyg') as HTMLElement | null) || document;
                        const ownerNow = root.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                        const foldedNow3 = !!(ownerNow && ownerNow.getAttribute('fold') === '1');
                        if (foldedNow3) {
                            await unfoldBlock(nodeId as any);
                        } else {
                            await foldBlock(nodeId as any);
                        }
                    } catch {}
                    inlineBtn!.removeAttribute('data-busy');
                };
            }
            inlineBtn.setAttribute('data-folded', isFolded ? '1' : '0');
            if ((inlineBtn.innerHTML || '').trim() !== desired) {
                inlineBtn.innerHTML = desired;
                const svgEl2 = inlineBtn.querySelector('svg') as SVGElement | null;
                if (svgEl2) {
                    (svgEl2.style as any).width = '12px';
                    (svgEl2.style as any).height = '12px';
                    (svgEl2.style as any).display = 'block';
                }
            }
            inlineBtn.style.display = 'grid';
            if (isFolded) {
                this.setBtnVisible(btn, false);
                this.setBtnVisible(qbtn, false);
            }

            let inlineQuick = callout.querySelector('.callout-quickcard-toggle:not([data-overlay="1"])') as HTMLButtonElement | null;
            if (!inlineQuick) {
                inlineQuick = document.createElement('button');
                inlineQuick.className = 'callout-quickcard-toggle';
                inlineQuick.type = 'button';
                inlineQuick.setAttribute('aria-label', '快速制卡');
                inlineQuick.setAttribute('title', '快速制卡');
                inlineQuick.setAttribute('contenteditable', 'false');
                inlineQuick.setAttribute('draggable', 'false');
                inlineQuick.setAttribute('spellcheck', 'false');
                try { (inlineQuick as any).tabIndex = -1; } catch {}
                callout.appendChild(inlineQuick);
                inlineQuick.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inlineQuick!.getAttribute('data-busy') === '1') return;
                    inlineQuick!.setAttribute('data-busy', '1');
                    try {
                        const on = await this.toggleQuickCard(nodeId);
                        const starOn = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>';
                        const starOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.834 6.631 7.166.593-5.44 4.707 1.64 7.069L12 17.27 5.8 21 7.44 13.93 2 9.224l7.166-.593L12 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                        inlineQuick!.innerHTML = on ? starOn : starOff;
                        inlineQuick!.setAttribute('data-on', on ? '1' : '0');
                    } catch {}
                    inlineQuick!.removeAttribute('data-busy');
                };
            }
            const quickOn2 = this.getQuickCardState(nodeId);
            const starOn2 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>';
            const starOff2 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.834 6.631 7.166.593-5.44 4.707 1.64 7.069L12 17.27 5.8 21 7.44 13.93 2 9.224l7.166-.593L12 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const desiredQ2 = quickOn2 ? starOn2 : starOff2;
            if ((inlineQuick.innerHTML || '').trim() !== desiredQ2) {
                inlineQuick.innerHTML = desiredQ2;
                const svgElQ2 = inlineQuick.querySelector('svg') as SVGElement | null;
                if (svgElQ2) {
                    (svgElQ2.style as any).width = '12px';
                    (svgElQ2.style as any).height = '12px';
                    (svgElQ2.style as any).display = 'block';
                }
            }
            inlineQuick.style.display = 'grid';

            // 清理历史遗留：正文中被注入并持久化的 HTMLBlock（包含 callout-fold-toggle）
            const htmlBlocks = callout.querySelectorAll('.render-node[data-type="NodeHTMLBlock"]') as NodeListOf<HTMLElement>;
            htmlBlocks.forEach(async (blockEl) => {
                try {
                    const placeholder = blockEl.querySelector('protyle-html') as HTMLElement | null;
                    const raw = placeholder?.getAttribute('data-content') || '';
                    if (raw.includes('callout-fold-toggle') || raw.includes('callout-quickcard-toggle')) {
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
                this.setBtnBackground(btn, true);
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
                this.setBtnVisible(btn, true);
            }, true);
            btn.addEventListener('pointerleave', () => {
                const state = this.ensureOverlayState(nodeId);
                state.overBtn = false;
                this.setBtnBackground(btn, false);
                const inGrace = !!(state.graceUntil && Date.now() < state.graceUntil);
                const foldedNow = btn.getAttribute('data-folded') === '1';
                if (!state.overCallout && !inGrace && !foldedNow) {
                    this.setBtnVisible(btn, false);
                    state.hideTimer = null;
                }
            }, true);
        }
        return btn;
    }

    private getOrCreateQuickButton(nodeId: string): HTMLButtonElement {
        let btn = this.overlayCardButtons.get(nodeId) as HTMLButtonElement | undefined;
        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'callout-quickcard-toggle';
            btn.type = 'button';
            btn.setAttribute('aria-label', '快速制卡');
            btn.setAttribute('title', '快速制卡');
            btn.setAttribute('data-overlay', '1');
            document.body.appendChild(btn);
            this.overlayCardButtons.set(nodeId, btn);
        }
        if (!btn.getAttribute('data-hover-bound')) {
            btn.setAttribute('data-hover-bound', '1');
            btn.addEventListener('pointerenter', () => {
                const state = this.ensureOverlayState(nodeId);
                state.overBtn = true;
                if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
                this.setBtnBackground(btn!, true);
                const owner = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                const callout = owner?.classList?.contains('callout') ? owner : owner?.querySelector?.('.callout');
                if (callout) {
                    const info = (callout as HTMLElement).querySelector('.callout-info') as HTMLElement | null;
                    const r = (info || callout as HTMLElement).getBoundingClientRect();
                    btn!.style.left = `${Math.max(0, r.right - 30 - 26)}px`;
                    btn!.style.top = `${Math.max(0, Math.round(r.top + Math.max(0, (r.height - 22) / 2)))}px`;
                }
                this.hideAllOverlaysExcept(nodeId);
                this.setBtnVisible(btn!, true);
            }, true);
            btn.addEventListener('pointerleave', () => {
                const state = this.ensureOverlayState(nodeId);
                state.overBtn = false;
                this.setBtnBackground(btn!, false);
                const inGrace = !!(state.graceUntil && Date.now() < state.graceUntil);
                const owner = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                let foldedNow = false;
                try { foldedNow = !!(owner && owner.getAttribute('fold') === '1'); } catch {}
                if (!state.overCallout && !inGrace && !foldedNow) {
                    this.setBtnVisible(btn!, false);
                    state.hideTimer = null;
                }
            }, true);
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (btn!.getAttribute('data-busy') === '1') return;
                btn!.setAttribute('data-busy', '1');
                try {
                    const st = this.ensureOverlayState(nodeId);
                    st.graceUntil = Date.now() + 900;
                    const on = await this.toggleQuickCard(nodeId);
                    const starOn = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>';
                    const starOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.834 6.631 7.166.593-5.44 4.707 1.64 7.069L12 17.27 5.8 21 7.44 13.93 2 9.224l7.166-.593L12 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    btn!.innerHTML = on ? starOn : starOff;
                    btn!.setAttribute('data-on', on ? '1' : '0');
                    const owner = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                    const base = owner?.classList?.contains('callout') ? owner : owner?.querySelector?.('.callout');
                    const anchor = (base as HTMLElement) || document.body;
                    if (anchor) {
                        this.scheduleCardPosition(nodeId, anchor as HTMLElement, btn!);
                        this.ensureVisibilityObserver(nodeId, anchor as HTMLElement, btn!);
                    }
                    this.hideAllOverlaysExcept(nodeId);
                    this.setBtnVisible(btn!, true);
                    const foldBtn = this.overlayButtons.get(nodeId);
                    if (foldBtn) this.setBtnVisible(foldBtn, true);
                } catch {}
                btn!.removeAttribute('data-busy');
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

    private scheduleCardPosition(nodeId: string, info: HTMLElement, btn: HTMLButtonElement) {
        try {
            const r = info.getBoundingClientRect();
            const l = Math.max(0, r.right - 30 - 26);
            const t = Math.max(0, Math.round(r.top + Math.max(0, (r.height - 22) / 2)));
            let st = this.overlayCardPositions.get(nodeId);
            if (!st) {
                st = { l, t, raf: null };
                this.overlayCardPositions.set(nodeId, st);
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
            const qbtn = this.overlayCardButtons.get(nodeId);
            if (qbtn) {
                qbtn.remove();
                this.overlayCardButtons.delete(nodeId);
            }
            this.overlayStates.delete(nodeId);
            const obs = this.overlayObservers.get(nodeId);
            if (obs) { try { obs.disconnect(); } catch {} this.overlayObservers.delete(nodeId); }
            const pos = this.overlayPositions.get(nodeId);
            if (pos && pos.raf != null) {
                try { cancelAnimationFrame(pos.raf); } catch {}
            }
            this.overlayPositions.delete(nodeId);
            const pos2 = this.overlayCardPositions.get(nodeId);
            if (pos2 && pos2.raf != null) {
                try { cancelAnimationFrame(pos2.raf); } catch {}
            }
            this.overlayCardPositions.delete(nodeId);
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
            st = { overCallout: false, overBtn: false, hideTimer: null, graceUntil: null };
            this.overlayStates.set(nodeId, st);
        }
        return st;
    }

    // 同时只显示一个覆盖按钮：隐藏其他所有 overlay 按钮
    private hideAllOverlaysExcept(currentId: string) {
        try {
            this.overlayButtons.forEach((button, key) => {
                if (key !== currentId) {
                    this.setBtnVisible(button, false);
                    const st = this.overlayStates.get(key);
                    if (st) {
                        st.overBtn = false;
                        st.overCallout = false;
                        if (st.hideTimer) { clearTimeout(st.hideTimer); st.hideTimer = null; }
                    }
                }
            });
            this.overlayCardButtons.forEach((button, key) => {
                if (key !== currentId) {
                    this.setBtnVisible(button, false);
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

    private setBtnVisible(btn: HTMLButtonElement, visible: boolean) {
        try {
            const cur = btn.getAttribute('data-visible') === '1';
            if (cur === visible) return;
            if (visible) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.setAttribute('data-visible', '1');
            } else {
                btn.style.opacity = '0';
                btn.style.pointerEvents = 'none';
                btn.setAttribute('data-visible', '0');
            }
        } catch {}
    }

    private setBtnBackground(btn: HTMLButtonElement, strong: boolean) {
        try {
            const target = strong ? '26' : '16';
            if (btn.getAttribute('data-bg') === target) return;
            // fallback first for browsers without color-mix
            btn.style.background = strong ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.10)';
            (btn.style as any).background = `color-mix(in srgb, currentColor ${target}%, transparent)`;
            btn.setAttribute('data-bg', target);
        } catch {}
    }

    private ensureVisibilityObserver(nodeId: string, info: HTMLElement, btn: HTMLButtonElement) {
        try {
            const prev = this.overlayObservers.get(nodeId);
            if (prev) {
                try { prev.disconnect(); } catch {}
                this.overlayObservers.delete(nodeId);
            }
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.target !== info) return;
                    if (!entry.isIntersecting) {
                        const st = this.overlayStates.get(nodeId);
                        const inGrace = !!(st && st.graceUntil && Date.now() < st.graceUntil);
                        let foldedNow = false;
                        try {
                            const ownerNow = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
                            foldedNow = !!(ownerNow && ownerNow.getAttribute('fold') === '1');
                        } catch {}
                        if (!st || (!st.overBtn && !st.overCallout && !inGrace && !foldedNow)) {
                            this.setBtnVisible(btn, false);
                            const qbtn = this.overlayCardButtons.get(nodeId);
                            if (qbtn) this.setBtnVisible(qbtn, false);
                        }
                    }
                });
            }, { root: null, threshold: 0 });
            io.observe(info);
            this.overlayObservers.set(nodeId, io);
        } catch {}
    }

    private enqueueProcess(el: HTMLElement) {
        try {
            this.processQueue.add(el);
            if (this.processQueueRaf != null) return;
            this.processQueueRaf = requestAnimationFrame(() => {
                try {
                    const list = Array.from(this.processQueue);
                    this.processQueue.clear();
                    list.forEach(node => {
                        try { this.processBlockquote(node); } catch {}
                    });
                } finally {
                    this.processQueueRaf = null;
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
            this.overlayCardButtons.forEach((btn) => btn.remove());
            this.overlayCardButtons.clear();
            this.overlayStates.clear();
            this.overlayPositions.clear();
            this.overlayCardPositions.clear();
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
                                if (bq) this.enqueueProcess(bq);
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
                                if (nid) {
                                    // 仅当文档中确实不存在该 nodeId 时才移除 overlay，避免折叠/缩进替换过程中的短暂移除导致按钮丢失
                                    const stillExists = document.querySelector(`[data-node-id="${nid}"]`);
                                    if (!stillExists) this.removeOverlayForNode(nid);
                                }
                            });
                        }
                    });
                }

                // 处理属性变化（用于当原生完成解析并设置结构时我们兜底图标）
                if (mutation.type === 'attributes' && mutation.target) {
                    const element = mutation.target as HTMLElement;
                    if (element.classList?.contains('bq') || element.classList?.contains('callout')) {
                        const target = element.classList.contains('bq') ? element : element;
                        this.enqueueProcess(target);
                        try {
                            const owner = (target.getAttribute('data-node-id') ? target : (target.closest('.bq[data-node-id], .callout[data-node-id]') as HTMLElement | null));
                            const nodeId = owner?.getAttribute('data-node-id') || null;
                            if (nodeId) {
                                const btn = this.overlayButtons.get(nodeId);
                                if (btn) {
                                    const st = this.ensureOverlayState(nodeId);
                                    st.graceUntil = Date.now() + 900;
                                    const calloutNow = owner.classList.contains('callout') ? owner : (owner.querySelector('.callout') as HTMLElement | null);
                                    const infoNow = calloutNow?.querySelector('.callout-info') as HTMLElement | null;
                                    const anchor = (infoNow || calloutNow || owner) as HTMLElement;
                                    this.schedulePosition(nodeId, anchor, btn);
                                    this.ensureVisibilityObserver(nodeId, anchor, btn);
                                    this.setBtnVisible(btn, true);
                                    try {
                                        const foldedNow2 = owner.getAttribute('fold') === '1';
                                        btn.setAttribute('data-folded', foldedNow2 ? '1' : '0');
                                        const svgExpand = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                                        const svgCollapse = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                                        const desired = foldedNow2 ? svgExpand : svgCollapse;
                                        if ((btn.innerHTML || '').trim() !== desired) {
                                            btn.innerHTML = desired;
                                            const svgEl = btn.querySelector('svg') as SVGElement | null;
                                            if (svgEl) {
                                                (svgEl.style as any).width = '12px';
                                                (svgEl.style as any).height = '12px';
                                                (svgEl.style as any).display = 'block';
                                            }
                                        }
                                    } catch {}
                                }
                            }
                        } catch {}
                    }
                }

                // 处理文本变化：在编辑过程中同步自定义子类型
                if (mutation.type === 'characterData' && mutation.target) {
                    const node = mutation.target as Node;
                    let el: HTMLElement | null = (node as any).parentElement || null;
                    while (el && el !== document.body) {
                        if (el.classList?.contains('bq')) {
                            this.enqueueProcess(el);
                            break;
                        }
                        if (el.classList?.contains('callout')) {
                            this.enqueueProcess(el);
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

    public async addQuickCards(blockIDs: string[]): Promise<void> {
        if (!blockIDs || blockIDs.length === 0) return;
        try {
            await request('/api/riff/addRiffCards', { deckID: this.QUICK_DECK_ID, blockIDs });
        } catch {}
    }

    public async removeQuickCards(blockIDs: string[]): Promise<void> {
        if (!blockIDs || blockIDs.length === 0) return;
        try {
            await request('/api/riff/removeRiffCards', { deckID: this.QUICK_DECK_ID, blockIDs });
        } catch {}
    }

    public getQuickCardState(nodeId: string): boolean | null {
        try {
            const el = document.querySelector(`.protyle-wysiwyg [data-node-id="${nodeId}"]`) as HTMLElement | null;
            if (!el) return null;
            const decks = el.getAttribute(this.CUSTOM_RIFF_DECKS) || '';
            return decks.indexOf(this.QUICK_DECK_ID) !== -1;
        } catch { return null; }
    }

    public async toggleQuickCard(nodeId: string): Promise<boolean> {
        const on = this.getQuickCardState(nodeId);
        try {
            if (on) {
                await this.removeQuickCards([nodeId]);
                return false;
            } else {
                await this.addQuickCards([nodeId]);
                return true;
            }
        } catch {
            return !!on;
        }
    }
}

