import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig, FIXED_CALLOUT_SVG } from './types';
import { appendBlock } from '../api';
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
    }

    // 仅负责图标兜底：处理原生 .callout 结构，必要时创建并填充图标
    private ensureNativeIcon(blockquote: HTMLElement) {
        try {
            const callout = blockquote.classList.contains('callout')
                ? blockquote
                : (blockquote.querySelector('.callout') as HTMLElement | null);
            if (!callout) return;

            const info = callout.querySelector('.callout-info') as HTMLElement | null;
            if (!info) return;

            let icon = info.querySelector('.callout-icon') as HTMLElement | null;
            if (!icon) {
                icon = document.createElement('span');
                icon.className = 'callout-icon';
                info.insertBefore(icon, info.firstChild);
            }
            if (!icon.innerHTML || icon.innerHTML.trim() === '') {
                icon.innerHTML = FIXED_CALLOUT_SVG;
            }
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
                                if (bq) this.processBlockquote(bq);
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
                        const bq = element.classList.contains('bq') ? element : (element.closest('.bq[data-node-id]') as HTMLElement | null);
                        if (bq) this.processBlockquote(bq);
                    }
                }

                // 处理文本变化：在编辑过程中同步自定义子类型
                if (mutation.type === 'characterData' && mutation.target) {
                    const node = mutation.target as Node;
                    let el: HTMLElement | null = (node as any).parentElement || null;
                    while (el && el !== document.body) {
                        if (el.classList?.contains('bq') || el.classList?.contains('callout')) {
                            const bq = el.classList.contains('bq') ? el : (el.closest('.bq[data-node-id]') as HTMLElement | null);
                            if (bq) this.processBlockquote(bq);
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
            characterData: true
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

