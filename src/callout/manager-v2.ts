import { CalloutProcessorV2 } from './processor-v2';
import { CalloutMenuV2 } from './menu-v2';
import { generateCalloutStylesV2, updateCalloutStyles } from './styles-v2';
import type { CalloutConfig } from './config';
import { ConfigManager } from './config';
import { logger } from '../libs/logger';

/**
 * CalloutManagerV2 - 全新的 Callout 管理器
 * 
 * 基于块属性的架构，更简洁、更可靠
 */
export class CalloutManagerV2 {
    private processor: CalloutProcessorV2;
    private menu: CalloutMenuV2;
    private styleElement: HTMLStyleElement | null = null;
    private currentConfig: CalloutConfig | null = null;
    private plugin: any;
    private awaitingBQFromGT: boolean = false;
    
    // 事件监听器
    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
    private clickHandler: ((e: MouseEvent) => void) | null = null;
    
    // 拖拽和侧边栏按钮（可选功能，暂时保留接口）
    private gutterButtons: Map<string, HTMLElement> = new Map();

    constructor(plugin?: any) {
        this.plugin = plugin;
        this.processor = new CalloutProcessorV2();
        this.menu = new CalloutMenuV2(this.processor, this.plugin);
        
        // 暴露到全局（用于调试和其他模块访问）
        (window as any).siyuanCalloutProcessorV2 = this.processor;
        (window as any).siyuanCalloutMenuV2 = this.menu;
    }

    private getEmptyEditableAtCaret(): HTMLElement | null {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
        let node: HTMLElement | null = sel.anchorNode as any;
        if (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentElement;
        let editable: HTMLElement | null = node;
        while (editable && !(editable instanceof HTMLElement && editable.getAttribute('contenteditable') === 'true')) {
            editable = editable.parentElement;
        }
        if (!editable) return null;
        const text = editable.textContent?.replace(/\u200b/g, '').trim() || '';
        return text === '' ? editable : null;
    }
    private getGTContext(): { blockquote: HTMLElement, editable: HTMLElement } | null {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
        // 找到当前光标所在的可编辑容器
        let node: HTMLElement | null = sel.anchorNode as any;
        if (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentElement;
        let editable: HTMLElement | null = node;
        while (editable && !(editable instanceof HTMLElement && editable.getAttribute('contenteditable') === 'true')) {
            editable = editable.parentElement;
        }
        if (!editable) return null;
        const text = editable.textContent?.replace(/\u200b/g, '').trim() || '';
        if (text !== '') return null;
        // 必须在 blockquote（.bq）内，且不是原生 .callout
        let ancestor: HTMLElement | null = editable.parentElement;
        let blockquote: HTMLElement | null = null;
        while (ancestor) {
            if (ancestor.classList?.contains('callout')) return null;
            if (ancestor.classList?.contains('bq')) { blockquote = ancestor; break; }
            ancestor = ancestor.parentElement;
        }
        if (!blockquote) return null;
        return { blockquote, editable };
    }

    /**
     * 更新配置
     */
    updateConfig(config: CalloutConfig) {
        this.currentConfig = config;
        const availableTypes = ConfigManager.getAvailableTypes(config);
        
        this.processor.updateTypes(availableTypes);
        this.menu.updateTypes(availableTypes);
        this.menu.updateGridColumns(config.gridColumns || 3);
        
        // 更新样式
        this.updateStyles();
        
        logger.log('[ManagerV2] 配置已更新');
    }

    /**
     * 初始化
     */
    async initialize() {
        logger.log('[ManagerV2] 开始初始化');
        
        // 加载配置
        if (this.plugin) {
            this.currentConfig = await ConfigManager.load(this.plugin);
            const availableTypes = ConfigManager.getAvailableTypes(this.currentConfig);
            
            this.processor.updateTypes(availableTypes);
            this.menu.updateTypes(availableTypes);
            this.menu.updateGridColumns(this.currentConfig.gridColumns || 3);
        }

        // 注入样式
        this.injectStyles();

        // 初始化处理器
        this.processor.initialize();

        // 仅当由 '>' 空行触发时才自动显示菜单
        this.processor.onNewBlockquoteCreated = (blockquote: HTMLElement) => {
            if (this.awaitingBQFromGT) {
                this.awaitingBQFromGT = false;
                this.menu.show(blockquote, false);
                logger.log('[ManagerV2] 由 ">" 创建的 blockquote，自动显示菜单');
            }
        };

        // 设置事件监听
        this.setupEventListeners();
        
        // 设置侧边栏按钮
        this.setupGutterButtons();

        logger.log('[ManagerV2] 初始化完成');
    }

    /**
     * 注入样式
     */
    private injectStyles() {
        if (this.styleElement) {
            this.styleElement.remove();
        }

        const types = this.currentConfig ? ConfigManager.getAllTypes(this.currentConfig) : undefined;
        const themeId = this.currentConfig?.themeId || 'craft';
        const themeOverrides = this.currentConfig?.themeOverrides;

        this.styleElement = document.createElement('style');
        this.styleElement.id = 'custom-callout-styles-v2';
        this.styleElement.textContent = generateCalloutStylesV2(types, themeId, themeOverrides);
        document.head.appendChild(this.styleElement);
        
        logger.log('[ManagerV2] 样式已注入');
    }

    /**
     * 更新样式
     */
    private updateStyles() {
        if (!this.currentConfig) return;

        const types = ConfigManager.getAllTypes(this.currentConfig);
        const themeId = this.currentConfig.themeId || 'craft';
        const themeOverrides = this.currentConfig.themeOverrides;

        updateCalloutStyles('custom-callout-styles-v2', types, themeId, themeOverrides);
        
        logger.log('[ManagerV2] 样式已更新');
    }

    /**
     * 刷新（与 V1 接口兼容）
     */
    public refresh() {
        this.updateStyles();
    }

    /**
     * 设置事件监听
     */
    private setupEventListeners() {
        // 键盘快捷键
        this.keydownHandler = (e: KeyboardEvent) => {

            if (e.key === '>' || e.key === '>' || e.key === '》') { // Support both English and Chinese '>'
                const ctx = this.getGTContext();
                if (ctx) {
                    // 已在空的 blockquote 首行：直接拦截并弹出
                    e.preventDefault();
                    this.menu.show(ctx.blockquote, false);
                } else {
                    // 若当前为空行且不在 blockquote/callout 内：放行 '>'，等待原生创建 blockquote 后由回调弹出
                    const emptyEditable = this.getEmptyEditableAtCaret();
                    if (emptyEditable) {
                        // 确保不在 callout 或已有 blockquote 中
                        let anc: HTMLElement | null = emptyEditable.parentElement;
                        let inBQ = false, inCallout = false;
                        while (anc) {
                            if (anc.classList?.contains('callout')) { inCallout = true; break; }
                            if (anc.classList?.contains('bq')) { inBQ = true; break; }
                            anc = anc.parentElement;
                        }
                        if (!inCallout && !inBQ) {
                            this.awaitingBQFromGT = true;
                        }
                    }
                }
            }
        };

        // 双击 blockquote 边框打开菜单
        this.clickHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            // 检查是否双击了 blockquote
            if (target.classList.contains('bq') || target.closest('.bq')) {
                const blockquote = target.classList.contains('bq') 
                    ? target 
                    : target.closest('.bq') as HTMLElement;
                
                if (blockquote && e.detail === 2) { // 双击
                    this.handleDoubleClick(blockquote);
                }
            }
        };

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('click', this.clickHandler);
        
        logger.log('[ManagerV2] 事件监听已设置');
    }

    /**
     * 设置侧边栏按钮
     */
    private setupGutterButtons() {
        // 使用 MutationObserver 监听侧边栏按钮的添加
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        
                        // 查找 blockquote 的侧边栏按钮
                        if (element.classList?.contains('protyle-gutters')) {
                            this.processGutterButtons(element);
                        }
                        
                        const gutters = element.querySelectorAll?.('.protyle-gutters');
                        gutters?.forEach(gutter => {
                            this.processGutterButtons(gutter as HTMLElement);
                        });
                    }
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 处理侧边栏按钮
     */
    private processGutterButtons(gutterContainer: HTMLElement) {
        const buttons = gutterContainer.querySelectorAll('button[data-type="NodeBlockquote"]');
        
        buttons.forEach(button => {
            const btn = button as HTMLElement;
            const nodeId = btn.getAttribute('data-node-id');
            
            if (!nodeId || this.gutterButtons.has(nodeId)) {
                return;
            }

            // 添加点击事件
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const blockquote = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
                if (!blockquote) return;

                const isCallout = await this.processor.isCallout(blockquote);
                
                if (isCallout) {
                    // 如果已经是 callout，打开编辑菜单
                    this.menu.show(blockquote, true);
                } else {
                    // 如果不是 callout，打开创建菜单
                    this.menu.show(blockquote, false);
                }
            });

            this.gutterButtons.set(nodeId, btn);
        });
    }

    /**
     * 处理快速创建（快捷键）
     */
    private async handleQuickCreate() {
        // 获取当前选中的块
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // 查找最近的 blockquote
        let element = container.nodeType === Node.ELEMENT_NODE 
            ? container as HTMLElement 
            : container.parentElement;
            
        while (element && !element.classList.contains('bq')) {
            element = element.parentElement;
        }

        if (!element) return;

        const blockquote = element as HTMLElement;
        const isCallout = await this.processor.isCallout(blockquote);
        
        this.menu.show(blockquote, isCallout);
        
        logger.log('[ManagerV2] 快速创建菜单已打开');
    }

    /**
     * 处理双击
     */
    private async handleDoubleClick(blockquote: HTMLElement) {
        const isCallout = await this.processor.isCallout(blockquote);
        this.menu.show(blockquote, isCallout);
        
        logger.log('[ManagerV2] 双击菜单已打开');
    }

    /**
     * 销毁
     */
    destroy() {
        logger.log('[ManagerV2] 开始销毁');
        
        // 移除事件监听
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }

        // 销毁处理器和菜单
        this.processor.destroy();
        this.menu.destroy();

        // 移除样式
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }

        // 清理侧边栏按钮
        this.gutterButtons.clear();

        // 清理全局引用
        delete (window as any).siyuanCalloutProcessorV2;
        delete (window as any).siyuanCalloutMenuV2;

        logger.log('[ManagerV2] 销毁完成');
    }

    /**
     * 获取处理器（用于外部访问）
     */
    getProcessor(): CalloutProcessorV2 {
        return this.processor;
    }

    /**
     * 获取菜单（用于外部访问）
     */
    getMenu(): CalloutMenuV2 {
        return this.menu;
    }

    /**
     * 刷新样式（配置变化后调用）
     */
    async refreshStyles() {
        this.updateStyles();
        logger.log('[ManagerV2] 样式已刷新');
    }

    /**
     * 重新加载配置
     */
    async reloadConfig() {
        if (this.plugin) {
            this.currentConfig = await ConfigManager.load(this.plugin);
            this.updateConfig(this.currentConfig);
            logger.log('[ManagerV2] 配置已重新加载');
        }
    }
}

