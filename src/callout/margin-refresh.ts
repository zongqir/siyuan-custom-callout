/**
 * 边注位置切换时的DOM刷新逻辑
 */

import { CalloutProcessor } from './processor';

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
     * 刷新相邻的blockquotes
     */
    refreshAdjacentBlockquotes(targetBlockquote: HTMLElement) {
        console.log('[MarginRefresh] 🔄 开始局部DOM刷新');
        
        const elementsToRefresh = this.collectAdjacentElements(targetBlockquote);
        
        console.log('[MarginRefresh] 🔄 需要刷新的元素数量:', elementsToRefresh.length);
        
        // 刷新相邻元素
        elementsToRefresh.forEach((element, index) => {
            setTimeout(() => {
                if (this.isBlockquoteElement(element)) {
                    console.log('[MarginRefresh] 🔄 刷新相邻blockquote:', index + 1);
                    this.processor.processBlockquote(element);
                }
            }, index * 50); // 错开刷新时间，避免并发问题
        });
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

