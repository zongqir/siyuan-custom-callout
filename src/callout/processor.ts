import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig, ParsedCalloutCommand } from './types';
import { logger } from '../libs/logger';

/**
 * Callout处理器 - 负责检测和转换引述块为Callout样式
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
     * 获取blockquote的第一个内容div（兼容只读和可编辑模式）
     * 在只读模式下，contenteditable="false"；在可编辑模式下，contenteditable="true"
     */
    private getFirstContentDiv(blockquote: HTMLElement): HTMLElement | null {
        // 方法1：尝试查找第一个 NodeParagraph
        let titleDiv = blockquote.querySelector('div[data-type="NodeParagraph"]:first-of-type') as HTMLElement;
        if (titleDiv) {
            // 获取 NodeParagraph 内部的 contenteditable div
            const innerDiv = titleDiv.querySelector('div[contenteditable]') as HTMLElement;
            if (innerDiv) {
                return innerDiv;
            }
            return titleDiv;
        }
        
        // 方法2：查找任何 contenteditable div（不管是 true 还是 false）
        titleDiv = blockquote.querySelector('div[contenteditable]') as HTMLElement;
        if (titleDiv) {
            return titleDiv;
        }
        
        // 方法3：回退到第一个 div
        return blockquote.querySelector('div') as HTMLElement;
    }

    /**
     * 处理单个引述块
     */
    processBlockquote(blockquote: HTMLElement): boolean {
        if (!blockquote) {
            console.log('[Callout Debug] ❌ processBlockquote: blockquote is null/undefined');
            return false;
        }

        // 🔧 修复：更灵活的blockquote识别
        const isValidBlockquote = blockquote.classList.contains('bq') || 
                                 blockquote.getAttribute('data-type') === 'NodeBlockquote';
        
        if (!isValidBlockquote) {
            console.log('[Callout Debug] ❌ processBlockquote: element is neither .bq nor NodeBlockquote', {
                element: blockquote,
                classes: blockquote.className,
                dataType: blockquote.getAttribute('data-type'),
                tagName: blockquote.tagName
            });
            
            // 🔧 如果传入的是gutter按钮，尝试找到真正的blockquote
            if (blockquote.classList.contains('callout-gutter-highlight') && 
                blockquote.getAttribute('data-type') === 'NodeBlockquote') {
                const nodeId = blockquote.getAttribute('data-node-id');
                if (nodeId) {
                    const realBlockquote = document.querySelector(`[data-node-id="${nodeId}"].bq, [data-node-id="${nodeId}"][data-type="NodeBlockquote"]:not(.callout-gutter-highlight)`) as HTMLElement;
                    if (realBlockquote) {
                        console.log('[Callout Debug] 🔧 Found real blockquote from gutter button:', realBlockquote);
                        return this.processBlockquote(realBlockquote);
                    }
                }
            }
            
            return false;
        }

        const titleDiv = this.getFirstContentDiv(blockquote);
        const text = titleDiv?.textContent?.trim() || '';

        console.log('[Callout Debug] Processing text:', `"${text}"`, {
            looksLikeCallout: text.startsWith('[!') && text.includes(']'),
            hasCustomCallout: blockquote.hasAttribute('custom-callout')
        });

        // 处理所有涉及边注位置清理的逻辑 - 修复版
        // 🔧 修复：如果text看起来像callout命令，不要执行清理逻辑
        const isCalloutCommand = text.startsWith('[!') && text.includes(']');
        
        if (text === '' && !blockquote.hasAttribute('custom-callout') && !blockquote.hasAttribute('data-margin-width') && !blockquote.hasAttribute('data-margin-height')) {
            console.log('[Callout Debug] 🧹 Empty text detected, checking for margin note styles...');
            if (this.hasMarginNoteStyles(blockquote)) {
                console.log('[Callout Debug] 🧹 Clearing margin note styles and returning false');
                this.clearMarginNoteStyles(blockquote);
                return false;
            }
        } else if (text !== '' && !isCalloutCommand && !blockquote.hasAttribute('custom-callout') && !blockquote.hasAttribute('data-margin-width') && !blockquote.hasAttribute('data-margin-height')) {
            // 🔧 如果有非callout文本，但没有callout属性，也清理margin样式
            console.log('[Callout Debug] 🧹 Non-callout text detected, checking for margin note styles...');
            if (this.hasMarginNoteStyles(blockquote)) {
                console.log('[Callout Debug] 🧹 Clearing margin note styles for non-callout text');
                this.clearMarginNoteStyles(blockquote);
            }
        }

        // 跳过已有自定义样式的引述块  
        if (this.hasCustomStyle(blockquote)) {
            console.log('[Callout Debug] ⏭️ Skipping blockquote with existing custom style');
            return false;
        }

        const firstParagraph = blockquote.querySelector('div[data-type="NodeParagraph"]:first-of-type');
        if (!firstParagraph) {
            return false;
        }

        // titleDiv 已在上面定义了
        if (!titleDiv) {
            return false;
        }

        // 尝试解析参数化命令
        console.log('[Callout Debug] 🔍 Trying to parse callout command:', text);
        const parsedCommand = this.parseCalloutCommand(text);
        console.log('[Callout Debug] 📋 Parse result:', parsedCommand);
        
        if (parsedCommand) {
            
            // 设置基础 callout 类型
            blockquote.setAttribute('custom-callout', parsedCommand.config.type);

            // 设置边注相关属性（宽度和高度）
            if (parsedCommand.width && parsedCommand.width !== null) {
                // 只有明确指定宽度参数才设置
                blockquote.setAttribute('data-margin-width', parsedCommand.width);
                // 设置CSS变量
                blockquote.style.setProperty('--margin-width', parsedCommand.width);
            } else {
               // console.log('[Callout] ⚠️ 没有宽度参数，保持现有宽度设置不变');
                // 不要清除已有的宽度属性！用户可能之前设置过宽度
                // 只有在明确要设置新宽度时才修改
            }

            if (parsedCommand.height && parsedCommand.height !== null) {
                // 只有明确指定高度参数才设置
                //console.log('[Callout] 📏 设置高度属性:', parsedCommand.height);
                blockquote.setAttribute('data-margin-height', parsedCommand.height);
                // 设置CSS变量
                blockquote.style.setProperty('--margin-height', parsedCommand.height);
                blockquote.style.setProperty('min-height', parsedCommand.height);
            } else {
               // console.log('[Callout] ⚠️ 没有高度参数，保持现有高度设置不变');
                // 不要清除已有的高度属性！用户可能之前设置过高度
                // 只有在明确要设置新高度时才修改
            }

            // 标记标题并设置显示名称
            titleDiv.setAttribute('data-callout-title', 'true');
            titleDiv.setAttribute('data-callout-display-name', parsedCommand.config.displayName);

            // 添加标题只读功能
            this.addTitleEditFunction(blockquote, titleDiv);

            return true;
        }

        // 回退到旧的匹配方式（向后兼容）
        console.log('[Callout Debug] Trying fallback matching for:', text);
        
        for (const [trigger, config] of this.calloutTypes.entries()) {
            if (text.startsWith(trigger)) {
                console.log('[Callout Debug] ✅ Fallback match found:', trigger);
                logger.log('[Callout] 📝 匹配旧格式成功:', trigger);
                // 设置 callout 类型
                blockquote.setAttribute('custom-callout', config.type);

                // 标记标题并设置显示名称
                titleDiv.setAttribute('data-callout-title', 'true');
                titleDiv.setAttribute('data-callout-display-name', config.displayName);

                // 添加标题只读功能
                this.addTitleEditFunction(blockquote, titleDiv);

                return true;
            }
        }

        // 简化的清理逻辑  
        console.log('[Callout Debug] 🔍 No callout match found, entering cleanup logic');
        console.log('[Callout Debug] 🔍 Text content:', `"${text}"`);
        
        // 🔧 修复：如果text看起来像正在输入的callout命令，不要清理
        const isPartialCallout = text.startsWith('[!') || text.startsWith('[') || text.includes('!');
        
        // 如果不匹配任何 callout 类型，谨慎清除属性（保留宽度设置）
        if (blockquote.hasAttribute('custom-callout') && !isPartialCallout) {
            console.log('[Callout Debug] 🧹 Clearing callout attributes (text does not look like callout)');
            logger.log('[Callout] ========== 谨慎清除 callout 属性（保留宽度）==========');
            this.clearCalloutAttributesConservatively(blockquote, titleDiv);
        } else if (isPartialCallout) {
            console.log('[Callout Debug] ⏸️ Skipping cleanup - text looks like partial callout command');
        }

        return false;
    }

    /**
     * 处理所有引述块
     */
    processAllBlockquotes() {
        const blockquotes = document.querySelectorAll('.bq');
        let processed = 0;

        blockquotes.forEach((bq) => {
            if (this.processBlockquote(bq as HTMLElement)) {
                processed++;
            }
        });

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
            logger.error('[Callout] Error clearing style:', error);
            return false;
        }
    }

    /**
     * 添加标题只读样式（标题不可编辑，但允许回车添加新行）
     */
    private addTitleEditFunction(blockquote: HTMLElement, titleDiv: HTMLElement) {
        // 移除旧的双击监听器（如果存在）
        if ((titleDiv as any)._titleDblClickHandler) {
            titleDiv.removeEventListener('dblclick', (titleDiv as any)._titleDblClickHandler, true);
            (titleDiv as any)._titleDblClickHandler = null;
        }

        // 阻止双击选中文本
        const dblClickHandler = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 清除任何文本选择
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
            }
        };

        // 阻止鼠标选择文本（mousedown 时）
        const mouseDownHandler = (e: MouseEvent) => {
            // 只在标题区域（不是图标区域）阻止选择
            const rect = titleDiv.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            
            if (clickX > 40) {
                e.preventDefault();
            }
        };

        // 阻止选择变化（selectstart）
        const selectStartHandler = (e: Event) => {
            e.preventDefault();
        };

        // 保存引用
        (titleDiv as any)._titleDblClickHandler = dblClickHandler;
        (titleDiv as any)._titleMouseDownHandler = mouseDownHandler;
        (titleDiv as any)._titleSelectStartHandler = selectStartHandler;

        // 添加监听器
        titleDiv.addEventListener('dblclick', dblClickHandler, true);
        titleDiv.addEventListener('mousedown', mouseDownHandler, true);
        titleDiv.addEventListener('selectstart', selectStartHandler, false);

        // 保持 contenteditable="true"，这样才能按回车添加新行
        // 使用事件监听器来限制文本选择
        titleDiv.style.cursor = 'default';
        titleDiv.title = 'Callout 标题（只读，按回车添加新行）';
    }



    /**
     * 移除标题只读功能（恢复为可编辑）
     */
    private removeTitleEditFunction(titleDiv: HTMLElement) {
        // 移除双击监听器
        if ((titleDiv as any)._titleDblClickHandler) {
            titleDiv.removeEventListener('dblclick', (titleDiv as any)._titleDblClickHandler, true);
            (titleDiv as any)._titleDblClickHandler = null;
        }
        
        // 移除 mousedown 监听器
        if ((titleDiv as any)._titleMouseDownHandler) {
            titleDiv.removeEventListener('mousedown', (titleDiv as any)._titleMouseDownHandler, true);
            (titleDiv as any)._titleMouseDownHandler = null;
        }
        
        // 移除 selectstart 监听器
        if ((titleDiv as any)._titleSelectStartHandler) {
            titleDiv.removeEventListener('selectstart', (titleDiv as any)._titleSelectStartHandler, false);
            (titleDiv as any)._titleSelectStartHandler = null;
        }
        
        // 恢复默认样式
        titleDiv.style.cursor = '';
        titleDiv.title = '';
    }

    /**
     * 移除折叠功能（兼容旧方法名）
     */
    private removeCollapseToggle(titleDiv: HTMLElement) {
        this.removeTitleEditFunction(titleDiv);
    }



    /**
     * 检查是否为新创建的引述块
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
     * 检查引述块是否为空
     */
    isBlockQuoteEmpty(blockQuote: HTMLElement): boolean {
        const contentDiv = this.getFirstContentDiv(blockQuote);
        if (!contentDiv) return false;

        const text = contentDiv.textContent?.trim() || '';
        return text === '' || text.length < 3 || /^[\s\n\r]*$/.test(text);
    }

    /**
     * 标记引述块为已跟踪
     */
    trackBlockQuote(nodeId: string) {
        this.trackedBlockQuotes.add(nodeId);
    }

    /**
     * 标记引述块为最近创建
     */
    markAsRecentlyCreated(nodeId: string, timeout: number = 3000) {
        this.recentlyCreatedBlockQuotes.add(nodeId);
        setTimeout(() => this.recentlyCreatedBlockQuotes.delete(nodeId), timeout);
    }

    /**
     * 检查是否为最近创建的引述块
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
     * 解析参数化命令语法 - 支持宽度、高度和折叠状态参数
     * 支持格式: [!info|30%] 或 [!info|30%|120px] 或 [!info|120px]
     * 支持折叠: [!info]+ (展开) 或 [!info]- (折叠)
     * 组合格式: [!info|30%|120px]- (带宽高的折叠状态)
     */
    parseCalloutCommand(text: string): ParsedCalloutCommand | null {
        console.log('[Callout Debug] Parsing command:', text);
        
        // 匹配 [!type] 或 [!type|params] 格式，支持可选的折叠标记 +/-
        const match = text.match(/^\[!([^|\]]+)(\|.*?)?\]([+-])?$/);
        
        if (!match) {
            console.log('[Callout Debug] ❌ No regex match');
            return null;
        }

        const calloutType = match[1]; // info
        const paramsString = match[2]; // |30%|120px
        const collapseMarker = match[3]; // + 或 - 或 undefined
        
        // console.log('[Callout] 📋 解析结果:', {
        //     calloutType,
        //     paramsString,
        //     collapseMarker,
        //     fullMatch: match[0]
        // });
        
        // 构造查找用的键（现在配置中使用 [!type] 格式）
        const searchKey = `[!${calloutType}]`;
        
        // 查找匹配的配置
        const config = this.calloutTypes.get(searchKey);
        
        if (!config) {
            console.log('[Callout Debug] ❌ Config not found for:', searchKey);
            logger.log('[Callout] ❌ 找不到配置，searchKey:', searchKey);
            logger.log('[Callout] 可用的配置键:', Array.from(this.calloutTypes.keys()));
            return null;
        }
        
        console.log('[Callout Debug] ✅ Config found for:', searchKey);


        // 解析参数 - 支持宽度和高度
        const params = paramsString ? paramsString.substring(1).split('|') : []; // 移除开头的|
        
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
        
        // 解析折叠状态：- 表示折叠，+ 表示展开，undefined 表示默认展开
        const collapsed = collapseMarker === '-' ? true : (collapseMarker === '+' ? false : null);
        

        return {
            type: config.type,
            config: config,
            position: 'normal', // 固定为normal
            width: width,
            height: height,
            spacing: spacing,
            collapsed: collapsed,
            originalCommand: text
        };
    }


    /**
     * 解析宽度参数
     */
    private parseWidth(param: string): string {
        //console.log('[Callout] 🔍 parseWidth接收参数:', param);
        
        const normalized = param.trim();
        // console.log('[Callout] 📐 标准化后的参数:', normalized);
        
        // 验证宽度格式 (支持 % 和 px, em, rem 等，支持小数)
        if (/^[\d.]+(%|px|em|rem|vw)$/.test(normalized)) {
           // console.log('[Callout] ✅ 正则匹配成功，返回:', normalized);
            return normalized;
        }
        
        // 如果只是数字，默认当作百分比
        if (/^[\d.]+$/.test(normalized)) {
            const num = parseFloat(normalized);
            if (num > 0 && num <= 100) { // 限制到100%
                const result = `${num}%`;
                return result;
            }
        }
        
       //console.log('[Callout] ❌ 参数无效，回退到默认20%');
        return '10%'; // 回退到默认值
    }

    /**
     * 解析高度参数
     */
    private parseHeight(param: string): string | null {
        const normalized = param.trim();
        
        // 验证高度格式 (支持 px, 支持小数)
        if (/^[\d.]+px$/.test(normalized)) {
            const num = parseFloat(normalized);
            
            // 限制高度范围（50px - 1000px）
            if (num >= 50 && num <= 1000) {
                return normalized;
            } else {
                return null;
            }
        }
        
        // 如果只是数字，默认当作像素
        if (/^[\d.]+$/.test(normalized)) {
            const num = parseFloat(normalized);
            if (num >= 50 && num <= 1000) {
                const result = `${Math.round(num)}px`;
                return result;
            }
        }
        
        logger.log('[Callout] ❌ 高度参数无效，忽略');
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
        logger.log('[Callout] 🧽 清除宽度和高度样式');
        
        // 清除宽度和高度相关的CSS变量
        blockquote.style.removeProperty('--margin-width');
        blockquote.style.removeProperty('--margin-height');
        blockquote.style.removeProperty('min-height');
        
        logger.log('[Callout] 🧽 宽度和高度样式清除完成');
    }


    /**
     * 检查是否处于初始加载状态
     */
    isInInitialLoad(): boolean {
        return this.isInitialLoad;
    }


    /**
     * 销毁处理器，清理所有资源
     */
    destroy() {
        // 遍历所有已跟踪的 callout，移除事件监听器和删除按钮
        this.trackedBlockQuotes.forEach(nodeId => {
            const callout = document.querySelector(`[data-node-id="${nodeId}"][custom-callout]`);
            if (callout) {
                const titleDiv = callout.querySelector('[data-callout-title="true"]') as HTMLElement;
                if (titleDiv) {
                    this.removeCollapseToggle(titleDiv);
                }
            }
        });
        
        // 清空跟踪集合
        this.trackedBlockQuotes.clear();
        this.recentlyCreatedBlockQuotes.clear();
    }
}

