/**
 * 自定义日志系统
 * 默认关闭，可通过控制台配置开启
 * 
 * 使用方法：
 * - 在控制台中开启日志: window.enableCalloutLog()
 * - 在控制台中关闭日志: window.disableCalloutLog()
 * - 检查日志状态: window.getCalloutLogStatus()
 */

class Logger {
    private enabled: boolean = false;
    private prefix: string = '[Custom Callout]';

    constructor() {
        // 将控制方法暴露到window对象
        if (typeof window !== 'undefined') {
            (window as any).enableCalloutLog = () => {
                this.enabled = true;
                console.log(`${this.prefix} 日志已开启 ✅`);
            };

            (window as any).disableCalloutLog = () => {
                this.enabled = false;
                console.log(`${this.prefix} 日志已关闭 ❌`);
            };

            (window as any).getCalloutLogStatus = () => {
                console.log(`${this.prefix} 日志状态: ${this.enabled ? '开启 ✅' : '关闭 ❌'}`);
                return this.enabled;
            };
        }
    }

    /**
     * 普通日志
     */
    log(...args: any[]) {
        if (this.enabled) {
            console.log(this.prefix, ...args);
        }
    }

    /**
     * 警告日志
     */
    warn(...args: any[]) {
        if (this.enabled) {
            console.warn(this.prefix, ...args);
        }
    }

    /**
     * 错误日志
     */
    error(...args: any[]) {
        if (this.enabled) {
            console.error(this.prefix, ...args);
        }
    }

    /**
     * 调试日志
     */
    debug(...args: any[]) {
        if (this.enabled) {
            console.debug(this.prefix, ...args);
        }
    }

    /**
     * 信息日志
     */
    info(...args: any[]) {
        if (this.enabled) {
            console.info(this.prefix, ...args);
        }
    }

    /**
     * 设置日志状态
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    /**
     * 获取日志状态
     */
    isEnabled(): boolean {
        return this.enabled;
    }
}

// 创建全局logger实例
export const logger = new Logger();

