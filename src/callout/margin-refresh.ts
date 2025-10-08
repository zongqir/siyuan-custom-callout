/**
 * 边注位置切换时的DOM刷新逻辑
 * 使用思源官方API进行刷新
 */

import { CalloutProcessor } from './processor';

/**
 * 思源 Protyle 接口定义
 */
interface IProtyle {
    element: HTMLElement;
    [key: string]: any;
}

export class MarginRefreshManager {
    private processor: CalloutProcessor;

    constructor(processor: CalloutProcessor) {
        this.processor = processor;
    }

    /**
     * 检测是否涉及边注位置切换
     */
    detectMarginPositionChange(newCommand: string, blockquote: HTMLElement): boolean {
        // 获取当前的边注位置
        const currentPosition = blockquote.getAttribute('data-margin-position') || 'normal';
        
        // 解析新命令中的位置信息
        let newPosition = 'normal';
        const marginMatch = newCommand.match(/\|([^|\]]+)\]/);
        if (marginMatch) {
            const positionParam = marginMatch[1].toLowerCase();
            if (positionParam === 'left' || positionParam === 'right') {
                newPosition = positionParam;
            }
        }
        
        // 检测位置是否发生变化
        const isPositionChange = currentPosition !== newPosition;
        
        console.log('[MarginRefresh] 🔄 边注位置检测:', {
            current: currentPosition,
            new: newPosition,
            hasChange: isPositionChange
        });
        
        return isPositionChange;
    }

    /**
     * 从 DOM 元素获取 Protyle 实例
     */
    private getProtyleFromElement(element: HTMLElement): IProtyle | null {
        try {
            // 方法1: 从元素向上查找 .protyle-wysiwyg 容器
            let current: HTMLElement | null = element;
            while (current && current !== document.body) {
                if (current.classList.contains('protyle-wysiwyg')) {
                    // 找到编辑器容器，向上找protyle根元素
                    const protyleElement = current.closest('.protyle') as HTMLElement;
                    if (protyleElement && (protyleElement as any).protyle) {
                        return (protyleElement as any).protyle as IProtyle;
                    }
                }
                current = current.parentElement;
            }

            // 方法2: 尝试从 data-node-id 获取所在块的protyle
            const blockId = element.getAttribute('data-node-id');
            if (blockId) {
                const blockElement = document.querySelector(`[data-node-id="${blockId}"]`);
                if (blockElement) {
                    const protyleWysiwyg = blockElement.closest('.protyle-wysiwyg');
                    if (protyleWysiwyg) {
                        const protyleElement = protyleWysiwyg.closest('.protyle') as HTMLElement;
                        if (protyleElement && (protyleElement as any).protyle) {
                            return (protyleElement as any).protyle as IProtyle;
                        }
                    }
                }
            }

            // 方法3: 从全局查找当前激活的编辑器
            const activeProtyle = document.querySelector('.protyle:not(.fn__none)') as HTMLElement;
            if (activeProtyle && (activeProtyle as any).protyle) {
                return (activeProtyle as any).protyle as IProtyle;
            }

            console.warn('[MarginRefresh] ⚠️ 无法获取 Protyle 实例');
            return null;
        } catch (error) {
            console.error('[MarginRefresh] ❌ 获取 Protyle 实例失败:', error);
            return null;
        }
    }

    /**
     * 使用官方 API 重载 Protyle（完整刷新）
     */
    private reloadProtyle(protyle: IProtyle, focus: boolean = false) {
        try {
            // 检查是否存在官方 reloadProtyle 方法
            if (typeof (window as any).reloadProtyle === 'function') {
                (window as any).reloadProtyle(protyle, focus, false);
                console.log('[MarginRefresh] ✅ 使用官方 reloadProtyle 重载编辑器');
            } else {
                console.warn('[MarginRefresh] ⚠️ 官方 reloadProtyle API 不可用，降级处理');
                // 降级：使用 processor 重新处理
                this.fallbackRefresh(protyle.element);
            }
        } catch (error) {
            console.error('[MarginRefresh] ❌ 重载 Protyle 失败:', error);
            this.fallbackRefresh(protyle.element);
        }
    }

    /**
     * 使用官方 API 渲染指定块（局部刷新）
     */
    private blockRender(protyle: IProtyle, element: Element) {
        try {
            // 检查是否存在官方 blockRender 方法
            if (typeof (window as any).blockRender === 'function') {
                (window as any).blockRender(protyle, element);
                console.log('[MarginRefresh] ✅ 使用官方 blockRender 渲染块');
            } else {
                console.warn('[MarginRefresh] ⚠️ 官方 blockRender API 不可用，降级处理');
                // 降级：使用 processor 重新处理
                if (this.isBlockquoteElement(element as HTMLElement)) {
                    this.processor.processBlockquote(element as HTMLElement);
                }
            }
        } catch (error) {
            console.error('[MarginRefresh] ❌ 渲染块失败:', error);
            if (this.isBlockquoteElement(element as HTMLElement)) {
                this.processor.processBlockquote(element as HTMLElement);
            }
        }
    }

    /**
     * 降级刷新方案 - 当官方API不可用时
     */
    private fallbackRefresh(containerElement: HTMLElement) {
        console.log('[MarginRefresh] 🔄 使用降级刷新方案');
        const blockquotes = containerElement.querySelectorAll('blockquote, .bq');
        blockquotes.forEach(bq => {
            if (this.isBlockquoteElement(bq as HTMLElement)) {
                this.processor.processBlockquote(bq as HTMLElement);
            }
        });
    }

    /**
     * 刷新相邻的blockquotes - 主入口
     */
    refreshAdjacentBlockquotes(targetBlockquote: HTMLElement) {
        console.log('[MarginRefresh] 🔄 开始局部DOM刷新');
        
        // 尝试获取 Protyle 实例
        const protyle = this.getProtyleFromElement(targetBlockquote);
        
        if (protyle) {
            console.log('[MarginRefresh] ✅ 已获取 Protyle 实例，使用官方API刷新');
            
            // 收集需要刷新的相邻元素
            const elementsToRefresh = this.collectAdjacentElements(targetBlockquote);
            console.log('[MarginRefresh] 🔄 需要刷新的元素数量:', elementsToRefresh.length);
            
            // 使用官方 blockRender API 刷新每个块
            elementsToRefresh.forEach((element, index) => {
                setTimeout(() => {
                    if (this.isBlockquoteElement(element)) {
                        console.log('[MarginRefresh] 🔄 刷新相邻blockquote:', index + 1);
                        this.blockRender(protyle, element);
                    }
                }, index * 50); // 错开刷新时间，避免并发问题
            });
        } else {
            console.warn('[MarginRefresh] ⚠️ 无法获取 Protyle 实例，使用降级方案');
            
            // 降级方案：直接使用 processor
            const elementsToRefresh = this.collectAdjacentElements(targetBlockquote);
            console.log('[MarginRefresh] 🔄 需要刷新的元素数量:', elementsToRefresh.length);
            
            elementsToRefresh.forEach((element, index) => {
                setTimeout(() => {
                    if (this.isBlockquoteElement(element)) {
                        console.log('[MarginRefresh] 🔄 刷新相邻blockquote:', index + 1);
                        this.processor.processBlockquote(element);
                    }
                }, index * 50);
            });
        }
    }

    /**
     * 收集需要刷新的相邻元素
     */
    private collectAdjacentElements(targetBlockquote: HTMLElement): HTMLElement[] {
        const elements: HTMLElement[] = [];
        
        // 收集前面的元素（向上最多2个blockquote）
        let prevElement = targetBlockquote.previousElementSibling as HTMLElement;
        let prevCount = 0;
        while (prevElement && prevCount < 2) {
            if (this.isBlockquoteElement(prevElement)) {
                elements.unshift(prevElement); // 添加到前面
                prevCount++;
            }
            prevElement = prevElement.previousElementSibling as HTMLElement;
        }
        
        // 收集后面的元素（向下最多2个blockquote）
        let nextElement = targetBlockquote.nextElementSibling as HTMLElement;
        let nextCount = 0;
        while (nextElement && nextCount < 2) {
            if (this.isBlockquoteElement(nextElement)) {
                elements.push(nextElement); // 添加到后面
                nextCount++;
            }
            nextElement = nextElement.nextElementSibling as HTMLElement;
        }
        
        return elements;
    }

    /**
     * 判断元素是否为blockquote
     */
    private isBlockquoteElement(element: HTMLElement): boolean {
        return element && (
            element.tagName === 'BLOCKQUOTE' || 
            element.classList.contains('bq') ||
            element.getAttribute('data-type') === 'NodeBlockquote'
        );
    }
}
