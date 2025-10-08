/**
 * Callout 块标高亮功能
 * 给 callout 的块标按钮添加醒目颜色
 */

export class CalloutGutterHighlight {
    private observer: MutationObserver | null = null;
    private trackedCallouts: Set<string> = new Set();

    constructor() {
        this.init();
    }

    /**
     * 初始化块标高亮功能
     */
    private init() {
        console.log('[CalloutGutterHighlight] 🚀 初始化开始...');

        // 监听块标的出现
        this.observer = new MutationObserver((mutations) => {
            console.log('[CalloutGutterHighlight] 📝 DOM 变化，mutations 数量:', mutations.length);
            this.highlightVisibleGutters();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });

        console.log('[CalloutGutterHighlight] ✅ MutationObserver 已启动');

        // 为所有 callout 添加悬停监听
        setTimeout(() => {
            console.log('[CalloutGutterHighlight] 🔄 500ms 后初始化悬停监听...');
            this.addHoverListeners();
        }, 500);

        // 定期添加监听器（处理新创建的 callout）
        setInterval(() => {
            console.log('[CalloutGutterHighlight] 🔄 定期检查新 callout...');
            this.addHoverListeners();
        }, 2000);
    }

    /**
     * 为所有 callout 添加悬停监听
     */
    private addHoverListeners() {
        const callouts = document.querySelectorAll('[custom-callout]');
        console.log('[CalloutGutterHighlight] 🔍 查找 callout，找到数量:', callouts.length);
        
        callouts.forEach((callout, index) => {
            const nodeId = callout.getAttribute('data-node-id');
            console.log(`[CalloutGutterHighlight] Callout #${index + 1}:`, {
                nodeId,
                element: callout,
                已跟踪: this.trackedCallouts.has(nodeId || '')
            });

            if (!nodeId || this.trackedCallouts.has(nodeId)) {
                console.log(`[CalloutGutterHighlight] 跳过 Callout #${index + 1}:`, nodeId ? '已跟踪' : '无ID');
                return;
            }

            // 标记为已跟踪
            this.trackedCallouts.add(nodeId);

            // 找到标题元素
            const titleDiv = callout.querySelector('[data-callout-title="true"]') as HTMLElement;
            console.log(`[CalloutGutterHighlight] 查找标题元素:`, {
                nodeId,
                找到标题: !!titleDiv,
                标题元素: titleDiv
            });

            // 同时在 callout 和标题上添加监听
            const handler = () => {
                console.log('[CalloutGutterHighlight] 🖱️🖱️🖱️ 鼠标进入了！nodeId:', nodeId);
                this.activateAndHighlightGutter(callout as HTMLElement);
            };

            // 整个 callout 上添加
            callout.addEventListener('mouseenter', handler);
            console.log(`[CalloutGutterHighlight] ✅ 已在 callout 上添加监听:`, nodeId);

            // 标题上也添加（如果存在）
            if (titleDiv) {
                titleDiv.addEventListener('mouseenter', handler);
                console.log(`[CalloutGutterHighlight] ✅ 已在标题上添加监听:`, nodeId);
            }
        });
    }

    /**
     * 激活并高亮块标
     */
    private async activateAndHighlightGutter(callout: HTMLElement) {
        const nodeId = callout.getAttribute('data-node-id');
        if (!nodeId) {
            console.log('[CalloutGutterHighlight] ❌ Callout 没有 nodeId');
            return;
        }

        console.log('[CalloutGutterHighlight] 🎯 开始激活块标:', nodeId);

        // 触发点击激活块标
        const rect = callout.getBoundingClientRect();
        const targetX = rect.left + 20;
        const targetY = rect.top + rect.height / 2;

        console.log('[CalloutGutterHighlight] 📍 点击位置:', { targetX, targetY, rect });

        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: targetX,
            clientY: targetY,
            button: 0
        });

        callout.dispatchEvent(clickEvent);
        console.log('[CalloutGutterHighlight] ✅ 已触发点击事件');

        // 等待块标出现
        console.log('[CalloutGutterHighlight] ⏳ 等待 100ms...');
        await this.waitForMs(100);

        // 高亮块标
        console.log('[CalloutGutterHighlight] 🔍 开始查找并高亮块标...');
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
        console.log('[CalloutGutterHighlight] 🔍 查找块标容器，找到数量:', allGutters.length);
        
        allGutters.forEach((gutters, gutterIndex) => {
            const buttons = gutters.querySelectorAll('button[data-node-id]');
            console.log(`[CalloutGutterHighlight] 块标容器 #${gutterIndex + 1}，按钮数量:`, buttons.length);
            console.log(`[CalloutGutterHighlight] 块标容器详情:`, {
                element: gutters,
                style: (gutters as HTMLElement).style.cssText,
                visible: (gutters as HTMLElement).offsetWidth > 0
            });
            
            buttons.forEach((button, btnIndex) => {
                const nodeId = button.getAttribute('data-node-id');
                const dataType = button.getAttribute('data-type');
                
                console.log(`[CalloutGutterHighlight] 按钮 #${btnIndex + 1}:`, {
                    nodeId,
                    dataType,
                    element: button,
                    classList: button.classList.toString()
                });

                if (!nodeId) {
                    console.log(`[CalloutGutterHighlight] ⚠️ 按钮 #${btnIndex + 1} 没有 nodeId`);
                    return;
                }

                // 检查对应的块是否是 callout
                const block = document.querySelector(`[data-node-id="${nodeId}"][custom-callout]`);
                console.log(`[CalloutGutterHighlight] 查找块 ${nodeId}:`, {
                    找到: !!block,
                    是Callout: !!block,
                    元素: block
                });
                
                if (block) {
                    // 是 callout，添加高亮
                    if (!button.classList.contains('callout-gutter-highlight')) {
                        button.classList.add('callout-gutter-highlight');
                        console.log('[CalloutGutterHighlight] ✅✅✅ 已添加高亮:', nodeId, button);
                    } else {
                        console.log('[CalloutGutterHighlight] ✓ 已经高亮:', nodeId);
                    }
                } else {
                    // 不是 callout，移除高亮
                    if (button.classList.contains('callout-gutter-highlight')) {
                        button.classList.remove('callout-gutter-highlight');
                        console.log('[CalloutGutterHighlight] ❌ 移除高亮（不是 callout）:', nodeId);
                    }
                }
            });
        });
    }

    /**
     * 销毁功能
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // 清空跟踪集合
        this.trackedCallouts.clear();

        // 移除所有高亮
        document.querySelectorAll('.callout-gutter-highlight').forEach((button) => {
            button.classList.remove('callout-gutter-highlight');
        });

        console.log('[CalloutGutterHighlight] 功能已销毁');
    }
}
