import { DEFAULT_CALLOUT_TYPES, CalloutTypeConfig } from './types';
import { setBlockAttrs, getBlockAttrs } from '../api';
import { logger } from '../libs/logger';

/**
 * CalloutProcessorV2 - 基于块属性的全新 Callout 处理器
 * 
 * 核心理念：
 * 1. 使用块属性存储 callout 状态，而不是解析文档内容
 * 2. 通过 CSS 属性选择器应用样式
 * 3. 简化的 DOM 操作，更可靠的状态管理
 * 
 * 块属性约定：
 * - custom-callout-type: callout 类型（如 "info", "warning" 等）
 * - custom-callout-title: 自定义标题（可选）
 * - custom-callout-collapsed: 折叠状态（"true" 或 "false"）
 */
export class CalloutProcessorV2 {
    private calloutTypes: Map<string, CalloutTypeConfig> = new Map();
    private observer: MutationObserver | null = null;
    private processedBlocks: Set<string> = new Set();
    private isInitialLoad: boolean = true;
    
    // 新建 blockquote 自动显示菜单的回调
    public onNewBlockquoteCreated: ((blockquote: HTMLElement) => void) | null = null;

    constructor() {
        this.loadDefaultTypes();
        
        // 2秒后结束初始加载状态
        setTimeout(() => {
            this.isInitialLoad = false;
        }, 2000);
    }

    /**
     * 加载默认的 Callout 类型
     */
    private loadDefaultTypes() {
        DEFAULT_CALLOUT_TYPES.forEach(config => {
            this.calloutTypes.set(config.type, config);
        });
    }

    /**
     * 更新 Callout 类型配置
     */
    updateTypes(types: CalloutTypeConfig[]) {
        this.calloutTypes.clear();
        types.forEach(config => {
            this.calloutTypes.set(config.type, config);
        });
    }

    /**
     * 获取所有 Callout 类型
     */
    getTypes(): CalloutTypeConfig[] {
        return Array.from(this.calloutTypes.values());
    }

    /**
     * 根据类型获取配置
     */
    getTypeConfig(type: string): CalloutTypeConfig | null {
        return this.calloutTypes.get(type) || null;
    }

    /**
     * 初始化处理器 - 启动 DOM 监听
     */
    initialize() {
        logger.log('[ProcessorV2] 初始化处理器');
        
        // 处理现有的所有 blockquote
        this.processAllBlockquotes();
        
        // 启动 MutationObserver 监听 DOM 变化
        this.startObserver();
    }

    /**
     * 销毁处理器
     */
    destroy() {
        logger.log('[ProcessorV2] 销毁处理器');
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        this.processedBlocks.clear();
    }

    /**
     * 处理所有编辑器中的 blockquote
     */
    private processAllBlockquotes() {
        const editors = document.querySelectorAll('.protyle-wysiwyg');
        editors.forEach(editor => {
            const blockquotes = editor.querySelectorAll('.bq[data-node-id]');
            blockquotes.forEach(bq => {
                this.processBlockquote(bq as HTMLElement);
            });
        });
    }

    /**
     * 启动 MutationObserver 监听 DOM 变化
     */
    private startObserver() {
        this.observer = new MutationObserver((mutations) => {
            const newBlockquotes: HTMLElement[] = [];
            
            for (const mutation of mutations) {
                // 处理新增的节点
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        
                        // 如果是 blockquote 本身
                        if (element.classList?.contains('bq')) {
                            newBlockquotes.push(element);
                        }
                        
                        // 如果包含 blockquote
                        const blockquotes = element.querySelectorAll?.('.bq[data-node-id]');
                        blockquotes?.forEach(bq => {
                            newBlockquotes.push(bq as HTMLElement);
                        });
                    }
                });

                // 处理属性变化
                if (mutation.type === 'attributes' && mutation.target) {
                    const element = mutation.target as HTMLElement;
                    if (element.classList?.contains('bq')) {
                        this.processBlockquote(element);
                    }
                }
            }
            
            // 处理新增的 blockquote
            if (newBlockquotes.length > 0) {
                // 去重
                const uniqueBlockquotes = [...new Set(newBlockquotes)];
                
                setTimeout(() => {
                    uniqueBlockquotes.forEach(bq => {
                        const nodeId = bq.getAttribute('data-node-id');
                        if (!nodeId) return;
                        
                        // 标记为已处理
                        this.processedBlocks.add(nodeId);
                        
                        // 如果不是初始加载 且 blockquote 是空的，触发回调显示菜单
                        if (!this.isInitialLoad && this.isBlockquoteEmpty(bq)) {
                            const rect = bq.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0 && this.onNewBlockquoteCreated) {
                                this.onNewBlockquoteCreated(bq);
                            }
                        }
                        
                        // 处理 blockquote
                        this.processBlockquote(bq);
                    });
                }, 50);
            }
        });

        // 监听整个文档
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['custom-callout-type', 'custom-callout-collapsed']
        });
    }

    /**
     * 处理单个 blockquote 元素
     */
    private async processBlockquote(blockquote: HTMLElement) {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) return;

        try {
            // 获取块属性
            const attrs = await getBlockAttrs(nodeId);
            const calloutType = attrs['custom-callout-type'];
            
            if (calloutType) {
                // 这是一个 callout
                this.applyCalloutStyle(blockquote, calloutType, attrs);
            } else {
                // 不是 callout，移除相关样式
                this.removeCalloutStyle(blockquote);
            }
        } catch (error) {
            logger.error('[ProcessorV2] 处理 blockquote 失败:', error);
        }
    }

    /**
     * 应用 callout 样式
     */
    private applyCalloutStyle(blockquote: HTMLElement, type: string, attrs: Record<string, string>) {
        const config = this.getTypeConfig(type);
        if (!config) {
            logger.warn('[ProcessorV2] 未知的 callout 类型:', type);
            return;
        }

        // 设置 DOM 属性（用于 CSS 选择器）
        blockquote.setAttribute('custom-callout', '');
        blockquote.setAttribute('custom-callout-type', type);
        
        // 设置折叠状态
        const collapsed = attrs['custom-callout-collapsed'] === 'true';
        if (collapsed) {
            blockquote.setAttribute('data-collapsed', 'true');
        } else {
            blockquote.removeAttribute('data-collapsed');
        }

        // 处理标题
        this.processCalloutTitle(blockquote, config, attrs);
        
        // 添加折叠按钮
        this.addCollapseButton(blockquote);
        
        // 隐藏内部段落的侧边栏按钮
        this.hideInnerGutterButtons(blockquote);
    }

    /**
     * 移除 callout 样式
     */
    private removeCalloutStyle(blockquote: HTMLElement) {
        blockquote.removeAttribute('custom-callout');
        blockquote.removeAttribute('custom-callout-type');
        blockquote.removeAttribute('data-collapsed');
        
        // 移除标题标记
        const titleDiv = blockquote.querySelector('[data-callout-title]');
        if (titleDiv) {
            titleDiv.removeAttribute('data-callout-title');
            const icon = titleDiv.querySelector('.callout-icon');
            icon?.remove();
        }
        
        // 移除折叠按钮
        const collapseBtn = blockquote.querySelector('.callout-collapse-button');
        collapseBtn?.remove();
        
        // 恢复内部段落的侧边栏按钮
        this.showInnerGutterButtons(blockquote);
    }

    /**
     * 处理 callout 标题
     */
    private processCalloutTitle(blockquote: HTMLElement, config: CalloutTypeConfig, attrs: Record<string, string>) {
        // 找到第一个段落作为标题
        const firstParagraph = blockquote.querySelector('div[data-type="NodeParagraph"]');
        if (!firstParagraph) return;

        const titleDiv = firstParagraph.querySelector('div[contenteditable]') as HTMLElement;
        if (!titleDiv) return;

        // 标记为标题
        titleDiv.setAttribute('data-callout-title', 'true');
        
        // 设置样式
        titleDiv.style.position = 'relative';
        titleDiv.style.paddingLeft = '28px';
        
        // 移除旧图标
        const oldIcon = titleDiv.querySelector('.callout-icon');
        oldIcon?.remove();

        // 先处理文本内容（不要用 textContent，它会清除所有子元素）
        // 获取纯文本（排除 HTML 元素）
        const getTextContent = (element: HTMLElement): string => {
            let text = '';
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent || '';
                }
            });
            return text.trim();
        };
        
        const currentText = getTextContent(titleDiv);
        
        // 如果文本为空，设置默认标题
        if (currentText === '') {
            const customTitle = attrs['custom-callout-title'];
            const defaultText = customTitle || config.displayName;
            
            // 清除现有文本节点，但保留其他元素
            Array.from(titleDiv.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.remove();
                }
            });
            
            // 添加新文本
            const textNode = document.createTextNode(defaultText);
            titleDiv.appendChild(textNode);
        }

        // 最后添加图标（确保在最前面）
        const icon = document.createElement('span');
        icon.className = 'callout-icon';
        icon.innerHTML = config.icon;
        icon.style.cssText = `
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            pointer-events: none;
        `;
        
        titleDiv.insertBefore(icon, titleDiv.firstChild);
    }

    /**
     * 添加折叠按钮
     */
    private addCollapseButton(blockquote: HTMLElement) {
        // 检查是否已存在
        if (blockquote.querySelector('.callout-collapse-button')) {
            return;
        }

        const button = document.createElement('button');
        button.className = 'callout-collapse-button';
        button.innerHTML = '▼';
        button.title = '展开/折叠';
        button.style.cssText = `
            position: absolute;
            right: 8px;
            top: 8px;
            width: 20px;
            height: 20px;
            border: none;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            z-index: 1;
        `;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCollapse(blockquote);
        });

        blockquote.style.position = 'relative';
        blockquote.appendChild(button);
    }

    /**
     * 切换折叠状态
     */
    private async toggleCollapse(blockquote: HTMLElement) {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) return;

        try {
            const attrs = await getBlockAttrs(nodeId);
            const isCollapsed = attrs['custom-callout-collapsed'] === 'true';
            
            // 更新块属性
            await setBlockAttrs(nodeId, {
                'custom-callout-collapsed': isCollapsed ? 'false' : 'true'
            });

            // 更新 DOM
            if (isCollapsed) {
                blockquote.removeAttribute('data-collapsed');
            } else {
                blockquote.setAttribute('data-collapsed', 'true');
            }

            // 更新按钮图标
            const button = blockquote.querySelector('.callout-collapse-button');
            if (button) {
                button.innerHTML = isCollapsed ? '▼' : '▶';
            }

            logger.log('[ProcessorV2] 切换折叠状态:', { nodeId, isCollapsed: !isCollapsed });
        } catch (error) {
            logger.error('[ProcessorV2] 切换折叠状态失败:', error);
        }
    }

    /**
     * 创建新的 callout
     */
    async createCallout(blockquote: HTMLElement, type: string, title?: string) {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) {
            logger.error('[ProcessorV2] blockquote 没有 data-node-id');
            return;
        }

        const config = this.getTypeConfig(type);
        if (!config) {
            logger.error('[ProcessorV2] 未知的 callout 类型:', type);
            return;
        }

        try {
            // 设置块属性
            const attrs: Record<string, string> = {
                'custom-callout-type': type
            };
            
            if (title) {
                attrs['custom-callout-title'] = title;
            }

            await setBlockAttrs(nodeId, attrs);

            // 应用样式
            this.applyCalloutStyle(blockquote, type, attrs);

            logger.log('[ProcessorV2] 创建 callout 成功:', { nodeId, type, title });
        } catch (error) {
            logger.error('[ProcessorV2] 创建 callout 失败:', error);
        }
    }

    /**
     * 删除 callout
     */
    async removeCallout(blockquote: HTMLElement) {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) return;

        try {
            // 移除块属性
            await setBlockAttrs(nodeId, {
                'custom-callout-type': '',
                'custom-callout-title': '',
                'custom-callout-collapsed': ''
            });

            // 移除样式
            this.removeCalloutStyle(blockquote);

            logger.log('[ProcessorV2] 删除 callout 成功:', nodeId);
        } catch (error) {
            logger.error('[ProcessorV2] 删除 callout 失败:', error);
        }
    }

    /**
     * 更新 callout 类型
     */
    async updateCalloutType(blockquote: HTMLElement, newType: string) {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) return;

        try {
            // 更新块属性
            await setBlockAttrs(nodeId, {
                'custom-callout-type': newType
            });

            // 重新应用样式
            const attrs = await getBlockAttrs(nodeId);
            this.applyCalloutStyle(blockquote, newType, attrs);

            logger.log('[ProcessorV2] 更新 callout 类型成功:', { nodeId, newType });
        } catch (error) {
            logger.error('[ProcessorV2] 更新 callout 类型失败:', error);
        }
    }

    /**
     * 检查一个 blockquote 是否是 callout
     */
    async isCallout(blockquote: HTMLElement): Promise<boolean> {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) return false;

        try {
            const attrs = await getBlockAttrs(nodeId);
            return !!attrs['custom-callout-type'];
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取 callout 的类型
     */
    async getCalloutType(blockquote: HTMLElement): Promise<string | null> {
        const nodeId = blockquote.getAttribute('data-node-id');
        if (!nodeId) return null;

        try {
            const attrs = await getBlockAttrs(nodeId);
            return attrs['custom-callout-type'] || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 检查 blockquote 是否为空
     */
    private isBlockquoteEmpty(blockquote: HTMLElement): boolean {
        const firstParagraph = blockquote.querySelector('div[data-type="NodeParagraph"]');
        if (!firstParagraph) return true;

        const contentDiv = firstParagraph.querySelector('div[contenteditable]');
        if (!contentDiv) return true;

        const text = contentDiv.textContent?.trim() || '';
        return text === '' || text === '\n';
    }

    /**
     * 隐藏 callout 内部段落的侧边栏拖拽按钮
     */
    private hideInnerGutterButtons(blockquote: HTMLElement) {
        // 获取 blockquote 内所有的子块（段落、列表等）
        const innerBlocks = blockquote.querySelectorAll('[data-node-id]');
        
        innerBlocks.forEach(block => {
            const nodeId = block.getAttribute('data-node-id');
            if (!nodeId) return;
            
            // 跳过 blockquote 本身
            if (block === blockquote) return;
            
            // 查找对应的侧边栏按钮
            const gutterButton = document.querySelector(
                `.protyle-gutters button[data-node-id="${nodeId}"]`
            ) as HTMLElement;
            
            if (gutterButton) {
                // 隐藏内部块的拖拽按钮
                gutterButton.style.display = 'none';
                gutterButton.setAttribute('data-callout-inner', 'true');
            }
        });
    }

    /**
     * 恢复 callout 内部段落的侧边栏拖拽按钮
     */
    private showInnerGutterButtons(blockquote: HTMLElement) {
        // 获取 blockquote 内所有的子块
        const innerBlocks = blockquote.querySelectorAll('[data-node-id]');
        
        innerBlocks.forEach(block => {
            const nodeId = block.getAttribute('data-node-id');
            if (!nodeId) return;
            
            // 跳过 blockquote 本身
            if (block === blockquote) return;
            
            // 查找对应的侧边栏按钮
            const gutterButton = document.querySelector(
                `.protyle-gutters button[data-node-id="${nodeId}"]`
            ) as HTMLElement;
            
            if (gutterButton && gutterButton.getAttribute('data-callout-inner') === 'true') {
                // 恢复显示
                gutterButton.style.display = '';
                gutterButton.removeAttribute('data-callout-inner');
            }
        });
    }
}

