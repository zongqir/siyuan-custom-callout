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

        // 跳过已有自定义样式的引用块
        if (this.hasCustomStyle(blockquote)) {
            return false;
        }

        const firstParagraph = blockquote.querySelector('div[data-type="NodeParagraph"]:first-of-type');
        if (!firstParagraph) return false;

        const titleDiv = firstParagraph.querySelector('div[contenteditable="true"]') as HTMLElement;
        if (!titleDiv) return false;

        const text = titleDiv.textContent?.trim() || '';

        // 尝试解析参数化命令
        const parsedCommand = this.parseCalloutCommand(text);
        if (parsedCommand) {
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
        for (const [trigger, config] of this.calloutTypes.entries()) {
            if (text.startsWith(trigger)) {
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

        // 如果不匹配任何 callout 类型，清除相关属性
        if (blockquote.hasAttribute('custom-callout')) {
            this.clearCalloutAttributes(blockquote, titleDiv);
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
                
                // 获取上一个元素的高度
                const siblingHeight = previousSibling.offsetHeight;
                const siblingMarginBottom = parseInt(getComputedStyle(previousSibling).marginBottom) || 0;
                
                // 计算需要向上移动的距离
                const moveUpDistance = siblingHeight + siblingMarginBottom;
                
                // 使用 transform 向上移动
                blockquote.style.setProperty('transform', `translateY(-${moveUpDistance}px)`, 'important');
                
                // 设置定位方式和间距
                if (parsedCommand.position === 'left') {
                    // 左侧边注 - 使用浮动
                    blockquote.style.setProperty('float', 'left', 'important');
                    blockquote.style.setProperty('clear', 'left', 'important');
                    blockquote.style.setProperty('margin-right', `${spacingValue}px`, 'important');
                    blockquote.style.setProperty('margin-left', '0', 'important');
                    
                    // 给上一个元素留出左边空间
                    previousSibling.style.setProperty('margin-left', `${widthValue + spacingValue}px`, 'important');
                    
                } else if (parsedCommand.position === 'right') {
                    // 右侧边注 - 使用 margin-left: auto 推到右边
                    blockquote.style.removeProperty('float');
                    blockquote.style.removeProperty('clear');
                    
                    // 使用 auto margin 推送到右边
                    blockquote.style.setProperty('margin-left', 'auto', 'important');
                    blockquote.style.setProperty('margin-right', `${spacingValue}px`, 'important');
                    blockquote.style.setProperty('display', 'block', 'important');
                    
                    // 给上一个元素留出右边空间
                    previousSibling.style.setProperty('margin-right', `${widthValue + spacingValue}px`, 'important');
                }
                
                // 调试日志
                console.log('[Callout] 边注应用:', {
                    position: parsedCommand.position,
                    width: widthValue,
                    spacing: spacingValue,
                    moveUpDistance,
                    siblingHeight,
                    transform: blockquote.style.transform,
                    marginLeft: blockquote.style.marginLeft,
                    marginRight: blockquote.style.marginRight,
                    computedFloat: getComputedStyle(blockquote).float,
                    containerWidth: blockquote.parentElement?.offsetWidth,
                    blockquoteWidth: blockquote.offsetWidth
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
     * 清除边注样式
     */
    private clearMarginNoteStyles(blockquote: HTMLElement) {
        // 清除所有边注相关的CSS属性
        blockquote.style.removeProperty('--margin-width');
        blockquote.style.removeProperty('--margin-spacing');
        blockquote.style.removeProperty('transform');
        blockquote.style.removeProperty('margin-left');
        blockquote.style.removeProperty('margin-right');
        blockquote.style.removeProperty('float');
        blockquote.style.removeProperty('clear');
        blockquote.style.removeProperty('position');
        blockquote.style.removeProperty('left');
        blockquote.style.removeProperty('right');
        blockquote.style.removeProperty('display');
        
        // 恢复上一个兄弟元素的样式
        const previousSibling = blockquote.previousElementSibling as HTMLElement;
        if (previousSibling) {
            previousSibling.style.removeProperty('margin-left');
            previousSibling.style.removeProperty('margin-right');
        }
    }


    /**
     * 检查是否处于初始加载状态
     */
    isInInitialLoad(): boolean {
        return this.isInitialLoad;
    }
}

