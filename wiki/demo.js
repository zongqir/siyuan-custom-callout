(function() {
    'use strict';

    console.log('=== Optimized SiYuan BlockQuote Enhanced Script ===');

    // ==================== 自定义样式检测 ====================
  
    // 检查是否为自定义样式的 BlockQuote
    function hasCustomStyle(blockQuote) {
        if (!blockQuote) return false;
      
        // 检查 custom-b 属性
        const customB = blockQuote.getAttribute('custom-b');
        if (customB) {
            const customBTypes = ['info', 'light', 'bell', 'check', 'question', 'warn', 'wrong', 'bug', 'note', 'pen'];
            if (customBTypes.includes(customB)) {
                return true;
            }
        }
      
        // 检查 custom-callout 属性
        const customCallout = blockQuote.getAttribute('custom-callout');
        if (customCallout === '书签') {
            return true;
        }
      
        return false;
    }

    // ==================== 命令菜单部分 ====================
  
    // 命令定义（菜单用）
    const menuCommands = [
        {
            command: 'none',
            displayName: '原生样式',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>`,
            color: '#9ca3af',
            isNone: true
        },
        {
            command: '@info',
            displayName: '信息说明',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><circle cx="12" cy="12" r="10" stroke="#4493f8" stroke-width="1.7" fill="white"/><rect x="11" y="7" width="2" height="7" rx="1" fill="#4493f8"/><circle cx="12" cy="17" r="1.2" fill="#4493f8"/></svg>`,
            color: '#4493f8'
        },
        {
            command: '@concept',
            displayName: '概念解释',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="#9333ea" stroke-width="1.5" fill="none"/></svg>`,
            color: '#9333ea'
        },
        {
            command: '@example',
            displayName: '示例演示',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#10b981" stroke-width="1.5" fill="none"/><path d="M8 10h8M8 14h5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            color: '#10b981'
        },
        {
            command: '@tip',
            displayName: '使用技巧',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="#84cc16" stroke-width="1.5" fill="none"/></svg>`,
            color: '#84cc16'
        },
        {
            command: '@best-practice',
            displayName: '最佳实践',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#059669" stroke-width="1.5" fill="none"/></svg>`,
            color: '#059669'
        },
        {
            command: '@tradeoff',
            displayName: '权衡取舍',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M3 12h18M12 3v18" stroke="#ea580c" stroke-width="1.5"/><circle cx="7" cy="7" r="2" fill="#ea580c"/><circle cx="17" cy="17" r="2" fill="#ea580c"/></svg>`,
            color: '#ea580c'
        },
        {
            command: '@deep-dive',
            displayName: '深水区',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M12 3v18m0 0l-6-6m6 6l6-6" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 8h18" stroke="#1e40af" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            color: '#1e40af'
        },
        {
            command: '@comparison',
            displayName: '对比分析',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#6366f1" stroke-width="1.5" fill="none"/><path d="M9 12h6M9 16h6" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            color: '#6366f1'
        },
        {
            command: '@summary',
            displayName: '章节总结',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#06b6d4" stroke-width="1.5" fill="none"/></svg>`,
            color: '#06b6d4'
        },
        {
            command: '@pitfall',
            displayName: '常见陷阱',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#dc2626" stroke-width="1.5" fill="none"/></svg>`,
            color: '#dc2626'
        },
        {
            command: '@highlight',
            displayName: '重要亮点',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" overflow="visible"><path d="M12 3l2.163 6.636L21 12l-6.837 2.364L12 21l-2.163-6.636L3 12l6.837-2.364L12 3z" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"/></svg>`,
            color: '#f59e0b'
        }
    ];

    // 菜单状态管理
    let commandMenu = null;
    let isMenuVisible = false;
    let isProcessingEvent = false;
    let trackedBlockQuotes = new Set();
    let recentlyCreatedBlockQuotes = new Set();
    let currentTargetBlockQuote = null;
    let selectedMenuIndex = 0;
    let menuItems = [];
    let isInitialLoad = true; // 🔥 新增：标记是否为初始加载
    let lastBatchAddTime = 0; // 🔥 记录最后一次批量添加的时间
    let batchAddCount = 0; // 🔥 批量添加计数器

    // ==================== Callout 处理部分 ====================
  
    // Callout 类型定义（处理器用）
    const calloutTypes = {
        '@info': { type: 'info', displayName: '信息说明' },
        '@信息': { type: 'info', displayName: '信息说明' },
        '@concept': { type: 'concept', displayName: '概念解释' },
        '@概念': { type: 'concept', displayName: '概念解释' },
        '@example': { type: 'example', displayName: '示例演示' },
        '@示例': { type: 'example', displayName: '示例演示' },
        '@tip': { type: 'tip', displayName: '使用技巧' },
        '@技巧': { type: 'tip', displayName: '使用技巧' },
        '@best-practice': { type: 'best-practice', displayName: '最佳实践' },
        '@最佳实践': { type: 'best-practice', displayName: '最佳实践' },
        '@tradeoff': { type: 'tradeoff', displayName: '权衡取舍' },
        '@取舍': { type: 'tradeoff', displayName: '权衡取舍' },
        '@权衡取舍': { type: 'tradeoff', displayName: '权衡取舍' },
        '@deep-dive': { type: 'deep-dive', displayName: '深水区' },
        '@深入': { type: 'deep-dive', displayName: '深水区' },
        '@深水区': { type: 'deep-dive', displayName: '深水区' },
        '@comparison': { type: 'comparison', displayName: '对比分析' },
        '@对比': { type: 'comparison', displayName: '对比分析' },
        '@对比分析': { type: 'comparison', displayName: '对比分析' },
        '@summary': { type: 'summary', displayName: '章节总结' },
        '@总结': { type: 'summary', displayName: '章节总结' },
        '@章节总结': { type: 'summary', displayName: '章节总结' },
        '@pitfall': { type: 'pitfall', displayName: '常见陷阱' },
        '@陷阱': { type: 'pitfall', displayName: '常见陷阱' },
        '@常见陷阱': { type: 'pitfall', displayName: '常见陷阱' },
        '@highlight': { type: 'highlight', displayName: '重要亮点' },
        '@亮点': { type: 'highlight', displayName: '重要亮点' },
        '@重要亮点': { type: 'highlight', displayName: '重要亮点' }
    };

    // ==================== 命令菜单功能 ====================

    // 更新选中的菜单项
    function updateMenuSelection(immediate = false) {
        const doUpdate = () => {
            menuItems.forEach((item, index) => {
                if (index === selectedMenuIndex) {
                    item.style.backgroundColor = '#dbeafe';
                    item.style.borderColor = '#60a5fa';
                    item.style.transform = 'scale(1.02)';
                    // 只在需要时才滚动，且使用 instant 避免动画冲突
                    if (commandMenu) {
                        const itemRect = item.getBoundingClientRect();
                        const menuRect = commandMenu.getBoundingClientRect();
                        if (itemRect.top < menuRect.top || itemRect.bottom > menuRect.bottom) {
                            item.scrollIntoView({ block: 'nearest', behavior: 'instant' });
                        }
                    }
                } else {
                    item.style.backgroundColor = '';
                    item.style.borderColor = '#f3f4f6';
                    item.style.transform = 'scale(1)';
                }
            });
        };
        
        if (immediate) {
            doUpdate();
        } else {
            requestAnimationFrame(doUpdate);
        }
    }

    // 选择当前高亮的菜单项
    function selectCurrentMenuItem() {
        if (menuItems[selectedMenuIndex]) {
            menuItems[selectedMenuIndex].click();
        }
    }

    // 创建命令菜单
    function createCommandMenu(targetBlockQuote, isEdit = false) {
        if (commandMenu) return commandMenu;

        currentTargetBlockQuote = targetBlockQuote;
        selectedMenuIndex = 0;
        menuItems = [];
        
        commandMenu = document.createElement('div');
        commandMenu.setAttribute('tabindex', '0'); // 让菜单可以获得焦点
        commandMenu.style.cssText = `
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
            will-change: opacity, transform;
        `;

        // 关闭按钮
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
            hideCommandMenu(true);
        });
        commandMenu.appendChild(closeButton);

        // 标题
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
        commandMenu.appendChild(header);

        // 创建网格容器
        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
            padding: 8px;
        `;

        // 命令选项
        menuCommands.forEach((cmd, index) => {
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
                <span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${cmd.icon}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 500; color: #374151; font-size: 13px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cmd.command}</div>
                    <div style="color: #6b7280; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cmd.displayName}</div>
                </div>
            `;
          
            item.addEventListener('mouseenter', () => {
                selectedMenuIndex = index; // 同步更新选中索引
                updateMenuSelection();
            });
          
            item.addEventListener('mouseleave', () => {
                // 鼠标离开时保持键盘选中状态
            });
          
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                item.style.backgroundColor = '#dbeafe';
                item.style.color = '#1e40af';
                
                // 🔥 处理清除样式
                if (cmd.isNone) {
                    clearCalloutStyle(currentTargetBlockQuote);
                    setTimeout(() => hideCommandMenu(true), 100);
                } else {
                    // 🔥 传递 isEdit 参数
                    insertCommandToBlockQuote(cmd.command, currentTargetBlockQuote, isEdit);
                    setTimeout(() => hideCommandMenu(true), 300);
                }
            });
          
            menuItems.push(item); // 保存菜单项引用
            gridContainer.appendChild(item);
        });
        
        // 将网格容器添加到菜单
        commandMenu.appendChild(gridContainer);

        // 底部提示
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
        commandMenu.appendChild(footer);

        // 添加键盘事件监听（支持上下左右导航）
        commandMenu.addEventListener('keydown', (e) => {
            const cols = 2; // 列数
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                // 向下移动2行（因为是2列）
                selectedMenuIndex = Math.min(selectedMenuIndex + cols, menuItems.length - 1);
                updateMenuSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                // 向上移动2行
                selectedMenuIndex = Math.max(selectedMenuIndex - cols, 0);
                updateMenuSelection();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                // 向右移动
                selectedMenuIndex = Math.min(selectedMenuIndex + 1, menuItems.length - 1);
                updateMenuSelection();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                // 向左移动
                selectedMenuIndex = Math.max(selectedMenuIndex - 1, 0);
                updateMenuSelection();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectCurrentMenuItem();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideCommandMenu(true);
            }
        });

        document.body.appendChild(commandMenu);
        
        return commandMenu;
    }

    // 🔥 新增：清除 Callout 样式
    function clearCalloutStyle(blockQuoteElement) {
        if (!blockQuoteElement) return false;

        try {
            // 移除 callout 属性
            blockQuoteElement.removeAttribute('custom-callout');
            
            // 查找并清理标题元素
            const titleDiv = blockQuoteElement.querySelector('[data-callout-title="true"]');
            if (titleDiv) {
                titleDiv.removeAttribute('data-callout-title');
                titleDiv.removeAttribute('data-callout-display-name');
                
                // 清空标题内容（如果内容是命令格式）
                const text = titleDiv.textContent.trim();
                if (text.startsWith('@') || Object.keys(calloutTypes).includes(text)) {
                    titleDiv.textContent = '';
                }
            }
            
            console.log('Callout style cleared');
            return true;
        } catch (error) {
            console.error('Error clearing callout style:', error);
            return false;
        }
    }

    // 插入命令并自动换行
    function insertCommandToBlockQuote(command, blockQuoteElement, isEdit = false) {
        if (!blockQuoteElement) return false;

        // 如果是编辑模式，查找标题div，否则查找第一个可编辑div
        let editableDiv;
        if (isEdit) {
            editableDiv = blockQuoteElement.querySelector('[data-callout-title="true"]');
        }
        if (!editableDiv) {
            editableDiv = blockQuoteElement.querySelector('[contenteditable="true"]');
        }
        if (!editableDiv) return false;

        try {
            // 如果是编辑模式，直接替换并立即处理
            if (isEdit) {
                editableDiv.textContent = command;
                
                // 触发事件
                editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
                editableDiv.dispatchEvent(new Event('change', { bubbles: true }));
                
                // 立即处理 Callout
                setTimeout(() => {
                    processBlockquote(blockQuoteElement);
                }, 100);
                
                return true;
            }
          
            // 新建模式：原有逻辑
            editableDiv.textContent = command;
          
            // 触发事件，让 Callout 处理器知道内容已更改
            editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
            editableDiv.dispatchEvent(new Event('change', { bubbles: true }));

            // 设置光标并自动换行
            setTimeout(() => {
                editableDiv.focus();
              
                const range = document.createRange();
                const selection = window.getSelection();
              
                if (editableDiv.childNodes.length > 0) {
                    const lastNode = editableDiv.childNodes[editableDiv.childNodes.length - 1];
                    if (lastNode.nodeType === Node.TEXT_NODE) {
                        range.setStart(lastNode, lastNode.textContent.length);
                        range.setEnd(lastNode, lastNode.textContent.length);
                    } else {
                        range.setStartAfter(lastNode);
                        range.setEndAfter(lastNode);
                    }
                } else {
                    range.selectNodeContents(editableDiv);
                    range.collapse(false);
                }
              
                selection.removeAllRanges();
                selection.addRange(range);
              
                // 自动换行
                setTimeout(() => {
                    editableDiv.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
                    }));
                    editableDiv.dispatchEvent(new KeyboardEvent('keyup', {
                        key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
                    }));
                  
                    // 延迟处理 Callout，确保内容已更新
                    setTimeout(() => {
                        processBlockquote(blockQuoteElement);
                    }, 200);
                }, 100);
            }, 150);

            return true;
        } catch (error) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(command);
            }
            return false;
        }
    }

    // 显示菜单
    function showCommandMenu(x, y, blockQuoteElement, isEdit = false) {
        if (isProcessingEvent || isMenuVisible) return;
      
        // 检查是否为自定义样式的 BlockQuote
        if (hasCustomStyle(blockQuoteElement)) {
            console.log('Skipping custom styled blockquote:', blockQuoteElement);
            return;
        }
      
        isProcessingEvent = true;
        const menu = createCommandMenu(blockQuoteElement, isEdit);

        // 获取菜单尺寸
        menu.style.left = '0px';
        menu.style.top = '0px';
        menu.style.visibility = 'hidden';
        menu.style.opacity = '1';
        menu.style.pointerEvents = 'auto';

        requestAnimationFrame(() => {
            const menuRect = menu.getBoundingClientRect();
            const menuHeight = menuRect.height;
            const menuWidth = menuRect.width;
          
            let menuX = x;
            let menuY = y;
          
            if (blockQuoteElement) {
                const blockRect = blockQuoteElement.getBoundingClientRect();
                menuX = blockRect.left;
                menuY = blockRect.top - menuHeight - 10;
            }

            // 边界检查
            if (menuY < 10 && blockQuoteElement) {
                const blockRect = blockQuoteElement.getBoundingClientRect();
                menuY = blockRect.bottom + 10;
            }
            if (menuX + menuWidth > window.innerWidth) {
                menuX = window.innerWidth - menuWidth - 10;
            }
            if (menuY + menuHeight > window.innerHeight) {
                menuY = window.innerHeight - menuHeight - 10;
            }
            if (menuX < 10) menuX = 10;
            if (menuY < 10) menuY = 10;
          
            // 设置位置并显示
            menu.style.left = menuX + 'px';
            menu.style.top = menuY + 'px';
            menu.style.visibility = 'visible';
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
          
            // 立即更新选中状态（在动画之前）
            updateMenuSelection(true);
            
            // 然后执行动画
            requestAnimationFrame(() => {
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
                
                // 动画结束后聚焦
                menu.addEventListener('transitionend', function focusMenu() {
                    menu.removeEventListener('transitionend', focusMenu);
                    menu.focus();
                }, { once: true });
            });
          
            isMenuVisible = true;
            isProcessingEvent = false;
          
            // 标记已显示
            if (blockQuoteElement) {
                const nodeId = blockQuoteElement.getAttribute('data-node-id');
                if (nodeId) {
                    recentlyCreatedBlockQuotes.add(nodeId);
                    setTimeout(() => recentlyCreatedBlockQuotes.delete(nodeId), 3000);
                }
            }
        });
    }

    // 隐藏菜单
    function hideCommandMenu(immediate = false) {
        if (!commandMenu || !isMenuVisible) return;
      
        currentTargetBlockQuote = null;
        selectedMenuIndex = 0;
        menuItems = [];
      
        if (immediate) {
            commandMenu.remove();
            commandMenu = null;
            isMenuVisible = false;
            return;
        }
      
        commandMenu.style.opacity = '0';
        commandMenu.style.transform = 'translateY(-10px)';
        commandMenu.style.pointerEvents = 'none';
      
        setTimeout(() => {
            if (commandMenu) {
                commandMenu.remove();
                commandMenu = null;
            }
            isMenuVisible = false;
        }, 200);
    }

    // ==================== Callout 处理功能 ====================

    // 处理单个引用块的函数
    function processBlockquote(blockquote) {
        console.log('Processing blockquote:', blockquote);
      
        // 跳过自定义样式的 BlockQuote
        if (hasCustomStyle(blockquote)) {
            console.log('Skipping custom styled blockquote for callout processing');
            return;
        }
      
        const firstParagraph = blockquote.querySelector('div[data-type="NodeParagraph"]:first-of-type');
        if (!firstParagraph) {
            console.log('No first paragraph found');
            return;
        }

        const titleDiv = firstParagraph.querySelector('div[contenteditable="true"]');
        if (!titleDiv) {
            console.log('No contenteditable div found');
            return;
        }

        const text = titleDiv.textContent.trim();
        console.log('Current text:', text);
      
        // 检查是否匹配任何 callout 类型
        for (const [trigger, config] of Object.entries(calloutTypes)) {
            if (text.startsWith(trigger)) {
                console.log(`Match found: ${trigger} -> ${config.type}`);
              
                // 设置 callout 类型（使用 custom-callout 属性以匹配 CSS）
                blockquote.setAttribute('custom-callout', config.type);
              
                // 标记标题并设置显示名称
                titleDiv.setAttribute('data-callout-title', 'true');
                titleDiv.setAttribute('data-callout-display-name', config.displayName);
              
                // 🔥 新增：添加折叠按钮
                addCollapseToggle(blockquote, titleDiv);
              
                console.log('Callout attributes set');
                return;
            }
        }
      
        // 如果不匹配任何 callout 类型，清除相关属性
        if (blockquote.hasAttribute('custom-callout')) {
            console.log('Clearing callout attributes');
            blockquote.removeAttribute('custom-callout');
            titleDiv.removeAttribute('data-callout-title');
            titleDiv.removeAttribute('data-callout-display-name');
            // 移除折叠按钮
            removeCollapseToggle(titleDiv);
        }
    }
  
    // 🔥 新增：添加折叠功能（无按钮版本）
    function addCollapseToggle(blockquote, titleDiv) {
        // 设置标题点击处理
        setupTitleClickHandler(blockquote, titleDiv);
    }
  
    // 🔥 新增：设置标题点击处理（点击标题切换折叠状态）
    function setupTitleClickHandler(blockquote, titleDiv) {
        // 移除旧的监听器（如果有）
        if (titleDiv._titleCollapseHandler) {
            titleDiv.removeEventListener('click', titleDiv._titleCollapseHandler, true);
        }
        
        // 创建新的监听器
        const handler = function(e) {
            // 检查是否点击了左侧图标区域（0-40px），那是用来切换主题的
            const rect = titleDiv.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            
            if (clickX >= 0 && clickX <= 40) {
                // 点击了图标区域，不处理折叠，让主题切换逻辑处理
                return;
            }
            
            // 点击标题其他区域，切换折叠状态
            e.preventDefault();
            e.stopPropagation();
            
            toggleCalloutCollapse(blockquote);
        };
        
        // 保存引用以便后续移除
        titleDiv._titleCollapseHandler = handler;
        
        // 使用捕获阶段，确保优先处理
        titleDiv.addEventListener('click', handler, true);
        
        // 添加标题悬停样式提示
        titleDiv.style.cursor = 'pointer';
    }
  
    // 🔥 新增：移除折叠功能
    function removeCollapseToggle(titleDiv) {
        // 移除点击处理器
        if (titleDiv._titleCollapseHandler) {
            titleDiv.removeEventListener('click', titleDiv._titleCollapseHandler, true);
            titleDiv._titleCollapseHandler = null;
        }
        // 恢复默认光标
        titleDiv.style.cursor = '';
    }
  
    // 🔥 新增：切换折叠状态（无按钮版本）
    function toggleCalloutCollapse(blockquote) {
        const isCollapsed = blockquote.getAttribute('data-collapsed') === 'true';
      
        if (isCollapsed) {
            // 展开
            blockquote.setAttribute('data-collapsed', 'false');
        } else {
            // 折叠
            blockquote.setAttribute('data-collapsed', 'true');
        }
    }

    // 处理所有引用块
    function processAllBlockquotes() {
        console.log('=== Processing all blockquotes ===');
        const blockquotes = document.querySelectorAll('.bq');
        console.log('Found blockquotes:', blockquotes.length);
      
        blockquotes.forEach((bq, index) => {
            if (!hasCustomStyle(bq)) {
                console.log(`Processing blockquote ${index + 1}`);
                processBlockquote(bq);
            } else {
                console.log(`Skipping custom blockquote ${index + 1}`);
            }
        });
    }

    // ==================== 共用功能 ====================

    // 查找 BlockQuote 元素
    function findSiYuanBlockQuotes() {
        const selectors = ['[data-type="NodeBlockquote"]', '.bq'];
        let allBlockQuotes = [];
      
        selectors.forEach(selector => {
            allBlockQuotes = allBlockQuotes.concat(Array.from(document.querySelectorAll(selector)));
        });
      
        return [...new Set(allBlockQuotes)];
    }

    // 检查是否为空
    function isBlockQuoteEmpty(blockQuote) {
        const contentDiv = blockQuote.querySelector('[contenteditable="true"]');
        if (!contentDiv) return false;
      
        const text = contentDiv.textContent.trim();
        return text === '' || text.length < 3 || /^[\s\n\r]*$/.test(text);
    }

    // 检查是否新创建
    function isBlockQuoteNewlyCreated(blockQuote) {
        const nodeId = blockQuote.getAttribute('data-node-id');
        if (!nodeId) return false;
      
        // 跳过自定义样式的 BlockQuote
        if (hasCustomStyle(blockQuote)) {
            return false;
        }
      
        const wasTracked = trackedBlockQuotes.has(nodeId);
        const isEmpty = isBlockQuoteEmpty(blockQuote);
      
        return !wasTracked && isEmpty;
    }

    // ==================== 优化的事件监听系统 ====================

    // 优化的MutationObserver
    function setupOptimizedObserver() {
        const observer = new MutationObserver(function(mutations) {
            const relevantMutations = mutations.filter(mutation => {
                // 只关注添加节点的变化
                return mutation.type === 'childList' && mutation.addedNodes.length > 0;
            });

            if (relevantMutations.length === 0) return;

            let newBlockquotes = [];
          
            relevantMutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 直接检查是否是blockquote
                        if (node.getAttribute?.('data-type') === 'NodeBlockquote' || 
                            node.classList?.contains('bq')) {
                            newBlockquotes.push(node);
                        }
                        // 检查子元素中的blockquote
                        const childBlockquotes = node.querySelectorAll?.('[data-type="NodeBlockquote"], .bq');
                        if (childBlockquotes?.length > 0) {
                            newBlockquotes.push(...Array.from(childBlockquotes));
                        }
                    }
                });
            });

            // 批量处理新的blockquote
            if (newBlockquotes.length > 0) {
                // 去重
                const uniqueBlockquotes = [...new Set(newBlockquotes)];
              
                // 🔥 关键修复：检测是否为批量加载（文档切换）
                const now = Date.now();
                let isBatchLoad = false;
              
                // 如果距离上次添加小于300ms，认为是批量加载
                if (now - lastBatchAddTime < 300) {
                    batchAddCount += uniqueBlockquotes.length;
                    // 如果累计添加数量>=2，认为是批量加载
                    if (batchAddCount >= 2) {
                        isBatchLoad = true;
                    }
                } else {
                    // 重置计数器
                    batchAddCount = uniqueBlockquotes.length;
                }
                
                lastBatchAddTime = now;
                
                // 500ms后重置计数器
                setTimeout(() => {
                    if (Date.now() - lastBatchAddTime >= 500) {
                        batchAddCount = 0;
                    }
                }, 500);
              
                setTimeout(() => {
                    uniqueBlockquotes.forEach(bq => {
                        if (!hasCustomStyle(bq)) {
                            const nodeId = bq.getAttribute('data-node-id');
                          
                            // 检查是否已经被跟踪过
                            const wasTracked = nodeId && trackedBlockQuotes.has(nodeId);
                          
                            // 标记为已跟踪
                            if (nodeId) {
                                trackedBlockQuotes.add(nodeId);
                            }
                          
                            // 🔥 修复：只在以下情况显示菜单：
                            // 1. 不是初始加载
                            // 2. 不是批量加载（文档切换）
                            // 3. 之前没被跟踪过
                            // 4. blockquote是空的
                            if (!isInitialLoad && !isBatchLoad && !wasTracked && isBlockQuoteEmpty(bq)) {
                                const rect = bq.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) {
                                    showCommandMenu(rect.left, rect.top, bq);
                                }
                            }
                            // 处理callout
                            processBlockquote(bq);
                        }
                    });
                }, 50);
            }
        });

        // 更精确的观察配置
        observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: false, // 不观察属性变化
            characterData: false // 不观察文本变化
        });

        return observer;
    }

    // 基于焦点的检测
    function setupFocusBasedDetection() {
        let lastFocusedElement = null;
      
        document.addEventListener('focusin', (e) => {
            const target = e.target;
          
            // 🔥 修复：跳过初始加载阶段的焦点事件
            if (isInitialLoad) return;
          
            // 检查是否聚焦到blockquote内的可编辑元素
            if (target.contentEditable === 'true') {
                const blockquote = target.closest('[data-type="NodeBlockquote"], .bq');
                if (blockquote && !hasCustomStyle(blockquote)) {
                    // 如果是新的空blockquote，显示菜单
                    if (isBlockQuoteEmpty(blockquote) && lastFocusedElement !== target) {
                        const nodeId = blockquote.getAttribute('data-node-id');
                        if (nodeId && !recentlyCreatedBlockQuotes.has(nodeId)) {
                            const rect = blockquote.getBoundingClientRect();
                            showCommandMenu(rect.left, rect.top, blockquote);
                        }
                    }
                    lastFocusedElement = target;
                }
            }
        });
    }

    // 事件驱动的callout处理
    function setupEventDrivenSystem() {
        // 使用防抖的输入监听
        let inputTimeout;
      
        ['input', 'keyup', 'paste'].forEach(eventType => {
            document.addEventListener(eventType, function(e) {
                // 检查是否在可编辑元素中
                if (e.target.contentEditable === 'true') {
                    clearTimeout(inputTimeout);
                    inputTimeout = setTimeout(() => {
                        // 查找最近的引用块父元素
                        const blockquote = e.target.closest('[data-type="NodeBlockquote"], .bq');
                        if (blockquote && !hasCustomStyle(blockquote)) {
                            processBlockquote(blockquote);
                        }
                    }, eventType === 'paste' ? 100 : 300); // 防抖300ms，粘贴100ms
                }
            }, true);
        });
      
        // 🔥 点击 callout 标题图标区域切换类型
        document.addEventListener('click', function(e) {
            const target = e.target;
          
            // 检查是否点击了 callout 标题
            if (target.contentEditable === 'true' && target.getAttribute('data-callout-title') === 'true') {
                const blockquote = target.closest('[data-type="NodeBlockquote"], .bq');
                if (blockquote && blockquote.hasAttribute('custom-callout') && !hasCustomStyle(blockquote)) {
                    // 获取点击位置（相对于标题元素的左侧区域，图标区域约40px）
                    const rect = target.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                  
                    // 如果点击了左侧图标区域（0-40px），显示切换主题菜单
                    if (clickX >= 0 && clickX <= 40) {
                        e.preventDefault();
                        e.stopPropagation();
                      
                        // 显示切换菜单
                        const bqRect = blockquote.getBoundingClientRect();
                        showCommandMenu(bqRect.left, bqRect.top, blockquote, true);
                    }
                    // 40px之后的区域由 setupTitleClickHandler 处理折叠功能
                }
            }
        }, true)
    }

    // 🔥 修复：思源API监听（安全版本）
    function setupSiYuanAPIListener() {
        try {
            // 检查思源API是否可用
            if (typeof window.siyuan === 'object' && window.siyuan !== null) {
                console.log('SiYuan API detected');
              
                // 尝试不同的API监听方式
                if (window.siyuan.ws && typeof window.siyuan.ws.onmessage !== 'undefined') {
                    // 方式1：使用 onmessage 属性
                    const originalOnMessage = window.siyuan.ws.onmessage;
                    window.siyuan.ws.onmessage = function(event) {
                        // 调用原始处理器
                        if (originalOnMessage) {
                            originalOnMessage.call(this, event);
                        }
                      
                        // 我们的处理逻辑
                        try {
                            const data = JSON.parse(event.data);
                            if (data.cmd === 'transactions' && data.data) {
                                data.data.forEach(transaction => {
                                    transaction.doOperations?.forEach(op => {
                                        if (op.action === 'insert' && op.data?.includes('NodeBlockquote')) {
                                            setTimeout(() => {
                                                // 🔥 修复：只在非初始加载时显示菜单
                                                if (!isInitialLoad) {
                                                    const newBlockquote = document.querySelector(`[data-node-id="${op.id}"]`);
                                                    if (newBlockquote && !hasCustomStyle(newBlockquote) && isBlockQuoteEmpty(newBlockquote)) {
                                                        const rect = newBlockquote.getBoundingClientRect();
                                                        showCommandMenu(rect.left, rect.top, newBlockquote);
                                                    }
                                                }
                                            }, 100);
                                        }
                                    });
                                });
                            }
                        } catch (error) {
                            // 忽略JSON解析错误
                        }
                    };
                    console.log('SiYuan WebSocket listener attached via onmessage');
                } else if (window.siyuan.eventBus && typeof window.siyuan.eventBus.on === 'function') {
                    // 方式2：使用事件总线
                    window.siyuan.eventBus.on('ws-main', (data) => {
                        try {
                            if (data.cmd === 'transactions' && data.data) {
                                data.data.forEach(transaction => {
                                    transaction.doOperations?.forEach(op => {
                                        if (op.action === 'insert' && op.data?.includes('NodeBlockquote')) {
                                            setTimeout(() => {
                                                // 🔥 修复：只在非初始加载时显示菜单
                                                if (!isInitialLoad) {
                                                    const newBlockquote = document.querySelector(`[data-node-id="${op.id}"]`);
                                                    if (newBlockquote && !hasCustomStyle(newBlockquote) && isBlockQuoteEmpty(newBlockquote)) {
                                                        const rect = newBlockquote.getBoundingClientRect();
                                                        showCommandMenu(rect.left, rect.top, newBlockquote);
                                                    }
                                                }
                                            }, 100);
                                        }
                                    });
                                });
                            }
                        } catch (error) {
                            // 忽略处理错误
                        }
                    });
                    console.log('SiYuan event bus listener attached');
                } else {
                    console.log('SiYuan API available but no suitable WebSocket interface found');
                }
            } else {
                console.log('SiYuan API not detected, using DOM-based detection only');
            }
        } catch (error) {
            console.log('Error setting up SiYuan API listener:', error.message);
            console.log('Falling back to DOM-based detection only');
        }
    }

    // 优化的事件监听设置
    function setupOptimizedEventListeners() {
        console.log('Setting up optimized event listeners');
      
        // 初始化已知的 BlockQuote
        const initialBlockQuotes = findSiYuanBlockQuotes();
        initialBlockQuotes.forEach(bq => {
            const nodeId = bq.getAttribute('data-node-id');
            if (nodeId) trackedBlockQuotes.add(nodeId);
        });
      
        // 1. 优化的MutationObserver
        setupOptimizedObserver();
      
        // 2. 基于焦点的检测
        setupFocusBasedDetection();
      
        // 3. 事件驱动的callout处理
        setupEventDrivenSystem();
      
        // 4. 键盘事件（ESC关闭菜单）
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isMenuVisible) {
                e.preventDefault();
                hideCommandMenu(true);
                return;
            }
        });
      
        // 5. 点击外部关闭菜单
        document.addEventListener('click', function(e) {
            if (commandMenu && !commandMenu.contains(e.target) && isMenuVisible) {
                setTimeout(() => {
                    if (isMenuVisible) hideCommandMenu(true);
                }, 100);
            }
        });

        // 6. 🔥 修复：安全的思源API监听
        setupSiYuanAPIListener();
    }

    // ==================== 初始化 ====================

    function initOptimized() {
        console.log('Initializing optimized BlockQuote script');
      
        // 初始处理现有的blockquote（只执行一次）
        processAllBlockquotes();
      
        // 设置优化的事件监听
        setupOptimizedEventListeners();
      
        // 🔥 修复：延迟结束初始加载状态，避免页面加载时弹出菜单
        setTimeout(() => {
            isInitialLoad = false;
            console.log('Initial load complete, menu triggers now active');
        }, 2000); // 延迟2秒，确保页面完全加载
    }

    // 启动优化版本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOptimized);
    } else {
        initOptimized();
    }

    // 页面卸载清理
    window.addEventListener('beforeunload', () => hideCommandMenu(true));

    // 调试功能
    window.debugEnhancedBlockQuote = {
        // 菜单相关
        showMenu: () => {
            const blockQuotes = findSiYuanBlockQuotes();
            if (blockQuotes.length > 0) {
                const lastBlockQuote = blockQuotes[blockQuotes.length - 1];
                const rect = lastBlockQuote.getBoundingClientRect();
                showCommandMenu(rect.left, rect.top, lastBlockQuote);
            }
        },
        hideMenu: () => hideCommandMenu(true),
      
        // Callout 相关
        processAll: processAllBlockquotes,
        checkBlockquotes: () => {
            const bqs = document.querySelectorAll('.bq');
            console.log('=== Current blockquotes ===');
            bqs.forEach((bq, i) => {
                const text = bq.textContent.trim();
                const type = bq.getAttribute('custom-callout');
                const customStyle = hasCustomStyle(bq);
                console.log(`BQ ${i + 1}: "${text}" - Type: ${type || 'none'} - Custom: ${customStyle}`);
            });
        },
      
        // 检查自定义样式
        checkCustomStyles: () => {
            const bqs = document.querySelectorAll('.bq');
            console.log('=== Custom styled blockquotes ===');
            bqs.forEach((bq, i) => {
                if (hasCustomStyle(bq)) {
                    const customB = bq.getAttribute('custom-b');
                    const customCallout = bq.getAttribute('custom-callout');
                    console.log(`Custom BQ ${i + 1}: custom-b="${customB}" custom-callout="${customCallout}"`);
                }
            });
        },
      
        // 状态查看
        status: () => ({
            menuVisible: isMenuVisible,
            trackedCount: trackedBlockQuotes.size,
            recentCount: recentlyCreatedBlockQuotes.size,
            isInitialLoad: isInitialLoad,
            batchAddCount: batchAddCount,
            timeSinceLastBatch: Date.now() - lastBatchAddTime
        }),
      
        // 重置初始加载状态
        resetInitialLoad: () => {
            isInitialLoad = false;
            console.log('Initial load flag reset to false');
        },

        // 性能测试
        performanceTest: () => {
            const start = performance.now();
            processAllBlockquotes();
            const end = performance.now();
            console.log(`Processing all blockquotes took ${end - start} milliseconds`);
        },
      
        // 测试切换功能
        testSwitch: () => {
            const calloutBlocks = document.querySelectorAll('.bq[custom-callout]');
            if (calloutBlocks.length > 0) {
                const firstCallout = calloutBlocks[0];
                const rect = firstCallout.getBoundingClientRect();
                console.log('Opening switch menu for first callout...');
                showCommandMenu(rect.left, rect.top, firstCallout, true);
            } else {
                console.log('No callout blocks found');
            }
        },
      
        // 测试清除样式
        testClear: () => {
            const calloutBlocks = document.querySelectorAll('.bq[custom-callout]');
            if (calloutBlocks.length > 0) {
                const firstCallout = calloutBlocks[0];
                console.log('Clearing first callout style...');
                clearCalloutStyle(firstCallout);
            } else {
                console.log('No callout blocks found');
            }
        },
      
        // 测试折叠功能
        testCollapse: () => {
            const calloutBlocks = document.querySelectorAll('.bq[custom-callout]');
            if (calloutBlocks.length > 0) {
                const firstCallout = calloutBlocks[0];
                console.log('Toggling first callout...');
                toggleCalloutCollapse(firstCallout);
            } else {
                console.log('No callout blocks found');
            }
        },
      
        // 🔥 手动刷新所有callout（添加折叠功能）
        refresh: () => {
            console.log('Refreshing all callouts...');
            processAllBlockquotes();
            console.log('Refresh complete!');
        }
    };

    console.log('=== Optimized Enhanced BlockQuote Script Loaded ===');
})();