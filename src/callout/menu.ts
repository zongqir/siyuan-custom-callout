import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig } from './types';
import { CalloutProcessor } from './processor';

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

    constructor(processor: CalloutProcessor) {
        this.processor = processor;
        this.setupGlobalEventListeners();
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
        menu.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            max-height: 500px;
            overflow-y: auto;
            z-index: 10000;
            font-size: 14px;
            min-width: 520px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            outline: none;
        `;

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
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            color: #6b7280;
            transition: all 0.15s ease;
            z-index: 1;
        `;
        closeButton.innerHTML = '×';

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = '#ef4444';
            closeButton.style.color = 'white';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = '#f3f4f6';
            closeButton.style.color = '#6b7280';
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
        header.style.cssText = `
            padding: 12px 40px 12px 16px;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
            color: #6b7280;
            font-weight: 600;
        `;
        const headerText = isEdit ? '切换 Callout 类型' : 'Callout 命令菜单';
        header.innerHTML = `<div>${headerText}</div>`;
        return header;
    }

    /**
     * 创建过滤输入框
     */
    private createFilterInput(): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = `
            padding: 8px 16px 10px;
            background: linear-gradient(to bottom, #fafbfc, #f6f8fa);
            border-bottom: 1px solid #e1e4e8;
            display: none;
        `;

        const inputWrapper = document.createElement('div');
        inputWrapper.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: white;
            border-radius: 8px;
            border: 1.5px solid #3b82f6;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
            transition: all 0.2s ease;
        `;

        // 搜索图标 (SVG)
        const icon = document.createElement('span');
        icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="#3b82f6" stroke-width="2"/>
            <path d="M20 20L16.65 16.65" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
        icon.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        `;

        // 过滤文本显示
        const text = document.createElement('span');
        text.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            letter-spacing: 0.3px;
        `;
        text.textContent = '@';

        // 提示标签
        const hint = document.createElement('span');
        hint.style.cssText = `
            margin-left: auto;
            font-size: 11px;
            color: #9ca3af;
            background: #f3f4f6;
            padding: 2px 8px;
            border-radius: 4px;
        `;
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
        container.style.cssText = `padding: 8px;`;

        // 如果是编辑模式，显示正常网格 + 底部边注工具栏
        if (isEdit) {
            const gridContainer = document.createElement('div');
            gridContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(${this.gridColumns}, 1fr);
                gap: 4px;
                margin-bottom: 8px;
            `;

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
            gridContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(${this.gridColumns}, 1fr);
                gap: 4px;
            `;

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
        toolbar.style.cssText = `
            border-top: 1px solid #e5e7eb;
            padding: 6px 8px 4px;
            background: #fafbfc;
            display: flex;
            align-items: center;
            gap: 6px;
        `;

        // 标签
        const label = document.createElement('span');
        label.style.cssText = `
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
            margin-right: 4px;
        `;
        label.textContent = '边注:';

        toolbar.appendChild(label);

        // 三个按钮
        const buttons = [
            { position: 'normal', icon: '📄', text: '普通', color: '#f3f4f6' },
            { position: 'left', icon: '⬅️', text: '左侧', color: '#dcfce7' },
            { position: 'right', icon: '➡️', text: '右侧', color: '#fef3c7' }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'margin-toolbar-btn';
            button.setAttribute('data-position', btn.position);
            button.style.cssText = `
                flex: 1;
                display: flex;
                align-items: center;
                gap: 3px;
                padding: 3px 4px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                background: ${btn.color};
                cursor: pointer;
                font-size: 11px;
                font-weight: 500;
                color: #374151;
                transition: all 0.15s ease;
                justify-content: center;
            `;

            button.innerHTML = `
                <span>${btn.icon}</span>
                <span>${btn.text}</span>
            `;

            // 悬停效果
            button.addEventListener('mouseenter', () => {
                button.style.borderColor = '#9ca3af';
                button.style.transform = 'scale(1.02)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.borderColor = '#d1d5db';
                button.style.transform = 'scale(1)';
            });

            toolbar.appendChild(button);
        });

        return toolbar;
    }


    /**
     * 创建边注图标（在原图标基础上添加方向指示）
     */
    private createMarginIcon(originalIcon: string, position: 'left' | 'right'): string {
        // 创建一个包含原图标和方向箭头的组合图标
        const arrow = position === 'left' ? '←' : '→';
        const arrowColor = position === 'left' ? '#10b981' : '#f59e0b';
        
        return `
        <div style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
            ${originalIcon}
            <span style="
                position: absolute; 
                bottom: -2px; 
                right: -2px; 
                font-size: 10px; 
                color: ${arrowColor}; 
                font-weight: bold;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            ">${arrow}</span>
        </div>
        `;
    }

    /**
     * 创建菜单项
     */
    private createMenuItem(options: any, index: number, isEdit: boolean): HTMLElement {
        const item = document.createElement('div');
        
        // 边注菜单项的特殊样式
        const marginNoteStyle = options.isMarginNote ? `
            border-left: 3px solid ${options.marginPosition === 'left' ? '#10b981' : '#f59e0b'};
            background: linear-gradient(135deg, 
                ${options.marginPosition === 'left' ? '#f0fdf4' : '#fffbeb'} 0%, 
                #ffffff 100%);
            font-size: 12px;
        ` : '';
        
        item.style.cssText = `
            padding: 10px 12px;
            cursor: pointer;
            border: 1px solid #f3f4f6;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background-color 0.1s ease, transform 0.1s ease, border-color 0.1s ease;
            ${marginNoteStyle}
        `;

        item.innerHTML = `
            <span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${options.icon}</span>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; color: #1f2937; font-size: 14px; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${options.displayName}</div>
                <div style="color: #9ca3af; font-size: 10px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${options.command}</div>
            </div>
        `;

        item.addEventListener('mouseenter', () => {
            this.selectedMenuIndex = index;
            this.updateMenuSelection();
        });

        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.style.backgroundColor = '#dbeafe';
            item.style.color = '#1e40af';

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
        footer.style.cssText = `
            padding: 8px 16px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #9ca3af;
            text-align: center;
        `;
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
        const marginButtons = menu.querySelectorAll('.margin-toolbar-btn');
        marginButtons.forEach(button => {
            const position = (button as HTMLElement).getAttribute('data-position');
            const element = button as HTMLElement;
            
            if (position === currentPosition) {
                // 选中状态
                element.style.borderColor = '#3b82f6';
                element.style.borderWidth = '2px';
                element.style.fontWeight = '600';
                element.style.background = position === 'normal' ? '#f3f4f6' : 
                                          position === 'left' ? '#dcfce7' : '#fef3c7';
                element.style.transform = 'scale(1.02)';
            } else {
                // 未选中状态
                element.style.borderColor = '#d1d5db';
                element.style.borderWidth = '1px';
                element.style.fontWeight = '500';
                element.style.background = position === 'normal' ? '#f9fafb' : 
                                          position === 'left' ? '#f0fdf4' : '#fffbeb';
                element.style.transform = 'scale(1)';
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

        // 清除现有边注设置
        blockquote.removeAttribute('data-margin-position');
        blockquote.removeAttribute('data-margin-width');
        blockquote.removeAttribute('data-margin-spacing');
        blockquote.style.removeProperty('--margin-width');
        blockquote.style.removeProperty('--margin-spacing');

        if (position !== 'normal') {
            // 使用默认的宽度和间距
            const defaultWidth = '30%';
            const defaultSpacing = '1em';
            
            // 应用新的边注设置
            blockquote.setAttribute('data-margin-position', position);
            blockquote.setAttribute('data-margin-width', defaultWidth);
            blockquote.setAttribute('data-margin-spacing', defaultSpacing);
            
            // 设置CSS变量
            blockquote.style.setProperty('--margin-width', defaultWidth);
            blockquote.style.setProperty('--margin-spacing', defaultSpacing);
            
            // 更新命令文本以保持持久化
            const currentText = titleDiv.textContent?.trim() || '';
            
            // 从当前文本中提取类型 - 支持 [!info] 或 [!info|params] 格式
            let baseType = '';
            const match = currentText.match(/^\[!([^|\]]+)(\|.*?)?\]?/);
            if (match) {
                baseType = match[1];
            }
            
            const newCommand = `[!${baseType}|${position}]`;
            titleDiv.textContent = newCommand;
        } else {
            // 恢复普通模式，更新命令文本
            const currentText = titleDiv.textContent?.trim() || '';
            
            // 从当前文本中提取类型 - 支持 [!info] 或 [!info|params] 格式
            let baseType = '';
            const match = currentText.match(/^\[!([^|\]]+)(\|.*?)?\]?/);
            if (match) {
                baseType = match[1];
            }
            
            const baseCommand = `[!${baseType}]`;
            titleDiv.textContent = baseCommand;
        }
        
        // 触发重新处理（如果处理器可用）
        if (this.processor) {
            this.processor.processBlockquote(blockquote);
        }
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
        requestAnimationFrame(() => {
            this.menuItems.forEach((item, index) => {
                if (index === this.selectedMenuIndex) {
                    item.style.backgroundColor = '#dbeafe';
                    item.style.borderColor = '#60a5fa';
                    item.style.transform = 'scale(1.02)';
                } else {
                    item.style.backgroundColor = '';
                    item.style.borderColor = '#f3f4f6';
                    item.style.transform = 'scale(1)';
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
     * 应用过滤
     */
    private applyFilter(filteredTypes: CalloutTypeConfig[]) {
        // 使用保存的编辑状态，而不是重新判断
        const isEdit = this.currentIsEdit;
        // console.log('[Callout Menu] 🔍 applyFilter - isEdit:', isEdit);
        
        // 清空现有菜单项
        const gridContainer = this.commandMenu?.querySelector('div[style*="grid-template-columns"]');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        this.menuItems = [];
        this.selectedMenuIndex = 0;

        const typesToShow = filteredTypes.length > 0 ? filteredTypes : this.allCalloutTypes;

        // 如果不在过滤模式，添加"原生样式"选项
        if (!this.filterMode || filteredTypes.length === 0) {
            const noneItem = this.createMenuItem({
                command: 'none',
                displayName: '原生样式',
                icon: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>`,
                isNone: true
            }, 0, isEdit);
            gridContainer.appendChild(noneItem);
        }

        // 添加过滤后的类型及其边注变体
        typesToShow.forEach((config) => {
            let itemIndex = this.menuItems.length;
            
            // 1. 普通类型
            const normalItem = this.createMenuItem({
                command: config.command,
                displayName: config.displayName,
                icon: config.icon,
                color: config.color,
                isNone: false,
                isMarginNote: false
            }, itemIndex++, isEdit);
            gridContainer.appendChild(normalItem);
            
            // 2. 左侧边注
            const leftCommand = config.command.replace(/\]$/, '|left]'); // [!info] -> [!info|left]
            const leftItem = this.createMenuItem({
                command: leftCommand,
                displayName: `${config.displayName} (左侧)`,
                icon: this.createMarginIcon(config.icon, 'left'),
                color: config.color,
                isNone: false,
                isMarginNote: true,
                marginPosition: 'left'
            }, itemIndex++, isEdit);
            gridContainer.appendChild(leftItem);
            
            // 3. 右侧边注
            const rightCommand = config.command.replace(/\]$/, '|right]'); // [!info] -> [!info|right]
            const rightItem = this.createMenuItem({
                command: rightCommand,
                displayName: `${config.displayName} (右侧)`,
                icon: this.createMarginIcon(config.icon, 'right'),
                color: config.color,
                isNone: false,
                isMarginNote: true,
                marginPosition: 'right'
            }, itemIndex++, isEdit);
            gridContainer.appendChild(rightItem);
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
            this.processor.clearCalloutStyle(this.currentTargetBlockQuote);
        }
        setTimeout(() => this.hideMenu(true), 100);
    }

    /**
     * 处理选择Callout
     */
    private handleSelectCallout(command: string, isEdit: boolean) {
        // console.log('[Callout Menu] 📝 handleSelectCallout:', { command, isEdit });
        if (this.currentTargetBlockQuote) {
            this.insertCommand(command, this.currentTargetBlockQuote, isEdit);
        }
        setTimeout(() => this.hideMenu(true), 300);
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
                
                // 模拟真实编辑：先聚焦，然后选中所有文本，删除，再输入新文本
                editableDiv.focus();
                
                console.log('[Callout Menu] ✂️ 模拟真实编辑操作');
                
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
                document.execCommand('insertText', false, command);
                
                console.log('[Callout Menu] ✍️ 已插入新文本:', command);
                
                // 4. 处理 callout
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

