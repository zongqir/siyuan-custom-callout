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

    constructor(processor: CalloutProcessor) {
        this.processor = processor;
        this.setupGlobalEventListeners();
    }

    /**
     * 更新 Callout 类型（动态配置）
     */
    updateTypes(types: CalloutTypeConfig[]) {
        this.calloutTypes = types;
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

        // 菜单项网格
        const gridContainer = this.createMenuGrid(isEdit);
        menu.appendChild(gridContainer);

        // 底部提示
        const footer = this.createFooter();
        menu.appendChild(footer);

        // 添加键盘事件
        this.setupMenuKeyboardEvents(menu);

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
     * 创建菜单网格
     */
    private createMenuGrid(isEdit: boolean): HTMLElement {
        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${this.gridColumns}, 1fr);
            gap: 4px;
            padding: 8px;
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
            const adjustedIndex = index + 1; // 因为 none 占了第 0 位
            const item = this.createMenuItem({
                command: config.command,
                displayName: config.displayName,
                icon: config.icon,
                color: config.color,
                isNone: false
            }, adjustedIndex, isEdit);
            gridContainer.appendChild(item);
        });

        return gridContainer;
    }

    /**
     * 创建菜单项
     */
    private createMenuItem(options: any, index: number, isEdit: boolean): HTMLElement {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 10px 12px;
            cursor: pointer;
            border: 1px solid #f3f4f6;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background-color 0.1s ease, transform 0.1s ease, border-color 0.1s ease;
        `;

        item.innerHTML = `
            <span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${options.icon}</span>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 500; color: #374151; font-size: 13px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${options.command}</div>
                <div style="color: #6b7280; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${options.displayName}</div>
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
        footer.innerHTML = '↑↓←→ 导航 • Enter 确认 • ESC 关闭';
        return footer;
    }

    /**
     * 设置菜单键盘事件
     */
    private setupMenuKeyboardEvents(menu: HTMLElement) {
        menu.addEventListener('keydown', (e) => {
            const cols = this.gridColumns; // 使用动态列数
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
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideMenu(true);
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

        try {
            if (isEdit) {
                // 编辑模式：直接替换并立即处理
                editableDiv.textContent = command;
                editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
                editableDiv.dispatchEvent(new Event('change', { bubbles: true }));

                setTimeout(() => {
                    this.processor.processBlockquote(blockQuoteElement);
                }, 100);
            } else {
                // 新建模式：插入命令并自动换行
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
    showMenu(x: number, y: number, blockQuoteElement: HTMLElement, isEdit: boolean = false, allowToggle: boolean = false) {
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
        this.selectedMenuIndex = 0;
        this.menuItems = [];

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

