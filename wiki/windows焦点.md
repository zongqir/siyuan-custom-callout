# 获取激活Tab编辑区域并解析的实现逻辑

**基于真实代码提取** - 来源：key-info-navigator插件

## 核心API和实现流程

### 1. 获取当前激活的编辑器

**使用的思源API：** `getAllEditor()`

**代码位置：** `src/modules/utils/EditorUtils.ts`

```typescript
import { getAllEditor } from "siyuan";

/**
 * 获取当前活跃的编辑器
 * 优先级：焦点编辑器 > 可见编辑器 > 第一个有效编辑器
 */
function getCurrentActiveEditor(): any {
    const editors = getAllEditor();
    
    console.log(`获取到 ${editors.length} 个编辑器`);
    
    if (editors.length === 0) {
        return null;
    }
    
    // 如果只有一个编辑器，直接返回
    if (editors.length === 1) {
        console.log('只有一个编辑器，直接使用');
        return editors[0];
    }
    
    // 策略1: 尝试找到具有焦点的编辑器
    for (const editor of editors) {
        if (editor?.protyle?.element?.contains(document.activeElement)) {
            console.log('找到具有焦点的编辑器');
            return editor;
        }
    }
    
    // 策略2: 尝试找到可见的编辑器（通过检查 element 的可见性）
    for (const editor of editors) {
        if (editor?.protyle?.element) {
            const rect = editor.protyle.element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                console.log('找到可见的编辑器');
                return editor;
            }
        }
    }
    
    // 策略3: 如果都没找到，返回第一个有效的编辑器
    console.log('使用第一个有效的编辑器作为备选');
    return editors.find(editor => editor?.protyle?.block) || editors[0];
}
```

### 2. 从编辑器获取文档信息

```typescript
/**
 * 获取编辑器的文档ID
 */
function getEditorBlockId(editor: any): string | null {
    return editor?.protyle?.block?.rootID || null;
}

/**
 * 检查编辑器是否有效
 */
function isValidEditor(editor: any): boolean {
    return !!(editor?.protyle?.block);
}

/**
 * 检查编辑器是否可见
 */
function isEditorVisible(editor: any): boolean {
    if (!editor?.protyle?.element) {
        return false;
    }
    
    const rect = editor.protyle.element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

/**
 * 检查编辑器是否有焦点
 */
function isEditorFocused(editor: any): boolean {
    return !!(editor?.protyle?.element?.contains(document.activeElement));
}
```

### 3. 解析编辑器内容

#### 方法A: 通过SQL查询数据库（推荐）

**代码位置：** `src/modules/formatProcessor/TextFormatParser.ts`

**⚠️ 重要：** 代码中注释说明 `fetchPost` 有问题，必须使用原生 `fetch`

```typescript
/**
 * 从数据库查询格式化文本（spans表）
 * 来源：TextFormatParser.querySpans() 和 buildSqlQuery()
 */
async function queryFormattedTexts(rootBlockId: string): Promise<any[]> {
    // spans表的type格式：
    // - "textmark strong" (加粗)
    // - "textmark em" (斜体)  
    // - "textmark u" (下划线)
    // - "textmark mark" (高亮)
    // - "inline-memo" (备注)
    // - "tag" (标签)
    
    // 使用 LIKE 匹配，支持多格式合并（如 "textmark strong inline-memo"）
    const typeConditions = [
        "type LIKE '%textmark strong%'",
        "type LIKE '%textmark em%'",
        "type LIKE '%textmark u%'",
        "type LIKE '%textmark mark%'",
        "type LIKE '%inline-memo%'",
        "type LIKE '%tag%'"
    ].join(" OR ");
    
    const stmt = `
        SELECT *
        FROM spans
        WHERE root_id = "${rootBlockId}"
          AND (${typeConditions})
        LIMIT 200
    `.trim();
    
    try {
        // 【重要】使用原生 fetch，不是 fetchPost（fetchPost 有问题）
        const fetchResponse = await fetch('/api/query/sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stmt })
        });
        const response = await fetchResponse.json();
        
        if (!response) {
            console.error('❌ SQL查询无响应');
            return [];
        }
        
        if (response.code !== 0) {
            console.error('❌ SQL查询失败:', response);
            return [];
        }
        
        // 确保response.data是有效数组
        if (!response.data || !Array.isArray(response.data)) {
            console.error('❌ SQL查询返回无效数据:', response.data);
            return [];
        }
        
        console.log('✅ 查询到', response.data.length, '个格式化文本');
        return response.data;
        
    } catch (error) {
        console.error('❌ SQL查询异常:', error);
        return [];
    }
}

/**
 * 查询待办事项块（blocks表）
 * 来源：TextFormatParser.queryTodoBlocks()
 */
async function queryTodoBlocks(rootBlockId: string): Promise<any[]> {
    const stmt = `
        SELECT *
        FROM blocks
        WHERE root_id = "${rootBlockId}"
          AND type = "i"
          AND subtype = "t"
        ORDER BY created ASC
        LIMIT 200
    `.trim();
    
    try {
        // 【重要】使用原生 fetch（fetchPost 有问题，返回 undefined）
        const fetchResponse = await fetch('/api/query/sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stmt })
        });
        const response = await fetchResponse.json();
        
        if (!response) {
            console.error('Todo块查询无响应');
            return [];
        }
        
        if (response.code !== 0) {
            console.error('Todo块查询失败:', response);
            return [];
        }
        
        // 确保response.data是有效数组
        if (!response.data || !Array.isArray(response.data)) {
            console.error('Todo块查询返回无效数据:', response.data);
            return [];
        }
        
        return response.data;
        
    } catch (error) {
        console.error('Todo块查询异常:', error);
        return [];
    }
}
```

#### 方法B: 通过DOM解析（备用方案）

```typescript
/**
 * 从编辑器DOM中解析格式化文本
 */
function parseFromEditorDOM(editor: any): any[] {
    if (!editor?.protyle?.wysiwyg?.element) {
        console.log('编辑器元素不可用');
        return [];
    }
    
    const editorElement = editor.protyle.wysiwyg.element;
    const results = [];
    
    // 解析加粗文本
    const boldElements = editorElement.querySelectorAll('strong');
    boldElements.forEach((el: HTMLElement) => {
        results.push({
            type: 'bold',
            text: el.textContent?.trim(),
            element: el
        });
    });
    
    // 解析斜体文本
    const italicElements = editorElement.querySelectorAll('em');
    italicElements.forEach((el: HTMLElement) => {
        results.push({
            type: 'italic',
            text: el.textContent?.trim(),
            element: el
        });
    });
    
    // 解析下划线
    const underlineElements = editorElement.querySelectorAll('u');
    underlineElements.forEach((el: HTMLElement) => {
        results.push({
            type: 'underline',
            text: el.textContent?.trim(),
            element: el
        });
    });
    
    // 解析高亮
    const highlightElements = editorElement.querySelectorAll('mark');
    highlightElements.forEach((el: HTMLElement) => {
        results.push({
            type: 'highlight',
            text: el.textContent?.trim(),
            element: el
        });
    });
    
    // 解析标签
    const tagElements = editorElement.querySelectorAll('span[data-type="tag"]');
    tagElements.forEach((el: HTMLElement) => {
        results.push({
            type: 'tag',
            text: el.textContent?.trim(),
            element: el
        });
    });
    
    // 解析备注
    const memoElements = editorElement.querySelectorAll('span[data-type="inline-memo"]');
    memoElements.forEach((el: HTMLElement) => {
        results.push({
            type: 'memo',
            text: el.textContent?.trim(),
            element: el,
            memoContent: el.getAttribute('data-inline-memo-content')
        });
    });
    
    return results;
}
```

### 4. 完整使用示例

**代码位置：** `src/modules/formattedTextDock/FormattedTextDock.ts` (refresh方法) 和 `src/modules/formatProcessor/TextFormatParser.ts` (parseFormattedTexts方法)

```typescript
import { getAllEditor } from "siyuan";

/**
 * 完整的获取和解析流程
 * 来源：FormattedTextDock.refresh() 和 TextFormatParser.parseFormattedTexts()
 */
async function getActiveTabContentAndParse() {
    // 步骤1: 获取当前激活的编辑器
    const editor = getCurrentActiveEditor(console.log);
    
    if (!editor?.protyle?.block) {
        console.log('没有找到有效的编辑器');
        return null;
    }
    
    // 步骤2: 获取文档ID
    const blockId = editor.protyle.block.rootID;
    
    if (!blockId) {
        console.log('无法获取文档ID');
        return null;
    }
    
    console.log('当前文档ID:', blockId);
    
    // 步骤3: 解析内容（真实代码的实现方式）
    const allItems = [];
    
    // 3.1 查询Todo块
    const todoItems = await queryTodoBlocks(blockId, 200);
    allItems.push(...todoItems);
    
    // 3.2 查询spans（所有格式化文本）
    const spanItems = await queryFormattedTexts(blockId);
    allItems.push(...spanItems);
    
    // 3.3 这里可以添加排序逻辑（原代码使用了SorterFactory）
    // const sortedItems = await sorter.sort(allItems);
    
    console.log(`总共获取到 ${allItems.length} 个格式化文本项`);
    
    return {
        editor,
        blockId,
        allItems,
        todoItems,
        spanItems
    };
}

// 使用示例
async function main() {
    const result = await getActiveTabContentAndParse();
    
    if (result) {
        console.log('解析结果:', result);
        console.log('格式化文本总数:', result.allItems.length);
        console.log('待办事项数量:', result.todoItems.length);
        console.log('Spans数量:', result.spanItems.length);
    }
}
```

## 关键编辑器对象结构

```typescript
// 编辑器对象的结构
interface Editor {
    protyle: {
        element: HTMLElement;           // 编辑器的DOM元素
        block: {
            rootID: string;             // 文档根块ID
        };
        wysiwyg: {
            element: HTMLElement;       // 编辑器内容区域的DOM元素
        };
    };
}
```

## 数据库表结构参考

### spans表（格式化文本）
- `root_id`: 文档根块ID
- `block_id`: 所在块ID
- `type`: 格式类型（如 "textmark strong", "textmark em", "inline-memo"等）
- `content`: 文本内容
- `start_offset`: 起始位置
- `end_offset`: 结束位置

### blocks表（块信息）
- `root_id`: 文档根块ID
- `id`: 块ID
- `type`: 块类型（"i" 表示列表项）
- `subtype`: 子类型（"t" 表示待办）
- `content`: 块内容
- `created`: 创建时间

## 注意事项

1. **获取编辑器优先级**：焦点 > 可见 > 第一个有效
2. **SQL查询更可靠**：比DOM解析更准确，性能更好
3. **错误处理**：需要检查编辑器、文档ID、查询结果的有效性
4. **异步处理**：SQL查询是异步的，需要使用 async/await
5. **API路径**：`/api/query/sql` 是思源的SQL查询接口

## ⚠️ 从真实代码中提取的关键要点

### 1. 必须使用原生fetch，不要用fetchPost
```typescript
// ❌ 错误：不要使用 fetchPost（代码注释说它有问题）
// const response = await fetchPost('/api/query/sql', { stmt });

// ✅ 正确：使用原生 fetch
const fetchResponse = await fetch('/api/query/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stmt })
});
const response = await fetchResponse.json();
```

### 2. SQL查询的type条件必须用LIKE
```typescript
// spans表的type字段可能包含多个格式，如 "textmark strong inline-memo"
// 所以必须使用 LIKE 匹配，不能用等号

// ❌ 错误
WHERE type = "textmark strong"

// ✅ 正确  
WHERE type LIKE '%textmark strong%'
```

### 3. 响应格式验证很重要
```typescript
// 真实代码中有完整的验证逻辑
if (!response) {
    console.error('无响应');
    return [];
}

if (response.code !== 0) {
    console.error('查询失败:', response);
    return [];
}

if (!response.data || !Array.isArray(response.data)) {
    console.error('返回无效数据:', response.data);
    return [];
}
```

### 4. 编辑器对象的完整路径
```typescript
// 获取编辑器
const editor = getAllEditor()[0];

// 获取文档ID（完整路径）
const blockId = editor?.protyle?.block?.rootID;

// 获取编辑器DOM元素
const editorElement = editor?.protyle?.element;

// 获取编辑器内容区域
const contentElement = editor?.protyle?.wysiwyg?.element;
```

## 实际应用场景

- 提取文档中的所有加粗、斜体、高亮等格式化文本
- 获取文档中的所有标签
- 提取文档中的所有待办事项
- 构建文档导航或索引
- 实现格式化文本的快速定位和跳转
- 批量处理格式化内容
- 文档内容分析和统计

