/**
 * 菜单主题辅助函数
 * 统一处理主题切换逻辑
 */

import { MenuThemeManager } from './menu-theme';
import * as MenuStyles from './menu-styles';

/**
 * 主题辅助类
 */
export class MenuThemeHelper {
    private themeManager: MenuThemeManager;
    private unsubscribe?: () => void;

    constructor() {
        this.themeManager = new MenuThemeManager();
    }

    /**
     * 获取当前是否为黑夜模式
     */
    isDark(): boolean {
        return this.themeManager.isDark();
    }

    /**
     * 订阅主题变化，返回取消订阅函数
     */
    subscribe(callback: (isDark: boolean) => void): () => void {
        this.unsubscribe = this.themeManager.subscribe(callback);
        return this.unsubscribe;
    }

    /**
     * 刷新整个菜单的主题
     */
    refreshMenuTheme(menu: HTMLElement) {
        if (!menu) return;

        const isDark = this.isDark();
        console.log('[MenuTheme] 刷新菜单主题:', isDark ? '黑夜' : '白天');

        // 1. 更新主容器
        menu.style.cssText = MenuStyles.getMenuContainerStyle(isDark);

        // 2. 更新关闭按钮
        const closeBtn = menu.querySelector('[data-menu-close]') as HTMLElement;
        if (closeBtn) {
            closeBtn.style.cssText = MenuStyles.getCloseButtonStyle(isDark);
        }

        // 3. 更新标题
        const header = menu.querySelector('[data-menu-header]') as HTMLElement;
        if (header) {
            header.style.cssText = MenuStyles.getHeaderStyle(isDark);
        }

        // 4. 更新过滤输入框
        const filterInput = menu.querySelector('[data-filter-input]') as HTMLElement;
        if (filterInput) {
            const display = filterInput.style.display;
            filterInput.style.cssText = MenuStyles.getFilterInputContainerStyle(isDark, display);
            
            const wrapper = filterInput.querySelector('[data-filter-wrapper]') as HTMLElement;
            if (wrapper) {
                wrapper.style.cssText = MenuStyles.getFilterInputWrapperStyle(isDark);
            }

            const text = filterInput.querySelector('[data-filter-text]') as HTMLElement;
            if (text) {
                text.style.cssText = MenuStyles.getFilterInputTextStyle(isDark);
            }

            const hint = filterInput.querySelector('[data-filter-hint]') as HTMLElement;
            if (hint) {
                hint.style.cssText = MenuStyles.getFilterInputHintStyle(isDark);
            }
        }

        // 5. 更新所有菜单项
        const menuItems = menu.querySelectorAll('[data-menu-item]') as NodeListOf<HTMLElement>;
        menuItems.forEach(item => {
            const command = item.getAttribute('data-command') || '';
            const options = { command };
            item.style.cssText = MenuStyles.getMenuItemStyle(isDark, options);

            const title = item.querySelector('.menu-item-title') as HTMLElement;
            if (title) title.style.color = MenuStyles.getMenuItemTitleColor(isDark);

            const cmdText = item.querySelector('.menu-item-command') as HTMLElement;
            if (cmdText) cmdText.style.color = MenuStyles.getMenuItemCommandColor(isDark);
        });

        // 6. 更新底部提示
        const footer = menu.querySelector('[data-menu-footer]') as HTMLElement;
        if (footer) {
            footer.style.cssText = MenuStyles.getFooterStyle(isDark);
        }

        // 7. 更新筛选行
        const filterRows = menu.querySelectorAll('[data-filter-row]') as NodeListOf<HTMLElement>;
        filterRows.forEach(row => {
            row.style.cssText = MenuStyles.getFilterRowStyle(isDark);

            const placeholders = row.querySelectorAll('[data-placeholder]') as NodeListOf<HTMLElement>;
            placeholders.forEach(ph => {
                ph.style.cssText = MenuStyles.getPlaceholderStyle(isDark);
            });
        });
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.themeManager.destroy();
    }
}

