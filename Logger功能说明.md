# 自定义日志系统 - 功能说明

## ✅ 已完成的修改

1. **创建了自定义日志模块** (`src/libs/logger.ts`)
   - 默认全局关闭所有日志
   - 支持动态开启/关闭
   - 统一的日志前缀

2. **替换了所有console调用**
   - `src/index.ts` - 主入口文件
   - `src/callout/processor.ts` - 核心处理器
   - `src/callout/menu.ts` - 菜单管理
   - `src/callout/autocomplete.ts` - 自动补全
   - `src/callout/config.ts` - 配置管理
   - `src/libs/setting-utils.ts` - 设置工具（注释掉debug日志）
   - `src/callout/themes/utils.ts` - 主题工具（注释掉错误日志）

3. **提供控制台API**
   - `window.enableCalloutLog()` - 开启日志
   - `window.disableCalloutLog()` - 关闭日志
   - `window.getCalloutLogStatus()` - 查看状态

## 📖 使用方法

### 用户使用

1. 打开浏览器开发者工具（按 F12）
2. 切换到 Console 控制台
3. 输入以下命令：

```javascript
// 开启日志
window.enableCalloutLog()

// 关闭日志
window.disableCalloutLog()

// 查看状态
window.getCalloutLogStatus()
```

### 开发者使用

在代码中导入并使用 logger：

```typescript
import { logger } from './libs/logger';

// 记录日志
logger.log('操作信息');
logger.warn('警告信息');
logger.error('错误信息');
logger.debug('调试信息');
logger.info('提示信息');
```

## 🎯 特点

- ✅ **默认关闭**：不影响生产环境性能
- ✅ **动态控制**：无需重启，控制台即可开关
- ✅ **统一管理**：所有日志都有统一前缀 `[Custom Callout]`
- ✅ **完整支持**：支持 log、warn、error、debug、info 所有级别
- ✅ **零侵入**：使用简单，与原 console API 一致

## 🔧 技术实现

- 使用单例模式创建全局 logger 实例
- 通过 window 对象暴露控制方法
- 内部通过 enabled 标志控制是否输出

## 📝 注意事项

1. 日志状态在页面刷新后会重置为关闭
2. 建议仅在开发和调试时开启日志
3. 生产环境保持日志关闭以获得最佳性能

## 🧪 验证

已通过构建测试，无编译错误：
```bash
npm run build
✓ built in 947ms
```

