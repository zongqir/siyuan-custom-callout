import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig, FIXED_CALLOUT_SVG } from './types';
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
    private plugin: any;
    private calloutTypes: CalloutTypeConfig[] = [];
    private currentBlockquote: HTMLElement | null = null;
    private selectedIndex: number = 0;
    private menuItems: HTMLElement[] = [];  // 实际渲染的菜单项
    private isEdit: boolean = false;
    private listenersAttached: boolean = false;
    // Type-ahead 键盘缓冲
    private typeAheadBuffer: string = '';
    private typeAheadTimer: any = null;
    // 过滤与渲染
    private menuGrid: HTMLElement | null = null;
    private filterInput: HTMLInputElement | null = null;
    private currentList: CalloutTypeConfig[] = [];
    private filterQuery: string = '';
    
    // 网格布局配置
    private gridColumns: number = 3;
    
    // 事件监听器
    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
    private clickHandler: ((e: MouseEvent) => void) | null = null;

    constructor(processor: CalloutProcessorV2, plugin?: any) {
        this.processor = processor;
        this.plugin = plugin;
        this.calloutTypes = [...DEFAULT_CALLOUT_TYPES];
        this.currentList = [...this.calloutTypes];
        
        logger.log('[MenuV2] ✅ 菜单系统已初始化');
    }

    private t(key: string, fallback: string): string {
        try {
            const txt = this.plugin?.i18n?.[key];
            if (typeof txt === 'string' && txt.trim()) return txt;
        } catch {}
        return fallback;
    }

    /**
     * 更新 Callout 类型
     */
    updateTypes(types: CalloutTypeConfig[]) {
        this.calloutTypes = types;
        this.currentList = [...types];
        if (this.menuGrid) {
            this.renderMenuGrid(this.currentList);
        }
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
        if (this.listenersAttached) return;
        // 键盘事件监听
        this.keydownHandler = (e: KeyboardEvent) => {
            if (!this.menu) return;
            const target = e.target as HTMLElement | null;
            const isOnFilter = this.filterInput ? (target === this.filterInput) : false;
            
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

            // 优先使用筛选输入框（与中文行为一致：键入即出现筛选）
            if (this.filterInput) {
                if (this.isPrintableKey(e)) {
                    if (!isOnFilter) {
                        e.preventDefault();
                        const v = this.filterInput.value || '';
                        this.filterInput.value = v + e.key;
                        this.applyFilter(this.filterInput.value);
                        this.filterInput.focus();
                        return;
                    } else {
                        // 让输入框接收字符，过滤由 oninput 触发
                        return;
                    }
                }
                if (e.key === 'Backspace' && !isOnFilter) {
                    e.preventDefault();
                    const v = this.filterInput.value || '';
                    this.filterInput.value = v.slice(0, -1);
                    this.applyFilter(this.filterInput.value);
                    this.filterInput.focus();
                    return;
                }
            } else {
                // 无输入框时，回退到无 UI 的 type-ahead
                if (this.isPrintableKey(e)) {
                    e.preventDefault();
                    this.handleTypeAheadCharacter(e.key);
                    return;
                }
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    this.handleTypeAheadBackspace();
                    return;
                }
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
        this.listenersAttached = true;
    }

    /**
     * 移除全局监听器（仅在菜单隐藏时调用）
     */
    private teardownGlobalListeners() {
        if (!this.listenersAttached) return;
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler, true);
        }
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler, true);
        }
        this.listenersAttached = false;
    }

    /**
     * 显示菜单
     */
    async show(blockquote: HTMLElement, isEdit: boolean = false) {
        this.currentBlockquote = blockquote;
        this.isEdit = isEdit;
        this.selectedIndex = 0;
        try { if (this.typeAheadTimer) { clearTimeout(this.typeAheadTimer); } } catch {}
        this.typeAheadTimer = null;
        this.typeAheadBuffer = '';
        this.currentList = [...this.calloutTypes];
        this.filterQuery = '';

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
            }
        });
        
        logger.log('[MenuV2] 显示菜单', { isEdit, selectedIndex: this.selectedIndex });
        // 仅在菜单可见期间挂载监听器
        this.setupGlobalListeners();
    }

    /**
     * 隐藏菜单
     */
    hide() {
        const bq = this.currentBlockquote;
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
        // 菜单隐藏时移除监听器，避免无关按键触发
        this.teardownGlobalListeners();
        try { if (this.typeAheadTimer) { clearTimeout(this.typeAheadTimer); } } catch {}
        this.typeAheadTimer = null;
        this.typeAheadBuffer = '';

        // 若存在当前编辑块，优先恢复到首段编辑区，避免光标丢失
        try {
            if (bq) {
                const firstPara = bq.querySelector('div[data-type="NodeParagraph"]') as HTMLElement | null;
                const firstEditable = firstPara?.querySelector('div[contenteditable]') as HTMLElement | null;
                if (firstEditable) {
                    firstEditable.focus();
                    this.placeCaretAtEnd(firstEditable);
                }
            }
        } catch {}

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
        title.textContent = this.isEdit
            ? this.t('menuEditTitle', 'Edit Callout Type')
            : this.t('menuCreateTitle', 'Select Callout Type');
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

        // 筛选输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = this.t('filterPlaceholder', 'Type to filter (fuzzy) · Use arrow keys · Enter to confirm');
        input.style.cssText = `
            width: 100%;
            box-sizing: border-box;
            margin: 8px 0 10px 0;
            padding: 6px 8px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 12px;
            outline: none;
        `;
        input.oninput = () => {
            this.filterQuery = input.value || '';
            this.applyFilter(this.filterQuery);
        };
        menu.appendChild(input);
        this.filterInput = input as HTMLInputElement;

        // 网格容器
        const grid = document.createElement('div');
        grid.className = 'callout-menu-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${this.gridColumns}, 1fr);
            gap: 8px;
        `;
        this.menuGrid = grid;
        menu.appendChild(grid);

        // 初始渲染
        this.renderMenuGrid(this.currentList);
        
        // 菜单创建完成

        // 如果是编辑模式，添加删除按钮
        if (this.isEdit) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = this.t('deleteCallout', 'Delete Callout');
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

    private applyFilter(query: string) {
        const q = this.normalizeForMatch(query);
        if (!q) {
            this.currentList = [...this.calloutTypes];
            this.renderMenuGrid(this.currentList);
            return;
        }
        const scored: Array<{cfg: CalloutTypeConfig; score: number}> = [];
        for (const c of this.calloutTypes) {
            let score = -1;
            const fields = [c.command, (c as any).zhCommand, c.type, c.displayName];
            for (const f of fields) {
                const s = this.normalizeForMatch(f as any);
                if (!s) continue;
                if (s.startsWith(q)) score = Math.max(score, 2);
                else if (s.includes(q)) score = Math.max(score, 1);
            }
            if (score >= 0) scored.push({ cfg: c, score });
        }
        // 前缀优先，其次包含；再按 displayName 稳定排序
        scored.sort((a, b) => (b.score - a.score) || a.cfg.displayName.localeCompare(b.cfg.displayName));
        this.currentList = scored.map(s => s.cfg);
        this.renderMenuGrid(this.currentList);
    }

    private renderMenuGrid(list: CalloutTypeConfig[]) {
        if (!this.menuGrid) return;
        // 清空
        while (this.menuGrid.firstChild) this.menuGrid.removeChild(this.menuGrid.firstChild);
        this.menuItems = [];
        // 原生样式
        const noneItem = this.createNoneItem();
        this.menuGrid.appendChild(noneItem);
        this.menuItems.push(noneItem);
        // 列表
        list.forEach((cfg, i) => {
            const item = this.createMenuItem(cfg, i + 1);
            this.menuGrid!.appendChild(item);
            this.menuItems.push(item);
        });
        // 选中第一项（存在时偏向列表首项，否则原生样式）
        this.selectedIndex = list.length > 0 ? 1 : 0;
        this.updateSelection();
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
        name.textContent = this.t('nativeStyle', 'Native style');
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
        icon.innerHTML = config.icon || FIXED_CALLOUT_SVG;
        icon.style.cssText = `
            width: 24px;
            height: 24px;
        `;
        item.appendChild(icon);

        // 显示名称（中文）+ 英文副标题
        const wrap = document.createElement('div');
        wrap.style.cssText = `
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        `;
        const name = document.createElement('div');
        name.textContent = config.displayName;
        name.style.cssText = `
            font-size: 12px;
            color: #374151;
            font-weight: 500;
        `;
        const sub = document.createElement('div');
        sub.textContent = config.type;
        sub.style.cssText = `
            font-size: 11px;
            color: #6b7280;
        `;
        wrap.appendChild(name);
        wrap.appendChild(sub);
        item.appendChild(wrap);

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
        
        if (delta === this.gridColumns) {
            // 向下移动：加cols，但不超过最大索引
            const newIndex = this.selectedIndex + cols;
            this.selectedIndex = Math.min(newIndex, totalItems - 1);
            this.updateSelection();
            
        } else if (delta === -this.gridColumns) {
            // 向上移动：减cols，但不小于0
            const newIndex = this.selectedIndex - cols;
            this.selectedIndex = Math.max(newIndex, 0);
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
                } else {
                    // 跨行，忽略
                }
            } else {
                // 行尾或边界，忽略
            }
            this.updateSelection();
            
        } else if (delta === -1) {
            // 向左移动：不能跨行
            const currentCol = this.selectedIndex % cols;
            
            // 只有不在行首才移动
            if (currentCol > 0) {
                this.selectedIndex--;
            } else {
                // 已在行首
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
                const config = this.currentList[index - 1];
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

    private isPrintableKey(e: KeyboardEvent): boolean {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        if (!e.key || e.key.length !== 1) return false;
        const c = e.key.charCodeAt(0);
        return c >= 32 && c !== 127;
    }

    private handleTypeAheadCharacter(ch: string) {
        this.typeAheadBuffer += ch;
        if (this.typeAheadBuffer.length > 32) {
            this.typeAheadBuffer = this.typeAheadBuffer.slice(-32);
        }
        const idx = this.findBestMatchIndex(this.typeAheadBuffer);
        if (idx >= 0) {
            this.selectedIndex = idx + 1;
            this.updateSelection();
        }
        try { if (this.typeAheadTimer) { clearTimeout(this.typeAheadTimer); } } catch {}
        this.typeAheadTimer = setTimeout(() => { this.typeAheadBuffer = ''; }, 700);
    }

    private handleTypeAheadBackspace() {
        if (!this.typeAheadBuffer) return;
        this.typeAheadBuffer = this.typeAheadBuffer.slice(0, -1);
        const idx = this.findBestMatchIndex(this.typeAheadBuffer);
        if (idx >= 0) {
            this.selectedIndex = idx + 1;
            this.updateSelection();
        }
        try { if (this.typeAheadTimer) { clearTimeout(this.typeAheadTimer); } } catch {}
        this.typeAheadTimer = this.typeAheadBuffer
            ? setTimeout(() => { this.typeAheadBuffer = ''; }, 700)
            : null;
    }

    private findBestMatchIndex(q: string): number {
        const query = this.normalizeForMatch(q);
        if (!query) return -1;
        let best = -1;
        let bestScore = -1;
        for (let i = 0; i < this.calloutTypes.length; i++) {
            const c = this.calloutTypes[i];
            const fields = [
                c.command,
                (c as any).zhCommand,
                c.type,
                c.displayName,
            ];
            let score = -1;
            for (const f of fields) {
                const s = this.normalizeForMatch(f as any);
                if (!s) continue;
                if (s.startsWith(query)) { score = Math.max(score, 2); }
                else if (s.includes(query)) { score = Math.max(score, 1); }
            }
            if (score > bestScore) { bestScore = score; best = i; }
        }
        return bestScore >= 0 ? best : -1;
    }

    private normalizeForMatch(s?: string): string {
        if (!s) return '';
        const low = s.toLowerCase();
        return low.replace(/\[|\]|!|\s+/g, '');
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

        const selectedType = this.currentList[this.selectedIndex - 1];  // 减1因为索引0是原生样式
        if (!selectedType) return;

        try {
            const blockquote = this.currentBlockquote;
            const firstPara = blockquote.querySelector('div[data-type="NodeParagraph"]') as HTMLElement | null;
            const firstEditable = firstPara?.querySelector('div[contenteditable]') as HTMLElement | null;
            if (firstEditable) {
                let existingTitle = this.getTextOnly(firstEditable);
                if (!existingTitle) existingTitle = selectedType.displayName;
                const textToInsert = `[!${selectedType.type}] ${existingTitle}`;

                // 清空所有子节点，确保命令位于行首
                while (firstEditable.firstChild) firstEditable.removeChild(firstEditable.firstChild);
                firstEditable.appendChild(document.createTextNode(textToInsert));

                // 不自动换行/不模拟回车：仅将光标置于首行末尾，等待用户自行回车
                firstEditable.focus();
                this.placeCaretAtEnd(firstEditable);
                this.emitInput(firstEditable);

                // 不再设置任何自定义属性，完全交由原生解析后写入 data-subtype
            }

            logger.log('[MenuV2] 选择确认', { type: selectedType.type, isEdit: this.isEdit });

            // 不再自动创建第二段，交由用户自行回车
        } catch (error) {
            logger.error('[MenuV2] 确认选择失败:', error);
        } finally {
            // 确保无论成败都移除全局监听，避免按键被持续拦截造成假死
            this.hide();
        }
    }

    /**
     * 处理"原生样式"选择（取消 callout）
     */
    private async handleNoneSelection() {
        if (!this.currentBlockquote) return;

        try {
            const blockquote = this.currentBlockquote;
            await this.processor.removeCallout(blockquote);

            // 还原编辑焦点到首段，避免因菜单拦截 Enter 导致光标丢失
            const firstPara = blockquote.querySelector('div[data-type="NodeParagraph"]') as HTMLElement | null;
            const firstEditable = firstPara?.querySelector('div[contenteditable]') as HTMLElement | null;
            if (firstEditable) {
                firstEditable.focus();
                this.placeCaretAtEnd(firstEditable);
                this.emitInput(firstEditable);
            }

            this.hide();
            logger.log('[MenuV2] 已取消 callout，恢复原生样式');
        } catch (error) {
            logger.error('[MenuV2] 取消 callout 失败:', error);
        }
    }

    /**
     * 选择完成后，将焦点放到内容编辑区
     */
    private focusAfterSelection(blockquote: HTMLElement | null) {
        try {
            if (!blockquote) return;
            const paras = blockquote.querySelectorAll('div[data-type="NodeParagraph"]');
            let target: HTMLElement | null = null;
            if (paras.length >= 2) {
                target = paras[1].querySelector('div[contenteditable]') as HTMLElement;
                if (target) {
                    target.focus();
                    this.placeCaretAtEnd(target);
                    return;
                }
            }
            if (paras.length === 1) {
                const first = paras[0].querySelector('div[contenteditable]') as HTMLElement;
                if (first) {
                    first.focus();
                    this.placeCaretAtEnd(first);
                    this.ensureSecondParagraph(blockquote, first);
                    return;
                }
            }
            if (paras.length >= 1) {
                target = paras[0].querySelector('div[contenteditable]') as HTMLElement;
                if (target) {
                    target.focus();
                    this.placeCaretAtEnd(target);
                }
            }
        } catch {}
    }

    private placeCaretAtEnd(el: HTMLElement) {
        try {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } catch {}
    }

    private getTextOnly(el: HTMLElement): string {
        let t = '';
        el.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) t += n.textContent || ''; });
        return t.trim();
    }

    private ensureSecondParagraph(blockquote: HTMLElement, firstEditable: HTMLElement) {
        try {
            firstEditable.focus();
            this.placeCaretAtEnd(firstEditable);
            try {
                document.execCommand('insertParagraph', false);
            } catch {}
            this.triggerEnterOn(firstEditable);
            setTimeout(async () => {
                let paras = blockquote.querySelectorAll('div[data-type="NodeParagraph"]');
                if (paras.length < 2 && (this.processor as any).ensureSecondParagraphWithAPI) {
                    await (this.processor as any).ensureSecondParagraphWithAPI(blockquote);
                }
                setTimeout(() => {
                    paras = blockquote.querySelectorAll('div[data-type="NodeParagraph"]');
                    const second = paras.length >= 2 ? paras[1].querySelector('div[contenteditable]') as HTMLElement : null;
                    if (second) {
                        second.focus();
                        this.placeCaretAtEnd(second);
                    }
                }, 80);
            }, 60);
        } catch {}
    }

    private triggerEnterOn(el: HTMLElement) {
        try {
            const options: any = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true };
            el.dispatchEvent(new KeyboardEvent('keydown', options));
            el.dispatchEvent(new KeyboardEvent('keypress', options));
            el.dispatchEvent(new KeyboardEvent('keyup', options));
        } catch {}
    }

    private emitInput(el: HTMLElement) {
        try {
            const ev = new InputEvent('input', { bubbles: true, cancelable: true, composed: true } as any);
            el.dispatchEvent(ev);
        } catch {
            try {
                el.dispatchEvent(new Event('input', { bubbles: true }));
            } catch {}
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

