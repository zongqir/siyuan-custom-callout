import { CalloutProcessor } from './processor';
import { CalloutMenu } from './menu';
import { CalloutDragResizer } from './drag-resize';
import { CalloutGutterHighlight } from './proxy-button';
import { generateCalloutStyles } from './styles';
import type { CalloutConfig } from './config';
import { ConfigManager } from './config';

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
    private keydownHandler: ((e: Event) => void) | null = null;
    
    // 简单的删除检测
    private lastDeleteTime: number = 0;
    
    // 🔧 焦点防抖定时器，避免系统操作触发菜单
    private focusDebounceTimer: number = 0;

    constructor(plugin?: any) {
        this.plugin = plugin;
        this.processor = new CalloutProcessor();
        this.menu = new CalloutMenu(this.processor);
        
        // 🌍 将菜单暴露到全局，供drag-resize检查状态
        (window as any).siyuanCalloutMenu = this.menu;
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
     * 初始化Callout功能（新版：基于输入监听）
     */
    async initialize() {
        console.log('🔥 [Callout Manager] 开始初始化...');
        
        // 加载配置
        if (this.plugin) {
            this.currentConfig = await ConfigManager.load(this.plugin);
            const availableTypes = ConfigManager.getAvailableTypes(this.currentConfig); // 只使用可用的类型（排除隐藏的）
            this.processor.updateTypes(availableTypes);
            this.menu.updateTypes(availableTypes);
            this.menu.updateGridColumns(this.currentConfig.gridColumns || 3);
        }

        // 注入样式（仅用于面板 UI 和自定义类型补充样式）
        this.injectStyles();

        // 🆕 监听输入事件，检测 `>` 输入
        this.setupInputListener();
        
        console.log('🔥 [Callout Manager] 初始化完成！');
    }

    /**
     * 🆕 设置输入监听器
     * 监听用户输入 `>` 后弹出 Callout 选择面板
     */
    setupInputListener() {
        console.log('🔥🔥🔥 [Callout Manager] 设置输入监听器...');
        
        // 监听键盘输入事件
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            // 只关注 `>` 键（Shift + .）
            if (event.key === '>') {
                console.log('🔥🔥🔥 [Callout Manager] 检测到 `>` 输入！');
                
                // 检查是否在编辑器中
                const activeElement = document.activeElement as HTMLElement;
                const protyle = activeElement?.closest('.protyle-wysiwyg');
                if (!protyle) {
                    console.log('[Callout Manager] ⚠️ 不在编辑器中，忽略');
                    return;
                }
                
                console.log('🎉🎉🎉 [Callout Manager] 在编辑器中，直接显示 Callout 面板！');
                
                // 直接显示面板，不做任何判断！
                setTimeout(() => {
                    this.showCalloutMenu();
                }, 100);
            }
        }, true); // 使用捕获阶段
        
        console.log('✅ [Callout Manager] 输入监听器已设置！');
    }

    /**
     * 🎯 显示 Callout 选择菜单
     */
    showCalloutMenu() {
        console.log('[Callout Manager] 🎯 尝试显示 Callout 菜单...');
        
        // 获取光标位置
        const cursorPos = this.getCursorPosition();
        console.log('[Callout Manager] 光标位置:', cursorPos);
        
        // 显示菜单
        this.menu.showMenu(cursorPos.x, cursorPos.y, null, false, false);
    }
    
    /**
     * 获取光标在视口中的位置
     * 返回的坐标是相对于视口的，可以直接用于 position: fixed 的元素
     */
    private getCursorPosition(): { x: number; y: number } {
        try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                console.log('[Callout Manager] 没有选区');
                return this.getFallbackPosition();
            }
            
            const range = selection.getRangeAt(0);
            if (!range) {
                console.log('[Callout Manager] range 无效');
                return this.getFallbackPosition();
            }
            
            const rect = range.getBoundingClientRect();
            console.log('[Callout Manager] range.getBoundingClientRect():', {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height
            });
            
            // 检查 rect 是否有效（在视口内）
            // rect.left/top 为 0 可能是有效的（光标在左上角）
            // 但如果所有值都是 0，通常表示无效
            const isValidRect = !(rect.left === 0 && rect.top === 0 && rect.right === 0 && rect.bottom === 0);
            
            if (isValidRect) {
                // 返回光标位置（使用 left 和 bottom，这样菜单会在光标下方）
                return { x: rect.left, y: rect.bottom };
            }
            
            console.log('[Callout Manager] rect 无效，尝试使用 focusNode');
            
            // 备选：使用 focusNode 的位置
            if (selection.focusNode) {
                const focusElement = selection.focusNode.nodeType === Node.TEXT_NODE
                    ? selection.focusNode.parentElement
                    : selection.focusNode as HTMLElement;
                    
                if (focusElement && focusElement.getBoundingClientRect) {
                    const focusRect = focusElement.getBoundingClientRect();
                    if (focusRect.width > 0 || focusRect.height > 0) {
                        console.log('[Callout Manager] 使用 focusNode 位置:', focusRect);
                        return { x: focusRect.left, y: focusRect.bottom };
                    }
                }
            }
            
            return this.getFallbackPosition();
        } catch (e) {
            console.error('[Callout Manager] 获取光标位置失败:', e);
            return this.getFallbackPosition();
        }
    }
    
    /**
     * 获取备选位置（当无法获取光标位置时）
     */
    private getFallbackPosition(): { x: number; y: number } {
        // 尝试使用当前活动元素的位置
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.getBoundingClientRect) {
            const rect = activeElement.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
                console.log('[Callout Manager] 使用 activeElement 位置');
                return { x: rect.left + 20, y: rect.top + 30 };
            }
        }
        
        // 最后备选：屏幕中心偏上
        console.log('[Callout Manager] 使用屏幕中心位置');
        return {
            x: Math.max(100, window.innerWidth / 2 - 200),
            y: Math.max(100, window.innerHeight / 3)
        };
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
     * 设置MutationObserver监听新增的blockquote
     */
    private setupObserver() {
        this.observer = new MutationObserver((mutations) => {
            const relevantMutations = mutations.filter(
                mutation => mutation.type === 'childList' && mutation.addedNodes.length > 0
            );

            if (relevantMutations.length === 0) return;

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

                        // 🔧 改进的新建检测逻辑
                        // 只有当blockquote是真正新建的（之前未被跟踪），且为空时，才显示菜单
                        const isFirstTimeSeen = nodeId && !this.processor.isTracked(nodeId);
                        const isEmpty = this.processor.isBlockQuoteEmpty(bq);
                        const notInInitialLoad = !this.processor.isInInitialLoad();
                        
                        // 标记为已跟踪（必须在检查isFirstTimeSeen之后）
                        if (nodeId) {
                            this.processor.trackBlockQuote(nodeId);
                        }

                        // 🎯 只在真正新建的空blockquote时显示菜单
                        // 如果已经被跟踪过，说明是DOM重建/撤销/复制等操作，不显示菜单
                        if (notInInitialLoad && isFirstTimeSeen && isEmpty) {
                            const rect = bq.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0) {
                                this.menu.showMenu(rect.left, rect.top, bq);
                            }
                        }

                        // 处理callout
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
     * 设置事件监听器
     */
    private setupEventListeners() {
        // 输入事件监听（防抖）
        let inputTimeout: number;
        this.inputEventHandler = (e) => {
            const target = e.target as HTMLElement;
            if (target.contentEditable === 'true') {
                clearTimeout(inputTimeout);
                
                // 1. 检查是否在第一行 + 刚删除过
                const isInFirstLine = this.isCaretInFirstLine(target);
                const isAfterDelete = (Date.now() - this.lastDeleteTime) < 1000; // 1秒内有删除操作
                
                // 2. 决定延迟时间：删除+第一行=3秒，其他=300ms
                const delay = (isInFirstLine && isAfterDelete) ? 3000 : 300;
                
                console.log('[Callout Debug] Input event:', {
                    isInFirstLine,
                    isAfterDelete,
                    delay: delay + 'ms'
                });
                
                inputTimeout = window.setTimeout(() => {
                    const blockquote = this.findTargetBlockquote(target);
                    if (blockquote) {
                        this.processor.processBlockquote(blockquote);
                    }
                }, delay);
            }
        };
        
        ['input', 'keyup', 'paste'].forEach(eventType => {
            document.addEventListener(eventType, this.inputEventHandler!, true);
        });

        // 检测删除操作
        this.keydownHandler = (e) => {
            const keyEvent = e as KeyboardEvent;
            if ((keyEvent.key === 'Backspace' || keyEvent.key === 'Delete') &&
                keyEvent.target && (keyEvent.target as HTMLElement).contentEditable === 'true') {
                this.lastDeleteTime = Date.now();
            }
        };
        document.addEventListener('keydown', this.keydownHandler, true);

        // 点击callout标题图标区域切换类型
        this.clickEventHandler = (e) => {
            const target = e.target as HTMLElement;
            const mouseEvent = e as MouseEvent;

            if (target.contentEditable === 'true' &&
                target.getAttribute('data-callout-title') === 'true') {
                const blockquote = target.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;

                if (blockquote && blockquote.hasAttribute('custom-callout')) {
                    const rect = target.getBoundingClientRect();
                    const clickX = mouseEvent.clientX - rect.left;

                    // 点击图标区域（0-40px），显示/隐藏切换主题菜单（toggle）
                    if (clickX >= 0 && clickX <= 40) {
                        e.preventDefault();
                        e.stopPropagation();

                        // 🔧 使用鼠标点击的实际位置，而不是 blockquote 的位置
                        this.menu.showMenu(mouseEvent.clientX, mouseEvent.clientY, blockquote, true, true);
                    }
                }
            }
        };
        
        document.addEventListener('click', this.clickEventHandler, true);

        // 🔧 焦点事件监听 - 已禁用，仅通过新建和点击图标触发菜单
        // this.focusinEventHandler = (e) => {
        //     if (this.processor.isInInitialLoad()) return;

        //     const target = e.target as HTMLElement;
        //     if (target.contentEditable === 'true') {
        //         const blockquote = target.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;

        //         if (blockquote && this.processor.isBlockQuoteEmpty(blockquote)) {
        //             const nodeId = blockquote.getAttribute('data-node-id');
        //             if (nodeId && !this.processor.isRecentlyCreated(nodeId)) {
        //                 clearTimeout(this.focusDebounceTimer);
        //                 this.focusDebounceTimer = window.setTimeout(() => {
        //                     if (!this.menu.isVisible() && document.activeElement && 
        //                         blockquote.contains(document.activeElement)) {
        //                         const rect = blockquote.getBoundingClientRect();
        //                         this.menu.showMenu(rect.left, rect.top, blockquote);
        //                     }
        //                 }, 200);
        //             }
        //         }
        //     }
        // };
        
        // document.addEventListener('focusin', this.focusinEventHandler);
    }

    /**
     * 检查光标是否在第一行
     */
    private isCaretInFirstLine(target: HTMLElement): boolean {
        try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                console.log('[Callout Debug] 光标检测: 没有选区');
                return false;
            }
            
            const range = selection.getRangeAt(0);
            
            // 🔧 修复：直接从选区查找blockquote，不依赖target
            let container = range.commonAncestorContainer;
            if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentElement!;
            }
            
            const blockquote = (container as HTMLElement).closest('[data-type="NodeBlockquote"], .bq');
            if (!blockquote) {
                console.log('[Callout Debug] 光标检测: 选区中找不到blockquote');
                return false;
            }
            
            // 获取blockquote的第一个内容div（兼容只读模式）
            const firstDiv = blockquote.querySelector('div[contenteditable]');
            if (!firstDiv) {
                console.log('[Callout Debug] 光标检测: blockquote中找不到第一个div');
                return false;
            }
            
            // 检查光标是否在第一个div内
            const isInFirstLine = firstDiv.contains(range.commonAncestorContainer) || 
                                 firstDiv === range.commonAncestorContainer ||
                                 range.commonAncestorContainer === firstDiv ||
                                 firstDiv.contains(container as Node) ||
                                 firstDiv === container;
            
            console.log('[Callout Debug] 光标检测详情:', {
                targetTag: target.tagName,
                blockquoteFound: !!blockquote,
                firstDiv: firstDiv,
                container: container,
                rangeContainer: range.commonAncestorContainer,
                isInFirstLine: isInFirstLine,
                firstDivText: firstDiv.textContent?.substring(0, 20),
                containerText: (container as HTMLElement)?.textContent?.substring(0, 20)
            });
            
            return isInFirstLine;
        } catch (e) {
            console.log('[Callout Debug] 光标检测出错:', e);
            return false;
        }
    }

    /**
     * 查找目标blockquote
     */
    private findTargetBlockquote(target: HTMLElement): HTMLElement | null {
        let blockquote = target.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;
        
        // 如果找不到，尝试通过选区查找
        if (!blockquote) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                const containerElement = container.nodeType === Node.TEXT_NODE ? 
                    container.parentElement : container as HTMLElement;
                blockquote = containerElement?.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;
            }
        }
        
        return blockquote;
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
        
        // 🔧 focusin监听器已禁用
        // if (this.focusinEventHandler) {
        //     document.removeEventListener('focusin', this.focusinEventHandler);
        //     this.focusinEventHandler = null;
        // }
        
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler, true);
            this.keydownHandler = null;
        }
        
        // 清理焦点防抖定时器
        clearTimeout(this.focusDebounceTimer);

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

