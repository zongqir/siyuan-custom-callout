import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig, ParsedCalloutCommand } from './types';
import { logger } from '../libs/logger';
import { getChildBlocks, deleteBlock } from '../api';

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
     * 处理单个引述块
     */
    processBlockquote(blockquote: HTMLElement): boolean {
        if (!blockquote) return false;

        // 确保是blockquote元素
        if (!blockquote.classList.contains('bq')) {
            return false;
        }

        const titleDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
        const text = titleDiv?.textContent?.trim() || '';

        // 处理所有涉及边注位置清理的逻辑 - 简化版
        if (text === '' && !blockquote.hasAttribute('custom-callout') && !blockquote.hasAttribute('data-margin-width') && !blockquote.hasAttribute('data-margin-height')) {
            if (this.hasMarginNoteStyles(blockquote)) {
                this.clearMarginNoteStyles(blockquote);
                return false;
            }
        }

        // 跳过已有自定义样式的引述块  
        if (this.hasCustomStyle(blockquote)) {
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
        const parsedCommand = this.parseCalloutCommand(text);
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

            // 应用折叠状态
            if (parsedCommand.collapsed !== null && parsedCommand.collapsed !== undefined) {
                blockquote.setAttribute('data-collapsed', String(parsedCommand.collapsed));
            }

            // 添加折叠功能
            this.addCollapseToggle(blockquote, titleDiv);

            return true;
        }

        // 回退到旧的匹配方式（向后兼容）
        //console.log('[Callout] 尝试旧的匹配方式');
        for (const [trigger, config] of this.calloutTypes.entries()) {
            if (text.startsWith(trigger)) {
                logger.log('[Callout] 📝 匹配旧格式成功:', trigger);
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
        //console.log('[Callout] 🔍 没有匹配任何callout类型，进入清理逻辑');
        
        // 如果不匹配任何 callout 类型，谨慎清除属性（保留宽度设置）
        if (blockquote.hasAttribute('custom-callout')) {
            logger.log('[Callout] ========== 谨慎清除 callout 属性（保留宽度）==========');
            this.clearCalloutAttributesConservatively(blockquote, titleDiv);
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
     * 检查引述块是否为空（没有子块）
     */
    async isBlockquoteEmpty(blockquote: HTMLElement): Promise<boolean> {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) {
            return false;
        }

        try {
            const childBlocks = await getChildBlocks(nodeId);
           // logger.log('[Callout] 检查引述块子块数量:', childBlocks?.length || 0);
            
            // 如果没有子块，则认为是空的
            return !childBlocks || childBlocks.length === 0;
        } catch (error) {
            logger.error('[Callout] 检查子块失败:', error);
            return false;
        }
    }

    /**
     * 删除空的引述块
     */
    async removeEmptyBlockquote(blockquote: HTMLElement): Promise<boolean> {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) {
            logger.warn('[Callout] 无法获取引述块ID，跳过删除');
            return false;
        }

        try {
            logger.log('[Callout] 🗑️ 删除空的引述块:', nodeId);
            await deleteBlock(nodeId);
            logger.log('[Callout] ✅ 成功删除空引述块');
            return true;
        } catch (error) {
            logger.error('[Callout] 删除引述块失败:', error);
            return false;
        }
    }

    /**
     * 扫描并清理空的引述块（增加保护机制）
     */
    async scanAndRemoveEmptyBlockquotes(): Promise<number> {
        const blockquotes = document.querySelectorAll('[data-type="NodeBlockquote"], .bq');
        let removedCount = 0;

        for (const bq of blockquotes) {
            const blockquoteElement = bq as HTMLElement;
            
            try {
                // 检查是否是正在操作的引述块
                if (this.isBlockquoteBeingUsed(blockquoteElement)) {
                    logger.log('[Callout] ⚠️ 跳过正在操作的引述块，避免误删');
                    continue;
                }
                
                const isEmpty = await this.isBlockquoteEmpty(blockquoteElement);
                
                if (isEmpty) {
                    const success = await this.removeEmptyBlockquote(blockquoteElement);
                    if (success) {
                        removedCount++;
                    }
                }
            } catch (error) {
                logger.error('[Callout] 处理引述块时发生错误:', error);
            }
        }

        if (removedCount > 0) {
            logger.log(`[Callout] 🧹 清理完成，删除了 ${removedCount} 个空引述块`);
        }

        return removedCount;
    }

    /**
     * 检查引述块是否正在被使用（有焦点或最近被操作）
     */
    private isBlockquoteBeingUsed(blockquote: HTMLElement): boolean {
        // 检查是否有焦点
        const activeElement = document.activeElement;
        if (activeElement && blockquote.contains(activeElement)) {
            return true;
        }

        // 检查是否是最近创建的
        const nodeId = blockquote.getAttribute('data-node-id');
        if (nodeId && this.isRecentlyCreated(nodeId)) {
            return true;
        }

        // 检查是否有contenteditable焦点
        const editableDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
        if (editableDiv) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (editableDiv.contains(range.commonAncestorContainer)) {
                    return true;
                }
            }
        }

        return false;
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
                    logger.log('[Callout] 单击标题，执行折叠操作');
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

            logger.log('[Callout] 双击标题，进入编辑模式');
            
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
    private async toggleCollapse(blockquote: HTMLElement) {
        const isCollapsed = blockquote.getAttribute('data-collapsed') === 'true';
        const newCollapsed = !isCollapsed;
        blockquote.setAttribute('data-collapsed', String(newCollapsed));
        
        // 🎯 持久化折叠状态到标题
        await this.persistCollapseState(blockquote);
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
        const contentDiv = blockQuote.querySelector('[contenteditable="true"]') as HTMLElement;
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
        
        // 匹配 [!type] 或 [!type|params] 格式，支持可选的折叠标记 +/-
        const match = text.match(/^\[!([^|\]]+)(\|.*?)?\]([+-])?$/);
        if (!match) {
            return null;
        }

        const calloutType = match[1]; // info
        const paramsString = match[2]; // |30%|120px
        const collapseMarker = match[3]; // + 或 - 或 undefined
        
        // logger.log('[Callout] 📋 解析结果:', {
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
            logger.log('[Callout] ❌ 找不到配置，searchKey:', searchKey);
            logger.log('[Callout] 可用的配置键:', Array.from(this.calloutTypes.keys()));
            return null;
        }


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
     * 持久化折叠状态到标题
     */
    private async persistCollapseState(blockquote: HTMLElement) {
        // 找到可编辑的标题div
        const titleDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
        if (!titleDiv) {
            logger.error('[Callout] 找不到可编辑标题div');
            return;
        }

        // 获取原本的标题内容
        const originalContent = titleDiv.textContent?.trim() || '';

        // 解析现有的callout格式
        const parsed = this.parseCalloutTitleInternal(originalContent);
        
        // 🎯 更新折叠状态（从DOM属性读取）
        const currentCollapsed = blockquote.getAttribute('data-collapsed');
        if (currentCollapsed === 'true') {
            parsed.collapsed = true;
        } else if (currentCollapsed === 'false') {
            parsed.collapsed = false;
        } else {
            parsed.collapsed = null;
        }
        
        logger.log('[Callout] 🎯 持久化折叠状态:', {
            currentCollapsed,
            parsedCollapsed: parsed.collapsed,
            originalContent
        });

        // 生成新的标题内容
        const newContent = this.generateCalloutTitleInternal(parsed);

        // 模拟键盘输入替换
        await this.simulateKeyboardInputInternal(titleDiv, newContent);
    }

    /**
     * 解析callout标题（内部使用）
     */
    private parseCalloutTitleInternal(content: string): {
        type: string, 
        width: string | null, 
        height: string | null, 
        collapsed: boolean | null
    } {
        const result = {
            type: 'info', 
            width: null as string | null, 
            height: null as string | null, 
            collapsed: null as boolean | null
        };
        
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
                        result.width = trimmed;
                    } else if (trimmed.endsWith('px')) {
                        // 高度参数
                        result.height = trimmed;
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * 生成新的callout标题（内部使用）
     */
    private generateCalloutTitleInternal(parsed: {
        type: string, 
        width: string | null, 
        height: string | null, 
        collapsed: boolean | null
    }): string {
        const params: string[] = [];
        
        if (parsed.width !== null) {
            params.push(parsed.width);
        }
        
        if (parsed.height !== null) {
            params.push(parsed.height);
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
     * 模拟键盘输入（内部使用）
     */
    private async simulateKeyboardInputInternal(titleDiv: HTMLElement, newContent: string) {
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
        
        logger.log('[Callout] ✅ 标题已更新:', newContent);
    }

    /**
     * 销毁处理器，清理所有资源
     */
    destroy() {
        // 遍历所有已跟踪的 callout，移除事件监听器
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

