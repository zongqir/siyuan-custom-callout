/**
 * 调试助手 - 帮助诊断拖拽功能问题
 */

export class CalloutDebugHelper {
    /**
     * 检查页面中callout的状态
     */
    static checkCalloutStatus() {
        const allCallouts = document.querySelectorAll('.bq[custom-callout]');
        const calloutsWithHandle = document.querySelectorAll('.bq[custom-callout] .callout-resize-handle');
        
        console.group('[CalloutDebug] 🔍 Callout状态检查');
        console.log('总callout数量:', allCallouts.length);
        console.log('有拖拽手柄的callout数量:', calloutsWithHandle.length);
        
        if (allCallouts.length === 0) {
            console.warn('⚠️ 没有找到任何callout！请确保：');
            console.log('1. 插件已正确加载');
            console.log('2. 文档中有 [!info] 等格式的引用块');
            console.log('3. 引用块已被正确处理为callout样式');
        }
        
        if (allCallouts.length > 0 && calloutsWithHandle.length === 0) {
            console.warn('⚠️ 找到callout但没有拖拽手柄！可能的原因：');
            console.log('1. 拖拽功能初始化失败');
            console.log('2. CSS样式未正确应用');
            console.log('3. DOM结构问题');
        }
        
        // 详细检查每个callout
        allCallouts.forEach((callout, index) => {
            const hasHandle = !!callout.querySelector('.callout-resize-handle');
            const nodeId = callout.getAttribute('data-node-id');
            const calloutType = callout.getAttribute('custom-callout');
            const marginWidth = callout.getAttribute('data-margin-width');
            
            console.log(`Callout ${index + 1}:`, {
                nodeId,
                type: calloutType,
                width: marginWidth || '默认',
                hasHandle,
                position: callout.style.position || 'static'
            });
        });
        
        console.groupEnd();
        return { total: allCallouts.length, withHandle: calloutsWithHandle.length };
    }

    /**
     * 测试持久化功能
     */
    static async testPersistence() {
        console.group('[CalloutDebug] 🧪 测试持久化功能');
        
        const callouts = document.querySelectorAll('.bq[custom-callout]');
        if (callouts.length === 0) {
            console.error('❌ 没有找到callout，无法测试');
            console.groupEnd();
            return;
        }
        
        const firstCallout = callouts[0] as HTMLElement;
        const nodeId = firstCallout.getAttribute('data-node-id');
        
        if (!nodeId) {
            console.error('❌ 第一个callout没有node-id');
            console.groupEnd();
            return;
        }
        
        try {
            // 导入API函数
            const { getBlockKramdown, updateBlock } = await import('../api');
            
            console.log('🔍 测试节点ID:', nodeId);
            
            // 测试获取内容
            console.log('📖 测试getBlockKramdown...');
            const kramdownRes = await getBlockKramdown(nodeId);
            console.log('getBlockKramdown结果:', kramdownRes);
            
            if (!kramdownRes || !kramdownRes.kramdown) {
                console.error('❌ getBlockKramdown失败');
                console.groupEnd();
                return;
            }
            
            // 测试更新内容（添加一个注释来验证）
            console.log('💾 测试updateBlock...');
            const testContent = kramdownRes.kramdown + '\n<!-- 持久化测试 ' + Date.now() + ' -->';
            const updateResult = await updateBlock('markdown', testContent, nodeId);
            console.log('updateBlock结果:', updateResult);
            
            if (updateResult) {
                console.log('✅ 持久化功能正常！');
            } else {
                console.error('❌ updateBlock返回空结果');
            }
            
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
        }
        
        console.groupEnd();
    }

    /**
     * 模拟拖拽持久化
     */
    static async simulateDragPersistence(widthPercent = 50) {
        console.group(`[CalloutDebug] 🎭 模拟拖拽持久化 (${widthPercent}%)`);
        
        const callouts = document.querySelectorAll('.bq[custom-callout]');
        if (callouts.length === 0) {
            console.error('❌ 没有找到callout');
            console.groupEnd();
            return;
        }
        
        const firstCallout = callouts[0] as HTMLElement;
        const nodeId = firstCallout.getAttribute('data-node-id');
        
        if (!nodeId) {
            console.error('❌ callout没有node-id');
            console.groupEnd();
            return;
        }
        
        try {
            const { getBlockKramdown, updateBlock } = await import('../api');
            
            // 获取当前内容
            const kramdownRes = await getBlockKramdown(nodeId);
            if (!kramdownRes || !kramdownRes.kramdown) {
                console.error('❌ 无法获取内容');
                console.groupEnd();
                return;
            }
            
            const currentKramdown = kramdownRes.kramdown;
            console.log('📄 当前内容:', currentKramdown);
            
            // 更新宽度
            const newKramdown = this.updateKramdownWidthTest(currentKramdown, widthPercent);
            console.log('📝 更新后内容:', newKramdown);
            
            if (newKramdown === currentKramdown) {
                console.log('⚠️ 内容无变化');
                console.groupEnd();
                return;
            }
            
            // 保存更新
            const updateResult = await updateBlock('markdown', newKramdown, nodeId);
            console.log('💾 保存结果:', updateResult);
            
            if (updateResult) {
                console.log('✅ 模拟持久化成功！');
                // 更新视觉效果
                firstCallout.setAttribute('data-margin-width', widthPercent + '%');
                firstCallout.style.setProperty('--margin-width', widthPercent + '%');
            }
            
        } catch (error) {
            console.error('❌ 模拟过程中发生错误:', error);
        }
        
        console.groupEnd();
    }
    
    /**
     * 测试用的kramdown宽度更新
     */
    private static updateKramdownWidthTest(kramdown: string, widthPercent: number): string {
        const lines = kramdown.split('\n');
        const shouldRemoveWidth = widthPercent > 95;
        const widthStr = widthPercent.toFixed(1) + '%';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 匹配 [!type] 或 [!type|params] 格式
            const match = line.match(/^(\[!([^|\]]+))(\|.*?)?\](.*)$/);
            if (match) {
                const baseCommand = match[1]; // [!info
                const existingParams = match[3]; // |30%|2em 或 undefined
                const suffix = match[4]; // 可能的额外内容
                
                console.log('🔍 匹配到callout行:', {
                    fullLine: line,
                    baseCommand,
                    existingParams,
                    suffix
                });
                
                if (shouldRemoveWidth) {
                    if (existingParams) {
                        const params = existingParams.substring(1).split('|');
                        const nonWidthParams = params.slice(1);
                        
                        if (nonWidthParams.length > 0 && nonWidthParams.some(p => p.trim())) {
                            lines[i] = `${baseCommand}|${nonWidthParams.join('|')}]${suffix}`;
                        } else {
                            lines[i] = `${baseCommand}]${suffix}`;
                        }
                    }
                } else {
                    if (existingParams) {
                        const params = existingParams.substring(1).split('|');
                        params[0] = widthStr;
                        lines[i] = `${baseCommand}|${params.join('|')}]${suffix}`;
                    } else {
                        lines[i] = `${baseCommand}|${widthStr}]${suffix}`;
                    }
                }
                
                console.log('📝 更新行为:', lines[i]);
                break;
            }
        }

        return lines.join('\n');
    }
    
    /**
     * 手动为所有callout添加拖拽手柄
     */
    static manuallyAddHandles() {
        console.log('[CalloutDebug] 🔧 手动添加拖拽手柄...');
        
        const allCallouts = document.querySelectorAll('.bq[custom-callout]');
        let addedCount = 0;
        
        allCallouts.forEach((callout) => {
            if (!callout.querySelector('.callout-resize-handle')) {
                this.addDebugHandle(callout as HTMLElement);
                addedCount++;
            }
        });
        
        console.log(`[CalloutDebug] ✅ 已添加 ${addedCount} 个拖拽手柄`);
    }
    
    /**
     * 添加调试版拖拽手柄
     */
    private static addDebugHandle(blockquote: HTMLElement) {
        const handle = document.createElement('div');
        handle.className = 'callout-resize-handle debug-handle';
        handle.title = '🔧 调试拖拽手柄';
        handle.style.cssText = `
            position: absolute !important;
            right: -8px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            width: 16px !important;
            height: 40px !important;
            background: rgba(255, 0, 0, 0.5) !important;
            border: 2px solid #ff0000 !important;
            cursor: ew-resize !important;
            z-index: 9999 !important;
            opacity: 1 !important;
            border-radius: 4px !important;
        `;
        
        handle.innerHTML = '<div style="color: white; font-size: 10px; text-align: center; line-height: 40px;">拖拽</div>';
        
        // 确保父元素有相对定位
        if (window.getComputedStyle(blockquote).position === 'static') {
            blockquote.style.position = 'relative';
        }
        
        blockquote.appendChild(handle);
        
        // 简单的拖拽事件
        let isDragging = false;
        let startX = 0;
        let startWidth = 0;
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startWidth = blockquote.offsetWidth;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const newWidth = Math.max(100, startWidth + deltaX);
            const containerWidth = blockquote.parentElement?.offsetWidth || window.innerWidth;
            const widthPercent = Math.min(100, Math.max(10, (newWidth / containerWidth) * 100));
            
            blockquote.style.width = widthPercent + '%';
            handle.title = `🔧 宽度: ${widthPercent.toFixed(1)}%`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
                console.log('[CalloutDebug] 拖拽结束');
            }
        });
    }
    
    /**
     * 检查CSS样式是否正确加载
     */
    static checkStyles() {
        console.group('[CalloutDebug] 🎨 样式检查');
        
        const customStyleElement = document.getElementById('custom-callout-styles');
        if (!customStyleElement) {
            console.error('❌ 找不到 custom-callout-styles 样式元素');
            console.log('这意味着插件样式可能没有正确注入');
            console.groupEnd();
            return false;
        }
        
        const styleContent = customStyleElement.textContent || '';
        const hasDragStyles = styleContent.includes('callout-resize-handle');
        
        console.log('✅ 找到样式元素');
        console.log('包含拖拽样式:', hasDragStyles);
        console.log('样式长度:', styleContent.length, '字符');
        
        if (!hasDragStyles) {
            console.warn('⚠️ 样式中缺少拖拽相关CSS');
            console.log('可能需要重新构建插件');
        }
        
        console.groupEnd();
        return hasDragStyles;
    }
}


// 将调试助手挂载到全局对象
(window as any).CalloutDebugHelper = CalloutDebugHelper;

// 自动执行基础检查
setTimeout(() => {
    CalloutDebugHelper.checkCalloutStatus();
    CalloutDebugHelper.checkStyles();
}, 1000);
