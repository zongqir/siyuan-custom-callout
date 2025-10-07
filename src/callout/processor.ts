import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig, ParsedCalloutCommand } from './types';

/**
 * Callout处理器 - 负责检测和转换引用块为Callout样式
 */
export class CalloutProcessor {
    private calloutTypes: Map<string, CalloutTypeConfig> = new Map();
    private trackedBlockQuotes: Set<string> = new Set();
    private recentlyCreatedBlockQuotes: Set<string> = new Set();
    private isInitialLoad: boolean = true;

    constructor() {
        this.loadDefaultTypes();
        
        // 2秒后结束初始加载状态
        setTimeout(() => {
            this.isInitialLoad = false;
        }, 2000);
    }

    /**
     * 加载默认的Callout类型
     */
    private loadDefaultTypes() {
        DEFAULT_CALLOUT_TYPES.forEach(config => {
            // 英文命令
            this.calloutTypes.set(config.command, config);
            // 中文命令
            if (config.zhCommand) {
                this.calloutTypes.set(config.zhCommand, config);
            }
        });
    }

    /**
     * 更新 Callout 类型（动态配置）
     */
    updateTypes(types: CalloutTypeConfig[]) {
        this.calloutTypes.clear();
        types.forEach(config => {
            this.calloutTypes.set(config.command, config);
            if (config.zhCommand) {
                this.calloutTypes.set(config.zhCommand, config);
            }
        });
    }

    /**
     * 处理单个引用块
     */
    processBlockquote(blockquote: HTMLElement): boolean {
        if (!blockquote) return false;

        console.log('[Callout] ⚡ processBlockquote接收到的元素:', {
            tagName: blockquote.tagName,
            className: blockquote.className,
            classList: Array.from(blockquote.classList),
            nodeId: blockquote.getAttribute('data-node-id'),
            dataType: blockquote.getAttribute('data-type')
        });

        // 确保是blockquote元素
        if (!blockquote.classList.contains('bq')) {
            console.log('[Callout] ❌ 错误：传入的不是blockquote元素，而是:', blockquote.tagName);
            return false;
        }

        const titleDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
        const text = titleDiv?.textContent?.trim() || '';
        
        console.log('[Callout] processBlockquote 被调用', {
            text: text,
            hasCustomCallout: blockquote.hasAttribute('custom-callout'),
            hasMarginPosition: blockquote.hasAttribute('data-margin-position'),
            customCallout: blockquote.getAttribute('custom-callout'),
            marginPosition: blockquote.getAttribute('data-margin-position'),
            hasTitleDiv: !!titleDiv
        });

        // 特别处理：如果文本为空但有CSS样式，直接清理
        if (text === '' && !blockquote.hasAttribute('custom-callout') && !blockquote.hasAttribute('data-margin-position')) {
            console.log('[Callout] 🧹 文本为空且无属性，检查是否有遗留CSS...');
            if (this.hasMarginNoteStyles(blockquote)) {
                console.log('[Callout] 🧹 发现遗留CSS，直接清理！');
                this.clearMarginNoteStyles(blockquote);
                return false;
            } else {
                console.log('[Callout] 🧹 无遗留CSS，检查周围元素的margin...');
                
                // 【关键修复】遍历所有兄弟元素，清理可能的遗留margin
                const parent = blockquote.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children);
                    console.log('[Callout] 🔍 父容器有', siblings.length, '个子元素');
                    
                    let cleanedCount = 0;
                    siblings.forEach((sibling, index) => {
                        if (sibling !== blockquote && sibling instanceof HTMLElement) {
                            const marginLeft = sibling.style.marginLeft;
                            const marginRight = sibling.style.marginRight;
                            
                            // 检查是否有可疑的大margin（大于200px的可能是我们设置的）
                            const hasLargeLeftMargin = marginLeft && parseInt(marginLeft) > 200;
                            const hasLargeRightMargin = marginRight && parseInt(marginRight) > 200;
                            
                            if (hasLargeLeftMargin || hasLargeRightMargin) {
                                console.log(`[Callout] 🧹 发现元素[${index}]有可疑margin，清理！`, {
                                    nodeName: sibling.nodeName,
                                    className: sibling.className,
                                    marginLeft,
                                    marginRight
                                });
                                sibling.style.removeProperty('margin-left');
                                sibling.style.removeProperty('margin-right');
                                cleanedCount++;
                            }
                        }
                    });
                    
                    console.log(`[Callout] ✅ 清理了 ${cleanedCount} 个元素的margin`);
                } else {
                    console.log('[Callout] ⚠️ 找不到父容器');
                }
            }
        }

        // 跳过已有自定义样式的引用块  
        if (this.hasCustomStyle(blockquote)) {
            console.log('[Callout] 跳过已有自定义样式的引用块');
            return false;
        }

        const firstParagraph = blockquote.querySelector('div[data-type="NodeParagraph"]:first-of-type');
        if (!firstParagraph) {
            console.log('[Callout] ❌ 找不到firstParagraph，提前返回');
            return false;
        }

        // titleDiv 已在上面定义了
        if (!titleDiv) {
            console.log('[Callout] ❌ 找不到titleDiv，提前返回');
            return false;
        }

        // 尝试解析参数化命令
        console.log('[Callout] 尝试解析参数化命令:', text);
        const parsedCommand = this.parseCalloutCommand(text);
        if (parsedCommand) {
            console.log('[Callout] 📝 匹配参数化命令成功，设置callout');
            
            // 【关键】如果现在是普通callout，清理所有边注CSS
            if (parsedCommand.position === 'normal') {
                console.log('[Callout] 🔄 改为普通callout，清理边注CSS');
                
                // 1. 清理边注div自己的CSS样式
                const propertiesToClear = [
                    'transform', 'margin-left', 'margin-right', 'display',
                    'float', 'clear', 'position', 'top', 'left', 'right',
                    'width', 'max-width'
                ];
                
                console.log('[Callout] 🔄 清理边注div自己的CSS...', {
                    before: {
                        transform: blockquote.style.transform,
                        marginLeft: blockquote.style.marginLeft,
                        marginRight: blockquote.style.marginRight,
                        display: blockquote.style.display
                    }
                });
                
                propertiesToClear.forEach(prop => {
                    blockquote.style.removeProperty(prop);
                });
                
                console.log('[Callout] 🔄 边注div CSS清理完成');
                
                // 2. 清理上一个元素的margin
                const previousSibling = blockquote.previousElementSibling as HTMLElement;
                if (previousSibling) {
                    const marginLeft = previousSibling.style.marginLeft;
                    const marginRight = previousSibling.style.marginRight;
                    const hasLargeMargin = 
                        (marginLeft && parseInt(marginLeft) > 200) ||
                        (marginRight && parseInt(marginRight) > 200);
                    
                    if (hasLargeMargin) {
                        console.log('[Callout] 🔄 清理上一个元素的margin:', {
                            marginLeft,
                            marginRight
                        });
                        previousSibling.style.removeProperty('margin-left');
                        previousSibling.style.removeProperty('margin-right');
                    }
                }
            }
            
            // 设置基础 callout 类型
            blockquote.setAttribute('custom-callout', parsedCommand.config.type);

            // 设置边注相关属性
            if (parsedCommand.position !== 'normal') {
                blockquote.setAttribute('data-margin-position', parsedCommand.position);
                blockquote.setAttribute('data-margin-width', parsedCommand.width || '20%');
                blockquote.setAttribute('data-margin-spacing', parsedCommand.spacing || '1em');
                
                // 调试日志
                console.log('[Callout] 边注设置:', {
                    position: parsedCommand.position,
                    width: parsedCommand.width || '20%',
                    spacing: parsedCommand.spacing || '1em',
                    element: blockquote
                });
                
                // 直接设置CSS变量，避免浏览器兼容性问题
                this.applyMarginNoteStyles(blockquote, parsedCommand);
            }

            // 标记标题并设置显示名称
            titleDiv.setAttribute('data-callout-title', 'true');
            titleDiv.setAttribute('data-callout-display-name', parsedCommand.config.displayName);

            // 添加折叠功能
            this.addCollapseToggle(blockquote, titleDiv);

            return true;
        }

        // 回退到旧的匹配方式（向后兼容）
        console.log('[Callout] 尝试旧的匹配方式');
        for (const [trigger, config] of this.calloutTypes.entries()) {
            if (text.startsWith(trigger)) {
                console.log('[Callout] 📝 匹配旧格式成功:', trigger);
                // 设置 callout 类型
                blockquote.setAttribute('custom-callout', config.type);

                // 标记标题并设置显示名称
                titleDiv.setAttribute('data-callout-title', 'true');
                titleDiv.setAttribute('data-callout-display-name', config.displayName);

                // 添加折叠功能
                this.addCollapseToggle(blockquote, titleDiv);

                return true;
            }
        }

        console.log('[Callout] 🔍 没有匹配任何callout类型，进入清理逻辑');
        
        // 如果不匹配任何 callout 类型，清除相关属性
        if (blockquote.hasAttribute('custom-callout')) {
            console.log('[Callout] ========== 清除 callout 属性 ==========');
            console.log('[Callout] 文本:', text);
            console.log('[Callout] 当前属性:', {
                customCallout: blockquote.getAttribute('custom-callout'),
                marginPosition: blockquote.getAttribute('data-margin-position')
            });
            this.clearCalloutAttributes(blockquote, titleDiv);
        } else if (text === '') {
            console.log('[Callout] ========== 文本为空处理 ==========');
            if (this.hasMarginNoteStyles(blockquote)) {
                console.log('[Callout] 文本为空且有CSS样式，强制清除边注样式');
                this.clearMarginNoteStyles(blockquote);
            } else {
                console.log('[Callout] 文本为空但没有CSS样式，无需清理');
            }
        }
        
        // 【关键】无论上面执行什么，都要检查边注CSS样式
        console.log('[Callout] ========== 最终CSS检查 ==========');
        if (!blockquote.hasAttribute('data-margin-position')) {
            console.log('[Callout] 没有边注属性，检查CSS...');
            if (this.hasMarginNoteStyles(blockquote)) {
                console.log('[Callout] ⚠️ 发现遗留的边注CSS样式，强制清除！');
                this.clearMarginNoteStyles(blockquote);
            } else {
                console.log('[Callout] ✅ 没有边注CSS样式');
            }
        } else {
            console.log('[Callout] 有边注属性，跳过CSS清理');
        }

        return false;
    }

    /**
     * 处理所有引用块
     */
    processAllBlockquotes() {
        const blockquotes = document.querySelectorAll('.bq');
        let processed = 0;

        blockquotes.forEach((bq) => {
            if (this.processBlockquote(bq as HTMLElement)) {
                processed++;
            }
        });

        console.log(`[Callout] Processed ${processed}/${blockquotes.length} blockquotes`);
    }

    /**
     * 检查是否有自定义样式
     */
    private hasCustomStyle(blockQuote: HTMLElement): boolean {
        const customB = blockQuote.getAttribute('custom-b');
        const customCallout = blockQuote.getAttribute('custom-callout');

        // 检查是否是旧版自定义样式
        if (customB) {
            const customBTypes = ['info', 'light', 'bell', 'check', 'question', 'warn', 'wrong', 'bug', 'note', 'pen'];
            if (customBTypes.includes(customB)) {
                return true;
            }
        }

        // 检查是否是书签类型
        if (customCallout === '书签') {
            return true;
        }

        return false;
    }

    /**
     * 清除Callout属性
     */
    private clearCalloutAttributes(blockquote: HTMLElement, titleDiv: HTMLElement) {
        blockquote.removeAttribute('custom-callout');
        blockquote.removeAttribute('data-collapsed');
        // 清除边注相关属性
        blockquote.removeAttribute('data-margin-position');
        blockquote.removeAttribute('data-margin-width');
        blockquote.removeAttribute('data-margin-spacing');
        // 清除边注样式
        this.clearMarginNoteStyles(blockquote);
        
        titleDiv.removeAttribute('data-callout-title');
        titleDiv.removeAttribute('data-callout-display-name');
        this.removeCollapseToggle(titleDiv);
    }

    /**
     * 清除Callout样式（用户主动清除）
     */
    clearCalloutStyle(blockquoteElement: HTMLElement): boolean {
        if (!blockquoteElement) return false;

        console.log('[Callout] clearCalloutStyle 被调用');

        try {
            blockquoteElement.removeAttribute('custom-callout');
            blockquoteElement.removeAttribute('data-collapsed');
            // 清除边注相关属性
            blockquoteElement.removeAttribute('data-margin-position');
            blockquoteElement.removeAttribute('data-margin-width');
            blockquoteElement.removeAttribute('data-margin-spacing');
            // 清除边注样式
            this.clearMarginNoteStyles(blockquoteElement);

            const titleDiv = blockquoteElement.querySelector('[data-callout-title="true"]') as HTMLElement;
            if (titleDiv) {
                titleDiv.removeAttribute('data-callout-title');
                titleDiv.removeAttribute('data-callout-display-name');

                // 清空命令内容
                const text = titleDiv.textContent?.trim() || '';
                if (text.startsWith('[!') || this.calloutTypes.has(text)) {
                    titleDiv.textContent = '';
                }

                this.removeCollapseToggle(titleDiv);
            }

            return true;
        } catch (error) {
            console.error('[Callout] Error clearing style:', error);
            return false;
        }
    }

    /**
     * 添加折叠功能
     */
    private addCollapseToggle(blockquote: HTMLElement, titleDiv: HTMLElement) {
        // 移除旧的监听器
        if ((titleDiv as any)._titleCollapseHandler) {
            titleDiv.removeEventListener('click', (titleDiv as any)._titleCollapseHandler, true);
        }

        // 创建点击处理器
        const handler = (e: MouseEvent) => {
            const rect = titleDiv.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            // 点击图标区域（0-40px）用于切换主题，不处理折叠
            if (clickX >= 0 && clickX <= 40) {
                return;
            }

            // 点击其他区域切换折叠状态
            e.preventDefault();
            e.stopPropagation();
            this.toggleCollapse(blockquote);
        };

        // 保存引用
        (titleDiv as any)._titleCollapseHandler = handler;

        // 添加监听器
        titleDiv.addEventListener('click', handler, true);
        titleDiv.style.cursor = 'pointer';
    }

    /**
     * 移除折叠功能
     */
    private removeCollapseToggle(titleDiv: HTMLElement) {
        if ((titleDiv as any)._titleCollapseHandler) {
            titleDiv.removeEventListener('click', (titleDiv as any)._titleCollapseHandler, true);
            (titleDiv as any)._titleCollapseHandler = null;
        }
        titleDiv.style.cursor = '';
    }

    /**
     * 切换折叠状态
     */
    private toggleCollapse(blockquote: HTMLElement) {
        const isCollapsed = blockquote.getAttribute('data-collapsed') === 'true';
        blockquote.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
    }

    /**
     * 检查是否为新创建的引用块
     */
    isBlockQuoteNewlyCreated(blockQuote: HTMLElement): boolean {
        const nodeId = blockQuote.getAttribute('data-node-id');
        if (!nodeId) return false;

        if (this.hasCustomStyle(blockQuote)) {
            return false;
        }

        const wasTracked = this.trackedBlockQuotes.has(nodeId);
        const isEmpty = this.isBlockQuoteEmpty(blockQuote);

        return !wasTracked && isEmpty;
    }

    /**
     * 检查引用块是否为空
     */
    isBlockQuoteEmpty(blockQuote: HTMLElement): boolean {
        const contentDiv = blockQuote.querySelector('[contenteditable="true"]') as HTMLElement;
        if (!contentDiv) return false;

        const text = contentDiv.textContent?.trim() || '';
        return text === '' || text.length < 3 || /^[\s\n\r]*$/.test(text);
    }

    /**
     * 标记引用块为已跟踪
     */
    trackBlockQuote(nodeId: string) {
        this.trackedBlockQuotes.add(nodeId);
    }

    /**
     * 标记引用块为最近创建
     */
    markAsRecentlyCreated(nodeId: string, timeout: number = 3000) {
        this.recentlyCreatedBlockQuotes.add(nodeId);
        setTimeout(() => this.recentlyCreatedBlockQuotes.delete(nodeId), timeout);
    }

    /**
     * 检查是否为最近创建的引用块
     */
    isRecentlyCreated(nodeId: string): boolean {
        return this.recentlyCreatedBlockQuotes.has(nodeId);
    }

    /**
     * 获取所有Callout类型配置
     */
    getAllTypes(): CalloutTypeConfig[] {
        return DEFAULT_CALLOUT_TYPES;
    }

    /**
     * 根据命令获取配置
     */
    getTypeByCommand(command: string): CalloutTypeConfig | undefined {
        return this.calloutTypes.get(command);
    }

    /**
     * 解析参数化命令语法
     * 支持格式: [!info|left|30%|2em]
     */
    parseCalloutCommand(text: string): ParsedCalloutCommand | null {
        // 匹配 [!type] 或 [!type|params] 格式
        const match = text.match(/^\[!([^|\]]+)(\|.*?)?\]$/);
        if (!match) {
            return null;
        }

        const calloutType = match[1]; // info
        const paramsString = match[2]; // |left|30%|2em
        
        // 构造查找用的键（现在配置中使用 [!type] 格式）
        const searchKey = `[!${calloutType}]`;
        
        // 查找匹配的配置
        const config = this.calloutTypes.get(searchKey);
        if (!config) {
            return null;
        }

        // 解析参数
        const params = paramsString ? paramsString.substring(1).split('|') : []; // 移除开头的|
        const position = this.parsePosition(params[0]);
        const width = this.parseWidth(params[1]);
        const spacing = this.parseSpacing(params[2]);

        return {
            type: config.type,
            config: config,
            position: position,
            width: width,
            spacing: spacing,
            originalCommand: text
        };
    }

    /**
     * 解析位置参数
     */
    private parsePosition(param?: string): 'normal' | 'left' | 'right' {
        if (!param) return 'normal';
        
        const normalized = param.toLowerCase().trim();
        if (normalized === 'left' || normalized === '左' || normalized === 'l') {
            return 'left';
        }
        if (normalized === 'right' || normalized === '右' || normalized === 'r') {
            return 'right';
        }
        
        return 'normal';
    }

    /**
     * 解析宽度参数
     */
    private parseWidth(param?: string): string {
        if (!param) return '20%'; // 默认宽度 - 更窄，适合边注
        
        const normalized = param.trim();
        
        // 验证宽度格式 (支持 % 和 px, em, rem 等)
        if (/^\d+(%|px|em|rem|vw)$/.test(normalized)) {
            return normalized;
        }
        
        // 如果只是数字，默认当作百分比
        if (/^\d+$/.test(normalized)) {
            const num = parseInt(normalized);
            if (num > 0 && num <= 50) { // 限制最大50%，防止太宽
                return `${num}%`;
            }
        }
        
        return '20%'; // 回退到默认值
    }

    /**
     * 解析间距参数
     */
    private parseSpacing(param?: string): string {
        if (!param) return '1em'; // 默认间距
        
        const normalized = param.trim();
        
        // 验证间距格式
        if (/^[\d.]+(%|px|em|rem|vw)$/.test(normalized)) {
            return normalized;
        }
        
        // 如果只是数字，默认当作em
        if (/^[\d.]+$/.test(normalized)) {
            const num = parseFloat(normalized);
            if (num >= 0) {
                return `${num}em`;
            }
        }
        
        return '1em'; // 回退到默认值
    }

    /**
     * 应用边注样式 - 使用浮动 + transform
     */
    private applyMarginNoteStyles(blockquote: HTMLElement, parsedCommand: ParsedCalloutCommand) {
        const width = parsedCommand.width || '20%';
        const spacing = parsedCommand.spacing || '1em';
        
        // 设置CSS变量
        blockquote.style.setProperty('--margin-width', width);
        blockquote.style.setProperty('--margin-spacing', spacing);
        
        // 查找上一个兄弟元素
        const previousSibling = blockquote.previousElementSibling as HTMLElement;
        
        if (previousSibling) {
            requestAnimationFrame(() => {
                // 计算边注的宽度和间距（像素值）
                const widthValue = this.parseWidthToPixels(width, blockquote);
                const spacingValue = this.parseSpacingToPixels(spacing, blockquote);
                
                // 先设置定位方式和间距，让布局稳定
                console.log('[Callout] 🎨 开始设置CSS，position:', parsedCommand.position);
                if (parsedCommand.position === 'left') {
                    // 左侧边注 - 使用浮动
                    console.log('[Callout] 🎨 设置左侧边注CSS');
                    blockquote.style.setProperty('float', 'left', 'important');
                    blockquote.style.setProperty('clear', 'left', 'important');
                    blockquote.style.setProperty('margin-right', `${spacingValue}px`, 'important');
                    blockquote.style.setProperty('margin-left', '0', 'important');
                    
                    // 给上一个元素留出左边空间
                    const leftMarginValue = `${widthValue + spacingValue}px`;
                    console.log('[Callout] 🎨 设置上一个元素margin-left:', leftMarginValue);
                    previousSibling.style.setProperty('margin-left', leftMarginValue, 'important');
                    console.log('[Callout] 🎨 上一个元素margin-left设置后:', previousSibling.style.marginLeft);
                    
                    console.log('[Callout] 🎨 左侧CSS设置结果:', {
                        float: blockquote.style.float,
                        marginRight: blockquote.style.marginRight,
                        transform: blockquote.style.transform,
                        previousSiblingMarginLeft: previousSibling.style.marginLeft
                    });
                    
                } else if (parsedCommand.position === 'right') {
                    // 右侧边注 - 使用 margin-left: auto 推到右边
                    console.log('[Callout] 🎨 设置右侧边注CSS');
                    blockquote.style.removeProperty('float');
                    blockquote.style.removeProperty('clear');
                    
                    // 使用 auto margin 推送到右边
                    blockquote.style.setProperty('margin-left', 'auto', 'important');
                    blockquote.style.setProperty('margin-right', `${spacingValue}px`, 'important');
                    blockquote.style.setProperty('display', 'block', 'important');
                    
                    // 给上一个元素留出右边空间
                    const rightMarginValue = `${widthValue + spacingValue}px`;
                    console.log('[Callout] 🎨 设置上一个元素margin-right:', rightMarginValue);
                    previousSibling.style.setProperty('margin-right', rightMarginValue, 'important');
                    console.log('[Callout] 🎨 上一个元素margin-right设置后:', previousSibling.style.marginRight);
                    
                    console.log('[Callout] 🎨 右侧CSS设置结果:', {
                        marginLeft: blockquote.style.marginLeft,
                        marginRight: blockquote.style.marginRight,
                        display: blockquote.style.display,
                        transform: blockquote.style.transform,
                        previousSiblingMarginRight: previousSibling.style.marginRight
                    });
                }
                
                // 等待布局完成后，再计算精确位置并设置 transform
                requestAnimationFrame(() => {
                    // 使用 getBoundingClientRect 精确计算位置差
                    const siblingRect = previousSibling.getBoundingClientRect();
                    const blockquoteRect = blockquote.getBoundingClientRect();
                    
                    // 计算边注顶部到上一个元素顶部的距离
                    const moveUpDistance = blockquoteRect.top - siblingRect.top;
                    
                    console.log('[Callout] 📏 位置信息 (CSS设置后):', {
                        siblingTop: siblingRect.top,
                        blockquoteTop: blockquoteRect.top,
                        距离差: moveUpDistance
                    });
                    
                    // 使用 transform 向上移动，让边注顶部对齐到上一个元素顶部
                    console.log('[Callout] 🎨 设置transform向上移动:', `-${moveUpDistance}px`);
                    blockquote.style.setProperty('transform', `translateY(-${moveUpDistance}px)`, 'important');
                    console.log('[Callout] 🎨 transform设置后:', blockquote.style.transform);
                    
                    // 调试日志
                    console.log('[Callout] 边注应用:', {
                        position: parsedCommand.position,
                        width: widthValue,
                        spacing: spacingValue,
                        moveUpDistance,
                        siblingHeight: siblingRect.height,
                        transform: blockquote.style.transform,
                        marginLeft: blockquote.style.marginLeft,
                        marginRight: blockquote.style.marginRight,
                        computedFloat: getComputedStyle(blockquote).float,
                        containerWidth: blockquote.parentElement?.offsetWidth,
                        blockquoteWidth: blockquote.offsetWidth
                    });
                });
            });
        }
    }
    
    /**
     * 将宽度值转换为像素值
     */
    private parseWidthToPixels(width: string, element: HTMLElement): number {
        if (width.endsWith('%')) {
            const percentage = parseFloat(width) / 100;
            const containerWidth = element.parentElement?.offsetWidth || window.innerWidth;
            return containerWidth * percentage;
        } else if (width.endsWith('px')) {
            return parseFloat(width);
        } else if (width.endsWith('em') || width.endsWith('rem')) {
            const fontSize = parseFloat(getComputedStyle(element).fontSize);
            return parseFloat(width) * fontSize;
        }
        return 0;
    }
    
    /**
     * 将间距值转换为像素值
     */
    private parseSpacingToPixels(spacing: string, element: HTMLElement): number {
        if (spacing.endsWith('px')) {
            return parseFloat(spacing);
        } else if (spacing.endsWith('em') || spacing.endsWith('rem')) {
            const fontSize = parseFloat(getComputedStyle(element).fontSize);
            return parseFloat(spacing) * fontSize;
        } else if (spacing.endsWith('%')) {
            const percentage = parseFloat(spacing) / 100;
            const containerWidth = element.parentElement?.offsetWidth || window.innerWidth;
            return containerWidth * percentage;
        }
        return 0;
    }

    /**
     * 检测元素是否有边注样式
     */
    private hasMarginNoteStyles(blockquote: HTMLElement): boolean {
        console.log('[Callout] 🔬 开始检查边注CSS样式');
        console.log('[Callout] 🔬 元素信息:', {
            nodeId: blockquote.getAttribute('data-node-id'),
            className: blockquote.className,
            tagName: blockquote.tagName
        });
        
        const transform = blockquote.style.transform;
        const float = blockquote.style.float;
        const marginLeft = blockquote.style.marginLeft;
        const marginRight = blockquote.style.marginRight;
        const display = blockquote.style.display;
        const width = blockquote.style.width;
        
        console.log('[Callout] 🔬 所有内联样式:', {
            transform,
            float,
            marginLeft,
            marginRight,
            display,
            width,
            position: blockquote.style.position,
            top: blockquote.style.top,
            left: blockquote.style.left,
            right: blockquote.style.right,
            cssText: blockquote.style.cssText
        });
        
        const hasTransform = transform && transform !== 'none' && transform !== '';
        const hasFloat = float && float !== 'none' && float !== '';
        const hasMarginLeft = marginLeft && marginLeft !== '0px' && marginLeft !== '';
        const hasMarginRight = marginRight && marginRight !== '0px' && marginRight !== '';
        
        const result = hasTransform || hasFloat || hasMarginLeft || hasMarginRight;
        
        console.log('[Callout] 🔬 CSS检查结果:', {
            hasTransform,
            hasFloat,
            hasMarginLeft,
            hasMarginRight,
            finalResult: result
        });
        
        return result;
    }

    /**
     * 清除边注样式
     */
    private clearMarginNoteStyles(blockquote: HTMLElement) {
        console.log('[Callout] 🧽 ========== 开始清除边注样式 ==========');
        console.log('[Callout] 🧽 元素ID:', blockquote.getAttribute('data-node-id'));
        console.log('[Callout] 🧽 清除前的样式:', {
            transform: blockquote.style.transform,
            float: blockquote.style.float,
            marginLeft: blockquote.style.marginLeft,
            marginRight: blockquote.style.marginRight,
            display: blockquote.style.display,
            width: blockquote.style.width,
            cssText: blockquote.style.cssText.substring(0, 200)
        });
        
        // 1. 先恢复上一个元素的全宽（这很重要！）
        const previousSibling = blockquote.previousElementSibling as HTMLElement;
        if (previousSibling) {
            console.log('[Callout] 🧽 恢复上一个元素:', {
                nodeName: previousSibling.nodeName,
                className: previousSibling.className,
                marginLeftBefore: previousSibling.style.marginLeft,
                marginRightBefore: previousSibling.style.marginRight
            });
            
            previousSibling.style.removeProperty('margin-left');
            previousSibling.style.removeProperty('margin-right');
            
            console.log('[Callout] 🧽 上一个元素恢复后:', {
                marginLeftAfter: previousSibling.style.marginLeft,
                marginRightAfter: previousSibling.style.marginRight
            });
        } else {
            console.log('[Callout] 🧽 ⚠️ 没有上一个元素');
        }
        
        // 2. 清除边注div的所有样式 - 恢复到正常状态
        console.log('[Callout] 🧽 开始清除边注div所有样式...');
        
        const propertiesToClear = [
            '--margin-width', '--margin-spacing',
            'transform', 'position', 'top', 'left', 'right', 'bottom',
            'float', 'clear',
            'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
            'width', 'max-width', 'display'
        ];
        
        propertiesToClear.forEach(prop => {
            blockquote.style.removeProperty(prop);
        });
        
        console.log('[Callout] 🧽 清除后的样式:', {
            transform: blockquote.style.transform,
            float: blockquote.style.float,
            marginLeft: blockquote.style.marginLeft,
            marginRight: blockquote.style.marginRight,
            display: blockquote.style.display,
            cssText: blockquote.style.cssText || '(空)'
        });
        
        console.log('[Callout] 🧽 ========== 边注样式清除完成 ==========');
    }


    /**
     * 检查是否处于初始加载状态
     */
    isInInitialLoad(): boolean {
        return this.isInitialLoad;
    }
}

