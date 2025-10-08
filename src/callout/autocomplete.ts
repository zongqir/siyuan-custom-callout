import { CalloutTypeConfig } from './types';
import { CalloutProcessor } from './processor';
import { logger } from '../libs/logger';

/**
 * Callout 自动补全管理器
 */
export class CalloutAutocomplete {
    private autocompleteMenu: HTMLElement | null = null;
    private isMenuVisible: boolean = false;
    private currentTargetBlockQuote: HTMLElement | null = null;
    private selectedIndex: number = 0;
    private suggestions: CalloutTypeConfig[] = [];
    private processor: CalloutProcessor;
    private calloutTypes: CalloutTypeConfig[] = [];
    private globalClickHandler: ((e: MouseEvent) => void) | null = null;

    constructor(processor: CalloutProcessor) {
        this.processor = processor;
        this.setupGlobalEventListeners();
    }

    /**
     * 更新 Callout 类型
     */
    updateTypes(types: CalloutTypeConfig[]) {
        this.calloutTypes = types;
    }

    /**
     * 根据输入文本获取补全建议
     */
    private getSuggestions(input: string): CalloutTypeConfig[] {
        const search = input.toLowerCase().replace('@', '');
        if (!search) {
            return this.calloutTypes; // 显示所有
        }

        return this.calloutTypes.filter(type => {
            const commandMatch = type.command.toLowerCase().includes(search);
            const zhCommandMatch = type.zhCommand?.toLowerCase().includes(search);
            const displayNameMatch = type.displayName.toLowerCase().includes(search);
            return commandMatch || zhCommandMatch || displayNameMatch;
        });
    }

    /**
     * 显示自动补全菜单
     */
    showAutocomplete(x: number, y: number, blockquote: HTMLElement, inputText: string) {
        logger.log('[Autocomplete] showAutocomplete 调用 - 输入文本:', `"${inputText}"`);
        
        this.suggestions = this.getSuggestions(inputText);
        
        logger.log('[Autocomplete] 找到建议:', this.suggestions.length, '个');
        
        // 如果没有建议，隐藏菜单
        if (this.suggestions.length === 0) {
            logger.log('[Autocomplete] 无建议，隐藏菜单');
            this.hideAutocomplete();
            return;
        }

        this.currentTargetBlockQuote = blockquote;
        this.selectedIndex = 0;

        if (!this.autocompleteMenu) {
            this.autocompleteMenu = this.createAutocompleteMenu();
            document.body.appendChild(this.autocompleteMenu);
        }

        // 更新菜单内容
        this.updateMenuContent();

        // 定位菜单
        this.autocompleteMenu.style.left = `${x}px`;
        this.autocompleteMenu.style.top = `${y + 25}px`;
        this.autocompleteMenu.style.display = 'block';
        this.isMenuVisible = true;


        // 聚焦菜单
        setTimeout(() => {
            this.autocompleteMenu?.focus();
        }, 10);
    }

    /**
     * 创建自动补全菜单
     */
    private createAutocompleteMenu(): HTMLElement {
        const menu = document.createElement('div');
        menu.className = 'custom-callout-autocomplete';
        menu.setAttribute('tabindex', '0');
        menu.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-height: 300px;
            overflow-y: auto;
            z-index: 10001;
            font-size: 13px;
            min-width: 200px;
            padding: 4px 0;
        `;

        // 键盘事件
        menu.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectNext();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectPrevious();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmSelection();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideAutocomplete();
            }
        });

        return menu;
    }

    /**
     * 更新菜单内容
     */
    private updateMenuContent() {
        if (!this.autocompleteMenu) return;

        this.autocompleteMenu.innerHTML = '';

        this.suggestions.forEach((type, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            }

            item.style.cssText = `
                padding: 6px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.15s;
            `;

            if (index === this.selectedIndex) {
                item.style.background = '#f3f4f6';
            }

            // 图标
            const icon = document.createElement('span');
            icon.innerHTML = type.icon;
            icon.style.cssText = `
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                color: ${type.color};
            `;

            // 文本
            const text = document.createElement('div');
            text.style.cssText = `
                flex: 1;
                display: flex;
                flex-direction: column;
            `;

            const name = document.createElement('div');
            name.textContent = type.displayName;
            name.style.cssText = `
                font-weight: 500;
                color: #1f2937;
            `;

            const command = document.createElement('div');
            command.textContent = type.zhCommand ? `${type.command} / ${type.zhCommand}` : type.command;
            command.style.cssText = `
                font-size: 11px;
                color: #9ca3af;
            `;

            text.appendChild(name);
            text.appendChild(command);

            item.appendChild(icon);
            item.appendChild(text);

            // 点击选择
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedIndex = index;
                this.confirmSelection();
            });

            // 鼠标悬停
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });

            this.autocompleteMenu.appendChild(item);
        });
    }

    /**
     * 更新选中状态
     */
    private updateSelection() {
        const items = this.autocompleteMenu?.querySelectorAll('.autocomplete-item');
        items?.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                (item as HTMLElement).style.background = '#f3f4f6';
            } else {
                item.classList.remove('selected');
                (item as HTMLElement).style.background = 'transparent';
            }
        });
    }

    /**
     * 选择下一个
     */
    private selectNext() {
        this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
        this.updateSelection();
    }

    /**
     * 选择上一个
     */
    private selectPrevious() {
        this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
        this.updateSelection();
    }

    /**
     * 确认选择
     */
    private confirmSelection() {
        if (!this.currentTargetBlockQuote || this.suggestions.length === 0) return;

        const selectedType = this.suggestions[this.selectedIndex];
        
        // 获取第一行的编辑器
        const firstParagraph = this.currentTargetBlockQuote.querySelector('div[data-type="NodeParagraph"]:first-of-type');
        const titleDiv = firstParagraph?.querySelector('div[contenteditable="true"]') as HTMLElement;
        
        if (titleDiv) {
            // 替换文本为选中的命令
            titleDiv.textContent = selectedType.command;
            
            // 立即处理
            setTimeout(() => {
                this.processor.processBlockquote(this.currentTargetBlockQuote!);
            }, 10);
        }

        this.hideAutocomplete();
    }

    /**
     * 隐藏自动补全菜单
     */
    hideAutocomplete() {
        if (this.autocompleteMenu) {
            this.autocompleteMenu.style.display = 'none';
        }
        this.isMenuVisible = false;
        this.currentTargetBlockQuote = null;
        this.suggestions = [];
    }

    /**
     * 检查菜单是否可见
     */
    isVisible(): boolean {
        return this.isMenuVisible;
    }

    /**
     * 设置全局事件监听器
     */
    private setupGlobalEventListeners() {
        // 点击外部关闭
        this.globalClickHandler = (e: MouseEvent) => {
            if (this.isMenuVisible && 
                this.autocompleteMenu && 
                !this.autocompleteMenu.contains(e.target as Node)) {
                this.hideAutocomplete();
            }
        };
        document.addEventListener('click', this.globalClickHandler, true);
    }

    /**
     * 销毁自动补全菜单
     */
    destroy() {
        // 移除全局事件监听器
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler, true);
            this.globalClickHandler = null;
        }
        
        // 移除菜单元素
        if (this.autocompleteMenu) {
            this.autocompleteMenu.remove();
            this.autocompleteMenu = null;
        }
    }
}

