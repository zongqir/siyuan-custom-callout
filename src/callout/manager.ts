import { CalloutProcessor } from './processor';
import { CalloutMenu } from './menu';
import { generateCalloutStyles } from './styles';

/**
 * Callout功能管理器 - 负责协调所有Callout相关功能
 */
export class CalloutManager {
    private processor: CalloutProcessor;
    private menu: CalloutMenu;
    private observer: MutationObserver | null = null;
    private styleElement: HTMLStyleElement | null = null;

    constructor() {
        this.processor = new CalloutProcessor();
        this.menu = new CalloutMenu(this.processor);
    }

    /**
     * 初始化Callout功能
     */
    initialize() {
        console.log('[Callout Manager] Initializing...');

        // 注入样式
        this.injectStyles();

        // 处理现有的blockquote
        this.processor.processAllBlockquotes();

        // 设置监听器
        this.setupObserver();
        this.setupEventListeners();

        console.log('[Callout Manager] Initialized successfully');
    }

    /**
     * 注入CSS样式
     */
    private injectStyles() {
        if (this.styleElement) {
            this.styleElement.remove();
        }

        this.styleElement = document.createElement('style');
        this.styleElement.id = 'custom-callout-styles';
        this.styleElement.textContent = generateCalloutStyles();
        document.head.appendChild(this.styleElement);

        console.log('[Callout Manager] Styles injected');
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
                            console.log('[Callout Observer] 🔍 发现新的引用块:', element);
                            newBlockquotes.push(element);
                        }

                        // 检查子元素
                        const childBlockquotes = element.querySelectorAll?.(
                            '[data-type="NodeBlockquote"], .bq'
                        );
                        if (childBlockquotes?.length > 0) {
                            console.log('[Callout Observer] 🔍 发现子引用块数量:', childBlockquotes.length);
                            newBlockquotes.push(...Array.from(childBlockquotes) as HTMLElement[]);
                        }
                    }
                });
            });

            if (newBlockquotes.length > 0) {
                // 去重
                const uniqueBlockquotes = [...new Set(newBlockquotes)];
                console.log('[Callout Observer] ✅ 处理引用块数量:', uniqueBlockquotes.length);

                setTimeout(() => {
                    uniqueBlockquotes.forEach((bq, index) => {
                        const nodeId = bq.getAttribute('data-node-id');
                        console.log(`[Callout Observer] 📝 处理引用块 ${index + 1}:`, {
                            nodeId,
                            isEmpty: this.processor.isBlockQuoteEmpty(bq),
                            isInitialLoad: this.processor.isInInitialLoad(),
                            isRecentlyCreated: nodeId ? this.processor.isRecentlyCreated(nodeId) : false
                        });

                        // 标记为已跟踪
                        if (nodeId) {
                            this.processor.trackBlockQuote(nodeId);
                        }

                        // 如果不是初始加载且是空的blockquote，显示菜单
                        const isEmpty = this.processor.isBlockQuoteEmpty(bq);
                        const isInitialLoad = this.processor.isInInitialLoad();
                        const isRecentlyCreated = nodeId ? this.processor.isRecentlyCreated(nodeId) : false;

                        console.log(`[Callout Observer] 🎯 菜单显示条件检查:`, {
                            isEmpty,
                            isInitialLoad,
                            hasNodeId: !!nodeId,
                            isRecentlyCreated,
                            shouldShowMenu: !isInitialLoad && isEmpty && nodeId && !isRecentlyCreated
                        });

                        if (!isInitialLoad && isEmpty && nodeId && !isRecentlyCreated) {
                            const rect = bq.getBoundingClientRect();
                            console.log('[Callout Observer] 🎉 显示菜单!', {
                                rect: { width: rect.width, height: rect.height, left: rect.left, top: rect.top }
                            });
                            if (rect.width > 0 && rect.height > 0) {
                                this.menu.showMenu(rect.left, rect.top, bq);
                            } else {
                                console.warn('[Callout Observer] ⚠️ 引用块尺寸为0，不显示菜单');
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

        console.log('[Callout Manager] ✅ MutationObserver 已启动');
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners() {
        console.log('[Callout Manager] 🎧 开始设置事件监听器...');

        // 输入事件监听（防抖）
        let inputTimeout: number;
        ['input', 'keyup', 'paste'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                const target = e.target as HTMLElement;
                if (target.contentEditable === 'true') {
                    console.log(`[Callout Event] ⌨️ ${eventType} 事件触发`);
                    clearTimeout(inputTimeout);
                    inputTimeout = window.setTimeout(() => {
                        const blockquote = target.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;
                        if (blockquote) {
                            console.log('[Callout Event] 📝 处理引用块内容变化');
                            this.processor.processBlockquote(blockquote);
                        }
                    }, eventType === 'paste' ? 100 : 300);
                }
            }, true);
        });

        // 点击callout标题图标区域切换类型
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            if (target.contentEditable === 'true' &&
                target.getAttribute('data-callout-title') === 'true') {
                console.log('[Callout Event] 🖱️ 点击 Callout 标题');
                const blockquote = target.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;

                if (blockquote && blockquote.hasAttribute('custom-callout')) {
                    const rect = target.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;

                    console.log(`[Callout Event] 📍 点击位置: ${clickX}px`);

                    // 点击图标区域（0-40px），显示切换主题菜单
                    if (clickX >= 0 && clickX <= 40) {
                        e.preventDefault();
                        e.stopPropagation();

                        console.log('[Callout Event] 🎨 显示类型切换菜单');
                        const bqRect = blockquote.getBoundingClientRect();
                        this.menu.showMenu(bqRect.left, bqRect.top, blockquote, true);
                    }
                }
            }
        }, true);

        // 焦点事件监听
        document.addEventListener('focusin', (e) => {
            const target = e.target as HTMLElement;
            console.log('[Callout Event] 🎯 焦点事件:', {
                isContentEditable: target.contentEditable === 'true',
                isInitialLoad: this.processor.isInInitialLoad()
            });

            if (this.processor.isInInitialLoad()) {
                console.log('[Callout Event] ⏳ 初始加载中，跳过焦点处理');
                return;
            }

            if (target.contentEditable === 'true') {
                const blockquote = target.closest('[data-type="NodeBlockquote"], .bq') as HTMLElement;

                if (blockquote) {
                    const isEmpty = this.processor.isBlockQuoteEmpty(blockquote);
                    const nodeId = blockquote.getAttribute('data-node-id');
                    const isRecentlyCreated = nodeId ? this.processor.isRecentlyCreated(nodeId) : false;

                    console.log('[Callout Event] 🔍 焦点引用块检查:', {
                        isEmpty,
                        nodeId,
                        isRecentlyCreated,
                        shouldShowMenu: isEmpty && nodeId && !isRecentlyCreated
                    });

                    if (isEmpty && nodeId && !isRecentlyCreated) {
                        const rect = blockquote.getBoundingClientRect();
                        console.log('[Callout Event] 🎉 焦点触发显示菜单!');
                        this.menu.showMenu(rect.left, rect.top, blockquote);
                    }
                }
            }
        });

        console.log('[Callout Manager] ✅ 事件监听器设置完成');
    }

    /**
     * 销毁Callout功能
     */
    destroy() {
        console.log('[Callout Manager] Destroying...');

        // 移除observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // 移除样式
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }

        // 隐藏菜单
        this.menu.hideMenu(true);

        console.log('[Callout Manager] Destroyed');
    }

    /**
     * 刷新所有Callout
     */
    refresh() {
        console.log('[Callout Manager] Refreshing...');
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
}

