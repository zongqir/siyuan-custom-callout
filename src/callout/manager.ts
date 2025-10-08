import { CalloutProcessor } from './processor';
import { CalloutMenu } from './menu';
import { CalloutDragResizer } from './drag-resize';
import { CalloutGutterHighlight } from './proxy-button';
import { generateCalloutStyles } from './styles';
import type { CalloutConfig } from './config';
import { ConfigManager } from './config';
import { logger } from '../libs/logger';

/**
 * Callout功能管理器 - 负责协调所有Callout相关功能
 */
export class CalloutManager {
    private processor: CalloutProcessor;
    private menu: CalloutMenu;
    private dragResizer: CalloutDragResizer | null = null;
    private gutterHighlight: CalloutGutterHighlight | null = null;
    private observer: MutationObserver | null = null;
    private styleElement: HTMLStyleElement | null = null;
    private currentConfig: CalloutConfig | null = null;
    private plugin: any;
    
    // 保存事件监听器引用，以便在销毁时移除
    private inputEventHandler: ((e: Event) => void) | null = null;
    private clickEventHandler: ((e: Event) => void) | null = null;
    private focusinEventHandler: ((e: Event) => void) | null = null;
    private keydownEventHandler: ((e: KeyboardEvent) => void) | null = null;
    private keyupEventHandler: ((e: KeyboardEvent) => void) | null = null;
    private blurEventHandler: ((e: FocusEvent) => void) | null = null;

    constructor(plugin?: any) {
        this.plugin = plugin;
        this.processor = new CalloutProcessor();
        this.menu = new CalloutMenu(this.processor);
    }

    /**
     * 更新配置
     */
    updateConfig(config: CalloutConfig) {
        this.currentConfig = config;
        const availableTypes = ConfigManager.getAvailableTypes(config); // 只使用可用的类型（排除隐藏的）
        this.processor.updateTypes(availableTypes);
        this.menu.updateTypes(availableTypes);
        this.menu.updateGridColumns(config.gridColumns || 3);
    }

    /**
     * 初始化Callout功能
     */
    async initialize() {
        // 加载配置
        if (this.plugin) {
            this.currentConfig = await ConfigManager.load(this.plugin);
            const availableTypes = ConfigManager.getAvailableTypes(this.currentConfig); // 只使用可用的类型（排除隐藏的）
            this.processor.updateTypes(availableTypes);
            this.menu.updateTypes(availableTypes);
            this.menu.updateGridColumns(this.currentConfig.gridColumns || 3);
        }

        // 设置事件监听器（优先设置）
        this.setupEventListeners();

        // 注入样式
        this.injectStyles();

        // 初始化拖拽调整功能
        this.initializeDragResize();

        // 初始化块标高亮功能
        this.initializeGutterHighlight();

        // 处理现有的blockquote
        this.processor.processAllBlockquotes();

        // 设置Observer
        this.setupObserver();
    }

    /**
     * 注入CSS样式
     */
    private injectStyles() {
        if (this.styleElement) {
            this.styleElement.remove();
        }

        // 样式需要包含所有类型（包括隐藏的），因为隐藏的类型可能已经在文档中使用了
        const types = this.currentConfig ? ConfigManager.getAllTypes(this.currentConfig) : undefined;
        const themeId = this.currentConfig?.themeId || 'modern';
        const themeOverrides = this.currentConfig?.themeOverrides;
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'custom-callout-styles';
        this.styleElement.textContent = generateCalloutStyles(types, themeId, themeOverrides);
        document.head.appendChild(this.styleElement);
    }

    /**
     * 设置MutationObserver监听新增的blockquote和节点删除
     */
    private setupObserver() {
        this.observer = new MutationObserver((mutations) => {
            let hasAddedNodes = false;
            // let hasRemovedNodes = false; // 已禁用自动删除空块功能
            
            // 检查是否有节点添加
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    if (mutation.addedNodes.length > 0) {
                        hasAddedNodes = true;
                    }
                    // if (mutation.removedNodes.length > 0) {
                    //     hasRemovedNodes = true;
                    // }
                }
            });

            // 禁用自动删除空块功能，避免误删用户正在操作的块
            // 用户可以通过思源笔记自己的功能来删除空块
            // if (hasRemovedNodes) {
            //     setTimeout(async () => {
            //         await this.processor.scanAndRemoveEmptyBlockquotes();
            //     }, 2000);
            // }

            // 处理新增的节点
            if (!hasAddedNodes) return;
            
            const relevantMutations = mutations.filter(
                mutation => mutation.type === 'childList' && mutation.addedNodes.length > 0
            );

            let newBlockquotes: HTMLElement[] = [];

            relevantMutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;

                        // 检查是否是blockquote
                        if (element.getAttribute?.('data-type') === 'NodeBlockquote' ||
                            element.classList?.contains('bq')) {
                            newBlockquotes.push(element);
                        }

                        // 检查子元素
                        const childBlockquotes = element.querySelectorAll?.(
                            '[data-type="NodeBlockquote"], .bq'
                        );
                        if (childBlockquotes?.length > 0) {
                            newBlockquotes.push(...Array.from(childBlockquotes) as HTMLElement[]);
                        }
                    }
                });
            });

            if (newBlockquotes.length > 0) {
                // 去重
                const uniqueBlockquotes = [...new Set(newBlockquotes)];

                setTimeout(() => {
                    uniqueBlockquotes.forEach(bq => {
                        const nodeId = bq.getAttribute('data-node-id');

                        // 标记为已跟踪
                        if (nodeId) {
                            this.processor.trackBlockQuote(nodeId);
                        }

                        // 不再在Observer中自动显示菜单，避免误触
                        // 只有用户明确操作（点击图标等）时才显示菜单

                        // 处理callout样式
                        this.processor.processBlockquote(bq);
                    });
                }, 50);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }

    /**
     * 查找目标元素相关的引述块（支持主编辑器中的查找）
     */
    private findBlockquoteFromTarget(target: HTMLElement): HTMLElement | null {
        // 首先尝试常规查找
        let blockquote = target.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;
        
        // 如果没找到引述块，检查是否在主编辑器中
        if (!blockquote && target.classList.contains('protyle-wysiwyg')) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                let currentNode = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
                
                while (currentNode && currentNode !== target) {
                    if (currentNode.getAttribute?.('data-type') === 'NodeBlockquote' || currentNode.classList?.contains('bq')) {
                        blockquote = currentNode as HTMLElement;
                        break;
                    }
                    // 检查文本内容是否包含callout命令
                    if (currentNode.textContent?.trim().match(/^\[![^\]]+\]/)) {
                        const parentBlockquote = currentNode.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;
                        if (parentBlockquote) {
                            blockquote = parentBlockquote;
                            break;
                        }
                    }
                    currentNode = currentNode.parentElement;
                }
            }
        }
        
        return blockquote;
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners() {
        // 输入事件监听（防抖）
        let inputTimeout: number;
        // let emptyCheckTimeout: number; // 已禁用自动删除空块功能
        
        this.inputEventHandler = (e) => {
            const target = e.target as HTMLElement;
            if (target.contentEditable === 'true') {
                clearTimeout(inputTimeout);
                const eventType = e.type;
                
                inputTimeout = window.setTimeout(() => {
                    const blockquote = this.findBlockquoteFromTarget(target);
                    if (blockquote) {
                        // 对于删除相关的按键事件，检查是否产生了空引述块
                        if (eventType === 'keyup' && e instanceof KeyboardEvent) {
                            const key = e.key;
                            // 禁用删除键后的自动清理空块，避免误删
                            if (key === 'Delete' || key === 'Backspace') {
                                // clearTimeout(emptyCheckTimeout);
                                // emptyCheckTimeout = window.setTimeout(async () => {
                                //     await this.processor.scanAndRemoveEmptyBlockquotes();
                                // }, 3000);
                                
                                // 删除键不触发callout处理，避免编辑冲突
                                return;
                            }
                        }
                        
                        // 其他情况正常处理
                        this.processor.processBlockquote(blockquote);
                    }
                }, eventType === 'paste' ? 100 : 1500); // 延长到1.5秒，给用户更多编辑时间
            }
        };
        
        // 只监听paste事件，input和keyup不自动触发callout处理
        ['paste'].forEach(eventType => {
            document.addEventListener(eventType, this.inputEventHandler!, true);
        });
        
        // 添加blur事件监听器，在失去焦点时处理callout
        this.blurEventHandler = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.contentEditable === 'true') {
                const blockquote = this.findBlockquoteFromTarget(target);
                if (blockquote) {
                    // 移除编辑状态
                    if (blockquote.hasAttribute('data-editing')) {
                        blockquote.removeAttribute('data-editing');
                    }
                    
                    // 延迟一点处理，确保焦点切换完成
                    setTimeout(() => {
                        logger.log('[Callout Manager] 👋 失去焦点，处理callout');
                        this.processor.processBlockquote(blockquote);
                    }, 100);
                }
            }
        };
        
        document.addEventListener('blur', this.blurEventHandler, true);

        // 专门的keydown监听器，处理回车键触发callout转换
        this.keydownEventHandler = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                logger.log('[Callout Manager] ⌨️ 检测到回车键');
                const target = e.target as HTMLElement;
                logger.log('[Callout Manager] 🎯 目标:', target.tagName, target.contentEditable);
                
                if (target.contentEditable === 'true') {
                    const blockquote = this.findBlockquoteFromTarget(target);
                    logger.log('[Callout Manager] 📦 找到引述块:', !!blockquote);
                    
                    if (blockquote) {
                        // 获取回车前的文本
                        const beforeEnterDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
                        const beforeEnterText = beforeEnterDiv?.textContent?.trim() || '';
                        logger.log('[Callout Manager] 📝 回车前文本:', beforeEnterText);
                        
                        // 延迟处理，确保回车键操作完成
                        setTimeout(() => {
                            // 查找第一个段落（可能包含callout命令）
                            const firstParagraph = blockquote.querySelector('div[data-type="NodeParagraph"]:first-of-type');
                            const titleDiv = firstParagraph?.querySelector('div[contenteditable="true"]') as HTMLElement;
                            const text = titleDiv?.textContent?.trim() || '';
                            
                            logger.log('[Callout Manager] ↵ 回车键触发callout处理');
                            logger.log('[Callout Manager] 🔍 找到第一个段落:', !!firstParagraph);
                            logger.log('[Callout Manager] 📝 当前文本:', text);
                            logger.log('[Callout Manager] 📋 引述块当前属性:', {
                                'custom-callout': blockquote.getAttribute('custom-callout'),
                                'data-node-id': blockquote.getAttribute('data-node-id'),
                                'titleDiv存在': !!titleDiv
                            });
                            
                            const result = this.processor.processBlockquote(blockquote);
                            logger.log('[Callout Manager] ✅ processBlockquote返回值:', result);
                            
                            // 检查处理后的属性
                            logger.log('[Callout Manager] 📋 处理后的属性:', {
                                'custom-callout': blockquote.getAttribute('custom-callout'),
                                'data-callout-title': titleDiv?.getAttribute('data-callout-title'),
                                'data-callout-display-name': titleDiv?.getAttribute('data-callout-display-name')
                            });
                        }, 200); // 增加延迟到200ms
                    } else {
                        logger.log('[Callout Manager] ⚠️ 未找到引述块，无法处理');
                    }
                }
            }
        };
        
        document.addEventListener('keydown', this.keydownEventHandler, true);
        
        // 备用方案：也监听keyup事件，防止keydown被阻止
        this.keyupEventHandler = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const target = e.target as HTMLElement;
                if (target.contentEditable === 'true') {
                    const blockquote = this.findBlockquoteFromTarget(target);
                    
                    if (blockquote) {
                        // 如果有多个段落了，移除编辑状态
                        const paragraphs = blockquote.querySelectorAll('div[data-type="NodeParagraph"]');
                        if (paragraphs.length > 1 && blockquote.hasAttribute('data-editing')) {
                            blockquote.removeAttribute('data-editing');
                        }
                        
                        setTimeout(() => {
                            const titleDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
                            const text = titleDiv?.textContent?.trim() || '';
                            logger.log('[Callout Manager] ↵ keyup备用处理:', text);
                            this.processor.processBlockquote(blockquote);
                        }, 50);
                    }
                }
            }
        };
        
        document.addEventListener('keyup', this.keyupEventHandler, true);

        // 点击callout标题图标区域切换类型
        this.clickEventHandler = (e) => {
            const target = e.target as HTMLElement;

            if (target.contentEditable === 'true' &&
                target.getAttribute('data-callout-title') === 'true') {
                const blockquote = this.findBlockquoteFromTarget(target);

                if (blockquote && blockquote.hasAttribute('custom-callout')) {
                    const rect = target.getBoundingClientRect();
                    const clickX = (e as MouseEvent).clientX - rect.left;

                    // 点击图标区域（0-40px），显示/隐藏切换主题菜单（toggle）
                    if (clickX >= 0 && clickX <= 40) {
                        e.preventDefault();
                        e.stopPropagation();

                        const bqRect = blockquote.getBoundingClientRect();
                        this.menu.showMenu(bqRect.left, bqRect.top, blockquote, true, true); // 最后一个参数为 allowToggle
                    }
                }
            } else {
                // 检查是否点击在callout内部，处理只有标题的情况
                const blockquote = target.closest('[custom-callout]') as HTMLElement;
                if (blockquote && !target.closest('[contenteditable="true"]')) {
                    
                    // 检查是否只有一个段落（只有标题）
                    const paragraphs = blockquote.querySelectorAll('div[data-type="NodeParagraph"]');
                    if (paragraphs.length === 1) {
                        // 只有标题，临时显示编辑模式
                        const titleDiv = blockquote.querySelector('[data-callout-title="true"]') as HTMLElement;
                        if (titleDiv) {
                            e.preventDefault();
                            
                            // 临时移除callout样式，让用户可以编辑
                            blockquote.setAttribute('data-editing', 'true');
                            
                            setTimeout(() => {
                                titleDiv.focus();
                                const range = document.createRange();
                                const selection = window.getSelection();
                                range.selectNodeContents(titleDiv);
                                range.collapse(false);
                                selection?.removeAllRanges();
                                selection?.addRange(range);
                            }, 10);
                        }
                    }
                }
            }
        };
        
        document.addEventListener('click', this.clickEventHandler, true);

        // 焦点事件监听（仅用于处理callout，不自动显示菜单）
        this.focusinEventHandler = (e) => {
            if (this.processor.isInInitialLoad()) return;

            const target = e.target as HTMLElement;
            if (target.contentEditable === 'true') {
                const blockquote = this.findBlockquoteFromTarget(target);
                
                // 只处理callout样式，不自动显示菜单
                if (blockquote) {
                    this.processor.processBlockquote(blockquote);
                }
            }
        };
        
        document.addEventListener('focusin', this.focusinEventHandler);
    }

    /**
     * 初始化拖拽调整功能
     */
    private initializeDragResize() {
        this.dragResizer = new CalloutDragResizer(this.processor);
    }

    /**
     * 初始化块标高亮功能
     */
    private initializeGutterHighlight() {
        this.gutterHighlight = new CalloutGutterHighlight();
    }

    /**
     * 销毁Callout功能
     */
    destroy() {
        // 移除observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // 移除事件监听器
        if (this.inputEventHandler) {
            ['input', 'keyup', 'paste'].forEach(eventType => {
                document.removeEventListener(eventType, this.inputEventHandler!, true);
            });
            this.inputEventHandler = null;
        }
        
        if (this.clickEventHandler) {
            document.removeEventListener('click', this.clickEventHandler, true);
            this.clickEventHandler = null;
        }
        
        if (this.focusinEventHandler) {
            document.removeEventListener('focusin', this.focusinEventHandler);
            this.focusinEventHandler = null;
        }

        if (this.keydownEventHandler) {
            document.removeEventListener('keydown', this.keydownEventHandler, true);
            this.keydownEventHandler = null;
        }

        if (this.keyupEventHandler) {
            document.removeEventListener('keyup', this.keyupEventHandler, true);
            this.keyupEventHandler = null;
        }

        if (this.blurEventHandler) {
            document.removeEventListener('blur', this.blurEventHandler, true);
            this.blurEventHandler = null;
        }

        // 销毁处理器（包括清理 callout 元素上的事件监听器）
        this.processor.destroy();

        // 销毁拖拽调整功能
        if (this.dragResizer) {
            this.dragResizer.destroy();
            this.dragResizer = null;
        }

        // 销毁块标高亮功能
        if (this.gutterHighlight) {
            this.gutterHighlight.destroy();
            this.gutterHighlight = null;
        }

        // 销毁菜单（包括清理菜单的事件监听器）
        this.menu.destroy();

        // 移除样式
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }
    }

    /**
     * 刷新所有Callout
     */
    refresh() {
        this.injectStyles();
        this.processor.processAllBlockquotes();
    }

    /**
     * 清理空的引述块
     * @returns 删除的空引述块数量
     */
    async cleanupEmptyBlockquotes(): Promise<number> {
        return await this.processor.scanAndRemoveEmptyBlockquotes();
    }

    /**
     * 获取处理器实例
     */
    getProcessor(): CalloutProcessor {
        return this.processor;
    }

    /**
     * 获取菜单实例
     */
    getMenu(): CalloutMenu {
        return this.menu;
    }

    /**
     * 获取拖拽调整器实例
     */
    getDragResizer(): CalloutDragResizer | null {
        return this.dragResizer;
    }
}

