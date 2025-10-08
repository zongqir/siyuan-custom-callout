/**
 * Callout拖拽调整功能
 */

import { updateBlock, getBlockKramdown } from '../api';
import type { CalloutProcessor } from './processor';

export class CalloutDragResizer {
    private processor: CalloutProcessor;
    private isDragging: boolean = false;
    private currentBlockquote: HTMLElement | null = null;
    private currentHandle: HTMLElement | null = null;
    private startWidth: number = 0;
    private startX: number = 0;

    constructor(processor: CalloutProcessor) {
        this.processor = processor;
        this.initializeResizer();
    }

    /**
     * 初始化拖拽调整功能
     */
    private initializeResizer() {
        console.log('[CalloutResize] 🚀 初始化拖拽调整功能');
        
        // 延迟初始化，确保DOM准备就绪
        setTimeout(() => {
            // 为现有的callout添加拖拽手柄
            this.addResizeHandlesToExistingCallouts();
            
            // 监听DOM变化，为新的callout添加拖拽手柄
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as HTMLElement;
                            
                            // 检查是否是callout或包含callout
                            const callouts = element.classList?.contains('bq') && element.hasAttribute('custom-callout') 
                                ? [element] 
                                : element.querySelectorAll?.('.bq[custom-callout]') || [];
                            
                            if (callouts.length > 0) {
                                console.log('[CalloutResize] 检测到新的callout，添加拖拽手柄', callouts.length);
                            }
                            
                            callouts.forEach((callout) => {
                                // 延迟添加，确保callout完全渲染
                                setTimeout(() => {
                                    this.addResizeHandle(callout as HTMLElement);
                                }, 100);
                            });
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['custom-callout']
            });

            // 绑定全局事件
            this.bindGlobalEvents();
            
            // 定期检查并添加遗漏的手柄
            this.startPeriodicCheck();
        }, 500);
    }

    /**
     * 为现有的callout添加拖拽手柄
     */
    private addResizeHandlesToExistingCallouts() {
        const existingCallouts = document.querySelectorAll('.bq[custom-callout]');
        console.log('[CalloutResize] 🔍 发现现有callout数量:', existingCallouts.length);
        
        existingCallouts.forEach((callout, index) => {
            console.log(`[CalloutResize] 为第${index + 1}个callout添加拖拽手柄`);
            this.addResizeHandle(callout as HTMLElement);
        });
    }

    /**
     * 定期检查并添加遗漏的拖拽手柄
     */
    private startPeriodicCheck() {
        setInterval(() => {
            const allCallouts = document.querySelectorAll('.bq[custom-callout]');
            const calloutsWithoutHandle: HTMLElement[] = [];
            
            allCallouts.forEach((callout) => {
                if (!callout.querySelector('.callout-resize-handle')) {
                    calloutsWithoutHandle.push(callout as HTMLElement);
                }
            });
            
            if (calloutsWithoutHandle.length > 0) {
                console.log('[CalloutResize] 🔧 发现遗漏的callout，补充拖拽手柄:', calloutsWithoutHandle.length);
                calloutsWithoutHandle.forEach((callout) => {
                    this.addResizeHandle(callout);
                });
            }
        }, 2000); // 每2秒检查一次
    }

    /**
     * 为callout添加拖拽手柄
     */
    private addResizeHandle(blockquote: HTMLElement) {
        // 避免重复添加
        if (blockquote.querySelector('.callout-resize-handle')) {
            console.log('[CalloutResize] ⚠️ callout已有拖拽手柄，跳过');
            return;
        }

        console.log('[CalloutResize] ✨ 为callout添加拖拽手柄:', {
            nodeId: blockquote.getAttribute('data-node-id'),
            customCallout: blockquote.getAttribute('custom-callout'),
            classes: blockquote.className
        });

        const handle = document.createElement('div');
        handle.className = 'callout-resize-handle';
        handle.title = '拖拽调整宽度';
        handle.innerHTML = `
            <div class="resize-handle-inner">
                <div class="resize-handle-dots"></div>
            </div>
        `;

        // 设置手柄样式
        Object.assign(handle.style, {
            position: 'absolute',
            right: '-8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '40px',
            cursor: 'ew-resize',
            zIndex: '10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            transition: 'opacity 0.2s ease',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)'
        });

        const handleInner = handle.querySelector('.resize-handle-inner') as HTMLElement;
        Object.assign(handleInner.style, {
            width: '6px',
            height: '20px',
            background: '#666',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        const dots = handle.querySelector('.resize-handle-dots') as HTMLElement;
        Object.assign(dots.style, {
            width: '2px',
            height: '12px',
            background: 'repeating-linear-gradient(to bottom, #fff 0, #fff 1px, transparent 1px, transparent 3px)',
            borderRadius: '1px'
        });

        // 确保blockquote有相对定位
        const computedStyle = window.getComputedStyle(blockquote);
        if (computedStyle.position === 'static') {
            blockquote.style.position = 'relative';
        }

        blockquote.appendChild(handle);

        // 绑定事件
        this.bindHandleEvents(handle, blockquote);
        this.bindHoverEvents(blockquote, handle);
    }

    /**
     * 绑定拖拽手柄事件
     */
    private bindHandleEvents(handle: HTMLElement, blockquote: HTMLElement) {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startResize(e, handle, blockquote);
        });
    }

    /**
     * 绑定hover事件
     */
    private bindHoverEvents(blockquote: HTMLElement, handle: HTMLElement) {
        blockquote.addEventListener('mouseenter', () => {
            if (!this.isDragging) {
                handle.style.opacity = '1';
            }
        });

        blockquote.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                handle.style.opacity = '0';
            }
        });
    }

    /**
     * 开始调整尺寸
     */
    private startResize(e: MouseEvent, handle: HTMLElement, blockquote: HTMLElement) {
        console.log('🚨🚨🚨 测试日志：新版本已生效！🚨🚨🚨');
        console.log('[CalloutResize] 开始拖拽调整');
        
        this.isDragging = true;
        this.currentBlockquote = blockquote;
        this.currentHandle = handle;
        this.startX = e.clientX;

        // 🔥 强制刷新DOM再获取宽度
        console.log('🔥 准备调用getCurrentWidth...');
        console.log('🔥 blockquote元素:', blockquote);
        console.log('🔥 blockquote的data-margin-width:', blockquote.getAttribute('data-margin-width'));
        
        const currentWidth = this.getCurrentWidth(blockquote);
        console.log('🔥 getCurrentWidth返回值:', currentWidth);
        this.startWidth = currentWidth;

        // 添加拖拽状态样式
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        document.body.classList.add('dragging-callout');
        blockquote.classList.add('callout-resizing');
        handle.classList.add('active');

        console.log('[CalloutResize] 开始宽度:', currentWidth);
        console.log('🚨🚨🚨 FORCE DEBUG getCurrentWidth 🚨🚨🚨');
        console.log('marginWidth属性:', blockquote.getAttribute('data-margin-width'));
        console.log('所有属性:', blockquote.getAttributeNames());
    }

    /**
     * 绑定全局事件
     */
    private bindGlobalEvents() {
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.currentBlockquote) {
                this.handleResize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.endResize();
            }
        });
    }

    /**
     * 处理拖拽调整
     */
    private handleResize(e: MouseEvent) {
        if (!this.currentBlockquote || !this.isDragging) return;

        const deltaX = e.clientX - this.startX;
        const containerWidth = this.getContainerWidth();
        
        // 🔧 安全检查：防止startWidth为NaN
        if (isNaN(this.startWidth) || this.startWidth <= 0) {
            console.warn('[CalloutResize] ⚠️ startWidth异常，重新获取:', this.startWidth);
            this.startWidth = this.getCurrentWidth(this.currentBlockquote);
            if (isNaN(this.startWidth)) {
                console.error('[CalloutResize] 💥 无法获取有效宽度，停止拖拽');
                this.endResize();
                return;
            }
        }
        
        // 计算新宽度（基于像素差转换为百分比）
        const widthChangePercent = (deltaX / containerWidth) * 100;
        let newWidthPercent = this.startWidth + widthChangePercent;

        // 限制宽度范围（10% - 100%）
        newWidthPercent = Math.max(10, Math.min(100, newWidthPercent));
        
        // 应用新宽度
        console.log('🔥 准备调用applyWidth, newWidthPercent:', newWidthPercent);
        this.applyWidth(this.currentBlockquote, newWidthPercent);
        console.log('🔥 applyWidth调用完成');

        console.log('[CalloutResize] 调整中 - 新宽度:', newWidthPercent.toFixed(1) + '%');
    }

    /**
     * 结束调整
     */
    private async endResize() {
        if (!this.currentBlockquote || !this.isDragging) return;

        console.log('[CalloutResize] 结束拖拽调整');

        // 🔥 新逻辑：直接从CSS样式读取最终宽度
        const finalWidthStr = this.currentBlockquote.style.getPropertyValue('--margin-width');
        console.log('[CalloutResize] 从CSS样式读取最终宽度:', finalWidthStr);
        
        // 清理拖拽状态
        this.isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('dragging-callout');
        this.currentBlockquote.classList.remove('callout-resizing');

        if (this.currentHandle) {
            this.currentHandle.classList.remove('active');
            this.currentHandle.style.opacity = '0';
        }

        // 🔥 核心：模拟键盘输入来持久化
        if (finalWidthStr) {
            const match = finalWidthStr.match(/^(\d*\.?\d+)%$/);
            if (match) {
                const finalWidth = parseFloat(match[1]);
                console.log('[CalloutResize] 解析出最终宽度:', finalWidth);
                await this.updateTitleWithKeyboardInput(this.currentBlockquote, finalWidth);
            }
        } else {
            console.log('[CalloutResize] ⚠️ 没有找到CSS宽度，跳过持久化');
        }

        this.currentBlockquote = null;
        this.currentHandle = null;
    }

    /**
     * 🔥 核心：通过模拟键盘输入来更新标题并持久化
     */
    private async updateTitleWithKeyboardInput(blockquote: HTMLElement, finalWidth: number) {
        console.log('🔥🔥🔥 updateTitleWithKeyboardInput 开始！🔥🔥🔥');
        console.log('目标宽度:', finalWidth + '%');

        // 1. 找到可编辑的标题div
        const titleDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
        if (!titleDiv) {
            console.error('[CalloutResize] ❌ 找不到可编辑标题div');
            return;
        }

        // 2. 获取原本的标题内容
        const originalContent = titleDiv.textContent?.trim() || '';
        console.log('[CalloutResize] 📝 原标题内容:', originalContent);

        // 3. 解析callout类型
        let calloutType = 'info'; // 默认
        const match = originalContent.match(/^\[!([^|\]]+)(?:\|.*?)?\]$/);
        if (match) {
            calloutType = match[1];
            console.log('[CalloutResize] 🎯 解析出callout类型:', calloutType);
        } else {
            console.warn('[CalloutResize] ⚠️ 无法解析callout类型，使用默认:', calloutType);
        }

        // 4. 生成新的标题内容
        const newContent = finalWidth >= 99 ? `[!${calloutType}]` : `[!${calloutType}|${finalWidth.toFixed(1)}%]`;
        console.log('[CalloutResize] ✏️ 新标题内容:', newContent);

        // 5. 模拟键盘输入替换
        await this.simulateKeyboardInput(titleDiv, newContent);
        
        console.log('🔥🔥🔥 updateTitleWithKeyboardInput 完成！🔥🔥🔥');
    }

    /**
     * 模拟键盘输入
     */
    private async simulateKeyboardInput(titleDiv: HTMLElement, newContent: string) {
        console.log('[CalloutResize] 🔥 开始模拟键盘输入...');
        console.log('[CalloutResize] 原内容:', titleDiv.textContent);
        console.log('[CalloutResize] 新内容:', newContent);
        
        // 聚焦元素
        titleDiv.focus();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 🔧 修复：直接替换内容，不要先删除！
        // 全选内容
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(titleDiv);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // 短暂等待选择生效
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 🔥 一次性设置新内容（替换选中内容）
        titleDiv.textContent = newContent;
        
        // 立即触发input事件
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertReplacementText',
            data: newContent
        });
        titleDiv.dispatchEvent(inputEvent);
        
        // 等待内容更新
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 触发compositionend（确保输入法兼容）
        const compositionEndEvent = new CompositionEvent('compositionend', {
            bubbles: true,
            data: newContent
        });
        titleDiv.dispatchEvent(compositionEndEvent);
        
        // 等待处理
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 🔧 修复：不要模拟回车键！直接触发change和blur即可
        // 触发change事件
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        titleDiv.dispatchEvent(changeEvent);
        
        // 失焦确保保存
        titleDiv.blur();
        
        console.log('[CalloutResize] ✅ 键盘输入模拟完成');
        console.log('[CalloutResize] 最终内容:', titleDiv.textContent);
    }

    /**
     * 获取当前宽度（百分比）
     */
    private getCurrentWidth(blockquote: HTMLElement): number {
        console.log('🚨🚨🚨 getCurrentWidth被调用！🚨🚨🚨');
        console.log('blockquote元素:', blockquote);
        console.log('节点ID:', blockquote.getAttribute('data-node-id'));
        
        const marginWidth = blockquote.getAttribute('data-margin-width');
        console.log('读取到的marginWidth属性:', marginWidth);
        console.log('marginWidth类型:', typeof marginWidth);
        
        if (marginWidth) {
            console.log('marginWidth不为空，开始正则匹配');
            const match = marginWidth.match(/^(\d*\.?\d+)%$/);
            console.log('正则匹配结果:', match);
            
            if (match) {
                const parsed = parseFloat(match[1]);
                console.log('解析出的数字:', parsed);
                console.log('返回解析结果:', parsed);
                return parsed;
            } else {
                console.log('正则匹配失败，返回默认100');
            }
        } else {
            console.log('marginWidth为空，返回默认100');
        }
        
        console.log('最终返回默认宽度100');
        return 100; // 默认全宽
    }

    /**
     * 获取容器宽度
     */
    private getContainerWidth(): number {
        // 找到编辑器容器
        const editorContainer = document.querySelector('.protyle-wysiwyg') as HTMLElement;
        return editorContainer ? editorContainer.offsetWidth : window.innerWidth;
    }

    /**
     * 应用宽度
     */
    private applyWidth(blockquote: HTMLElement, widthPercent: number) {
        console.log('🚨🚨🚨 applyWidth被调用！🚨🚨🚨');
        console.log('传入的widthPercent:', widthPercent);
        console.log('传入的blockquote:', blockquote);
        
        // 🔧 修复：永远保持data-margin-width属性，确保后续拖拽能正确读取
        const widthStr = widthPercent.toFixed(1) + '%';
        console.log('计算出的widthStr:', widthStr);
        
        console.log('设置前的data-margin-width:', blockquote.getAttribute('data-margin-width'));
        blockquote.setAttribute('data-margin-width', widthStr);
        console.log('设置后的data-margin-width:', blockquote.getAttribute('data-margin-width'));
        
        blockquote.style.setProperty('--margin-width', widthStr);
        console.log('设置后的--margin-width:', blockquote.style.getPropertyValue('--margin-width'));
        
        // 验证属性是否真的被设置了
        const allAttrs = blockquote.getAttributeNames();
        console.log('设置后所有属性:', allAttrs);
        console.log('data-margin-width是否存在:', allAttrs.includes('data-margin-width'));
        
        console.log('[CalloutResize] 🎯 应用宽度完成:', widthStr);
    }


    /**
     * 销毁拖拽调整器
     */
    destroy() {
        // 移除所有拖拽手柄
        const handles = document.querySelectorAll('.callout-resize-handle');
        handles.forEach(handle => handle.remove());

        // 清理状态
        this.isDragging = false;
        this.currentBlockquote = null;
        this.currentHandle = null;
    }
}
