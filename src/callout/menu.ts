import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig } from './types';
import { CalloutProcessor } from './processor';
import { MenuThemeHelper } from './menu-theme-helper';
import * as MenuStyles from './menu-styles';

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

    constructor(processor: CalloutProcessor) {
        this.processor = processor;
        this.themeHelper = new MenuThemeHelper();
        this.setupGlobalEventListeners();
        
        // 订阅主题变化
        this.themeHelper.subscribe((isDark) => {
            console.log('[Callout Menu] 🌙 主题已切换:', isDark ? '黑夜' : '白天');
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

        // 设置边注事件（如果是编辑模式）
        if (isEdit) {
            this.setupMarginNoteEvents(menu, targetBlockQuote);
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

        // 如果是编辑模式，显示正常网格 + 底部边注工具栏
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
                    isNone: false,
                    isMarginNote: false
                }, index + 1, isEdit);
                gridContainer.appendChild(typeItem);
            });

            container.appendChild(gridContainer);

            // 添加底部边注工具栏
            const marginToolbar = this.createMarginToolbar();
            container.appendChild(marginToolbar);

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
                    isNone: false,
                    isMarginNote: false
                }, index + 1, isEdit);
                gridContainer.appendChild(item);
            });

            container.appendChild(gridContainer);
        }

        return container;
    }

    /**
     * 创建扁平化边注工具栏
     */
    private createMarginToolbar(): HTMLElement {
        const toolbar = document.createElement('div');
        toolbar.setAttribute('data-margin-toolbar', '');
        toolbar.style.cssText = MenuStyles.getMarginToolbarStyle(this.isDarkMode());

        // 标签
        const label = document.createElement('span');
        label.setAttribute('data-toolbar-label', '');
        label.style.cssText = MenuStyles.getMarginToolbarLabelStyle(this.isDarkMode());
        label.textContent = '边注:';

        toolbar.appendChild(label);

        // 三个按钮 - 按照左、普通、右的顺序
        const buttons = [
            { position: 'left', icon: '⬅️', text: '左侧', color: '#dcfce7' },
            { position: 'normal', icon: '📄', text: '普通', color: '#f3f4f6' },
            { position: 'right', icon: '➡️', text: '右侧', color: '#fef3c7' }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'margin-toolbar-btn';
            button.setAttribute('data-position', btn.position);
            button.setAttribute('data-toolbar-btn', '');
            button.style.cssText = MenuStyles.getMarginToolbarButtonStyle(this.isDarkMode(), btn.position);

            button.innerHTML = `
                <span>${btn.icon}</span>
                <span>${btn.text}</span>
            `;

            // 悬停效果
            button.addEventListener('mouseenter', () => {
                button.style.borderColor = MenuStyles.getMarginToolbarButtonHoverBorderColor(this.isDarkMode());
                button.style.transform = 'scale(1.02)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.borderColor = MenuStyles.getMarginToolbarButtonNormalBorderColor(this.isDarkMode());
                button.style.transform = 'scale(1)';
            });

            toolbar.appendChild(button);
        });

        return toolbar;
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
            this.selectedMenuIndex = index;
            this.updateMenuSelection();
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
     * 设置边注事件
     */
    private setupMarginNoteEvents(menu: HTMLElement, blockquote: HTMLElement) {
        // 获取当前边注设置
        const currentPosition = blockquote.getAttribute('data-margin-position') || 'normal';
        
        // 初始化边注工具栏状态
        this.updateMarginToolbarState(menu, currentPosition);

        // 为边注工具栏按钮添加点击事件
        const marginButtons = menu.querySelectorAll('.margin-toolbar-btn');
        marginButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const position = (button as HTMLElement).getAttribute('data-position')!;
                this.applyMarginNoteSetting(blockquote, position);
                this.updateMarginToolbarState(menu, position);
                
                // 延迟关闭菜单，让用户看到选中效果
                setTimeout(() => {
                    this.hideMenu(true);
                }, 200);
            });
        });
    }

    /**
     * 更新边注工具栏状态
     */
    private updateMarginToolbarState(menu: HTMLElement, currentPosition: string) {
        const isDark = this.isDarkMode();
        const marginButtons = menu.querySelectorAll('.margin-toolbar-btn');
        marginButtons.forEach(button => {
            const position = (button as HTMLElement).getAttribute('data-position');
            const element = button as HTMLElement;
            
            if (position === currentPosition) {
                // 选中状态 - 使用更醒目的高亮
                element.style.borderColor = isDark ? '#60a5fa' : '#3b82f6';
                element.style.borderWidth = '2px';
                element.style.fontWeight = '700';
                element.style.transform = 'scale(1.05)';
                // 选中时使用更亮的背景
                if (position === 'normal') {
                    element.style.background = isDark ? '#4b5563' : '#f3f4f6';
                } else if (position === 'left') {
                    element.style.background = isDark ? '#065f46' : '#a7f3d0';
                } else {
                    element.style.background = isDark ? '#92400e' : '#fcd34d';
                }
            } else {
                // 未选中状态 - 恢复默认样式
                element.style.cssText = MenuStyles.getMarginToolbarButtonStyle(isDark, position || 'normal');
            }
        });
    }

    /**
     * 应用边注设置
     */
    private applyMarginNoteSetting(blockquote: HTMLElement, position: string) {
        // 获取标题元素
        const titleDiv = blockquote.querySelector('[data-callout-title="true"]') as HTMLElement;
        if (!titleDiv) return;

        // 清除所有 callout 相关的属性，避免状态不一致
        blockquote.removeAttribute('custom-callout');
        blockquote.removeAttribute('data-margin-position');
        blockquote.removeAttribute('data-margin-width');
        blockquote.removeAttribute('data-margin-spacing');
        blockquote.removeAttribute('data-collapsed');
        blockquote.style.removeProperty('--margin-width');
        blockquote.style.removeProperty('--margin-spacing');
        
        console.log('[Callout Menu] 🧹 工具栏切换 - 已清除所有 callout 属性');

        // 获取当前文本并提取类型
        const currentText = titleDiv.textContent?.trim() || '';
        let baseType = '';
        const match = currentText.match(/^\[!([^|\]]+)(\|.*?)?\]?/);
        if (match) {
            baseType = match[1];
        }

        if (position !== 'normal') {
            // 生成边注命令
            const newCommand = `[!${baseType}|${position}]`;
            // 使用统一的文本更新函数
            this.updateEditableText(titleDiv, newCommand);
        } else {
            // 生成普通命令
            const baseCommand = `[!${baseType}]`;
            console.log('[Callout Menu] 🔄 工具栏切换到普通模式:', baseCommand);
            // 使用统一的文本更新函数
            this.updateEditableText(titleDiv, baseCommand);
        }
        
        // 延迟触发重新处理，确保文本更新完成
        setTimeout(() => {
            if (this.processor) {
                this.processor.processBlockquote(blockquote);
            }
        }, 100);
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
                this.selectedMenuIndex = Math.min(this.selectedMenuIndex + cols, this.menuItems.length - 1);
                this.updateMenuSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedMenuIndex = Math.max(this.selectedMenuIndex - cols, 0);
                this.updateMenuSelection();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.selectedMenuIndex = Math.min(this.selectedMenuIndex + 1, this.menuItems.length - 1);
                this.updateMenuSelection();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.selectedMenuIndex = Math.max(this.selectedMenuIndex - 1, 0);
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
            
            // 支持边注关键字搜索
            const marginKeywords = ['left', '左', 'right', '右', 'margin', '边注'];
            const hasMarginKeyword = marginKeywords.some(keyword => search.includes(keyword));
            
            const commandMatch = commandClean.startsWith(search);
            const zhCommandMatch = zhCommandClean?.startsWith(search);
            const displayNameMatch = type.displayName.toLowerCase().includes(search);
            
            // 如果搜索包含边注关键字，则显示该类型
            return commandMatch || zhCommandMatch || displayNameMatch || hasMarginKeyword;
        });
    }

    /**
     * 应用过滤 - 使用优化的三列布局
     */
    private applyFilter(filteredTypes: CalloutTypeConfig[]) {
        // 使用保存的编辑状态，而不是重新判断
        const isEdit = this.currentIsEdit;
        // console.log('[Callout Menu] 🔍 applyFilter - isEdit:', isEdit);
        
        // 清空现有菜单项
        const gridContainer = this.commandMenu?.querySelector('div[style*="grid-template-columns"]') as HTMLElement;
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        this.menuItems = [];
        this.selectedMenuIndex = 0;

        const typesToShow = filteredTypes.length > 0 ? filteredTypes : this.allCalloutTypes;

        // 创建优化的三列布局
        this.createOptimizedFilterLayout(gridContainer, typesToShow, isEdit);

        // 更新选中状态
        this.updateMenuSelection();
    }

    /**
     * 创建优化的筛选布局 - 简单表格式
     */
    private createOptimizedFilterLayout(container: HTMLElement, types: CalloutTypeConfig[], isEdit: boolean) {
        // 重新设置容器为简单表格布局
        container.style.cssText = `
            display: block;
            overflow: visible;
        `;

        // 如果不在过滤模式，添加"原生样式"行
        if (!this.filterMode || types.length === 0) {
            const noneRow = this.createFilterRow(
                {
                    command: 'none',
                    displayName: '原生样式',
                    icon: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>`,
                    isNone: true
                }, 
                null, // 无边注选项
                this.menuItems.length,
                isEdit
            );
            container.appendChild(noneRow);
        }

        // 为每个类型创建一行（原始类型 + 边注选项）
        let currentIndex = this.menuItems.length;
        types.forEach((config) => {
            const typeRow = this.createFilterRow(config, config, currentIndex, isEdit);
            container.appendChild(typeRow);
            
            // 更新索引：每行包含4个菜单项（原始+左中右）
            currentIndex += 4;
        });
    }

    /**
     * 创建筛选行（一个原始类型 + 对应的边注选项）
     */
    private createFilterRow(originalConfig: any, marginConfig: CalloutTypeConfig | null, startIndex: number, isEdit: boolean): HTMLElement {
        const row = document.createElement('div');
        row.setAttribute('data-filter-row', '');
        row.style.cssText = MenuStyles.getFilterRowStyle(this.isDarkMode());

        // 第1列：原始类型
        let originalIndex = startIndex;
        if (originalConfig.isNone) {
            const noneItem = this.createMenuItem(originalConfig, originalIndex++, isEdit);
            row.appendChild(noneItem);
            
            // 原生样式的其他3列显示占位符
            for (let i = 0; i < 3; i++) {
                const placeholder = document.createElement('div');
                placeholder.setAttribute('data-placeholder', '');
                placeholder.style.cssText = MenuStyles.getPlaceholderStyle(this.isDarkMode());
                placeholder.textContent = '-';
                row.appendChild(placeholder);
            }
        } else if (marginConfig) {
            // 普通类型：原始 + 左 + 中 + 右
            const originalItem = this.createMenuItem({
                command: marginConfig.command,
                displayName: marginConfig.displayName,
                icon: marginConfig.icon,
                color: marginConfig.color,
                isNone: false,
                isMarginNote: false
            }, originalIndex++, isEdit);
            row.appendChild(originalItem);

            // 左侧边注
            const leftCommand = marginConfig.command.replace(/\]$/, '|left]');
            const leftItem = this.createCompactMenuItem({
                command: leftCommand,
                displayName: '左',
                icon: '⬅️',
                color: marginConfig.color,
                isMarginNote: true,
                marginPosition: 'left',
                baseType: marginConfig.displayName
            }, originalIndex++, isEdit);
            row.appendChild(leftItem);

            // 中间（重复原始）
            const centerItem = this.createCompactMenuItem({
                command: marginConfig.command,
                displayName: '中',
                icon: marginConfig.icon,
                color: marginConfig.color,
                isMarginNote: false,
                marginPosition: 'normal',
                baseType: marginConfig.displayName
            }, originalIndex++, isEdit);
            row.appendChild(centerItem);

            // 右侧边注
            const rightCommand = marginConfig.command.replace(/\]$/, '|right]');
            const rightItem = this.createCompactMenuItem({
                command: rightCommand,
                displayName: '右',
                icon: '➡️',
                color: marginConfig.color,
                isMarginNote: true,
                marginPosition: 'right',
                baseType: marginConfig.displayName
            }, originalIndex++, isEdit);
            row.appendChild(rightItem);
        }

        return row;
    }


    /**
     * 创建紧凑的菜单项（用于第二列的边注选项）
     */
    private createCompactMenuItem(options: any, index: number, isEdit: boolean): HTMLElement {
        const item = document.createElement('div');
        item.setAttribute('data-compact-item', '');
        item.setAttribute('data-margin-position', options.marginPosition || 'normal');
        item.style.cssText = MenuStyles.getCompactMenuItemStyle(this.isDarkMode(), options.marginPosition);

        item.innerHTML = `
            <span style="font-size: 14px;">${options.icon}</span>
            <span class="compact-item-text" style="font-weight: 500; color: ${MenuStyles.getCompactMenuItemTextColor(this.isDarkMode())}">${options.displayName}</span>
        `;

        // 添加 tooltip
        item.title = `${options.baseType || ''} ${
            options.marginPosition === 'left' ? '(左侧边注)' :
            options.marginPosition === 'right' ? '(右侧边注)' : '(普通)'
        }`;

        item.addEventListener('mouseenter', () => {
            this.selectedMenuIndex = index;
            this.updateMenuSelection();
        });

        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const clickStyle = MenuStyles.getMenuItemClickStyle(this.isDarkMode());
            item.style.backgroundColor = clickStyle.backgroundColor;
            item.style.borderColor = this.isDarkMode() ? '#60a5fa' : '#60a5fa';

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
            this.processor.clearCalloutStyle(this.currentTargetBlockQuote);
        }
        setTimeout(() => this.hideMenu(true), 100);
    }

    /**
     * 处理选择Callout
     */
    private handleSelectCallout(command: string, isEdit: boolean) {
        if (this.currentTargetBlockQuote) {
            // 检测是否涉及边注位置切换
            const isMarginPositionChange = this.detectMarginPositionChange(command, this.currentTargetBlockQuote);
            
            this.insertCommand(command, this.currentTargetBlockQuote, isEdit);
            
            // 如果涉及边注位置切换，执行局部DOM刷新
            if (isMarginPositionChange) {
                setTimeout(() => {
                    this.refreshAdjacentBlockquotes(this.currentTargetBlockQuote!);
                }, 200);
            }
        }
        setTimeout(() => this.hideMenu(true), 300);
    }

    /**
     * 检测是否涉及边注位置切换
     */
    private detectMarginPositionChange(newCommand: string, blockquote: HTMLElement): boolean {
        // 获取当前的边注位置
        const currentPosition = blockquote.getAttribute('data-margin-position') || 'normal';
        
        // 解析新命令中的位置信息
        let newPosition = 'normal';
        const marginMatch = newCommand.match(/\|([^|\]]+)\]/);
        if (marginMatch) {
            const positionParam = marginMatch[1].toLowerCase();
            if (positionParam === 'left' || positionParam === 'right') {
                newPosition = positionParam;
            }
        }
        
        // 检测位置是否发生变化
        const isPositionChange = currentPosition !== newPosition;
        
        console.log('[Callout Menu] 🔄 边注位置检测:', {
            current: currentPosition,
            new: newPosition,
            hasChange: isPositionChange
        });
        
        return isPositionChange;
    }

    /**
     * 刷新相邻的blockquotes
     */
    private refreshAdjacentBlockquotes(targetBlockquote: HTMLElement) {
        console.log('[Callout Menu] 🔄 开始局部DOM刷新');
        
        const elementsToRefresh = this.collectAdjacentElements(targetBlockquote);
        
        console.log('[Callout Menu] 🔄 需要刷新的元素数量:', elementsToRefresh.length);
        
        // 刷新相邻元素
        elementsToRefresh.forEach((element, index) => {
            setTimeout(() => {
                if (this.isBlockquoteElement(element)) {
                    console.log('[Callout Menu] 🔄 刷新相邻blockquote:', index + 1);
                    this.processor.processBlockquote(element);
                }
            }, index * 50); // 错开刷新时间，避免并发问题
        });
    }

    /**
     * 收集需要刷新的相邻元素
     */
    private collectAdjacentElements(targetBlockquote: HTMLElement): HTMLElement[] {
        const elements: HTMLElement[] = [];
        
        // 收集前面的元素（向上最多2个blockquote）
        let prevElement = targetBlockquote.previousElementSibling as HTMLElement;
        let prevCount = 0;
        while (prevElement && prevCount < 2) {
            if (this.isBlockquoteElement(prevElement)) {
                elements.unshift(prevElement); // 添加到前面
                prevCount++;
            }
            prevElement = prevElement.previousElementSibling as HTMLElement;
        }
        
        // 收集后面的元素（向下最多2个blockquote）
        let nextElement = targetBlockquote.nextElementSibling as HTMLElement;
        let nextCount = 0;
        while (nextElement && nextCount < 2) {
            if (this.isBlockquoteElement(nextElement)) {
                elements.push(nextElement); // 添加到后面
                nextCount++;
            }
            nextElement = nextElement.nextElementSibling as HTMLElement;
        }
        
        return elements;
    }

    /**
     * 判断是否为blockquote元素
     */
    private isBlockquoteElement(element: HTMLElement): boolean {
        return element && (
            element.tagName === 'BLOCKQUOTE' || 
            element.classList.contains('bq') ||
            element.getAttribute('data-type') === 'NodeBlockquote'
        );
    }

    /**
     * 统一的文本更新函数 - 模拟真实编辑
     */
    private updateEditableText(editableDiv: HTMLElement, newText: string) {
        console.log('[Callout Menu] ✂️ 统一文本更新 - 模拟真实编辑');
        console.log('[Callout Menu] 📄 修改前文本:', editableDiv.textContent);
        
        // 聚焦
        editableDiv.focus();
        
        // 1. 选中所有文本
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editableDiv);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        console.log('[Callout Menu] 📝 已选中全部文本');
        
        // 2. 使用 execCommand 删除（模拟按删除键）
        document.execCommand('delete', false);
        
        console.log('[Callout Menu] 🗑️ 已删除文本');
        
        // 3. 使用 execCommand 插入新文本（模拟键盘输入）
        document.execCommand('insertText', false, newText);
        
        console.log('[Callout Menu] ✍️ 已插入新文本:', newText);
        console.log('[Callout Menu] 📄 修改后文本:', editableDiv.textContent);
    }

    /**
     * 插入命令到引用块
     */
    private insertCommand(command: string, blockQuoteElement: HTMLElement, isEdit: boolean) {
        let editableDiv: HTMLElement | null = null;

        if (isEdit) {
            editableDiv = blockQuoteElement.querySelector('[data-callout-title="true"]');
        }
        if (!editableDiv) {
            editableDiv = blockQuoteElement.querySelector('[contenteditable="true"]');
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
                console.log('[Callout Menu] ✏️ 编辑模式 - 修改命令:', command);
                console.log('[Callout Menu] 📄 修改前文本:', editableDiv.textContent);
                
                // 先清除所有 callout 相关的属性，避免状态不一致
                blockQuoteElement.removeAttribute('custom-callout');
                blockQuoteElement.removeAttribute('data-margin-position');
                blockQuoteElement.removeAttribute('data-margin-width');
                blockQuoteElement.removeAttribute('data-margin-spacing');
                blockQuoteElement.removeAttribute('data-collapsed');
                
                console.log('[Callout Menu] 🧹 已清除所有 callout 属性');
                
                // 使用统一的文本更新函数
                this.updateEditableText(editableDiv, command);
                
                // 处理 callout
                setTimeout(() => {
                    this.processor.processBlockquote(blockQuoteElement);
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
            console.error('[Callout Menu] Error inserting command:', error);
        }
    }

    /**
     * 显示菜单
     */
    showMenu(_x: number, _y: number, blockQuoteElement: HTMLElement, isEdit: boolean = false, allowToggle: boolean = false) {
        // 如果允许toggle且菜单已显示，则隐藏菜单
        if (allowToggle && this.isMenuVisible && this.currentTargetBlockQuote === blockQuoteElement) {
            this.hideMenu(true);
            return;
        }
        
        if (this.isMenuVisible) return;

        const menu = this.createCommandMenu(blockQuoteElement, isEdit);

        // 计算位置
        menu.style.left = '0px';
        menu.style.top = '0px';
        menu.style.visibility = 'hidden';
        menu.style.opacity = '1';
        menu.style.pointerEvents = 'auto';

        requestAnimationFrame(() => {
            const menuRect = menu.getBoundingClientRect();
            const blockRect = blockQuoteElement.getBoundingClientRect();

            let menuX = blockRect.left;
            let menuY = blockRect.top - menuRect.height - 10;

            // 边界检查
            if (menuY < 10) {
                menuY = blockRect.bottom + 10;
            }
            if (menuX + menuRect.width > window.innerWidth) {
                menuX = window.innerWidth - menuRect.width - 10;
            }
            if (menuY + menuRect.height > window.innerHeight) {
                menuY = window.innerHeight - menuRect.height - 10;
            }
            if (menuX < 10) menuX = 10;
            if (menuY < 10) menuY = 10;

            menu.style.left = menuX + 'px';
            menu.style.top = menuY + 'px';
            menu.style.visibility = 'visible';
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';

            this.updateMenuSelection();

            requestAnimationFrame(() => {
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
                menu.focus();
            });

            this.isMenuVisible = true;

            // 标记为最近创建
            const nodeId = blockQuoteElement.getAttribute('data-node-id');
            if (nodeId) {
                this.processor.markAsRecentlyCreated(nodeId);
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
        
        // 重置过滤状态
        this.filterMode = false;
        this.filterText = '';
        this.filterInput = null;

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
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuVisible) {
                e.preventDefault();
                this.hideMenu(true);
            }
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (this.commandMenu && !this.commandMenu.contains(e.target as Node) && this.isMenuVisible) {
                setTimeout(() => {
                    if (this.isMenuVisible) this.hideMenu(true);
                }, 100);
            }
        });
    }

    /**
     * 检查菜单是否可见
     */
    isVisible(): boolean {
        return this.isMenuVisible;
    }
}

