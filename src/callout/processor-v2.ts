import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig, FIXED_CALLOUT_SVG } from './types';
import { appendBlock, deleteBlock } from '../api';
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
    private processQueue: Set<HTMLElement> = new Set();
    private processQueueRaf: number | null = null;
    
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

    private cleanupLegacyButtons(blockquote: HTMLElement) {
        try {
            blockquote.querySelectorAll('.callout-fold-toggle, .callout-quickcard-toggle').forEach((el) => {
                try { (el as HTMLElement).remove(); } catch {}
            });

            const htmlBlocks = blockquote.querySelectorAll('.render-node[data-type="NodeHTMLBlock"]') as NodeListOf<HTMLElement>;
            htmlBlocks.forEach(async (blockEl) => {
                try {
                    const placeholder = blockEl.querySelector('protyle-html') as HTMLElement | null;
                    const raw = placeholder?.getAttribute('data-content') || '';
                    if (raw.includes('callout-fold-toggle') || raw.includes('callout-quickcard-toggle')) {
                        const badId = blockEl.getAttribute('data-node-id');
                        blockEl.remove();
                        if (badId) await deleteBlock(badId as any);
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

    // 重建别名索引（type、displayName）
    private rebuildAliasIndex() {
        const idx = new Map<string, CalloutTypeConfig>();
        this.calloutTypes.forEach(cfg => {
            idx.set(this.normalizeAlias(cfg.type), cfg);
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

                // 处理属性变化（用于当原生完成解析并设置结构时我们兜底图标）
                if (mutation.type === 'attributes' && mutation.target) {
                    const element = mutation.target as HTMLElement;
                    if (element.classList?.contains('bq') || element.classList?.contains('callout')) {
                        const target = element.classList.contains('bq') ? element : element;
                        this.enqueueProcess(target);
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
            this.cleanupLegacyButtons(blockquote);
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

