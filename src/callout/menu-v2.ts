import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig } from './types';
import { CalloutProcessorV2 } from './processor-v2';
import { logger } from '../libs/logger';

/**
 * CalloutMenuV2 - 简化的 Callout 菜单系统
 * 
 * 特点：
 * 1. 清晰的职责：只负责显示菜单和处理用户选择
 * 2. 不再解析文档，通过 processor 设置块属性
 * 3. 简化的键盘导航和鼠标交互
 */
export class CalloutMenuV2 {
    private menu: HTMLElement | null = null;
    private processor: CalloutProcessorV2;
    private calloutTypes: CalloutTypeConfig[] = [];
    private currentBlockquote: HTMLElement | null = null;
    private selectedIndex: number = 0;
    private menuItems: HTMLElement[] = [];  // 实际渲染的菜单项
    private isEdit: boolean = false;
    
    // 网格布局配置
    private gridColumns: number = 3;
    
    // 事件监听器
    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
    private clickHandler: ((e: MouseEvent) => void) | null = null;

    constructor(processor: CalloutProcessorV2) {
        this.processor = processor;
        this.calloutTypes = [...DEFAULT_CALLOUT_TYPES];
        this.setupGlobalListeners();
        
        logger.log('[MenuV2] ✅ 菜单系统已初始化');
        console.log('[MenuV2 强制日志] 菜单系统已初始化');
    }

    /**
     * 更新 Callout 类型
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
     * 设置全局事件监听
     */
    private setupGlobalListeners() {
        // 键盘事件监听
        this.keydownHandler = (e: KeyboardEvent) => {
            // 强制输出，不依赖logger
            console.log('[MenuV2 强制日志] 键盘事件触发', { 
                key: e.key, 
                menuExists: !!this.menu 
            });
            
            if (!this.menu) return;
            
            logger.log('[MenuV2] 键盘事件', { 
                key: e.key, 
                menuVisible: !!this.menu,
                gridColumns: this.gridColumns,
                currentIndex: this.selectedIndex,
                totalItems: this.calloutTypes.length
            });
            
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.hide();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    logger.log('[MenuV2] 按上键，delta =', -this.gridColumns);
                    this.moveSelection(-this.gridColumns);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    logger.log('[MenuV2] 按下键，delta =', this.gridColumns);
                    this.moveSelection(this.gridColumns);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    logger.log('[MenuV2] 按左键，delta = -1');
                    this.moveSelection(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    logger.log('[MenuV2] 按右键，delta = 1');
                    this.moveSelection(1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.confirmSelection();
                    break;
            }
        };

        // 点击外部关闭菜单
        this.clickHandler = (e: MouseEvent) => {
            if (!this.menu) return;
            
            const target = e.target as HTMLElement;
            if (!this.menu.contains(target)) {
                this.hide();
            }
        };

        // 使用捕获阶段监听，确保在思源笔记之前处理
        document.addEventListener('keydown', this.keydownHandler, true);
        document.addEventListener('click', this.clickHandler, true);
    }

    /**
     * 显示菜单
     */
    async show(blockquote: HTMLElement, isEdit: boolean = false) {
        this.currentBlockquote = blockquote;
        this.isEdit = isEdit;
        this.selectedIndex = 0;

        // 创建菜单
        this.menu = this.createMenu();
        
        // 先添加到 DOM（但暂时不可见）
        this.menu.style.visibility = 'hidden';
        document.body.appendChild(this.menu);
        
        // 等待 DOM 渲染完成后定位
        requestAnimationFrame(() => {
            if (this.menu) {
                this.positionMenu(blockquote);
                this.menu.style.visibility = 'visible';
                
                // 初始化选中状态
                this.updateSelection();
                
                // 聚焦菜单
                this.menu.focus();
                
                console.log('[MenuV2 强制日志] ✅ 菜单已显示并聚焦');
            }
        });
        
        logger.log('[MenuV2] 显示菜单', { isEdit, selectedIndex: this.selectedIndex });
        console.log('[MenuV2 强制日志] 显示菜单调用', { isEdit, selectedIndex: this.selectedIndex });
    }

    /**
     * 隐藏菜单
     */
    hide() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
        this.currentBlockquote = null;
        this.isEdit = false;
        
        logger.log('[MenuV2] 隐藏菜单');
    }

    /**
     * 创建菜单 DOM
     */
    private createMenu(): HTMLElement {
        const menu = document.createElement('div');
        menu.className = 'callout-menu-v2';
        menu.setAttribute('tabindex', '0');
        menu.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 12px;
            z-index: 9999;
            min-width: 400px;
            max-height: 500px;
            overflow-y: auto;
        `;

        // 标题
        const title = document.createElement('div');
        title.className = 'callout-menu-title';
        title.textContent = this.isEdit ? '修改 Callout 类型' : '选择 Callout 类型';
        title.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        `;
        menu.appendChild(title);

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            right: 8px;
            top: 8px;
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 16px;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.background = '#f3f4f6';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'transparent';
        };
        closeBtn.onclick = () => this.hide();
        menu.appendChild(closeBtn);

        // 网格容器
        const grid = document.createElement('div');
        grid.className = 'callout-menu-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${this.gridColumns}, 1fr);
            gap: 8px;
        `;

        // 创建类型项并保存引用
        this.menuItems = [];
        
        // 第一项：原生样式（取消 callout）
        const noneItem = this.createNoneItem();
        grid.appendChild(noneItem);
        this.menuItems.push(noneItem);
        
        // 其他类型
        this.calloutTypes.forEach((config, index) => {
            const item = this.createMenuItem(config, index + 1);  // 索引从1开始
            grid.appendChild(item);
            this.menuItems.push(item);  // 保存菜单项引用
        });

        menu.appendChild(grid);
        
        console.log('[MenuV2 强制日志] 菜单创建完成', {
            totalTypes: this.calloutTypes.length,
            actualMenuItems: this.menuItems.length,
            gridColumns: this.gridColumns,
            note: '包含1个"原生样式"选项'
        });

        // 如果是编辑模式，添加删除按钮
        if (this.isEdit) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除 Callout';
            deleteBtn.className = 'callout-menu-delete';
            deleteBtn.style.cssText = `
                width: 100%;
                margin-top: 12px;
                padding: 8px 16px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s;
            `;
            deleteBtn.onmouseover = () => {
                deleteBtn.style.background = '#dc2626';
            };
            deleteBtn.onmouseout = () => {
                deleteBtn.style.background = '#ef4444';
            };
            deleteBtn.onclick = () => this.handleDelete();
            menu.appendChild(deleteBtn);
        }

        return menu;
    }

    /**
     * 创建"原生样式"选项（取消 callout）
     */
    private createNoneItem(): HTMLElement {
        const item = document.createElement('div');
        item.className = 'callout-menu-item';
        item.dataset.index = '0';
        item.dataset.isNone = 'true';
        
        item.style.cssText = `
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        `;

        // X 图标
        const icon = document.createElement('div');
        icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>`;
        icon.style.cssText = `
            width: 24px;
            height: 24px;
        `;
        item.appendChild(icon);

        // 显示名称
        const name = document.createElement('div');
        name.textContent = '原生样式';
        name.style.cssText = `
            font-size: 12px;
            color: #374151;
            text-align: center;
            font-weight: 500;
        `;
        item.appendChild(name);

        // 鼠标事件
        item.onmouseover = () => {
            this.selectedIndex = 0;
            this.updateSelection();
        };
        
        item.onclick = () => {
            this.selectedIndex = 0;
            this.handleNoneSelection();
        };

        return item;
    }

    /**
     * 创建单个菜单项
     */
    private createMenuItem(config: CalloutTypeConfig, index: number): HTMLElement {
        const item = document.createElement('div');
        item.className = 'callout-menu-item';
        item.dataset.index = index.toString();
        
        // 先不设置选中状态，等待 updateSelection 统一处理
        item.style.cssText = `
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        `;

        // 图标
        const icon = document.createElement('div');
        icon.innerHTML = config.icon;
        icon.style.cssText = `
            width: 24px;
            height: 24px;
        `;
        item.appendChild(icon);

        // 显示名称
        const name = document.createElement('div');
        name.textContent = config.displayName;
        name.style.cssText = `
            font-size: 12px;
            color: #374151;
            text-align: center;
            font-weight: 500;
        `;
        item.appendChild(name);

        // 鼠标事件
        item.onmouseover = () => {
            this.selectedIndex = index;
            this.updateSelection();
        };
        
        item.onclick = () => {
            this.selectedIndex = index;
            this.confirmSelection();
        };

        return item;
    }

    /**
     * 定位菜单（智能自适应）
     */
    private positionMenu(blockquote: HTMLElement) {
        if (!this.menu) return;

        const bqRect = blockquote.getBoundingClientRect();
        const menuWidth = this.menu.offsetWidth;
        const menuHeight = this.menu.offsetHeight;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 计算各个方向的可用空间
        const spaceAbove = bqRect.top;
        const spaceBelow = viewportHeight - bqRect.bottom;
        const spaceLeft = bqRect.left;
        const spaceRight = viewportWidth - bqRect.right;
        
        let top: number;
        let left: number;
        
        // 垂直位置：优先上方，如果空间不足则下方
        if (spaceAbove >= menuHeight + 20 || spaceAbove > spaceBelow) {
            // 显示在上方
            top = bqRect.top - menuHeight - 10;
        } else if (spaceBelow >= menuHeight + 20) {
            // 显示在下方
            top = bqRect.bottom + 10;
        } else {
            // 空间都不够，居中显示
            top = (viewportHeight - menuHeight) / 2;
        }
        
        // 水平位置：与 blockquote 左对齐，但确保不超出边界
        left = bqRect.left;
        
        // 确保不超出右边界
        if (left + menuWidth > viewportWidth - 10) {
            left = viewportWidth - menuWidth - 10;
        }
        
        // 确保不超出左边界
        if (left < 10) {
            left = 10;
        }
        
        // 确保不超出上边界
        if (top < 10) {
            top = 10;
        }
        
        // 确保不超出下边界
        if (top + menuHeight > viewportHeight - 10) {
            top = viewportHeight - menuHeight - 10;
        }
        
        // 应用位置
        this.menu.style.top = `${top}px`;
        this.menu.style.left = `${left}px`;
        
        logger.log('[MenuV2] 菜单定位', {
            bqRect: { top: bqRect.top, left: bqRect.left, bottom: bqRect.bottom, right: bqRect.right },
            menuSize: { width: menuWidth, height: menuHeight },
            position: { top, left },
            spaces: { above: spaceAbove, below: spaceBelow, left: spaceLeft, right: spaceRight }
        });
    }

    /**
     * 移动选择（参照原版 menu.ts 的标准宫格移动逻辑）
     */
    private moveSelection(delta: number) {
        const cols = this.gridColumns;
        const totalItems = this.menuItems.length;  // 使用实际菜单项数量！
        
        console.log('[MenuV2 强制日志] 移动前', {
            delta,
            currentIndex: this.selectedIndex,
            cols,
            totalItems
        });
        
        if (delta === this.gridColumns) {
            // 向下移动：加cols，但不超过最大索引
            const newIndex = this.selectedIndex + cols;
            this.selectedIndex = Math.min(newIndex, totalItems - 1);
            console.log('[MenuV2 强制日志] ↓ 向下', { from: this.selectedIndex - cols, to: this.selectedIndex });
            this.updateSelection();
            
        } else if (delta === -this.gridColumns) {
            // 向上移动：减cols，但不小于0
            const newIndex = this.selectedIndex - cols;
            this.selectedIndex = Math.max(newIndex, 0);
            console.log('[MenuV2 强制日志] ↑ 向上', { from: this.selectedIndex + cols, to: this.selectedIndex });
            this.updateSelection();
            
        } else if (delta === 1) {
            // 向右移动：不能跨行
            const currentRow = Math.floor(this.selectedIndex / cols);
            const currentCol = this.selectedIndex % cols;
            const nextCol = currentCol + 1;
            
            // 只有在同一行内才移动
            if (nextCol < cols && this.selectedIndex + 1 < totalItems) {
                const nextRow = Math.floor((this.selectedIndex + 1) / cols);
                // 确保下一个位置仍在同一行
                if (nextRow === currentRow) {
                    this.selectedIndex++;
                    console.log('[MenuV2 强制日志] → 向右', { 
                        from: this.selectedIndex - 1, 
                        to: this.selectedIndex,
                        row: currentRow
                    });
                } else {
                    console.log('[MenuV2 强制日志] → 向右失败：跨行了');
                }
            } else {
                console.log('[MenuV2 强制日志] → 向右失败：到达行尾或边界');
            }
            this.updateSelection();
            
        } else if (delta === -1) {
            // 向左移动：不能跨行
            const currentCol = this.selectedIndex % cols;
            
            // 只有不在行首才移动
            if (currentCol > 0) {
                this.selectedIndex--;
                console.log('[MenuV2 强制日志] ← 向左', { 
                    from: this.selectedIndex + 1, 
                    to: this.selectedIndex 
                });
            } else {
                console.log('[MenuV2 强制日志] ← 向左失败：已在行首');
            }
            this.updateSelection();
        }
    }

    /**
     * 更新选择状态
     */
    private updateSelection() {
        if (!this.menu) return;

        const items = this.menu.querySelectorAll('.callout-menu-item');
        items.forEach((item, index) => {
            const element = item as HTMLElement;
            const isSelected = index === this.selectedIndex;
            
            // 索引0是"原生样式"，其他是 callout 类型
            if (index === 0) {
                // 原生样式
                element.style.border = `2px solid ${isSelected ? '#9ca3af' : '#e5e7eb'}`;
                element.style.background = isSelected ? '#f3f4f6' : 'white';
            } else {
                // callout 类型
                const config = this.calloutTypes[index - 1];
                element.style.border = `2px solid ${isSelected ? config.borderColor : '#e5e7eb'}`;
                element.style.background = isSelected ? config.bgGradient : 'white';
            }
        });

        // 滚动到选中项
        const selectedItem = items[this.selectedIndex] as HTMLElement;
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    /**
     * 确认选择
     */
    private async confirmSelection() {
        if (!this.currentBlockquote) return;

        // 索引0是"原生样式"
        if (this.selectedIndex === 0) {
            this.handleNoneSelection();
            return;
        }

        const selectedType = this.calloutTypes[this.selectedIndex - 1];  // 减1因为索引0是原生样式
        if (!selectedType) return;

        try {
            if (this.isEdit) {
                // 编辑模式：更新类型
                await this.processor.updateCalloutType(this.currentBlockquote, selectedType.type);
            } else {
                // 创建模式：创建新 callout
                await this.processor.createCallout(this.currentBlockquote, selectedType.type);
            }

            this.hide();
            logger.log('[MenuV2] 选择确认', { type: selectedType.type, isEdit: this.isEdit });
        } catch (error) {
            logger.error('[MenuV2] 确认选择失败:', error);
        }
    }

    /**
     * 处理"原生样式"选择（取消 callout）
     */
    private async handleNoneSelection() {
        if (!this.currentBlockquote) return;

        try {
            await this.processor.removeCallout(this.currentBlockquote);
            this.hide();
            logger.log('[MenuV2] 已取消 callout，恢复原生样式');
            console.log('[MenuV2 强制日志] 已恢复为原生 blockquote');
        } catch (error) {
            logger.error('[MenuV2] 取消 callout 失败:', error);
        }
    }

    /**
     * 处理删除
     */
    private async handleDelete() {
        if (!this.currentBlockquote) return;

        try {
            await this.processor.removeCallout(this.currentBlockquote);
            this.hide();
            logger.log('[MenuV2] 删除 callout');
        } catch (error) {
            logger.error('[MenuV2] 删除失败:', error);
        }
    }

    /**
     * 销毁菜单
     */
    destroy() {
        this.hide();
        
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler, true);
        }
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler, true);
        }
        
        logger.log('[MenuV2] 菜单已销毁');
    }

    /**
     * 检查菜单是否可见
     */
    isVisible(): boolean {
        return this.menu !== null;
    }
}

