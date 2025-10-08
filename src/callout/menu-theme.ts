/**
 * 菜单主题管理器
 */
export class MenuThemeManager {
    private isDarkMode: boolean = false;
    private observers: Set<(isDark: boolean) => void> = new Set();
    private mutationObserver: MutationObserver | null = null;

    constructor() {
        this.detectTheme();
        this.setupListeners();
    }

    /**
     * 检测当前主题
     */
    private detectTheme(): void {
        // 检测思源笔记的主题
        const siyuanTheme = document.documentElement.getAttribute('data-theme-mode') ||
                          document.documentElement.getAttribute('data-light') ||
                          document.body.getAttribute('data-theme-mode');
        
        if (siyuanTheme === 'dark') {
            this.isDarkMode = true;
            return;
        }

        // 检测常见的黑夜模式标记
        const bodyClasses = document.body.classList;
        const htmlClasses = document.documentElement.classList;
        
        this.isDarkMode = 
            bodyClasses.contains('theme--dark') ||
            bodyClasses.contains('dark') ||
            bodyClasses.contains('dark-mode') ||
            htmlClasses.contains('theme--dark') ||
            htmlClasses.contains('dark') ||
            htmlClasses.contains('dark-mode') ||
            document.documentElement.getAttribute('data-theme') === 'dark' ||
            document.body.getAttribute('data-theme') === 'dark' ||
            // 检测思源笔记特有的类名
            bodyClasses.contains('body--dark') ||
            // 系统偏好设置（最后检查）
            window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * 设置主题监听器
     */
    private setupListeners(): void {
        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            this.detectTheme();
            this.notifyObservers();
        });

        // 监听DOM变化
        this.mutationObserver = new MutationObserver(() => {
            const oldDarkMode = this.isDarkMode;
            this.detectTheme();
            if (oldDarkMode !== this.isDarkMode) {
                this.notifyObservers();
            }
        });

        // 监听body和html的属性变化
        this.mutationObserver.observe(document.body, { 
            attributes: true, 
            attributeFilter: ['class', 'data-theme', 'data-theme-mode', 'data-light'] 
        });
        
        this.mutationObserver.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['class', 'data-theme', 'data-theme-mode', 'data-light'] 
        });
    }

    /**
     * 通知所有观察者
     */
    private notifyObservers(): void {
        this.observers.forEach(callback => callback(this.isDarkMode));
    }

    /**
     * 订阅主题变化
     */
    subscribe(callback: (isDark: boolean) => void): () => void {
        this.observers.add(callback);
        // 返回取消订阅函数
        return () => {
            this.observers.delete(callback);
        };
    }

    /**
     * 获取当前是否为黑夜模式
     */
    isDark(): boolean {
        return this.isDarkMode;
    }

    /**
     * 销毁
     */
    destroy(): void {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        this.observers.clear();
    }
}

