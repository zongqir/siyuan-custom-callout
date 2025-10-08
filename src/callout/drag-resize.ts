/**
 * Callout拖拽调整功能
 */

import type { CalloutProcessor } from './processor';

export class CalloutDragResizer {
    private processor: CalloutProcessor;
    private isDragging: boolean = false;
    private currentBlockquote: HTMLElement | null = null;
    private currentHandle: HTMLElement | null = null;
    private dragType: 'horizontal' | 'vertical' = 'horizontal';
    private startWidth: number = 0;
    private startHeight: number = 0;
    private startX: number = 0;
    private startY: number = 0;

    constructor(processor: CalloutProcessor) {
        this.processor = processor;
        this.initializeResizer();
    }

    /**
     * 初始化拖拽调整功能
     */
    private initializeResizer() {
        setTimeout(() => {
            this.addResizeHandlesToExistingCallouts();
            
            // 监听DOM变化，为新的callout添加拖拽手柄
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as HTMLElement;
                            
                            const callouts = element.classList?.contains('bq') && element.hasAttribute('custom-callout') 
                                ? [element] 
                                : element.querySelectorAll?.('.bq[custom-callout]') || [];
                            
                            callouts.forEach((callout) => {
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

            this.bindGlobalEvents();
            this.startPeriodicCheck();
        }, 500);
    }

    /**
     * 为现有的callout添加拖拽手柄
     */
    private addResizeHandlesToExistingCallouts() {
        const existingCallouts = document.querySelectorAll('.bq[custom-callout]');
        existingCallouts.forEach((callout) => {
            this.addResizeHandle(callout as HTMLElement);
        });
    }

    /**
     * 定期检查并添加遗漏的拖拽手柄
     */
    private startPeriodicCheck() {
        setInterval(() => {
            const allCallouts = document.querySelectorAll('.bq[custom-callout]');
            const calloutsNeedingHandles: HTMLElement[] = [];
            
            allCallouts.forEach((callout) => {
                const hasHorizontal = !!callout.querySelector('.callout-resize-handle-horizontal');
                const hasVertical = !!callout.querySelector('.callout-resize-handle-vertical');
                
                // 如果缺少任一手柄，就需要补充
                if (!hasHorizontal || !hasVertical) {
                    calloutsNeedingHandles.push(callout as HTMLElement);
                }
            });
            
            if (calloutsNeedingHandles.length > 0) {
                calloutsNeedingHandles.forEach((callout) => {
                    this.addResizeHandle(callout);
                });
            }
        }, 2000);
    }

    /**
     * 为callout添加拖拽手柄
     */
    private addResizeHandle(blockquote: HTMLElement) {
        console.log('[CalloutResize] 🎯 开始为callout添加拖拽手柄:', {
            nodeId: blockquote.getAttribute('data-node-id'),
            hasHorizontal: !!blockquote.querySelector('.callout-resize-handle-horizontal'),
            hasVertical: !!blockquote.querySelector('.callout-resize-handle-vertical')
        });

        // 确保blockquote有相对定位
        const computedStyle = window.getComputedStyle(blockquote);
        if (computedStyle.position === 'static') {
            blockquote.style.position = 'relative';
        }

        let needsHoverBinding = false;

        // 分别检查并创建水平和垂直手柄
        if (!blockquote.querySelector('.callout-resize-handle-horizontal')) {
            console.log('[CalloutResize] 🔧 创建水平拖拽手柄');
            this.createHorizontalHandle(blockquote);
            needsHoverBinding = true;
        }
        
        if (!blockquote.querySelector('.callout-resize-handle-vertical')) {
            console.log('[CalloutResize] 🔧 创建垂直拖拽手柄');
            this.createVerticalHandle(blockquote);
            needsHoverBinding = true;
        }

        // 只在添加了新手柄时才绑定hover事件（避免重复绑定）
        if (needsHoverBinding && !blockquote.hasAttribute('data-hover-bound')) {
            console.log('[CalloutResize] 🔗 绑定hover事件');
            this.bindHoverEventsToBlockquote(blockquote);
            blockquote.setAttribute('data-hover-bound', 'true');
        }

        console.log('[CalloutResize] ✅ 手柄添加完成，当前手柄数量:', 
            blockquote.querySelectorAll('.callout-resize-handle').length);
    }

    /**
     * 创建水平拖拽手柄（调整宽度）
     */
    private createHorizontalHandle(blockquote: HTMLElement) {
        const handle = document.createElement('div');
        handle.className = 'callout-resize-handle callout-resize-handle-horizontal';
        handle.title = '拖拽调整宽度';
        handle.setAttribute('data-resize-type', 'horizontal');
        handle.innerHTML = `
            <div class="resize-handle-inner">
                <div class="resize-handle-dots"></div>
            </div>
        `;

        // 🎯 确保父元素blockquote有相对定位
        if (blockquote.style.position !== 'relative') {
            blockquote.style.position = 'relative';
            console.log('[CalloutResize] 🎯 设置blockquote为relative定位 (水平手柄)');
        }

        // 设置水平手柄样式
        Object.assign(handle.style, {
            position: 'absolute',
            right: '-8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '40px',
            cursor: 'ew-resize',
            zIndex: '1000',  // 修改：与垂直手柄保持一致
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            transition: 'opacity 0.2s ease',
            background: 'rgba(0, 0, 0, 0.3)',  // 修改：增加不透明度
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
            border: '2px solid rgba(0, 255, 0, 0.5)'  // 添加：绿色边框用于调试
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

        blockquote.appendChild(handle);
        this.bindHandleEvents(handle, blockquote);
        console.log('[CalloutResize] ✅ 水平手柄创建完成');
        
        // 调试：输出手柄的位置和尺寸信息
        setTimeout(() => {
            const rect = handle.getBoundingClientRect();
            const parentRect = blockquote.getBoundingClientRect();
            console.log('[CalloutResize] 🔍 水平手柄调试信息:', {
                手柄位置: {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    right: rect.right
                },
                父元素位置: {
                    left: parentRect.left,
                    top: parentRect.top,
                    width: parentRect.width,
                    height: parentRect.height,
                    right: parentRect.right
                },
                相对位置: {
                    相对左边距: rect.left - parentRect.left,
                    相对顶部距: rect.top - parentRect.top,
                    是否在父元素右侧: rect.left >= parentRect.right - 20
                }
            });
        }, 100);
    }

    /**
     * 创建垂直拖拽手柄（调整高度）
     */
    private createVerticalHandle(blockquote: HTMLElement) {
        // 确保blockquote有相对定位
        const computedStyle = window.getComputedStyle(blockquote);
        if (computedStyle.position === 'static') {
            blockquote.style.position = 'relative';
        }

        const handle = document.createElement('div');
        handle.className = 'callout-resize-handle callout-resize-handle-vertical';
        handle.title = '拖拽调整高度';
        handle.setAttribute('data-resize-type', 'vertical');
        handle.innerHTML = `
            <div class="resize-handle-inner">
                <div class="resize-handle-dots"></div>
            </div>
        `;

        // 🚀 JavaScript直接计算位置：强制放到底部中央！
        const updatePosition = () => {
            const parentStyle = window.getComputedStyle(blockquote);
            
            // 计算父元素内部可用区域
            const parentWidth = blockquote.offsetWidth - parseFloat(parentStyle.paddingLeft || '0') - parseFloat(parentStyle.paddingRight || '0');
            const parentHeight = blockquote.offsetHeight;
            
            // 计算手柄位置：水平居中，垂直在底部
            const handleWidth = parentWidth / 2; // 宽度为callout宽度的一半
            const handleLeft = (parentWidth - handleWidth) / 2;
            const handleTop = parentHeight - 5; // 距离底部5px
            
            // 直接设置像素位置 - 使用!important强制应用
            handle.style.setProperty('left', `${handleLeft}px`, 'important');
            handle.style.setProperty('top', `${handleTop}px`, 'important');
            handle.style.setProperty('width', `${handleWidth}px`, 'important');
            handle.style.setProperty('bottom', 'auto', 'important'); // 清除bottom
            handle.style.setProperty('transform', 'none', 'important'); // 清除transform
            
            console.log('[CalloutResize] 🚀 JavaScript强制定位:', {
                父元素尺寸: { width: parentWidth, height: parentHeight },
                计算位置: { left: handleLeft, top: handleTop },
                手柄宽度: handleWidth,
                实际设置: { left: `${handleLeft}px`, top: `${handleTop}px`, width: `${handleWidth}px` }
            });
        };

        // 设置垂直手柄基础样式（与水平手柄风格一致，但尺寸相反）- 使用!important确保样式生效
        handle.style.setProperty('position', 'absolute', 'important');
        handle.style.setProperty('height', '12px', 'important');      // 高度窄，形成水平椭圆
        handle.style.setProperty('cursor', 'ns-resize', 'important');
        handle.style.setProperty('z-index', '1000', 'important');
        handle.style.setProperty('display', 'flex', 'important');
        handle.style.setProperty('align-items', 'center', 'important');
        handle.style.setProperty('justify-content', 'center', 'important');
        handle.style.setProperty('opacity', '0', 'important');
        handle.style.setProperty('transition', 'opacity 0.2s ease', 'important');
        handle.style.setProperty('background', 'rgba(0, 0, 0, 0.3)', 'important');  // 与水平手柄相同的背景
        handle.style.setProperty('border-radius', '6px', 'important');               // 调整圆角适应新高度
        handle.style.setProperty('backdrop-filter', 'blur(4px)', 'important');       // 与水平手柄相同的模糊效果

        // 设置内部结构样式
        const handleInner = handle.querySelector('.resize-handle-inner') as HTMLElement;
        Object.assign(handleInner.style, {
            height: '4px',          // 内部高度更窄，适应12px的外部高度
            width: '20px',          // 宽度保持较宽，形成水平椭圆内部
            background: '#666',
            borderRadius: '2px',    // 调整内部圆角
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        const dots = handle.querySelector('.resize-handle-dots') as HTMLElement;
        // 使用!important强制应用水平点状图案
        dots.style.setProperty('width', '12px', 'important');
        dots.style.setProperty('height', '2px', 'important');  
        dots.style.setProperty('background', 'repeating-linear-gradient(to right, #fff 0, #fff 1px, transparent 1px, transparent 3px)', 'important');
        dots.style.setProperty('border-radius', '1px', 'important');

        // 立即执行一次定位
        setTimeout(updatePosition, 10);
        
        // 多次重试定位，确保成功
        setTimeout(updatePosition, 50);
        setTimeout(updatePosition, 100);
        setTimeout(updatePosition, 200);
        
        // 监听窗口大小变化以更新位置
        const resizeObserver = new ResizeObserver(updatePosition);
        resizeObserver.observe(blockquote);
        
        // 监听窗口resize事件
        window.addEventListener('resize', updatePosition);

        blockquote.appendChild(handle);
        this.bindHandleEvents(handle, blockquote);
        console.log('[CalloutResize] ✅ 垂直手柄创建完成');
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
     * 绑定blockquote的hover事件（只绑定一次）
     */
    private bindHoverEventsToBlockquote(blockquote: HTMLElement) {
        console.log('[CalloutResize] 🔗 绑定blockquote的hover事件');
        
        blockquote.addEventListener('mouseenter', () => {
            if (!this.isDragging) {
                console.log('[CalloutResize] 🐭 鼠标进入callout，显示所有手柄');
                const allHandles = blockquote.querySelectorAll('.callout-resize-handle');
                allHandles.forEach(h => {
                    const handle = h as HTMLElement;
                    handle.style.opacity = '1'; // 🎯 悬停时显示所有手柄
                });
            }
        });

        blockquote.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                console.log('[CalloutResize] 🐭 鼠标离开callout，隐藏所有手柄');
                const allHandles = blockquote.querySelectorAll('.callout-resize-handle');
                allHandles.forEach(h => {
                    const handle = h as HTMLElement;
                    handle.style.opacity = '0'; // 🎯 离开时隐藏所有手柄
                });
            }
        });
    }

    /**
     * 开始调整尺寸
     */
    private startResize(e: MouseEvent, handle: HTMLElement, blockquote: HTMLElement) {
        this.isDragging = true;
        this.currentBlockquote = blockquote;
        this.currentHandle = handle;
        
        // 判断拖拽类型
        const resizeType = handle.getAttribute('data-resize-type');
        this.dragType = resizeType === 'vertical' ? 'vertical' : 'horizontal';
        
        if (this.dragType === 'horizontal') {
            this.startX = e.clientX;
            this.startWidth = this.getCurrentWidth(blockquote);
            document.body.style.cursor = 'ew-resize';
        } else {
            this.startY = e.clientY;
            this.startHeight = this.getCurrentHeight(blockquote);
            document.body.style.cursor = 'ns-resize';
        }

        // 添加拖拽状态样式
        document.body.style.userSelect = 'none';
        document.body.classList.add('dragging-callout');
        blockquote.classList.add('callout-resizing');
        handle.classList.add('active');
        
        // 🎯 确保拖拽的手柄在拖拽期间保持可见
        handle.style.opacity = '1';
        console.log('[CalloutResize] 🎯 拖拽开始，强制显示手柄');
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

        if (this.dragType === 'horizontal') {
            this.handleHorizontalResize(e);
        } else {
            this.handleVerticalResize(e);
        }
    }

    /**
     * 处理水平拖拽调整（宽度）
     */
    private handleHorizontalResize(e: MouseEvent) {
        const deltaX = e.clientX - this.startX;
        const containerWidth = this.getContainerWidth();
        
        // 安全检查：防止startWidth为NaN
        if (isNaN(this.startWidth) || this.startWidth <= 0) {
            this.startWidth = this.getCurrentWidth(this.currentBlockquote!);
            if (isNaN(this.startWidth)) {
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
        this.applyWidth(this.currentBlockquote!, newWidthPercent);
    }

    /**
     * 处理垂直拖拽调整（高度）
     */
    private handleVerticalResize(e: MouseEvent) {
        const deltaY = e.clientY - this.startY;
        
        // 安全检查：防止startHeight为NaN
        if (isNaN(this.startHeight) || this.startHeight <= 0) {
            this.startHeight = this.getCurrentHeight(this.currentBlockquote!);
            if (isNaN(this.startHeight)) {
                this.endResize();
                return;
            }
        }
        
        // 计算新高度（像素值）
        let newHeightPx = this.startHeight + deltaY;

        // 限制高度范围（50px - 1000px）
        newHeightPx = Math.max(50, Math.min(1000, newHeightPx));
        
        // 应用新高度
        this.applyHeight(this.currentBlockquote!, newHeightPx);
    }

    /**
     * 结束调整
     */
    private async endResize() {
        if (!this.currentBlockquote || !this.isDragging) return;

        // 根据拖拽类型读取最终值
        let finalWidth: number | null = null;
        let finalHeight: number | null = null;

        if (this.dragType === 'horizontal') {
            const finalWidthStr = this.currentBlockquote.style.getPropertyValue('--margin-width');
            if (finalWidthStr) {
                const match = finalWidthStr.match(/^(\d*\.?\d+)%$/);
                if (match) {
                    finalWidth = parseFloat(match[1]);
                }
            }
        } else {
            const finalHeightStr = this.currentBlockquote.style.getPropertyValue('--margin-height');
            if (finalHeightStr) {
                const match = finalHeightStr.match(/^(\d*\.?\d+)px$/);
                if (match) {
                    finalHeight = parseFloat(match[1]);
                }
            }
        }
        
        // 清理拖拽状态
        this.isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('dragging-callout');
        this.currentBlockquote.classList.remove('callout-resizing');

        if (this.currentHandle) {
            this.currentHandle.classList.remove('active');
            
            // 🎯 拖拽结束后，保持手柄显示让用户能看到
            setTimeout(() => {
                console.log('[CalloutResize] 🎯 拖拽结束，保持手柄显示让用户能看到');
                // 如果用户真的想隐藏，可以移开鼠标触发mouseleave
            }, 100);
        }

        // 模拟键盘输入来持久化
        await this.updateTitleWithKeyboardInput(this.currentBlockquote, finalWidth, finalHeight);

        this.currentBlockquote = null;
        this.currentHandle = null;
    }

    /**
     * 通过模拟键盘输入来更新标题并持久化
     */
    private async updateTitleWithKeyboardInput(blockquote: HTMLElement, finalWidth: number | null, finalHeight: number | null) {
        // 找到可编辑的标题div
        const titleDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
        if (!titleDiv) {
            console.error('[CalloutResize] 找不到可编辑标题div');
            return;
        }

        // 获取原本的标题内容
        const originalContent = titleDiv.textContent?.trim() || '';

        // 解析现有的callout格式
        const parsed = this.parseCalloutTitle(originalContent);
        
        // 更新宽度或高度
        if (finalWidth !== null) {
            parsed.width = finalWidth >= 99 ? null : finalWidth;
        }
        if (finalHeight !== null) {
            parsed.height = finalHeight;
        }

        // 生成新的标题内容
        const newContent = this.generateCalloutTitle(parsed);

        // 模拟键盘输入替换
        await this.simulateKeyboardInput(titleDiv, newContent);
    }

    /**
     * 解析callout标题，提取类型、宽度、高度
     */
    private parseCalloutTitle(content: string): {type: string, width: number | null, height: number | null} {
        const result = {type: 'info', width: null as number | null, height: null as number | null};
        
        // 匹配 [!type] 或 [!type|params]
        const match = content.match(/^\[!([^|\]]+)(?:\|(.+?))?\]$/);
        if (match) {
            result.type = match[1];
            
            if (match[2]) {
                // 解析参数：width%|heightpx 或 width% 或 heightpx
                const params = match[2].split('|');
                for (const param of params) {
                    const trimmed = param.trim();
                    if (trimmed.endsWith('%')) {
                        // 宽度参数
                        const widthMatch = trimmed.match(/^(\d*\.?\d+)%$/);
                        if (widthMatch) {
                            result.width = parseFloat(widthMatch[1]);
                        }
                    } else if (trimmed.endsWith('px')) {
                        // 高度参数
                        const heightMatch = trimmed.match(/^(\d*\.?\d+)px$/);
                        if (heightMatch) {
                            result.height = parseFloat(heightMatch[1]);
                        }
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * 生成新的callout标题
     */
    private generateCalloutTitle(parsed: {type: string, width: number | null, height: number | null}): string {
        const params: string[] = [];
        
        if (parsed.width !== null) {
            params.push(`${parsed.width.toFixed(1)}%`);
        }
        
        if (parsed.height !== null) {
            params.push(`${Math.round(parsed.height)}px`);
        }
        
        if (params.length === 0) {
            return `[!${parsed.type}]`;
        } else {
            return `[!${parsed.type}|${params.join('|')}]`;
        }
    }

    /**
     * 模拟键盘输入
     */
    private async simulateKeyboardInput(titleDiv: HTMLElement, newContent: string) {
        // 聚焦元素
        titleDiv.focus();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 全选内容
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(titleDiv);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // 短暂等待选择生效
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 一次性设置新内容（替换选中内容）
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
        
        // 触发change事件
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        titleDiv.dispatchEvent(changeEvent);
        
        // 失焦确保保存
        titleDiv.blur();
    }

    /**
     * 获取当前宽度（百分比）
     */
    private getCurrentWidth(blockquote: HTMLElement): number {
        const marginWidth = blockquote.getAttribute('data-margin-width');
        if (marginWidth) {
            const match = marginWidth.match(/^(\d*\.?\d+)%$/);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        return 100; // 默认全宽
    }

    /**
     * 获取当前高度（像素）
     */
    private getCurrentHeight(blockquote: HTMLElement): number {
        const marginHeight = blockquote.getAttribute('data-margin-height');
        if (marginHeight) {
            const match = marginHeight.match(/^(\d*\.?\d+)px$/);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        // 返回当前实际高度或默认值
        return blockquote.offsetHeight || 120;
    }

    /**
     * 获取容器宽度
     */
    private getContainerWidth(): number {
        const editorContainer = document.querySelector('.protyle-wysiwyg') as HTMLElement;
        return editorContainer ? editorContainer.offsetWidth : window.innerWidth;
    }

    /**
     * 应用宽度
     */
    private applyWidth(blockquote: HTMLElement, widthPercent: number) {
        const widthStr = widthPercent.toFixed(1) + '%';
        blockquote.setAttribute('data-margin-width', widthStr);
        blockquote.style.setProperty('--margin-width', widthStr);
    }

    /**
     * 应用高度
     */
    private applyHeight(blockquote: HTMLElement, heightPx: number) {
        const heightStr = Math.round(heightPx) + 'px';
        blockquote.setAttribute('data-margin-height', heightStr);
        blockquote.style.setProperty('--margin-height', heightStr);
        blockquote.style.setProperty('min-height', heightStr);
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