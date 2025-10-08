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
            hasMarginWidth: blockquote.hasAttribute('data-margin-width'),
            customCallout: blockquote.getAttribute('custom-callout'),
            marginWidth: blockquote.getAttribute('data-margin-width'),
            hasTitleDiv: !!titleDiv
        });

        // 处理所有涉及边注位置清理的逻辑 - 简化版
        if (text === '' && !blockquote.hasAttribute('custom-callout') && !blockquote.hasAttribute('data-margin-width') && !blockquote.hasAttribute('data-margin-height')) {
            console.log('[Callout] 🧹 文本为空且无属性，检查是否有遗留CSS...');
            if (this.hasMarginNoteStyles(blockquote)) {
                console.log('[Callout] 🧹 发现遗留CSS，直接清理！');
                this.clearMarginNoteStyles(blockquote);
                return false;
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
            console.log('[Callout] 📝 匹配参数化命令成功，解析结果:', {
                type: parsedCommand.config.type,
                width: parsedCommand.width,
                originalCommand: parsedCommand.originalCommand
            });
            
            // 设置基础 callout 类型
            blockquote.setAttribute('custom-callout', parsedCommand.config.type);

            // 设置边注相关属性（宽度和高度）
            if (parsedCommand.width && parsedCommand.width !== null) {
                // 只有明确指定宽度参数才设置
                console.log('[Callout] 🎯 设置宽度属性:', parsedCommand.width);
                blockquote.setAttribute('data-margin-width', parsedCommand.width);
                // 设置CSS变量
                blockquote.style.setProperty('--margin-width', parsedCommand.width);
            } else {
                console.log('[Callout] ⚠️ 没有宽度参数，保持现有宽度设置不变');
                // 不要清除已有的宽度属性！用户可能之前设置过宽度
                // 只有在明确要设置新宽度时才修改
            }

            if (parsedCommand.height && parsedCommand.height !== null) {
                // 只有明确指定高度参数才设置
                console.log('[Callout] 📏 设置高度属性:', parsedCommand.height);
                blockquote.setAttribute('data-margin-height', parsedCommand.height);
                // 设置CSS变量
                blockquote.style.setProperty('--margin-height', parsedCommand.height);
                blockquote.style.setProperty('min-height', parsedCommand.height);
            } else {
                console.log('[Callout] ⚠️ 没有高度参数，保持现有高度设置不变');
                // 不要清除已有的高度属性！用户可能之前设置过高度
                // 只有在明确要设置新高度时才修改
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

        // 简化的清理逻辑  
        console.log('[Callout] 🔍 没有匹配任何callout类型，进入清理逻辑');
        
        // 如果不匹配任何 callout 类型，谨慎清除属性（保留宽度设置）
        if (blockquote.hasAttribute('custom-callout')) {
            console.log('[Callout] ========== 谨慎清除 callout 属性（保留宽度）==========');
            this.clearCalloutAttributesConservatively(blockquote, titleDiv);
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
        // 清除宽度和高度相关属性
        blockquote.removeAttribute('data-margin-width');
        blockquote.removeAttribute('data-margin-height');
        // 清除CSS变量
        blockquote.style.removeProperty('--margin-width');
        blockquote.style.removeProperty('--margin-height');
        blockquote.style.removeProperty('min-height');
        
        titleDiv.removeAttribute('data-callout-title');
        titleDiv.removeAttribute('data-callout-display-name');
        this.removeCollapseToggle(titleDiv);
    }

    /**
     * 谨慎清除Callout属性（保留用户可能手动设置的宽度）
     */
    private clearCalloutAttributesConservatively(blockquote: HTMLElement, titleDiv: HTMLElement) {
        blockquote.removeAttribute('custom-callout');
        blockquote.removeAttribute('data-collapsed');
        
        // ⚠️ 保留宽度和高度属性！用户可能通过拖拽手动设置了宽度和高度
        // 不要清除 data-margin-width、--margin-width、data-margin-height、--margin-height
        console.log('[Callout] 🛡️ 保留现有宽度和高度设置，避免用户设置丢失');
        
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
            // 清除宽度和高度相关属性
            blockquoteElement.removeAttribute('data-margin-width');
            blockquoteElement.removeAttribute('data-margin-height');
            // 清除CSS变量
            blockquoteElement.style.removeProperty('--margin-width');
            blockquoteElement.style.removeProperty('--margin-height');
            blockquoteElement.style.removeProperty('min-height');

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
        if ((titleDiv as any)._titleDblClickHandler) {
            titleDiv.removeEventListener('dblclick', (titleDiv as any)._titleDblClickHandler, true);
        }

        let clickTimeout: NodeJS.Timeout | null = null;
        let clickCount = 0;

        // 创建点击处理器（延迟执行，等待可能的双击）
        const clickHandler = (e: MouseEvent) => {
            const rect = titleDiv.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            // 点击图标区域（0-40px）用于切换主题，不处理折叠
            if (clickX >= 0 && clickX <= 40) {
                return;
            }

            clickCount++;
            
            // 如果已经有定时器在运行，取消它
            if (clickTimeout) {
                clearTimeout(clickTimeout);
            }

            // 设置延迟执行，等待可能的双击
            clickTimeout = setTimeout(() => {
                if (clickCount === 1) {
                    // 单击：折叠功能
                    console.log('[Callout] 单击标题，执行折叠操作');
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleCollapse(blockquote);
                }
                clickCount = 0;
                clickTimeout = null;
            }, 300); // 300ms内如果没有第二次点击，则认为是单击
        };

        // 创建双击处理器（用于编辑）
        const dblClickHandler = (e: MouseEvent) => {
            const rect = titleDiv.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            // 点击图标区域（0-40px）不处理编辑
            if (clickX >= 0 && clickX <= 40) {
                return;
            }

            // 取消单击的定时器
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }
            clickCount = 0;

            console.log('[Callout] 双击标题，进入编辑模式');
            
            // 双击：进入编辑模式
            // 不阻止默认行为，让contenteditable正常工作
            titleDiv.focus();
            
            // 选中所有文本以便编辑
            setTimeout(() => {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(titleDiv);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }, 10);
        };

        // 保存引用
        (titleDiv as any)._titleCollapseHandler = clickHandler;
        (titleDiv as any)._titleDblClickHandler = dblClickHandler;

        // 添加监听器
        titleDiv.addEventListener('click', clickHandler, true);
        titleDiv.addEventListener('dblclick', dblClickHandler, true);
        
        // 设置光标样式提示用户可以双击编辑
        titleDiv.style.cursor = 'pointer';
        titleDiv.title = '单击折叠/展开，双击编辑';
    }

    /**
     * 移除折叠功能
     */
    private removeCollapseToggle(titleDiv: HTMLElement) {
        if ((titleDiv as any)._titleCollapseHandler) {
            titleDiv.removeEventListener('click', (titleDiv as any)._titleCollapseHandler, true);
            (titleDiv as any)._titleCollapseHandler = null;
        }
        if ((titleDiv as any)._titleDblClickHandler) {
            titleDiv.removeEventListener('dblclick', (titleDiv as any)._titleDblClickHandler, true);
            (titleDiv as any)._titleDblClickHandler = null;
        }
        titleDiv.style.cursor = '';
        titleDiv.title = '';
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
     * 解析参数化命令语法 - 支持宽度和高度参数
     * 支持格式: [!info|30%] 或 [!info|30%|120px] 或 [!info|120px]
     */
    parseCalloutCommand(text: string): ParsedCalloutCommand | null {
        console.log('[Callout] 🔍 开始解析命令:', text);
        
        // 匹配 [!type] 或 [!type|params] 格式
        const match = text.match(/^\[!([^|\]]+)(\|.*?)?\]$/);
        if (!match) {
            console.log('[Callout] ❌ 正则匹配失败');
            return null;
        }

        const calloutType = match[1]; // info
        const paramsString = match[2]; // |30%|120px
        
        console.log('[Callout] 📋 解析结果:', {
            calloutType,
            paramsString,
            fullMatch: match[0]
        });
        
        // 构造查找用的键（现在配置中使用 [!type] 格式）
        const searchKey = `[!${calloutType}]`;
        
        // 查找匹配的配置
        const config = this.calloutTypes.get(searchKey);
        if (!config) {
            console.log('[Callout] ❌ 找不到配置，searchKey:', searchKey);
            console.log('[Callout] 可用的配置键:', Array.from(this.calloutTypes.keys()));
            return null;
        }

        console.log('[Callout] ✅ 找到配置:', config.type);

        // 解析参数 - 支持宽度和高度
        const params = paramsString ? paramsString.substring(1).split('|') : []; // 移除开头的|
        console.log('[Callout] 📊 参数列表:', params);
        
        // 解析参数：可能是宽度(%)、高度(px)或间距
        let width: string | null = null;
        let height: string | null = null;
        let spacing: string | null = null;
        
        for (const param of params) {
            if (!param) continue;
            
            const trimmed = param.trim();
            if (trimmed.endsWith('%')) {
                // 宽度参数
                width = this.parseWidth(trimmed);
            } else if (trimmed.endsWith('px')) {
                // 可能是高度参数
                const heightValue = this.parseHeight(trimmed);
                if (heightValue) {
                    height = heightValue;
                } else {
                    // 如果不是有效高度，可能是间距参数
                    spacing = this.parseSpacing(trimmed);
                }
            } else {
                // 其他格式的间距参数
                spacing = this.parseSpacing(trimmed);
            }
        }
        
        console.log('[Callout] 🎯 解析结果:', { width, height, spacing });

        return {
            type: config.type,
            config: config,
            position: 'normal', // 固定为normal
            width: width,
            height: height,
            spacing: spacing,
            originalCommand: text
        };
    }


    /**
     * 解析宽度参数
     */
    private parseWidth(param: string): string {
        console.log('[Callout] 🔍 parseWidth接收参数:', param);
        
        const normalized = param.trim();
        console.log('[Callout] 📐 标准化后的参数:', normalized);
        
        // 验证宽度格式 (支持 % 和 px, em, rem 等，支持小数)
        if (/^[\d.]+(%|px|em|rem|vw)$/.test(normalized)) {
            console.log('[Callout] ✅ 正则匹配成功，返回:', normalized);
            return normalized;
        }
        
        // 如果只是数字，默认当作百分比
        if (/^[\d.]+$/.test(normalized)) {
            const num = parseFloat(normalized);
            console.log('[Callout] 🔢 纯数字参数，解析为:', num);
            if (num > 0 && num <= 100) { // 限制到100%
                const result = `${num}%`;
                console.log('[Callout] ✅ 数字范围有效，返回:', result);
                return result;
            }
        }
        
        console.log('[Callout] ❌ 参数无效，回退到默认20%');
        return '20%'; // 回退到默认值
    }

    /**
     * 解析高度参数
     */
    private parseHeight(param: string): string | null {
        console.log('[Callout] 🔍 parseHeight接收参数:', param);
        
        const normalized = param.trim();
        console.log('[Callout] 📏 标准化后的参数:', normalized);
        
        // 验证高度格式 (支持 px, 支持小数)
        if (/^[\d.]+px$/.test(normalized)) {
            const num = parseFloat(normalized);
            console.log('[Callout] 🔢 解析出数字:', num);
            
            // 限制高度范围（50px - 1000px）
            if (num >= 50 && num <= 1000) {
                console.log('[Callout] ✅ 高度范围有效，返回:', normalized);
                return normalized;
            } else {
                console.log('[Callout] ⚠️ 高度超出范围，忽略:', num);
                return null;
            }
        }
        
        // 如果只是数字，默认当作像素
        if (/^[\d.]+$/.test(normalized)) {
            const num = parseFloat(normalized);
            console.log('[Callout] 🔢 纯数字参数，解析为:', num);
            if (num >= 50 && num <= 1000) {
                const result = `${Math.round(num)}px`;
                console.log('[Callout] ✅ 数字范围有效，返回:', result);
                return result;
            }
        }
        
        console.log('[Callout] ❌ 高度参数无效，忽略');
        return null;
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
     * 检测元素是否有宽度或高度样式
     */
    private hasMarginNoteStyles(blockquote: HTMLElement): boolean {
        // 检查是否有宽度或高度属性
        return blockquote.hasAttribute('data-margin-width') || blockquote.hasAttribute('data-margin-height');
    }

    /**
     * 清除宽度和高度样式
     */
    private clearMarginNoteStyles(blockquote: HTMLElement) {
        console.log('[Callout] 🧽 清除宽度和高度样式');
        
        // 清除宽度和高度相关的CSS变量
        blockquote.style.removeProperty('--margin-width');
        blockquote.style.removeProperty('--margin-height');
        blockquote.style.removeProperty('min-height');
        
        console.log('[Callout] 🧽 宽度和高度样式清除完成');
    }


    /**
     * 检查是否处于初始加载状态
     */
    isInInitialLoad(): boolean {
        return this.isInitialLoad;
    }
}

