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

        const titleDiv = blockquote.querySelector('div[contenteditable="true"]') as HTMLElement;
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

            // 应用折叠状态
            if (parsedCommand.collapsed !== null && parsedCommand.collapsed !== undefined) {
                blockquote.setAttribute('data-collapsed', String(parsedCommand.collapsed));
            }

            // 添加折叠功能（仅保留双击编辑，不包含点击折叠）
            this.addTitleEditFunction(blockquote, titleDiv);

            // 添加插入按钮
            this.addInsertButton(blockquote);

            // 添加折叠按钮
            this.addCollapseButton(blockquote);

            // 添加删除按钮
            this.addDeleteButton(blockquote);

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

                // 添加折叠功能（仅保留双击编辑，不包含点击折叠）
                this.addTitleEditFunction(blockquote, titleDiv);

                // 添加插入按钮
                this.addInsertButton(blockquote);

                // 添加折叠按钮
                this.addCollapseButton(blockquote);

                // 添加删除按钮
                this.addDeleteButton(blockquote);

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
        this.removeInsertButton(blockquote);
        this.removeCollapseButton(blockquote);
        this.removeDeleteButton(blockquote);
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
        this.removeInsertButton(blockquote);
        this.removeCollapseButton(blockquote);
        this.removeDeleteButton(blockquote);
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

            // 移除所有按钮
            this.removeInsertButton(blockquoteElement);
            this.removeCollapseButton(blockquoteElement);
            this.removeDeleteButton(blockquoteElement);

            return true;
        } catch (error) {
            logger.error('[Callout] Error clearing style:', error);
            return false;
        }
    }

    /**
     * 添加标题编辑功能（仅双击编辑，移除单击折叠）
     */
    private addTitleEditFunction(blockquote: HTMLElement, titleDiv: HTMLElement) {
        // 移除旧的监听器
        if ((titleDiv as any)._titleDblClickHandler) {
            titleDiv.removeEventListener('dblclick', (titleDiv as any)._titleDblClickHandler, true);
        }

        // 创建双击处理器（用于编辑）
        const dblClickHandler = (e: MouseEvent) => {
            const rect = titleDiv.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            // 点击图标区域（0-40px）不处理编辑
            if (clickX >= 0 && clickX <= 40) {
                return;
            }

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
        (titleDiv as any)._titleDblClickHandler = dblClickHandler;

        // 添加监听器
        titleDiv.addEventListener('dblclick', dblClickHandler, true);
        
        // 设置光标样式提示用户可以双击编辑
        titleDiv.style.cursor = 'text';
        titleDiv.title = '双击编辑';
    }

    /**
     * 添加折叠按钮
     */
    private addCollapseButton(blockquote: HTMLElement) {
        // 检查是否已经存在折叠按钮
        const existingButton = blockquote.querySelector('.callout-collapse-button');
        if (existingButton) {
            return; // 已存在，不重复添加
        }

        const collapseButton = document.createElement('div');
        collapseButton.className = 'callout-collapse-button';
        collapseButton.title = '折叠/展开';
        
        // 设置简单的减号图标
        collapseButton.innerHTML = '−';
        
        // 应用样式
        const isDark = this.isDarkMode();
        collapseButton.style.cssText = this.getCollapseButtonStyle(isDark);

        // 添加鼠标事件
        collapseButton.addEventListener('mouseenter', () => {
            collapseButton.style.background = 'rgba(0, 122, 255, 1)';
            collapseButton.style.transform = 'scale(1.1)';
            collapseButton.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.15)';
        });

        collapseButton.addEventListener('mouseleave', () => {
            collapseButton.style.cssText = this.getCollapseButtonStyle(isDark);
            this.updateCollapseButtonIcon(collapseButton, blockquote.getAttribute('data-collapsed') === 'true');
        });

        // 添加点击事件
        collapseButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleCollapseButtonClick(blockquote, collapseButton);
        });

        // 将按钮添加到blockquote
        blockquote.appendChild(collapseButton);

        // 保存按钮引用以便清理
        (blockquote as any)._collapseButton = collapseButton;
    }

    /**
     * 更新折叠按钮图标
     */
    private updateCollapseButtonIcon(button: HTMLElement, isCollapsed: boolean) {
        // 统一使用简单的减号图标，不区分状态
        button.innerHTML = '−';
    }

    /**
     * 获取折叠按钮样式
     */
    private getCollapseButtonStyle(isDark: boolean): string {
        return `
            position: absolute;
            top: 6px;
            right: 26px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${isDark ? 'rgba(0, 122, 255, 0.85)' : 'rgba(0, 122, 255, 0.9)'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 10px;
            color: white;
            font-weight: 600;
            transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
            z-index: 100;
            border: 0.5px solid rgba(255, 255, 255, 0.2);
        `;
    }

    /**
     * 处理折叠按钮点击
     */
    private handleCollapseButtonClick(blockquote: HTMLElement, button: HTMLElement) {
        try {
            // 切换折叠状态
            this.toggleCollapse(blockquote);
            
            // 更新按钮图标
            const isCollapsed = blockquote.getAttribute('data-collapsed') === 'true';
            this.updateCollapseButtonIcon(button, isCollapsed);
            
            logger.log('[Callout] 🔄 折叠按钮点击完成，当前状态:', isCollapsed ? '折叠' : '展开');
        } catch (error) {
            logger.error('[Callout] 折叠按钮处理出错:', error);
        }
    }

    /**
     * 移除折叠按钮
     */
    private removeCollapseButton(blockquote: HTMLElement) {
        const collapseButton = (blockquote as any)._collapseButton;
        if (collapseButton && collapseButton.parentNode) {
            collapseButton.remove();
            (blockquote as any)._collapseButton = null;
        }
    }

    /**
     * 添加插入按钮
     */
    private addInsertButton(blockquote: HTMLElement) {
        // 检查是否已经存在插入按钮
        const existingButton = blockquote.querySelector('.callout-insert-button');
        if (existingButton) {
            return; // 已存在，不重复添加
        }

        const insertButton = document.createElement('div');
        insertButton.className = 'callout-insert-button';
        insertButton.innerHTML = '＋';
        insertButton.title = '插入内容行';
        
        // 应用样式
        const isDark = this.isDarkMode();
        insertButton.style.cssText = this.getInsertButtonStyle(isDark);

        // 添加鼠标事件
        insertButton.addEventListener('mouseenter', () => {
            insertButton.style.background = 'rgba(48, 176, 199, 1)';
            insertButton.style.transform = 'scale(1.1)';
            insertButton.style.boxShadow = '0 2px 8px rgba(52, 199, 89, 0.3), 0 2px 4px rgba(0, 0, 0, 0.15)';
        });

        insertButton.addEventListener('mouseleave', () => {
            insertButton.style.cssText = this.getInsertButtonStyle(isDark);
        });

        // 添加点击事件
        insertButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleInsertButtonClick(blockquote);
        });

        // 将按钮添加到blockquote
        blockquote.appendChild(insertButton);

        // 保存按钮引用以便清理
        (blockquote as any)._insertButton = insertButton;
    }

    /**
     * 获取插入按钮样式
     */
    private getInsertButtonStyle(isDark: boolean): string {
        return `
            position: absolute;
            top: 6px;
            right: 46px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${isDark ? 'rgba(52, 199, 89, 0.85)' : 'rgba(52, 199, 89, 0.9)'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 10px;
            color: white;
            font-weight: 600;
            transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
            z-index: 100;
            border: 0.5px solid rgba(255, 255, 255, 0.2);
        `;
    }

    /**
     * 处理插入按钮点击
     */
    private handleInsertButtonClick(blockquote: HTMLElement) {
        try {
            // 找到标题div
            const titleDiv = blockquote.querySelector('[data-callout-title="true"]') as HTMLElement;
            if (!titleDiv) {
                logger.error('[Callout] 找不到标题div');
                return;
            }

            // 插入回车到标题结尾
            this.insertNewlineAtTitleEnd(titleDiv);
            
            logger.log('[Callout] ➕ 插入按钮点击完成');
        } catch (error) {
            logger.error('[Callout] 插入按钮处理出错:', error);
        }
    }

    /**
     * 在标题结尾插入回车
     */
    private insertNewlineAtTitleEnd(titleDiv: HTMLElement) {
        // 聚焦到标题div
        titleDiv.focus();
        
        // 将光标移动到文本结尾
        const selection = window.getSelection();
        const range = document.createRange();
        
        // 选择标题div的所有内容
        range.selectNodeContents(titleDiv);
        // 将光标移动到结尾
        range.collapse(false);
        
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // 短暂等待确保光标定位
        setTimeout(() => {
            // 创建回车键事件
            const enterKeyDown = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });
            
            const enterKeyUp = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter', 
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });
            
            // 分发键盘事件
            titleDiv.dispatchEvent(enterKeyDown);
            titleDiv.dispatchEvent(enterKeyUp);
            
            // 也触发input事件确保变化被检测到
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertLineBreak'
            });
            titleDiv.dispatchEvent(inputEvent);
            
            logger.log('[Callout] ↩️ 在标题结尾插入回车完成');
        }, 50);
    }

    /**
     * 移除插入按钮
     */
    private removeInsertButton(blockquote: HTMLElement) {
        const insertButton = (blockquote as any)._insertButton;
        if (insertButton && insertButton.parentNode) {
            insertButton.remove();
            (blockquote as any)._insertButton = null;
        }
    }

    /**
     * 移除标题编辑功能
     */
    private removeTitleEditFunction(titleDiv: HTMLElement) {
        if ((titleDiv as any)._titleDblClickHandler) {
            titleDiv.removeEventListener('dblclick', (titleDiv as any)._titleDblClickHandler, true);
            (titleDiv as any)._titleDblClickHandler = null;
        }
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
     * 添加删除按钮
     */
    private addDeleteButton(blockquote: HTMLElement) {
        // 检查是否已经存在删除按钮
        const existingButton = blockquote.querySelector('.callout-delete-button');
        if (existingButton) {
            return; // 已存在，不重复添加
        }

        const deleteButton = document.createElement('div');
        deleteButton.className = 'callout-delete-button';
        deleteButton.innerHTML = '×';
        deleteButton.title = '删除 Callout';
        
        // 应用样式（类似菜单关闭按钮的样式）
        const isDark = this.isDarkMode();
        deleteButton.style.cssText = this.getDeleteButtonStyle(isDark);

        // 添加鼠标事件
        deleteButton.addEventListener('mouseenter', () => {
            deleteButton.style.background = 'rgba(255, 69, 58, 1)';
            deleteButton.style.transform = 'scale(1.1)';
            deleteButton.style.boxShadow = '0 2px 8px rgba(255, 69, 58, 0.3), 0 2px 4px rgba(0, 0, 0, 0.15)';
        });

        deleteButton.addEventListener('mouseleave', () => {
            deleteButton.style.cssText = this.getDeleteButtonStyle(isDark);
        });

        // 添加点击事件
        deleteButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDeleteButtonClick(blockquote);
        });

        // 将按钮添加到blockquote
        blockquote.style.position = 'relative'; // 确保relative定位
        blockquote.appendChild(deleteButton);

        // 保存按钮引用以便清理
        (blockquote as any)._deleteButton = deleteButton;
    }

    /**
     * 移除删除按钮
     */
    private removeDeleteButton(blockquote: HTMLElement) {
        const deleteButton = (blockquote as any)._deleteButton;
        if (deleteButton && deleteButton.parentNode) {
            deleteButton.remove();
            (blockquote as any)._deleteButton = null;
        }
    }

    /**
     * 获取删除按钮样式
     */
    private getDeleteButtonStyle(isDark: boolean): string {
        return `
            position: absolute;
            top: 6px;
            right: 6px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${isDark ? 'rgba(255, 95, 87, 0.85)' : 'rgba(255, 95, 87, 0.9)'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 11px;
            color: white;
            font-weight: 500;
            transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
            z-index: 100;
            border: 0.5px solid rgba(255, 255, 255, 0.2);
        `;
    }

    /**
     * 检查是否为暗色模式
     */
    private isDarkMode(): boolean {
        // 检查body或html的data-theme-mode属性
        const themeMode = document.body.getAttribute('data-theme-mode') || 
                         document.documentElement.getAttribute('data-theme-mode') ||
                         document.body.getAttribute('data-light-theme') ||
                         document.documentElement.getAttribute('data-light-theme');
        
        // 如果找不到主题属性，检查body的类名
        if (!themeMode) {
            return document.body.classList.contains('theme--dark') || 
                   document.documentElement.classList.contains('theme--dark');
        }
        
        return themeMode === 'dark' || themeMode === '0';
    }

    /**
     * 处理删除按钮点击
     */
    private handleDeleteButtonClick(blockquote: HTMLElement) {
        try {
            // 第一件事：模拟点击之前经过CSS处理的关闭按钮
            // 清除callout样式
            this.clearCalloutStyle(blockquote);
            
            // 第二件事：模拟键盘的backspace
            const titleDiv = blockquote.querySelector('[contenteditable="true"]') as HTMLElement;
            if (titleDiv) {
                this.simulateBackspace(titleDiv);
            }
            
            logger.log('[Callout] 🗑️ 删除按钮点击完成');
        } catch (error) {
            logger.error('[Callout] 删除按钮处理出错:', error);
        }
    }

    /**
     * 模拟backspace按键
     */
    private simulateBackspace(element: HTMLElement) {
        // 聚焦到元素
        element.focus();
        
        // 创建backspace键盘事件
        const backspaceKeyDown = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            keyCode: 8,
            which: 8,
            bubbles: true,
            cancelable: true
        });
        
        const backspaceKeyUp = new KeyboardEvent('keyup', {
            key: 'Backspace', 
            code: 'Backspace',
            keyCode: 8,
            which: 8,
            bubbles: true,
            cancelable: true
        });
        
        // 分发事件
        element.dispatchEvent(backspaceKeyDown);
        element.dispatchEvent(backspaceKeyUp);
        
        // 也触发input事件确保变化被检测到
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'deleteContentBackward'
        });
        element.dispatchEvent(inputEvent);
        
        logger.log('[Callout] ⌫ 模拟backspace完成');
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
        // 遍历所有已跟踪的 callout，移除事件监听器和删除按钮
        this.trackedBlockQuotes.forEach(nodeId => {
            const callout = document.querySelector(`[data-node-id="${nodeId}"][custom-callout]`);
            if (callout) {
                const titleDiv = callout.querySelector('[data-callout-title="true"]') as HTMLElement;
                if (titleDiv) {
                    this.removeCollapseToggle(titleDiv);
                }
                // 移除所有按钮
                this.removeInsertButton(callout as HTMLElement);
                this.removeCollapseButton(callout as HTMLElement);
                this.removeDeleteButton(callout as HTMLElement);
            }
        });
        
        // 清空跟踪集合
        this.trackedBlockQuotes.clear();
        this.recentlyCreatedBlockQuotes.clear();
    }
}

