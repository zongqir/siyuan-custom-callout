# Callout Dock 调试指南 🔍

## 日志系统已启用

Dock 面板现在默认启用了详细日志，可以帮助我们诊断问题。

## 如何查看日志

### 1. 打开开发者工具

**Windows/Linux**: 按 `F12` 或 `Ctrl + Shift + I`  
**macOS**: 按 `Cmd + Option + I`

### 2. 切换到 Console 标签

在开发者工具中点击 "Console" 标签

### 3. 查看日志输出

你会看到类似这样的日志：

```
[Callout Dock] 📋 日志已启用，开始调试...
[Custom Callout] [Dock] 🚀 Dock 面板挂载
[Custom Callout] [Dock] 📥 开始加载 Callouts...
[Custom Callout] [Dock] ✅ 找到活动标签: <div>...</div>
[Custom Callout] [Dock] ✅ 找到文档编辑区: <div>...</div>
[Custom Callout] [Dock] 📄 当前文档 ID: 20231008123456-abc123
[Custom Callout] [Dock] 🔍 开始查找 Callout 元素...
[Custom Callout] [Dock] 🎯 找到 3 个带 custom-callout 属性的引述块
...
```

## 日志说明

### 关键日志标识

| 图标 | 含义 | 说明 |
|-----|------|------|
| 📋 | 初始化 | Dock 面板开始启动 |
| 🚀 | 挂载 | Dock 面板已挂载到 DOM |
| 📥 | 加载开始 | 开始加载 Callout 数据 |
| ✅ | 成功 | 操作成功 |
| ⚠️ | 警告 | 需要注意的情况 |
| ❌ | 错误 | 操作失败 |
| 🔍 | 查找 | 正在查找元素 |
| 🎯 | 找到 | 找到目标元素 |
| 📊 | 统计 | 数据统计信息 |
| ⏭️ | 跳过 | 操作被跳过 |

### 完整日志流程

#### 正常流程
```
1. [Dock] 📥 开始加载 Callouts...
2. [Dock] ✅ 找到活动标签
3. [Dock] ✅ 找到文档编辑区
4. [Dock] 📄 当前文档 ID: xxx
5. [Dock] 🔍 开始查找 Callout 元素...
6. [Dock] 🎯 找到 N 个带 custom-callout 属性的引述块
7. [Dock] 🔍 解析第 1 个 Callout...
8. [Dock]   - callout 类型: info
9. [Dock]   - 查找配置: info → 找到
10. [Dock]   - 块 ID: xxx
11. [Dock]   - 折叠状态: false
12. [Dock]   - 标题元素: 找到
13. [Dock]   - 显示名称: 信息说明
14. [Dock]   - 段落数量: 3
15. [Dock]   - 内容预览: 这是内容...
16. [Dock] ✅ 解析成功: {id, type, title, ...}
17. [Dock] 📊 最终解析结果: N 个 Callout
18. [Dock] ✅ 加载完成，当前共有 N 个 Callout
```

#### 问题诊断

**问题 1: 未找到活动标签**
```
[Dock] ⚠️ 未找到活动的编辑器标签
```
→ 可能原因：没有打开的文档或编辑器未激活

**问题 2: 未找到文档编辑区**
```
[Dock] ⚠️ 未找到文档编辑区
```
→ 可能原因：文档未加载完成

**问题 3: 找不到 Callout**
```
[Dock] ⚠️ 未找到带 custom-callout 的引述块
[Dock] 📊 文档中共有 5 个引述块
[Dock] 引述块 1: {hasCustomCallout: false, customCallout: null, ...}
```
→ **关键问题**：引述块没有被处理成 Callout！

**问题 4: 类型配置未找到**
```
[Dock] ❌ 找不到类型配置: xxx
[Dock]   - 可用的类型: [info, concept, example, ...]
```
→ 可能原因：Callout 类型不匹配

## 调试步骤

### 步骤 1: 检查引述块是否存在

1. 打开一个包含 Callout 的文档
2. 查看控制台日志
3. 找到这行：
   ```
   [Dock] 📊 文档中共有 N 个引述块
   ```

**如果 N = 0**：文档中没有引述块，请先创建 Callout

### 步骤 2: 检查是否有 custom-callout 属性

查看日志：
```
[Dock] 引述块 1: {
    hasCustomCallout: false,  // ← 关键！
    customCallout: null,
    classes: "bq",
    id: "..."
}
```

**如果 hasCustomCallout = false**：
- 引述块没有被 CalloutProcessor 处理
- 可能原因：
  1. Callout 格式不正确
  2. CalloutProcessor 未运行
  3. 引述块是旧版格式

### 步骤 3: 检查 Callout 格式

正确格式示例：
```markdown
> [!info]
> 这是信息内容
```

常见错误：
- ❌ `>[!info]` - 缺少空格
- ❌ `> [ !info]` - 多余空格
- ❌ `> !info` - 缺少方括号
- ✅ `> [!info]` - 正确

### 步骤 4: 检查 CalloutProcessor

查看是否有 CalloutProcessor 的日志：
```
[Callout] 📝 匹配成功: [!info]
```

**如果没有**：CalloutProcessor 可能没有运行

### 步骤 5: 手动触发处理

在控制台运行：
```javascript
// 获取所有引述块
document.querySelectorAll('.bq').forEach(bq => {
    console.log('引述块:', {
        text: bq.textContent?.substring(0, 50),
        hasCustomCallout: bq.hasAttribute('custom-callout'),
        customCallout: bq.getAttribute('custom-callout')
    });
});
```

## 常见问题排查

### Q1: Dock 面板显示空白

**检查点：**
1. 查看日志是否有 `找到 0 个带 custom-callout 属性的引述块`
2. 检查引述块是否存在
3. 检查 Callout 格式是否正确

**解决方案：**
- 确保文档中有正确格式的 Callout
- 刷新页面重试
- 手动触发 Callout 处理

### Q2: 找到引述块但无法解析

**检查点：**
1. 查看 `callout 类型` 是否正确
2. 查看 `查找配置` 是否找到

**解决方案：**
- 检查类型名称是否正确（info, concept, example 等）
- 查看可用类型列表

### Q3: 部分 Callout 显示，部分不显示

**检查点：**
1. 查看每个 Callout 的解析日志
2. 找到失败的那个

**解决方案：**
- 检查失败的 Callout 格式
- 查看是否有特殊字符或编码问题

## 高级调试

### 启用全局日志

在控制台运行：
```javascript
// 启用所有 Callout 日志
window.enableCalloutLog()
```

### 检查 DOM 结构

在控制台运行：
```javascript
// 查看第一个引述块的完整信息
const bq = document.querySelector('.bq');
console.log('引述块完整信息:', {
    outerHTML: bq?.outerHTML,
    attributes: Array.from(bq?.attributes || []).map(a => ({
        name: a.name,
        value: a.value
    }))
});
```

### 手动测试解析

在控制台运行：
```javascript
// 获取 Dock 面板中的类型映射
const typeMap = new Map();
typeMap.set('info', {type: 'info', displayName: '信息说明'});
// ... 添加其他类型

// 测试解析
const bq = document.querySelector('.bq[custom-callout]');
const type = bq?.getAttribute('custom-callout');
console.log('类型:', type);
console.log('配置:', typeMap.get(type));
```

## 反馈问题

如果问题仍然存在，请提供以下信息：

1. **完整的控制台日志**
2. **Callout 的 markdown 源码**
3. **引述块的 DOM 结构**（右键检查元素）
4. **思源笔记版本**
5. **插件版本**

---

**开始调试，找出问题！** 🔍🐛

