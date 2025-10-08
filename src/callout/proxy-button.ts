/**
 * Callout 块标高亮功能
 * 给 callout 的块标按钮添加醒目颜色
 */

export class CalloutGutterHighlight {
    private observer: MutationObserver | null = null;
    private trackedCallouts: Set<string> = new Set();
    private periodicCheckInterval: number | null = null;
    private eventHandlers: Map<string, () => void> = new Map(); // 保存事件处理器，用于清理

    constructor() {
        this.init();
    }

    /**
     * 初始化块标高亮功能
     */
    private init() {
        // 监听块标的出现
        this.observer = new MutationObserver(() => {
            this.highlightVisibleGutters();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });

        // 为所有 callout 添加悬停监听
        setTimeout(() => {
            this.addHoverListeners();
        }, 500);

        // 定期添加监听器（处理新创建的 callout）
        this.periodicCheckInterval = window.setInterval(() => {
            this.addHoverListeners();
        }, 2000);
    }

    /**
     * 为所有 callout 添加悬停监听
     */
    private addHoverListeners() {
        const callouts = document.querySelectorAll('[custom-callout]');
        
        callouts.forEach((callout) => {
            const nodeId = callout.getAttribute('data-node-id');

            if (!nodeId || this.trackedCallouts.has(nodeId)) {
                return;
            }

            // 标记为已跟踪
            this.trackedCallouts.add(nodeId);

            // 找到标题元素
            const titleDiv = callout.querySelector('[data-callout-title="true"]') as HTMLElement;

            // 同时在 callout 和标题上添加监听
            const handler = () => {
                this.activateAndHighlightGutter(callout as HTMLElement);
            };

            // 保存处理器引用
            this.eventHandlers.set(nodeId, handler);

            // 整个 callout 上添加
            callout.addEventListener('mouseenter', handler);

            // 标题上也添加（如果存在）
            if (titleDiv) {
                titleDiv.addEventListener('mouseenter', handler);
            }
        });
    }

    /**
     * 激活并高亮块标
     */
    private async activateAndHighlightGutter(callout: HTMLElement) {
        const nodeId = callout.getAttribute('data-node-id');
        if (!nodeId) {
            return;
        }

        // 触发点击激活块标
        const rect = callout.getBoundingClientRect();
        const targetX = rect.left + 20;
        const targetY = rect.top + rect.height / 2;

        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: targetX,
            clientY: targetY,
            button: 0
        });

        callout.dispatchEvent(clickEvent);

        // 等待块标出现
        await this.waitForMs(100);

        // 高亮块标
        this.highlightVisibleGutters();
    }

    /**
     * 等待指定毫秒
     */
    private waitForMs(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 高亮当前可见的块标
     */
    private highlightVisibleGutters() {
        // 查找所有可见的块标
        const allGutters = document.querySelectorAll('.protyle-gutters');
        
        allGutters.forEach((gutters) => {
            const buttons = gutters.querySelectorAll('button[data-node-id]');
            
            buttons.forEach((button) => {
                const nodeId = button.getAttribute('data-node-id');

                if (!nodeId) {
                    return;
                }

                // 检查对应的块是否是 callout
                const block = document.querySelector(`[data-node-id="${nodeId}"][custom-callout]`);
                
                if (block) {
                    // 是 callout，添加高亮
                    if (!button.classList.contains('callout-gutter-highlight')) {
                        button.classList.add('callout-gutter-highlight');
                    }
                } else {
                    // 不是 callout，移除高亮
                    if (button.classList.contains('callout-gutter-highlight')) {
                        button.classList.remove('callout-gutter-highlight');
                    }
                }
            });
        });
    }

    /**
     * 销毁功能
     */
    destroy() {
        // 停止定期检查
        if (this.periodicCheckInterval !== null) {
            clearInterval(this.periodicCheckInterval);
            this.periodicCheckInterval = null;
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // 移除所有事件监听器
        this.eventHandlers.forEach((handler, nodeId) => {
            const callout = document.querySelector(`[data-node-id="${nodeId}"][custom-callout]`);
            if (callout) {
                callout.removeEventListener('mouseenter', handler);
                
                const titleDiv = callout.querySelector('[data-callout-title="true"]') as HTMLElement;
                if (titleDiv) {
                    titleDiv.removeEventListener('mouseenter', handler);
                }
            }
        });
        this.eventHandlers.clear();

        // 清空跟踪集合
        this.trackedCallouts.clear();

        // 移除所有高亮
        document.querySelectorAll('.callout-gutter-highlight').forEach((button) => {
            button.classList.remove('callout-gutter-highlight');
        });
    }
}
