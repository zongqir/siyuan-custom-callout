/**
 * Callout拖拽调整功能
 */

import type { CalloutProcessor } from './processor';

export class CalloutDragResizer {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private _processor: CalloutProcessor; // 保留处理器引用，供未来扩展使用
    private isDragging: boolean = false;
    private currentBlockquote: HTMLElement | null = null;
    private currentHandle: HTMLElement | null = null;
    private dragType: 'horizontal' | 'vertical' = 'horizontal';
    private startWidth: number = 0;
    private startHeight: number = 0;
    private startX: number = 0;
    private startY: number = 0;

    constructor(processor: CalloutProcessor) {
        this._processor = processor;
        this.initializeResizer();
        
        // 🎯 设置全局调试接口
        CalloutDragResizer.setupGlobalDebug(this);
        
        // 拖拽调整器初始化完成
    }

    /**
     * 🎯 检测是否处于超级块状态 - 增强版
     */
    private isSuperBlockActive(): boolean {
        // 检测超级块的常见特征 - 扩展列表
        const superBlockSelectors = [
            '.protyle-wysiwyg--select', // 选中状态
            '.protyle-wysiwyg .protyle-action', // 操作栏显示
            '.protyle-gutters', // 侧边栏激活
            '.protyle-breadcrumb', // 面包屑导航
            '.protyle-wysiwyg[data-doc-type="NodeSuperBlock"]', // 超级块类型
            '.layout-tab-container.layout-tab-container--active .protyle-wysiwyg', // 激活的标签页
            '.protyle-wysiwyg .sb', // 超级块容器
            '.protyle-wysiwyg .protyle-attr', // 属性面板
            '.protyle-wysiwyg .protyle-toolbar', // 工具栏
            '.protyle-wysiwyg .fn__flex-1.protyle-wysiwyg', // 编辑器主体
            '.layout__wnd--active .protyle', // 激活的窗口
            'body.body--win32 .protyle' // Windows环境下的protyle
        ];

        const activeElements: string[] = [];
        for (const selector of superBlockSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                activeElements.push(selector);
            }
        }

        if (activeElements.length > 0) {
            return true;
        }

        // 额外检查：是否有任何protyle相关的class在body上
        const bodyClasses = document.body.className;
        if (bodyClasses.includes('protyle') || bodyClasses.includes('siyuan')) {
            return true;
        }

        return false;
    }

    /**
     * 🎯 检测blockquote是否在超级块容器内
     */
    private isInSuperBlock(blockquote: HTMLElement): boolean {
        let parent = blockquote.parentElement;
        while (parent) {
            if (parent.classList.contains('sb') || // 超级块容器
                parent.classList.contains('protyle-wysiwyg') && parent.hasAttribute('data-doc-type') ||
                parent.classList.contains('layout-tab-container')) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
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
     * 为callout添加拖拽手柄 - 强化版
     */
    private addResizeHandle(blockquote: HTMLElement) {
        const nodeId = blockquote.getAttribute('data-node-id');
        console.log('[CalloutResize] 🎯 开始为callout添加拖拽手柄:', {
            nodeId: nodeId,
            hasHorizontal: !!blockquote.querySelector('.callout-resize-handle-horizontal'),
            hasVertical: !!blockquote.querySelector('.callout-resize-handle-vertical'),
            blockquoteRect: blockquote.getBoundingClientRect(),
            inSuperBlock: this.isInSuperBlock(blockquote)
        });

        // 🔧 强化blockquote定位设置
        blockquote.style.setProperty('position', 'relative', 'important');
        blockquote.setAttribute('data-drag-container', 'true');
        
        // 🔧 确保容器不被其他样式干扰 - overflow必须为visible才能显示底部手柄
        blockquote.style.setProperty('overflow', 'visible', 'important');
        
        // 🎯 特别处理：超级块中也要确保overflow可见
        const parentSuperBlock = blockquote.closest('.sb');
        if (parentSuperBlock) {
            (parentSuperBlock as HTMLElement).style.setProperty('overflow', 'visible', 'important');
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

        // 🚀 强制刷新手柄显示和事件
        setTimeout(() => {
            this.forceRefreshHandles(blockquote);
        }, 100);

        const handleCount = blockquote.querySelectorAll('.callout-resize-handle').length;
        console.log('[CalloutResize] ✅ 手柄添加完成，当前手柄数量:', handleCount);
        
        if (handleCount === 0) {
            console.warn('[CalloutResize] ⚠️ 手柄添加失败，尝试备用方案');
            setTimeout(() => {
                this.createFallbackHandles(blockquote);
            }, 200);
        }
    }

    /**
     * 🚀 强制刷新手柄状态
     */
    private forceRefreshHandles(blockquote: HTMLElement) {
        const handles = blockquote.querySelectorAll('.callout-resize-handle') as NodeListOf<HTMLElement>;
        
        handles.forEach((handle, index) => {
            console.log(`[CalloutResize] 🚀 刷新手柄 ${index + 1}:`, {
                className: handle.className,
                visible: handle.offsetWidth > 0 && handle.offsetHeight > 0,
                rect: handle.getBoundingClientRect(),
                zIndex: handle.style.zIndex,
                pointerEvents: handle.style.pointerEvents
            });

            // 强制重新应用样式
            handle.style.setProperty('z-index', '999999', 'important');
            handle.style.setProperty('pointer-events', 'auto', 'important');
            handle.style.setProperty('position', 'absolute', 'important');
            
            // 强制重新绑定事件（清理后重新绑定）
            const newHandle = handle.cloneNode(true) as HTMLElement;
            handle.parentNode?.replaceChild(newHandle, handle);
            this.bindHandleEvents(newHandle, blockquote);
        });
    }

    /**
     * 🆘 备用手柄创建方案
     */
    private createFallbackHandles(blockquote: HTMLElement) {
        console.log('[CalloutResize] 🆘 创建备用拖拽手柄');
        
        // 清理现有手柄
        const existingHandles = blockquote.querySelectorAll('.callout-resize-handle');
        existingHandles.forEach(handle => handle.remove());
        
        // 创建超简单的备用手柄
        const createSimpleHandle = (type: 'horizontal' | 'vertical') => {
            const handle = document.createElement('div');
            handle.className = `callout-resize-handle callout-resize-handle-${type} fallback-handle`;
            handle.setAttribute('data-resize-type', type);
            handle.textContent = type === 'horizontal' ? '⟷' : '⟷';
            
            // 极简样式，确保显示
            Object.assign(handle.style, {
                position: 'absolute',
                zIndex: '999999',
                background: 'red',
                color: 'white',
                padding: '2px',
                fontSize: '12px',
                cursor: type === 'horizontal' ? 'ew-resize' : 'ns-resize',
                border: '1px solid white',
                pointerEvents: 'auto'
            });
            
            if (type === 'horizontal') {
                handle.style.right = '0px';
                handle.style.top = '50%';
                handle.style.transform = 'translateY(-50%)';
            } else {
                handle.style.left = '50%';
                handle.style.bottom = '0px';
                handle.style.transform = 'translateX(-50%)';
            }
            
            blockquote.appendChild(handle);
            this.bindHandleEvents(handle, blockquote);
            
            console.log(`[CalloutResize] 🆘 备用${type}手柄创建完成`);
        };
        
        createSimpleHandle('horizontal');
        createSimpleHandle('vertical');
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
            //console.log('[CalloutResize] 🎯 设置blockquote为relative定位 (水平手柄)');
        }

        // 🚀 JavaScript动态计算手柄高度为callout高度的70%
        const updateHandleSize = () => {
            const blockquoteHeight = blockquote.offsetHeight;
            const handleHeight = Math.max(20, blockquoteHeight * 0.7); // 最小20px，最大70%高度
            const innerHeight = Math.max(12, handleHeight * 0.6); // 内部高度为手柄高度的60%
            const dotsHeight = Math.max(8, innerHeight * 0.8); // 点状区域高度
            
            // 设置手柄高度
            handle.style.setProperty('height', `${handleHeight}px`, 'important');
            
            // 调整内部结构高度
            const handleInner = handle.querySelector('.resize-handle-inner') as HTMLElement;
            if (handleInner) {
                handleInner.style.setProperty('height', `${innerHeight}px`, 'important');
            }
            
            // 调整点状图案高度
            const dots = handle.querySelector('.resize-handle-dots') as HTMLElement;
            if (dots) {
                dots.style.setProperty('height', `${dotsHeight}px`, 'important');
            }
            
   
        };

        // 设置水平手柄基础样式 - 🎯 提高z-index确保在超级块之上
        Object.assign(handle.style, {
            position: 'absolute',
            right: '-8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            cursor: 'ew-resize',
            zIndex: '999999', // 🎯 极高z-index确保在所有超级块UI之上
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            transition: 'opacity 0.2s ease',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto' // 🎯 确保可以接收鼠标事件
        });

        const handleInner = handle.querySelector('.resize-handle-inner') as HTMLElement;
        Object.assign(handleInner.style, {
            width: '6px',
            background: '#666',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        const dots = handle.querySelector('.resize-handle-dots') as HTMLElement;
        Object.assign(dots.style, {
            width: '2px',
            background: 'repeating-linear-gradient(to bottom, #fff 0, #fff 1px, transparent 1px, transparent 3px)',
            borderRadius: '1px'
        });

        // 立即计算并设置尺寸
        setTimeout(updateHandleSize, 10);
        setTimeout(updateHandleSize, 50);
        setTimeout(updateHandleSize, 100);
        setTimeout(updateHandleSize, 200);

        // 监听callout尺寸变化
        const resizeObserver = new ResizeObserver(updateHandleSize);
        resizeObserver.observe(blockquote);

        // 监听窗口变化
        window.addEventListener('resize', updateHandleSize);

        blockquote.appendChild(handle);
        this.bindHandleEvents(handle, blockquote);
       // console.log('[CalloutResize] ✅ 水平手柄创建完成');
        
        // 调试：输出手柄的位置和尺寸信息
        setTimeout(() => {
            // const rect = handle.getBoundingClientRect();
            // const parentRect = blockquote.getBoundingClientRect();
            // console.log('[CalloutResize] 🔍 水平手柄调试信息:', {
            //     // debug info would go here
            // });
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
            
            // 计算手柄位置：水平居中
            const handleWidth = parentWidth / 2; // 宽度为callout宽度的一半
            const handleLeft = (parentWidth - handleWidth) / 2;
            
            // 🎯 使用bottom定位确保手柄完全在容器内部可见
            // 直接设置像素位置 - 使用!important强制应用
            handle.style.setProperty('left', `${handleLeft}px`, 'important');
            handle.style.setProperty('width', `${handleWidth}px`, 'important');
            handle.style.setProperty('bottom', '-6px', 'important'); // 距离底部-6px，让手柄一半露在外面
            handle.style.setProperty('top', 'auto', 'important'); // 清除top
            handle.style.setProperty('transform', 'none', 'important'); // 清除transform
            
          
        };

        // 设置垂直手柄基础样式（与水平手柄风格一致，但尺寸相反）- 使用!important确保样式生效
        handle.style.setProperty('position', 'absolute', 'important');
        handle.style.setProperty('height', '12px', 'important');      // 高度窄，形成水平椭圆
        handle.style.setProperty('cursor', 'ns-resize', 'important');
        handle.style.setProperty('z-index', '999999', 'important'); // 🎯 极高z-index确保在所有超级块UI之上
        handle.style.setProperty('display', 'flex', 'important');
        handle.style.setProperty('align-items', 'center', 'important');
        handle.style.setProperty('justify-content', 'center', 'important');
        handle.style.setProperty('opacity', '0', 'important');
        handle.style.setProperty('transition', 'opacity 0.2s ease', 'important');
        handle.style.setProperty('background', 'rgba(0, 0, 0, 0.3)', 'important');  // 与水平手柄相同的背景
        handle.style.setProperty('border-radius', '6px', 'important');               // 调整圆角适应新高度
        handle.style.setProperty('backdrop-filter', 'blur(4px)', 'important');       // 与水平手柄相同的模糊效果
        handle.style.setProperty('pointer-events', 'auto', 'important'); // 🎯 确保可以接收鼠标事件

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
        // console.log('[CalloutResize] ✅ 垂直手柄创建完成');
    }

    /**
     * 绑定拖拽手柄事件
     */
    private bindHandleEvents(handle: HTMLElement, blockquote: HTMLElement) {
        // 确保手柄可以接收事件
        handle.style.setProperty('pointer-events', 'auto', 'important');
        handle.style.setProperty('user-select', 'none', 'important');
        handle.setAttribute('data-drag-enabled', 'true');

        const mousedownHandler = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.startResize(e, handle, blockquote);
        };

        // 直接事件属性绑定（备用方案）
        handle.onmousedown = mousedownHandler;

        // 多种模式addEventListener
        handle.addEventListener('mousedown', mousedownHandler, true); // 捕获阶段
        handle.addEventListener('mousedown', mousedownHandler, false); // 冒泡阶段

        // 触摸事件支持
        const touchHandler = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: false,
                cancelable: true
            });
            this.startResize(mouseEvent, handle, blockquote);
        };

        handle.addEventListener('touchstart', touchHandler, true);
        handle.addEventListener('touchstart', touchHandler, false);

        // 防止右键菜单干扰
        handle.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    /**
     * 绑定blockquote的hover事件（只绑定一次）
     */
    private bindHoverEventsToBlockquote(blockquote: HTMLElement) {
        // console.log('[CalloutResize] 🔗 绑定blockquote的hover事件');
        
        blockquote.addEventListener('mouseenter', () => {
            if (!this.isDragging) {
                const allHandles = blockquote.querySelectorAll('.callout-resize-handle');
                allHandles.forEach(h => {
                    const handle = h as HTMLElement;
                    handle.style.opacity = '1'; // 🎯 悬停时显示所有手柄
                });
            }
        });

        blockquote.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                const allHandles = blockquote.querySelectorAll('.callout-resize-handle');
                allHandles.forEach(h => {
                    const handle = h as HTMLElement;
                    handle.style.opacity = '0'; // 🎯 离开时隐藏所有手柄
                });
            }
        });
    }

    /**
     * 开始调整尺寸 - 超级块专用方案
     */
    private startResize(e: MouseEvent, handle: HTMLElement, blockquote: HTMLElement) {
        // 🎯 检测超级块状态并应用特殊处理
        const inSuperBlock = this.isSuperBlockActive() || this.isInSuperBlock(blockquote);
        
        if (inSuperBlock) {
            this.startPollingDrag(e, handle, blockquote);
            return;
        }

        // 普通拖拽方案 
        this.startNormalDrag(e, handle, blockquote);
    }

    /**
     * 🚀 轮询拖拽方案（专门应对超级块阻止mousemove的情况）
     */
    private startPollingDrag(e: MouseEvent, handle: HTMLElement, blockquote: HTMLElement) {
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
        handle.style.opacity = '1';

        // 轮询检测鼠标位置变化
        let lastX = e.clientX;
        let lastY = e.clientY;
        let isMouseDown = true;
        
        const pollInterval = setInterval(() => {
            // 获取当前鼠标位置
            const getMousePos = () => {
                return new Promise<{x: number, y: number}>((resolve) => {
                    const tempHandler = (event: MouseEvent) => {
                        resolve({x: event.clientX, y: event.clientY});
                        document.removeEventListener('mousemove', tempHandler);
                        document.removeEventListener('mouseenter', tempHandler);
                        document.removeEventListener('mouseover', tempHandler);
                    };
                    
                    document.addEventListener('mousemove', tempHandler, {once: true, capture: true});
                    document.addEventListener('mouseenter', tempHandler, {once: true, capture: true});
                    document.addEventListener('mouseover', tempHandler, {once: true, capture: true});
                    
                    setTimeout(() => {
                        document.removeEventListener('mousemove', tempHandler);
                        document.removeEventListener('mouseenter', tempHandler); 
                        document.removeEventListener('mouseover', tempHandler);
                        resolve({x: lastX, y: lastY});
                    }, 10);
                });
            };

            if (!this.isDragging) {
                clearInterval(pollInterval);
                return;
            }

            getMousePos().then(pos => {
                const deltaX = pos.x - lastX;
                const deltaY = pos.y - lastY;
                
                if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
                    lastX = pos.x;
                    lastY = pos.y;
                    
                    const simulatedEvent = new MouseEvent('mousemove', {
                        clientX: pos.x,
                        clientY: pos.y,
                        bubbles: false,
                        cancelable: true
                    });
                    
                    this.handleResize(simulatedEvent);
                }
            });

            const checkMouseUp = () => {
                const mouseupHandler = () => {
                    isMouseDown = false;
                    clearInterval(pollInterval);
                    this.endResize();
                    document.removeEventListener('mouseup', mouseupHandler);
                };
                
                document.addEventListener('mouseup', mouseupHandler, {once: true, capture: true});
            };
            
            if (isMouseDown) {
                checkMouseUp();
            }
            
        }, 16); // 60fps
    }

    /**
     * 🎯 标准拖拽方案（非超级块状态）
     */
    private startNormalDrag(e: MouseEvent, handle: HTMLElement, blockquote: HTMLElement) {
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
        handle.style.opacity = '1';
        
    }

    /**
     * 绑定全局事件
     */
    private bindGlobalEvents() {
        // 标准事件监听
        const mousemoveHandler = (e: MouseEvent) => {
            if (this.isDragging && this.currentBlockquote) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.handleResize(e);
            }
        };

        const mouseupHandler = (e: MouseEvent) => {
            if (this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.endResize();
            }
        };

        // 多重绑定策略
        document.addEventListener('mousemove', mousemoveHandler, true);
        document.addEventListener('mousemove', mousemoveHandler, false);
        document.addEventListener('mouseup', mouseupHandler, true);  
        document.addEventListener('mouseup', mouseupHandler, false);

        window.addEventListener('mousemove', mousemoveHandler, true);
        window.addEventListener('mouseup', mouseupHandler, true);

        document.body.addEventListener('mousemove', mousemoveHandler, true);
        document.body.addEventListener('mouseup', mouseupHandler, true);

        // 触摸事件支持
        const touchmoveHandler = (e: TouchEvent) => {
            if (this.isDragging && this.currentBlockquote) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    bubbles: false,
                    cancelable: true
                });
                this.handleResize(mouseEvent);
            }
        };

        const touchendHandler = (e: TouchEvent) => {
            if (this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.endResize();
            }
        };

        document.addEventListener('touchmove', touchmoveHandler, true);
        document.addEventListener('touchend', touchendHandler, true);
        window.addEventListener('touchmove', touchmoveHandler, true);
        window.addEventListener('touchend', touchendHandler, true);
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
        
        // 🎯 恢复超级块的交互功能
        document.body.style.removeProperty('pointer-events');
        this.currentBlockquote.style.removeProperty('pointer-events');
        
        // 恢复被禁用的超级块元素
        const disabledElements = document.querySelectorAll('[data-drag-disabled="true"]');
        disabledElements.forEach(el => {
            (el as HTMLElement).style.removeProperty('pointer-events');
            (el as HTMLElement).removeAttribute('data-drag-disabled');
        });
        
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
                // 拖拽结束，恢复超级块交互功能
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
        
        // 🎯 保留当前的折叠状态（从DOM属性读取）
        const currentCollapsed = blockquote.getAttribute('data-collapsed');
        if (currentCollapsed === 'true') {
            parsed.collapsed = true;
        } else if (currentCollapsed === 'false') {
            parsed.collapsed = false;
        }
        // 如果没有 data-collapsed 属性，保持 parsed.collapsed 原有值
        
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
     * 解析callout标题，提取类型、宽度、高度、折叠状态
     */
    private parseCalloutTitle(content: string): {type: string, width: number | null, height: number | null, collapsed: boolean | null} {
        const result = {type: 'info', width: null as number | null, height: null as number | null, collapsed: null as boolean | null};
        
        // 匹配 [!type] 或 [!type|params]，支持折叠标记 +/-
        const match = content.match(/^\[!([^|\]]+)(?:\|(.+?))?\]([+-])?$/);
        if (match) {
            result.type = match[1];
            const collapseMarker = match[3];
            
            // 解析折叠标记
            if (collapseMarker === '-') {
                result.collapsed = true;
            } else if (collapseMarker === '+') {
                result.collapsed = false;
            }
            
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
    private generateCalloutTitle(parsed: {type: string, width: number | null, height: number | null, collapsed: boolean | null}): string {
        const params: string[] = [];
        
        if (parsed.width !== null) {
            params.push(`${parsed.width.toFixed(1)}%`);
        }
        
        if (parsed.height !== null) {
            params.push(`${Math.round(parsed.height)}px`);
        }
        
        // 构建基础标题
        let title = '';
        if (params.length === 0) {
            title = `[!${parsed.type}]`;
        } else {
            title = `[!${parsed.type}|${params.join('|')}]`;
        }
        
        // 添加折叠标记
        if (parsed.collapsed === true) {
            title += '-';
        } else if (parsed.collapsed === false) {
            title += '+';
        }
        // collapsed === null 时不添加标记
        
        return title;
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
        // 直接返回实际DOM高度，而不是CSS变量中的高度
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
        
        // 强制应用样式
        blockquote.setAttribute('data-margin-height', heightStr);
        blockquote.style.setProperty('--margin-height', heightStr, 'important');
        blockquote.style.setProperty('min-height', heightStr, 'important');
        blockquote.style.setProperty('height', heightStr, 'important');
        
        // 额外的强制样式确保生效
        blockquote.style.setProperty('max-height', 'none', 'important');
        blockquote.style.setProperty('flex-shrink', '0', 'important');
    }

    /**
     * 🔍 全局调试工具 - 诊断拖拽问题
     */
    debugDragIssues() {
        console.log('\n🔍 ========== CalloutResize 调试报告 ==========');
        console.log('🔧 处理器实例:', this._processor ? '已加载' : '未加载');
        
        const allCallouts = document.querySelectorAll('.bq[custom-callout]');
        console.log(`📊 发现 ${allCallouts.length} 个Callout`);
        
        allCallouts.forEach((callout, index) => {
            const nodeId = callout.getAttribute('data-node-id');
            const handles = callout.querySelectorAll('.callout-resize-handle');
            const rect = callout.getBoundingClientRect();
            
            console.log(`\n📋 Callout ${index + 1}:`, {
                nodeId,
                handleCount: handles.length,
                rect: {
                    width: rect.width,
                    height: rect.height,
                    visible: rect.width > 0 && rect.height > 0
                },
                inSuperBlock: this.isInSuperBlock(callout as HTMLElement),
                superBlockActive: this.isSuperBlockActive()
            });
            
            handles.forEach((handle, hIndex) => {
                const hRect = handle.getBoundingClientRect();
                const styles = window.getComputedStyle(handle as HTMLElement);
                
                console.log(`  🎯 手柄 ${hIndex + 1}:`, {
                    type: handle.getAttribute('data-resize-type'),
                    className: handle.className,
                    rect: hRect,
                    visible: hRect.width > 0 && hRect.height > 0,
                    zIndex: styles.zIndex,
                    pointerEvents: styles.pointerEvents,
                    position: styles.position,
                    opacity: styles.opacity
                });
            });
        });
        
        // 检查超级块状态
        console.log('\n🎯 超级块状态检查:');
        console.log('- isSuperBlockActive():', this.isSuperBlockActive());
        console.log('- body classes:', document.body.className);
        
        // 检查可能干扰的元素
        const potentialBlockers = [
            '.protyle-action',
            '.protyle-gutters', 
            '.protyle-breadcrumb',
            '.layout-tab-container'
        ];
        
        console.log('\n🚫 潜在干扰元素:');
        potentialBlockers.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`- ${selector}: ${elements.length} 个`);
            }
        });
        
        console.log('\n🔧 建议操作:');
        console.log('1. 如果手柄不可见，尝试悬停在Callout上');
        console.log('2. 如果手柄可见但无法拖拽，检查控制台错误');
        console.log('3. 如果在超级块中，尝试切换到普通编辑模式');
        console.log('========================================\n');
        
        // 自动尝试修复
        this.autoFixDragIssues();
    }

    /**
     * 🛠️ 自动修复拖拽问题
     */
    private autoFixDragIssues() {
        console.log('🛠️ 开始自动修复拖拽问题...');
        
        const brokenCallouts = document.querySelectorAll('.bq[custom-callout]');
        
        brokenCallouts.forEach((callout) => {
            const handles = callout.querySelectorAll('.callout-resize-handle');
            
            // 如果没有手柄或手柄不可见，重新创建
            if (handles.length === 0) {
                console.log('🔧 重新创建缺失的拖拽手柄');
                this.addResizeHandle(callout as HTMLElement);
            } else {
                // 检查现有手柄是否工作正常
                let needsRefresh = false;
                handles.forEach(handle => {
                    const rect = handle.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) {
                        needsRefresh = true;
                    }
                });
                
                if (needsRefresh) {
                    console.log('🔧 刷新现有拖拽手柄');
                    this.forceRefreshHandles(callout as HTMLElement);
                }
            }
        });
        
        console.log('🛠️ 自动修复完成');
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

    /**
     * 🎯 公开调试接口供外部调用
     */
    static setupGlobalDebug(instance: CalloutDragResizer) {
        // 将调试功能暴露到全局
        (window as any).debugCalloutDrag = () => instance.debugDragIssues();
        console.log('🎯 全局调试已设置，使用 debugCalloutDrag() 来调试拖拽问题');
    }
}