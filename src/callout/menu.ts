import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig } from './types';
import { CalloutProcessor } from './processor';
import { MenuThemeHelper } from './menu-theme-helper';
import * as MenuStyles from './menu-styles';
import { logger } from '../libs/logger';

/**
 * Callout命令菜单管理器
 */
export class CalloutMenu {
    private commandMenu: HTMLElement | null = null;
    private isMenuVisible: boolean = false;
    private currentTargetBlockQuote: HTMLElement | null = null;
    private selectedMenuIndex: number = 0;
    private menuItems: HTMLElement[] = [];
    private processor: CalloutProcessor;
    private calloutTypes: CalloutTypeConfig[] = [...DEFAULT_CALLOUT_TYPES];
    private gridColumns: number = 3; // 默认3列
    
    // 键盘过滤相关
    private filterMode: boolean = false;
    private filterText: string = '';
    private filterInput: HTMLElement | null = null;
    private allCalloutTypes: CalloutTypeConfig[] = [...DEFAULT_CALLOUT_TYPES];
    
    // 保存当前菜单的编辑状态
    private currentIsEdit: boolean = false;
    
    // 主题辅助类
    private themeHelper: MenuThemeHelper;
    
    // 保存事件监听器引用
    private globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
    private globalClickHandler: ((e: MouseEvent) => void) | null = null;
    
    // 🔧 控制鼠标悬停是否可以改变选中状态（防止菜单刚打开时鼠标位置干扰）
    private allowMouseHover: boolean = false;

    constructor(processor: CalloutProcessor) {
        this.processor = processor;
        this.themeHelper = new MenuThemeHelper();
        this.setupGlobalEventListeners();
        
        // 订阅主题变化
        this.themeHelper.subscribe((isDark) => {
            logger.log('[Callout Menu] 🌙 主题已切换:', isDark ? '黑夜' : '白天');
            if (this.isMenuVisible && this.commandMenu) {
                this.themeHelper.refreshMenuTheme(this.commandMenu);
            }
        });
    }

    /**
     * 获取当前是否为黑夜模式
     */
    private isDarkMode(): boolean {
        return this.themeHelper.isDark();
    }

    /**
     * 更新 Callout 类型（动态配置）
     */
    updateTypes(types: CalloutTypeConfig[]) {
        this.calloutTypes = types;
        this.allCalloutTypes = types;
    }

    /**
     * 更新网格列数
     */
    updateGridColumns(columns: number) {
        this.gridColumns = columns;
    }

    /**
     * 创建命令菜单
     */
    createCommandMenu(targetBlockQuote: HTMLElement, isEdit: boolean = false): HTMLElement {
        if (this.commandMenu) {
            return this.commandMenu;
        }

        this.currentTargetBlockQuote = targetBlockQuote;
        this.currentIsEdit = isEdit; // 保存编辑状态
        // console.log('[Callout Menu] 🎯 createCommandMenu - isEdit:', isEdit);
        this.selectedMenuIndex = 0;
        this.menuItems = [];
        this.allowMouseHover = false; // 🔧 禁用鼠标悬停，防止初始位置干扰

        const menu = document.createElement('div');
        menu.className = 'custom-callout-menu';
        menu.setAttribute('tabindex', '0');
        // 应用主题样式
        menu.style.cssText = MenuStyles.getMenuContainerStyle(this.isDarkMode());

        // 关闭按钮
        const closeButton = this.createCloseButton();
        menu.appendChild(closeButton);

        // 标题
        const header = this.createHeader(isEdit);
        menu.appendChild(header);

        // 过滤输入框
        const filterInputElement = this.createFilterInput();
        menu.appendChild(filterInputElement);
        this.filterInput = filterInputElement;

        // 菜单项网格
        const gridContainer = this.createMenuGrid(isEdit);
        menu.appendChild(gridContainer);

        // 编辑模式下的边注设置已集成到网格中

        // 底部提示
        const footer = this.createFooter();
        menu.appendChild(footer);

        // 添加键盘事件
        this.setupMenuKeyboardEvents(menu);

        // 简化的设置事件（如果是编辑模式）
        if (isEdit) {
            // 仅保留基本设置，不再有复杂的边注工具栏
        }

        document.body.appendChild(menu);
        this.commandMenu = menu;

        return menu;
    }

    /**
     * 创建关闭按钮
     */
    private createCloseButton(): HTMLElement {
        const closeButton = document.createElement('div');
        closeButton.setAttribute('data-menu-close', '');
        closeButton.style.cssText = MenuStyles.getCloseButtonStyle(this.isDarkMode());
        closeButton.innerHTML = '×';

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = '#ef4444';
            closeButton.style.color = 'white';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.cssText = MenuStyles.getCloseButtonStyle(this.isDarkMode());
        });

        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideMenu(true);
        });

        return closeButton;
    }

    /**
     * 创建标题
     */
    private createHeader(isEdit: boolean): HTMLElement {
        const header = document.createElement('div');
        header.setAttribute('data-menu-header', '');
        header.style.cssText = MenuStyles.getHeaderStyle(this.isDarkMode());
        const headerText = isEdit ? '切换 Callout 类型' : 'Callout 命令菜单';
        header.innerHTML = `<div>${headerText}</div>`;
        return header;
    }

    /**
     * 创建过滤输入框
     */
    private createFilterInput(): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = MenuStyles.getFilterInputContainerStyle(this.isDarkMode(), 'none');

        const inputWrapper = document.createElement('div');
        inputWrapper.style.cssText = MenuStyles.getFilterInputWrapperStyle(this.isDarkMode());

        // 搜索图标 (SVG)
        const icon = document.createElement('span');
        icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="#3b82f6" stroke-width="2"/>
            <path d="M20 20L16.65 16.65" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
        icon.style.cssText = MenuStyles.getFilterInputIconStyle();

        // 过滤文本显示
        const text = document.createElement('span');
        text.style.cssText = MenuStyles.getFilterInputTextStyle(this.isDarkMode());
        text.textContent = '@';

        // 提示标签
        const hint = document.createElement('span');
        hint.style.cssText = MenuStyles.getFilterInputHintStyle(this.isDarkMode());
        hint.textContent = 'ESC 退出';

        inputWrapper.appendChild(icon);
        inputWrapper.appendChild(text);
        inputWrapper.appendChild(hint);
        container.appendChild(inputWrapper);

        // 保存文本元素的引用
        (container as any)._textElement = text;

        return container;
    }

    /**
     * 创建菜单网格
     */
    private createMenuGrid(isEdit: boolean): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = MenuStyles.getMenuGridContainerStyle();

        // 如果是编辑模式，使用简化的网格布局
        if (isEdit) {
            const gridContainer = document.createElement('div');
            gridContainer.style.cssText = MenuStyles.getMenuGridStyle(this.gridColumns);

            // 添加"原生样式"选项
            const noneItem = this.createMenuItem({
                command: 'none',
                displayName: '原生样式',
                icon: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>`,
                isNone: true
            }, 0, isEdit);
            gridContainer.appendChild(noneItem);

            // 添加所有类型
            this.calloutTypes.forEach((config, index) => {
                const typeItem = this.createMenuItem({
                    command: config.command,
                    displayName: config.displayName,
                    icon: config.icon,
                    color: config.color,
                    isNone: false
                }, index + 1, isEdit);
                gridContainer.appendChild(typeItem);
            });

            container.appendChild(gridContainer);

        } else {
            // 新建模式，使用原来的布局
            const gridContainer = document.createElement('div');
            gridContainer.style.cssText = MenuStyles.getMenuGridStyleNoMargin(this.gridColumns);

            // 添加"原生样式"选项
            const noneItem = this.createMenuItem({
                command: 'none',
                displayName: '原生样式',
                icon: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>`,
                isNone: true
            }, 0, isEdit);
            gridContainer.appendChild(noneItem);

            // 添加所有Callout类型
            this.calloutTypes.forEach((config, index) => {
                const item = this.createMenuItem({
                    command: config.command,
                    displayName: config.displayName,
                    icon: config.icon,
                    color: config.color,
                    isNone: false
                }, index + 1, isEdit);
                gridContainer.appendChild(item);
            });

            container.appendChild(gridContainer);
        }

        return container;
    }




    /**
     * 创建菜单项
     */
    private createMenuItem(options: any, index: number, isEdit: boolean): HTMLElement {
        const item = document.createElement('div');
        item.setAttribute('data-menu-item', '');
        item.setAttribute('data-command', options.command || '');
        item.style.cssText = MenuStyles.getMenuItemStyle(this.isDarkMode(), options);
        
        item.innerHTML = `
            <span style="${MenuStyles.getMenuItemIconStyle()}">${options.icon}</span>
            <div style="${MenuStyles.getMenuItemContentStyle()}">
                <div class="menu-item-title" style="${MenuStyles.getMenuItemTitleStyle()}; color: ${MenuStyles.getMenuItemTitleColor(this.isDarkMode())}">${options.displayName}</div>
                <div class="menu-item-command" style="${MenuStyles.getMenuItemCommandStyle()}; color: ${MenuStyles.getMenuItemCommandColor(this.isDarkMode())}">${options.command}</div>
            </div>
        `;

        item.addEventListener('mouseenter', () => {
            // 🔧 只有在允许鼠标悬停时才改变选中状态（防止菜单刚打开时的干扰）
            if (this.allowMouseHover) {
                this.selectedMenuIndex = index;
                this.updateMenuSelection();
            }
        });

        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const clickStyle = MenuStyles.getMenuItemClickStyle(this.isDarkMode());
            item.style.backgroundColor = clickStyle.backgroundColor;
            item.style.color = clickStyle.color;

            // console.log('[Callout Menu] 🖱️ 菜单项点击:', {
            //     command: options.command,
            //     isEdit: isEdit,
            //     isNone: options.isNone
            // });

            if (options.isNone) {
                this.handleClearCallout();
            } else {
                this.handleSelectCallout(options.command, isEdit);
            }
        });

        this.menuItems.push(item);
        return item;
    }


    /**
     * 创建底部提示
     */
    private createFooter(): HTMLElement {
        const footer = document.createElement('div');
        footer.setAttribute('data-menu-footer', '');
        footer.style.cssText = MenuStyles.getFooterStyle(this.isDarkMode());
        footer.innerHTML = '↑↓←→ 导航 • Enter 确认 • 字母键 过滤 • ESC 关闭';
        return footer;
    }




    /**
     * 设置菜单键盘事件
     */
    private setupMenuKeyboardEvents(menu: HTMLElement) {
        menu.addEventListener('keydown', (e) => {
            const cols = this.gridColumns; // 使用动态列数
            
            // 处理 Backspace 键 - 删除过滤字符
            if (e.key === 'Backspace') {
                if (this.filterMode && this.filterText.length > 0) {
                    e.preventDefault();
                    this.filterText = this.filterText.slice(0, -1);
                    this.updateFilter();
                    return;
                } else if (this.filterMode && this.filterText.length === 0) {
                    // 退出过滤模式
                    e.preventDefault();
                    this.exitFilterMode();
                    return;
                }
            }
            
            // 处理字母和数字键 - 激活或更新过滤模式
            if (e.key.length === 1 && /^[a-zA-Z0-9]$/.test(e.key)) {
                e.preventDefault();
                if (!this.filterMode) {
                    this.enterFilterMode();
                }
                this.filterText += e.key.toLowerCase();
                this.updateFilter();
                return;
            }
            
            // ESC键 - 退出过滤模式或关闭菜单
            if (e.key === 'Escape') {
                e.preventDefault();
                if (this.filterMode) {
                    this.exitFilterMode();
                } else {
                    this.hideMenu(true);
                }
                return;
            }
            
            // 导航键和确认键
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                // 向下移动：加cols，但不超过最大索引
                const newIndex = this.selectedMenuIndex + cols;
                this.selectedMenuIndex = Math.min(newIndex, this.menuItems.length - 1);
                this.updateMenuSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                // 向上移动：减cols，但不小于0
                const newIndex = this.selectedMenuIndex - cols;
                this.selectedMenuIndex = Math.max(newIndex, 0);
                this.updateMenuSelection();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                // 🔧 修复：向右移动，但不能跨行
                const currentRow = Math.floor(this.selectedMenuIndex / cols);
                const currentCol = this.selectedMenuIndex % cols;
                const nextCol = currentCol + 1;
                
                // 只有在同一行内才移动
                if (nextCol < cols && this.selectedMenuIndex + 1 < this.menuItems.length) {
                    const nextRow = Math.floor((this.selectedMenuIndex + 1) / cols);
                    // 确保下一个位置仍在同一行
                    if (nextRow === currentRow) {
                        this.selectedMenuIndex++;
                    }
                }
                this.updateMenuSelection();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                // 🔧 修复：向左移动，但不能跨行
                const currentCol = this.selectedMenuIndex % cols;
                
                // 只有不在行首才移动
                if (currentCol > 0) {
                    this.selectedMenuIndex--;
                }
                this.updateMenuSelection();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.selectCurrentMenuItem();
            }
        });
    }

    /**
     * 更新菜单选中状态
     */
    private updateMenuSelection() {
        const isDark = this.isDarkMode();
        requestAnimationFrame(() => {
            this.menuItems.forEach((item, index) => {
                if (index === this.selectedMenuIndex) {
                    // 选中状态 - 使用高对比度颜色
                    item.style.backgroundColor = isDark ? 'rgba(59, 130, 246, 0.35)' : '#dbeafe';
                    item.style.borderColor = isDark ? '#60a5fa' : '#60a5fa';
                    item.style.transform = 'scale(1.02)';
                    // 确保文字清晰可见
                    const title = item.querySelector('.menu-item-title, .compact-item-text') as HTMLElement;
                    if (title) {
                        title.style.color = isDark ? '#ffffff' : '#1e40af';
                        title.style.fontWeight = '700';
                    }
                    const command = item.querySelector('.menu-item-command') as HTMLElement;
                    if (command) {
                        command.style.color = isDark ? '#e5e7eb' : '#3b82f6';
                    }
                } else {
                    // 非选中状态 - 恢复默认
                    item.style.backgroundColor = '';
                    item.style.borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6';
                    item.style.transform = 'scale(1)';
                    const title = item.querySelector('.menu-item-title, .compact-item-text') as HTMLElement;
                    if (title) {
                        title.style.color = '';
                        title.style.fontWeight = '';
                    }
                    const command = item.querySelector('.menu-item-command') as HTMLElement;
                    if (command) {
                        command.style.color = '';
                    }
                }
            });
        });
    }

    /**
     * 进入过滤模式
     */
    private enterFilterMode() {
        this.filterMode = true;
        this.filterText = '';
        if (this.filterInput) {
            this.filterInput.style.display = 'block';
        }
    }

    /**
     * 退出过滤模式
     */
    private exitFilterMode() {
        this.filterMode = false;
        this.filterText = '';
        if (this.filterInput) {
            this.filterInput.style.display = 'none';
            const textElement = (this.filterInput as any)._textElement;
            if (textElement) {
                textElement.textContent = '[!';
            }
        }
        // 恢复所有类型
        this.applyFilter([]);
    }

    /**
     * 更新过滤
     */
    private updateFilter() {
        if (!this.filterInput) return;

        // 更新显示的过滤文本
        const textElement = (this.filterInput as any)._textElement;
        if (textElement) {
            textElement.textContent = '[!' + this.filterText;
        }

        // 根据过滤文本获取匹配的类型
        const filtered = this.getFilteredTypes(this.filterText);
        this.applyFilter(filtered);
    }

    /**
     * 获取过滤后的类型
     */
    private getFilteredTypes(searchText: string): CalloutTypeConfig[] {
        if (!searchText) {
            return [];
        }

        const search = searchText.toLowerCase();
        return this.allCalloutTypes.filter(type => {
            // 去掉命令中的 [! 和 ] 符号再匹配
            const commandClean = type.command.toLowerCase().replace(/^\[!|\]$/g, '');
            const zhCommandClean = type.zhCommand?.toLowerCase().replace(/^\[!|\]$/g, '');
            
            // 支持宽度关键字搜索
            const widthKeywords = ['width', '宽度', 'w'];
            const hasWidthKeyword = widthKeywords.some(keyword => search.includes(keyword));
            
            const commandMatch = commandClean.startsWith(search);
            const zhCommandMatch = zhCommandClean?.startsWith(search);
            const displayNameMatch = type.displayName.toLowerCase().includes(search);
            
            // 如果搜索包含宽度关键字，则显示该类型
            return commandMatch || zhCommandMatch || displayNameMatch || hasWidthKeyword;
        });
    }

    /**
     * 应用过滤 - 使用正常的网格布局
     */
    private applyFilter(filteredTypes: CalloutTypeConfig[]) {
        // 使用保存的编辑状态，而不是重新判断
        const isEdit = this.currentIsEdit;
        
        // 清空现有菜单项
        const gridContainer = this.commandMenu?.querySelector('div[style*="grid-template-columns"]') as HTMLElement;
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        this.menuItems = [];
        this.selectedMenuIndex = 0;

        const typesToShow = filteredTypes.length > 0 ? filteredTypes : this.allCalloutTypes;

        // 恢复正常的网格布局
        gridContainer.style.cssText = MenuStyles.getMenuGridStyle(this.gridColumns);

        // 如果不在过滤模式，添加"原生样式"选项
        if (!this.filterMode || typesToShow.length === 0) {
            const noneItem = this.createMenuItem({
                command: 'none',
                displayName: '原生样式',
                icon: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>`,
                isNone: true
            }, 0, isEdit);
            gridContainer.appendChild(noneItem);
        }

        // 添加所有匹配的类型
        typesToShow.forEach((config, index) => {
            const startIndex = this.filterMode && typesToShow.length > 0 ? index : index + 1;
            const item = this.createMenuItem({
                command: config.command,
                displayName: config.displayName,
                icon: config.icon,
                color: config.color,
                isNone: false
            }, startIndex, isEdit);
            gridContainer.appendChild(item);
        });

        // 更新选中状态
        this.updateMenuSelection();
    }





    /**
     * 选择当前高亮的菜单项
     */
    private selectCurrentMenuItem() {
        if (this.menuItems[this.selectedMenuIndex]) {
            this.menuItems[this.selectedMenuIndex].click();
        }
    }

    /**
     * 处理清除Callout
     */
    private handleClearCallout() {
        if (this.currentTargetBlockQuote) {
            // 🔧 保存blockquote引用，防止hideMenu时被清空
            const targetBlockQuote = this.currentTargetBlockQuote;
            
            this.processor.clearCalloutStyle(targetBlockQuote);
            
            // 🔧 原生模式特殊处理：延迟恢复光标焦点
            setTimeout(() => {
                // 确保光标在正确的位置（兼容只读模式）
                const titleDiv = targetBlockQuote.querySelector('[contenteditable]') as HTMLElement;
                if (titleDiv) {
                    console.log('[Callout Menu] 🎯 原生模式：开始恢复光标焦点');
                    
                    // 强制聚焦并设置光标
                    titleDiv.focus();
                    
                    // 确保光标设置成功
                    requestAnimationFrame(() => {
                        const selection = window.getSelection();
                        const range = document.createRange();
                        
                        // 如果titleDiv有内容，光标移到末尾；如果没有内容，也要确保光标在其中
                        if (titleDiv.childNodes.length > 0) {
                            range.selectNodeContents(titleDiv);
                            range.collapse(false); // 光标移到末尾
                        } else {
                            // 空元素时，确保光标在元素内
                            range.selectNodeContents(titleDiv);
                        }
                        
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                        
                        console.log('[Callout Menu] ✅ 原生模式：光标焦点已恢复', {
                            focused: document.activeElement === titleDiv,
                            hasSelection: selection?.rangeCount > 0
                        });
                    });
                }
            }, 250); // 延长等待时间，确保DOM更新完成
        }
        
        // 延迟隐藏菜单，确保焦点处理完成
        setTimeout(() => this.hideMenu(true), 300);
    }

    /**
     * 处理选择Callout - 直接插入文本
     */
    private handleSelectCallout(command: string, isEdit: boolean) {
        // 查找对应的类型配置
        const typeConfig = this.calloutTypes.find(t => t.command === command);
        const displayName = typeConfig?.displayName || command;
        
        // 🔥 使用配置的 type 作为 callout 类型
        const textToInsert = `[!${typeConfig?.type || 'info'}] ${displayName}`;
        
        console.log('[Callout Menu] 📝 将插入文本:', textToInsert);
        
        // 使用 document.execCommand 插入文本
        document.execCommand('insertText', false, ' ' + textToInsert);
        
        console.log('[Callout Menu] ✅ 文本已插入');
        
        // 触发一次 Enter 让编辑器将 "> " 开头的行转换为引述块
        setTimeout(() => {
            this.triggerEnterKey();
            setTimeout(() => {
                this.processor.processAllBlockquotes();
            }, 120);
        }, 60);

        // 隐藏菜单
        this.hideMenu(true);
    }
    
    /**
     * 🆕 插入 Markdown 文本并自动触发转换（模式 B）
     */
    private insertMarkdownAndConvert(markdown: string, range: Range) {
        try {
            // 1. 删除当前选区内容
            range.deleteContents();
            
            // 2. 插入 Markdown 文本
            const textNode = document.createTextNode(markdown);
            range.insertNode(textNode);
            
            // 3. 设置光标位置（在文本末尾）
            range.setStart(textNode, markdown.length);
            range.collapse(true);
            
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            
            console.log('[Callout Menu] ✅ Markdown 已插入，准备触发转换');
            
            // 4. 自动触发回车（模式 B）
            setTimeout(() => {
                this.triggerEnterKey();
            }, 100); // 稍微延迟确保 DOM 更新
            
        } catch (error) {
            console.error('[Callout Menu] ❌ 插入 Markdown 失败:', error);
        }
    }
    
    /**
     * 🆕 触发回车键事件（模拟用户按回车）
     */
    private triggerEnterKey() {
        const activeElement = document.activeElement as HTMLElement;
        if (!activeElement) {
            console.log('[Callout Menu] ⚠️ 没有激活元素，无法触发回车');
            return;
        }
        
        console.log('[Callout Menu] 🔑 触发 Enter 键事件于:', activeElement.tagName);
        
        // 创建并触发 keydown 事件
        const keydownEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            composed: true
        });
        
        activeElement.dispatchEvent(keydownEvent);
        
        // 触发 keypress 事件（某些框架可能需要）
        const keypressEvent = new KeyboardEvent('keypress', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            composed: true
        });
        
        activeElement.dispatchEvent(keypressEvent);
        
        // 触发 keyup 事件
        const keyupEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            composed: true
        });
        
        activeElement.dispatchEvent(keyupEvent);
        
        console.log('[Callout Menu] ✅ Enter 键事件已触发');
    }

    /**
     * 获取当前焦点所在的可编辑div（在指定的blockquote内）
     */
    private getCurrentFocusedEditableDiv(blockQuoteElement: HTMLElement): HTMLElement | null {
        try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                logger.log('[Callout Menu] 🔍 No selection found');
                return null;
            }
            
            const range = selection.getRangeAt(0);
            let container = range.commonAncestorContainer;
            
            // 如果是文本节点，获取其父元素
            if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentElement!;
            }
            
            // 查找最近的contenteditable div（兼容只读模式）
            const editableDiv = (container as HTMLElement).closest('[contenteditable]') as HTMLElement;
            
            // 确保找到的div在指定的blockquote内
            if (editableDiv && blockQuoteElement.contains(editableDiv)) {
                logger.log('[Callout Menu] ✅ Found focused editable div in blockquote');
                return editableDiv;
            }
            
            logger.log('[Callout Menu] ⚠️ Focused element not in target blockquote');
            return null;
        } catch (e) {
            logger.error('[Callout Menu] ❌ Error finding focused editable div:', e);
            return null;
        }
    }

    /**
     * 统一的文本更新函数 - 模拟真实编辑
     */
    private updateEditableText(editableDiv: HTMLElement, newText: string) {
        logger.log('[Callout Menu] ✂️ 统一文本更新 - 模拟真实编辑');
        logger.log('[Callout Menu] 📄 修改前文本:', editableDiv.textContent);
        
        // 聚焦
        editableDiv.focus();
        
        // 1. 选中所有文本
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editableDiv);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        logger.log('[Callout Menu] 📝 已选中全部文本');
        
        // 2. 使用 execCommand 删除（模拟按删除键）
        document.execCommand('delete', false);
        
        logger.log('[Callout Menu] 🗑️ 已删除文本');
        
        // 3. 使用 execCommand 插入新文本（模拟键盘输入）
        document.execCommand('insertText', false, newText);
        
        logger.log('[Callout Menu] ✍️ 已插入新文本:', newText);
        logger.log('[Callout Menu] 📄 修改后文本:', editableDiv.textContent);
    }

    /**
     * 插入命令到引述块
     */
    private insertCommand(command: string, blockQuoteElement: HTMLElement, isEdit: boolean) {
        let editableDiv: HTMLElement | null = null;

        if (isEdit) {
            editableDiv = blockQuoteElement.querySelector('[data-callout-title="true"]');
        }
        if (!editableDiv) {
            // 🔧 修复：优先获取当前焦点所在的可编辑div，而不是第一个
            editableDiv = this.getCurrentFocusedEditableDiv(blockQuoteElement);
            if (!editableDiv) {
                // 如果没有焦点，才回退到第一个div（兼容只读模式）
                editableDiv = blockQuoteElement.querySelector('[contenteditable]');
            }
        }
        if (!editableDiv) return;

        // console.log('[Callout Menu] ✏️ insertCommand:', { 
        //     command, 
        //     isEdit, 
        //     hasCalloutTitle: !!blockQuoteElement.querySelector('[data-callout-title="true"]'),
        //     editableDiv: editableDiv?.getAttribute('data-callout-title')
        // });

        try {
            if (isEdit) {
                // 编辑模式：直接替换并立即处理
                logger.log('[Callout Menu] ✏️ 编辑模式 - 修改命令:', command);
                logger.log('[Callout Menu] 📄 修改前文本:', editableDiv.textContent);
                
                // 保存用户设置的宽度和高度（如果有的话）
                const existingWidth = blockQuoteElement.getAttribute('data-margin-width');
                const existingHeight = blockQuoteElement.getAttribute('data-margin-height');
                const existingWidthCSS = blockQuoteElement.style.getPropertyValue('--margin-width');
                const existingHeightCSS = blockQuoteElement.style.getPropertyValue('--margin-height');
                const existingMinHeight = blockQuoteElement.style.getPropertyValue('min-height');
                
                logger.log('[Callout Menu] 💾 保存现有尺寸设置:', {
                    width: existingWidth,
                    height: existingHeight,
                    widthCSS: existingWidthCSS,
                    heightCSS: existingHeightCSS,
                    minHeight: existingMinHeight
                });
                
                // 先清除callout类型相关的属性（但保留尺寸设置）
                blockQuoteElement.removeAttribute('custom-callout');
                blockQuoteElement.removeAttribute('data-collapsed');
                
                logger.log('[Callout Menu] 🧹 已清除callout类型属性（保留尺寸设置）');
                
                // 使用统一的文本更新函数
                this.updateEditableText(editableDiv, command);
                
                // 处理 callout
                setTimeout(() => {
                    this.processor.processBlockquote(blockQuoteElement);
                    
                    // 恢复用户设置的尺寸（如果有的话）
                    setTimeout(() => {
                        if (existingWidth) {
                            logger.log('[Callout Menu] 🔄 恢复宽度设置:', existingWidth);
                            blockQuoteElement.setAttribute('data-margin-width', existingWidth);
                            if (existingWidthCSS) {
                                blockQuoteElement.style.setProperty('--margin-width', existingWidthCSS);
                            }
                        }
                        
                        if (existingHeight) {
                            logger.log('[Callout Menu] 🔄 恢复高度设置:', existingHeight);
                            blockQuoteElement.setAttribute('data-margin-height', existingHeight);
                            if (existingHeightCSS) {
                                blockQuoteElement.style.setProperty('--margin-height', existingHeightCSS);
                            }
                            if (existingMinHeight) {
                                blockQuoteElement.style.setProperty('min-height', existingMinHeight);
                            }
                        }
                        
                        logger.log('[Callout Menu] ✅ 尺寸设置恢复完成');
                    }, 50);
                }, 100);
            } else {
                // 新建模式：插入命令并自动换行
                // console.log('[Callout Menu] ⚠️ 使用新建模式（会自动换行）');
                editableDiv.textContent = command;
                editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
                editableDiv.dispatchEvent(new Event('change', { bubbles: true }));

                setTimeout(() => {
                    editableDiv!.focus();
                    const range = document.createRange();
                    const selection = window.getSelection();

                    if (editableDiv!.childNodes.length > 0) {
                        const lastNode = editableDiv!.childNodes[editableDiv!.childNodes.length - 1];
                        if (lastNode.nodeType === Node.TEXT_NODE) {
                            range.setStart(lastNode, lastNode.textContent!.length);
                            range.setEnd(lastNode, lastNode.textContent!.length);
                        } else {
                            range.setStartAfter(lastNode);
                            range.setEndAfter(lastNode);
                        }
                    } else {
                        range.selectNodeContents(editableDiv!);
                        range.collapse(false);
                    }

                    selection?.removeAllRanges();
                    selection?.addRange(range);

                    // 自动换行
                    setTimeout(() => {
                        editableDiv!.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
                        }));
                        editableDiv!.dispatchEvent(new KeyboardEvent('keyup', {
                            key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
                        }));

                        setTimeout(() => {
                            this.processor.processBlockquote(blockQuoteElement);
                        }, 200);
                    }, 100);
                }, 150);
            }
        } catch (error) {
            logger.error('[Callout Menu] Error inserting command:', error);
        }
    }

    /**
     * 显示菜单
     * @param cursorX 光标/触发点的 X 坐标
     * @param cursorY 光标/触发点的 Y 坐标
     * @param blockQuoteElement 关联的 blockquote 元素（可为 null）
     * @param isEdit 是否为编辑模式
     * @param allowToggle 是否允许切换显示/隐藏
     */
    showMenu(cursorX: number, cursorY: number, blockQuoteElement: HTMLElement | null, isEdit: boolean = false, allowToggle: boolean = false) {
        // 如果允许toggle且菜单已显示，则隐藏菜单
        if (allowToggle && this.isMenuVisible && this.currentTargetBlockQuote === blockQuoteElement) {
            this.hideMenu(true);
            return;
        }
        
        if (this.isMenuVisible) return;

        const menu = this.createCommandMenu(blockQuoteElement!, isEdit);

        // 计算位置
        menu.style.left = '0px';
        menu.style.top = '0px';
        menu.style.visibility = 'hidden';
        menu.style.opacity = '1';
        menu.style.pointerEvents = 'auto';

        requestAnimationFrame(() => {
            const menuRect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            console.log('[Callout Menu] 定位计算:', {
                cursorX,
                cursorY,
                menuWidth: menuRect.width,
                menuHeight: menuRect.height,
                viewportWidth,
                viewportHeight
            });
            
            // 简单的定位逻辑：菜单显示在光标位置，确保不超出视口
            let menuX = cursorX;
            let menuY = cursorY;
            
            // 确保菜单不超出右边界
            if (menuX + menuRect.width > viewportWidth - 20) {
                menuX = viewportWidth - menuRect.width - 20;
            }
            
            // 确保菜单不超出下边界
            if (menuY + menuRect.height > viewportHeight - 20) {
                // 在光标上方显示（菜单底部在光标位置）
                menuY = cursorY - menuRect.height - 10;
            }
            
            // 确保菜单不超出左边界和上边界
            if (menuX < 20) menuX = 20;
            if (menuY < 20) menuY = 20;
            
            console.log('[Callout Menu] 最终位置:', { menuX, menuY });
            
            menu.style.left = menuX + 'px';
            menu.style.top = menuY + 'px';
            menu.style.visibility = 'visible';
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-5px)';

            this.updateMenuSelection();

            requestAnimationFrame(() => {
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
                menu.focus();
            });

            this.isMenuVisible = true;
            
            // 🔧 只有在鼠标真正移动后才启用鼠标悬停（而不是简单延迟）
            const enableMouseHoverOnMove = () => {
                this.allowMouseHover = true;
                document.removeEventListener('mousemove', enableMouseHoverOnMove);
            };
            document.addEventListener('mousemove', enableMouseHoverOnMove, { once: true });

            // 标记为最近创建
            if (blockQuoteElement) {
                const nodeId = blockQuoteElement.getAttribute('data-node-id');
                if (nodeId) {
                    this.processor.markAsRecentlyCreated(nodeId);
                }
            }
        });
    }

    /**
     * 隐藏菜单
     */
    hideMenu(immediate: boolean = false) {
        if (!this.commandMenu || !this.isMenuVisible) return;

        this.currentTargetBlockQuote = null;
        this.currentIsEdit = false; // 重置编辑状态
        this.selectedMenuIndex = 0;
        this.menuItems = [];
        this.allowMouseHover = false; // 🔧 重置鼠标悬停标志
        
        // 重置过滤状态
        this.filterMode = false;
        this.filterText = '';
        this.filterInput = null;

        // 🎯 触发菜单关闭事件，通知大纲刷新
        const menuCloseEvent = new CustomEvent('callout-menu-closed', {
            bubbles: true,
            detail: { immediate }
        });
        document.dispatchEvent(menuCloseEvent);

        if (immediate) {
            this.commandMenu.remove();
            this.commandMenu = null;
            this.isMenuVisible = false;
            return;
        }

        this.commandMenu.style.opacity = '0';
        this.commandMenu.style.transform = 'translateY(-10px)';
        this.commandMenu.style.pointerEvents = 'none';

        setTimeout(() => {
            if (this.commandMenu) {
                this.commandMenu.remove();
                this.commandMenu = null;
            }
            this.isMenuVisible = false;
        }, 200);
    }

    /**
     * 设置全局事件监听
     */
    private setupGlobalEventListeners() {
        // ESC关闭菜单
        this.globalKeydownHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.isMenuVisible) {
                e.preventDefault();
                this.hideMenu(true);
            }
        };
        document.addEventListener('keydown', this.globalKeydownHandler);

        // 点击外部关闭菜单
        this.globalClickHandler = (e: MouseEvent) => {
            if (this.commandMenu && !this.commandMenu.contains(e.target as Node) && this.isMenuVisible) {
                setTimeout(() => {
                    if (this.isMenuVisible) this.hideMenu(true);
                }, 100);
            }
        };
        document.addEventListener('click', this.globalClickHandler);
    }

    /**
     * 检查菜单是否可见
     */
    isVisible(): boolean {
        return this.isMenuVisible;
    }

    /**
     * 销毁菜单，清理所有资源
     */
    destroy() {
        // 隐藏并移除菜单
        this.hideMenu(true);
        
        // 移除全局事件监听器
        if (this.globalKeydownHandler) {
            document.removeEventListener('keydown', this.globalKeydownHandler);
            this.globalKeydownHandler = null;
        }
        
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler);
            this.globalClickHandler = null;
        }
        
        // 销毁主题辅助类
        this.themeHelper.destroy();
    }
}

