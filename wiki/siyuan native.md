# 思源原生 Callout 功能设计说明（面向资源插件的对齐参考）

> 本文档用于说明 **思源原生 Callout（NodeCallout）** 的设计与行为，方便资源插件在实现 Callout 时与原生体验保持一致，或进行兼容适配。

---

## 1. 功能概览

- Callout 是一种 **块级容器块**，在思源内核中对应类型为 `NodeCallout`。
- 语义上与 Blockquote（引用块，`NodeBlockquote`）类似，但具备以下特性：
  - 有 **类型（Subtype）** 概念（NOTE / TIP / IMPORTANT / WARNING / CAUTION 等）。
  - 带有 **图标 + 标题区**（icon + title）。
  - 内部实际内容被包裹在 `.callout-content` 容器中。
- Callout 已被纳入：
  - 搜索过滤类型。
  - 图谱类型过滤。
  - 批量替换类型筛选。
- 前端编辑器 Protyle 对 Callout 做了独立支持（创建、转换、取消、键盘导航等）。

---

## 2. 内核层设计概览

### 2.1 块类型与缩写映射

文件：`kernel/treenode/node.go`

内核通过 `typeAbbrMap` / `abbrTypeMap` 维护块类型与缩写的映射，其中包括 Callout：

```go
var typeAbbrMap = map[string]string{
    // 块级元素
    "NodeDocument":         "d",
    "NodeHeading":          "h",
    "NodeList":             "l",
    "NodeListItem":         "i",
    "NodeCodeBlock":        "c",
    "NodeMathBlock":        "m",
    "NodeTable":            "t",
    "NodeBlockquote":       "b",
    "NodeSuperBlock":       "s",
    "NodeParagraph":        "p",
    "NodeHTMLBlock":        "html",
    "NodeBlockQueryEmbed":  "query_embed",
    "NodeAttributeView":    "av",
    "NodeKramdownBlockIAL": "ial",
    "NodeIFrame":           "iframe",
    "NodeWidget":           "widget",
    "NodeThematicBreak":    "tb",
    "NodeVideo":            "video",
    "NodeAudio":            "audio",
    "NodeCallout":          "callout", // Callout 的缩写
    // 行级元素略……
}
```

要点：

- **存储和检索层面**，Callout 用 `"callout"` 作为类型缩写。
- 搜索、图谱、SQL 查询、引用生成等功能都会用到这个缩写。

### 2.2 搜索配置中的 Callout

文件：`kernel/conf/search.go`

```go
type Search struct {
    Document      bool `json:"document"`
    Heading       bool `json:"heading"`
    List          bool `json:"list"`
    ListItem      bool `json:"listItem"`
    CodeBlock     bool `json:"codeBlock"`
    MathBlock     bool `json:"mathBlock"`
    Table         bool `json:"table"`
    Blockquote    bool `json:"blockquote"`
    SuperBlock    bool `json:"superBlock"`
    Paragraph     bool `json:"paragraph"`
    HTMLBlock     bool `json:"htmlBlock"`
    EmbedBlock    bool `json:"embedBlock"`
    DatabaseBlock bool `json:"databaseBlock"`
    AudioBlock    bool `json:"audioBlock"`
    VideoBlock    bool `json:"videoBlock"`
    IFrameBlock   bool `json:"iframeBlock"`
    WidgetBlock   bool `json:"widgetBlock"`
    Callout       bool `json:"callout"` // 是否包含 Callout
    ...
}
```

- 默认配置中 `NewSearch()` 将 `Callout` 初始化为 `false`。
- `kernel/model/search.go` 的 `buildTypeFilter` 会结合前端传入的类型过滤，将 `Callout` 标志带入 SQL 查询条件。

前端对应：

- `app/src/search/getDefault.ts` 和 `app/src/types/config.d.ts` 中有 `callout` 字段，用于前端配置和 UI 状态同步。

### 2.3 图谱配置中的 Callout

文件：`kernel/conf/graph.go`

```go
type TypeFilter struct {
    Tag        bool `json:"tag"`
    Paragraph  bool `json:"paragraph"`
    Heading    bool `json:"heading"`
    Math       bool `json:"math"`
    Code       bool `json:"code"`
    Table      bool `json:"table"`
    List       bool `json:"list"`
    ListItem   bool `json:"listItem"`
    Blockquote bool `json:"blockquote"`
    Super      bool `json:"super"`
    Callout    bool `json:"callout"` // 图谱中是否显示 Callout
}
```

在 `kernel/model/graph.go` 中：

```go
callout := Conf.Graph.Local.Callout
if !local {
    callout = Conf.Graph.Global.Callout
}
if callout {
    inList = append(inList, "'callout'")
}
```

- 当开启 Callout 类型时，图谱查询会把 `"callout"` 类型的块纳入节点范围。

### 2.4 批量替换 / 存储配置中的 Callout

文件：`kernel/model/storage.go`

```go
type CriterionTypes struct {
    MathBlock     bool `json:"mathBlock"`
    Table         bool `json:"table"`
    Blockquote    bool `json:"blockquote"`
    SuperBlock    bool `json:"superBlock"`
    Paragraph     bool `json:"paragraph"`
    Document      bool `json:"document"`
    Heading       bool `json:"heading"`
    List          bool `json:"list"`
    ListItem      bool `json:"listItem"`
    CodeBlock     bool `json:"codeBlock"`
    HtmlBlock     bool `json:"htmlBlock"`
    EmbedBlock    bool `json:"embedBlock"`
    DatabaseBlock bool `json:"databaseBlock"`
    AudioBlock    bool `json:"audioBlock"`
    VideoBlock    bool `json:"videoBlock"`
    IFrameBlock   bool `json:"iframeBlock"`
    WidgetBlock   bool `json:"widgetBlock"`
    Callout       bool `json:"callout"` // 批量替换时可按 Callout 筛选
}
```

### 2.5 数据库排序中的 Callout 权重

文件：`kernel/sql/database.go`

```go
func nSort(n *ast.Node) int {
    ...
    case ast.NodeBlockquote:
        return 20
    case ast.NodeCallout:
        return 20
    case ast.NodeSuperBlock:
        return 30
    ...
}
```

- Callout 在排序权重上与 Blockquote 相同，属于中间优先级。

---

## 3. 前端 DOM 结构与类型定义

### 3.1 标准 DOM 结构

文件：`app/src/protyle/wysiwyg/transaction.ts`（`Blocks2Callout`）

当把一批块转换为 Callout 时，生成的 DOM 示例：

```html
<div class="callout"
     data-node-id="{id}"
     data-type="NodeCallout"
     data-subtype="NOTE"
     contenteditable="false">
  <div class="callout-info">
    <span class="callout-icon">✏️</span>
    <span class="callout-title">Note</span>
  </div>
  <div class="callout-content">
    <!-- 被包裹的内容块（段落/列表/…）插入于此 -->
  </div>
  <div class="protyle-attr" contenteditable="false">
    <!-- ZWSP 等 -->
  </div>
</div>
```

要点：

- 外层容器：
  - `class="callout"`
  - `data-type="NodeCallout"`
  - `data-node-id`：对应内核块 ID。
  - `data-subtype`：Callout 类型，默认 `"NOTE"`（大写）。
  - `contenteditable="false"`：容器本身不可编辑，内容在内部块中编辑。
- `callout-info`：
  - 包含 `.callout-icon`：图标（emoji 或 `<img>`）。
  - 包含 `.callout-title`：标题文本（Note / Tip / …）。
- `callout-content`：
  - 所有实际内容块（p / list / code 等）均作为子元素存放。
- `protyle-attr`：
  - 与其他块一致，用于属性按钮等扩展，不参与内容编辑。

### 3.2 前端类型声明

文件：`app/src/types/protyle.d.ts`

```ts
type TTurnIntoOne =
    "BlocksMergeSuperBlock" |
    "Blocks2ULs" |
    "Blocks2OLs" |
    "Blocks2TLs" |
    "Blocks2Blockquote" |
    "Blocks2Callout"; // 一键转换为 Callout 容器块
```

- Callout 与 Blockquote/列表一样，属于"容器类块"，参与统一的批量转换操作。

---

## 4. Callout 的创建、转换与取消

### 4.1 批量转换为 Callout（Blocks2Callout）

文件：`app/src/protyle/wysiwyg/transaction.ts`

逻辑概要：

1. 创建 Callout 容器：

   ```ts
   parentElement = document.createElement("div");
   parentElement.classList.add("callout");
   parentElement.setAttribute("data-node-id", id);
   parentElement.setAttribute("data-type", "NodeCallout");
   parentElement.setAttribute("contenteditable", "false");
   parentElement.setAttribute("data-subtype", "NOTE");
   parentElement.innerHTML = `
     <div class="callout-info">
       <span class="callout-icon">✏️</span>
       <span class="callout-title">Note</span>
     </div>
     <div class="callout-content"></div>
     <div class="protyle-attr" contenteditable="false">${Constants.ZWSP}</div>`;
   ```

2. 遍历选中的块 `options.selectsElement`：
   - 为每个块构造 `move` 操作，将其 `parentID` 设置为新 Callout 的块 ID。
   - 实际 DOM 中，将这些块插入到 `.callout-content` 末尾：

   ```ts
   parentElement.querySelector(".callout-content").insertAdjacentElement("beforeend", item);
   ```

3. 构造对应的 Undo 操作，支持撤销。

**结论：**

> 原生 Callout 的本质是一个"**容器块 + 内部子块**"的结构，并不是简单的样式包装。

### 4.2 从 Blockquote 自动识别 Callout 语法（Markdown 侧）

文件：`app/src/protyle/wysiwyg/enter.ts`

当在引用块 `.bq` 中输入特定语法后回车，会自动转换为 Callout：

```ts
if (currentElement.parentElement.classList.contains("bq") &&
    currentElement.parentElement.childElementCount > 2 &&
    currentElement.previousElementSibling.classList.contains("p") &&
    currentElement.classList.contains("p") &&
    currentElement.previousElementSibling.textContent.startsWith("[!") &&
    parentHTML) {

    const parentId = currentElement.parentElement.getAttribute("data-node-id");
    const calloutHTML = protyle.lute.SpinBlockDOM(currentElement.parentElement.outerHTML);

    if (calloutHTML.indexOf('data-type="NodeCallout"') > -1) {
        currentElement.parentElement.outerHTML = calloutHTML;
        mathRender(protyle.wysiwyg.element);
        updateTransaction(protyle, parentId, calloutHTML, parentHTML);
        focusByWbr(protyle.wysiwyg.element, range);
        scrollCenter(protyle);
        return true;
    }
}
```

说明：

- Callout 的 Markdown 语法基于 Blockquote，例如类似：

  ```markdown
  > [!NOTE] 标题
  > 内容……
  ```

- 具体语法由 Lute（Markdown 引擎）处理，`SpinBlockDOM` 会把引用块 DOM 识别并转换为 `NodeCallout` DOM。
- 前端只负责检测 `[!` 前缀并调用引擎做转换。

### 4.3 取消 Callout（还原为普通块结构）

文件：`app/src/protyle/wysiwyg/keydown.ts`

在某些快捷键下，如果当前选中块为 `NodeCallout`，会触发取消操作：

```ts
} else if (type === "NodeCallout") {
    turnsOneInto({
        protyle,
        nodeElement: selectsElement[0],
        id: selectsElement[0].getAttribute("data-node-id"),
        type: "CancelCallout",
    });
}
```

- `CancelCallout` 会把 `.callout-content` 中的块"拉出来"，删除 Callout 容器。
- 具体实现细节略，但可以把它看作：**Callout → 若干普通块** 的反向转换。

---

## 5. 编辑行为与键盘交互

### 5.1 Enter：从 Callout 中"退出"

文件：`app/src/protyle/wysiwyg/enter.ts`

对 Blockquote / Callout 使用统一逻辑：

```ts
// bq || callout
const isCallout = blockElement.parentElement.classList.contains("callout-content");
const parentBlockElement = isCallout ? blockElement.parentElement.parentElement : blockElement.parentElement;

if (editableElement.textContent.replace(Constants.ZWSP, "").replace("\n", "") === "" &&
    ((blockElement.nextElementSibling && blockElement.nextElementSibling.classList.contains("protyle-attr") &&
            blockElement.parentElement.getAttribute("data-type") === "NodeBlockquote") ||
        (isCallout && !blockElement.nextElementSibling))) {
    // 空块 + 特定位置 → 从容器中"跳出"
    ...
}
```

行为：

- 当光标所在块为空，且：
  - Blockquote：后面紧跟 `.protyle-attr`。
  - Callout：该块是 `.callout-content` 中最后一个子块。
- 按 Enter：
  - 在容器之后插入一个新块。
  - 当前块从容器中移出（同时可能删除空容器）。

这与 Markdown 中"空行退出引用/列表"的习惯是一致的。

### 5.2 方向键：从 Callout 尾部跳出

文件：`app/src/protyle/wysiwyg/keydown.ts`

```ts
if (event.key === "ArrowDown" &&
    nodeEditableElement?.innerText.trimRight().substr(position.start).indexOf("\n") === -1 && (
        ...
        (nodeElement.parentElement.getAttribute("data-type") === "NodeBlockquote" && ...) ||
        (nodeElement.parentElement.classList.contains("callout-content") &&
         !nodeElement.nextElementSibling &&
         !getNextBlock(nodeElement.parentElement.parentElement))
    )) {

    if (nodeElement.parentElement.getAttribute("data-type") === "NodeBlockquote") {
        insertEmptyBlock(protyle, "afterend", nodeElement.parentElement.getAttribute("data-node-id"));
    } else if (nodeElement.parentElement.classList.contains("callout-content")) {
        insertEmptyBlock(protyle, "afterend", nodeElement.parentElement.parentElement.getAttribute("data-node-id"));
    } else {
        insertEmptyBlock(protyle, "afterend", nodeElement.getAttribute("data-node-id"));
    }
}
```

- 当光标在 Callout 最后一行末尾按 ↓：
  - 会在整个 Callout 之后插入一个新块，光标跳出 Callout。

### 5.3 Delete/Backspace：从 Callout 中"拉出"首块

文件：`app/src/protyle/wysiwyg/remove.ts`

```ts
const isCallout = blockElement.parentElement.classList.contains("callout-content");
if (!blockElement.previousElementSibling &&
    (blockElement.parentElement.getAttribute("data-type") === "NodeBlockquote" || isCallout)) {

    const blockParentElement = isCallout ? blockElement.parentElement.parentElement : blockElement.parentElement;
    blockParentElement.insertAdjacentElement("beforebegin", blockElement);

    if (isCallout ? blockParentElement.querySelector(".callout-content").childElementCount === 0 :
        blockParentElement.childElementCount === 1) {
        // 容器已空 → 删除整个容器块
        transaction(protyle, [...], [...]);
    }
}
```

- 如果当前块是 `.callout-content` 中的 **第一个子块**：
  - Delete/Backspace 会把它"拉出" Callout，放到 Callout 前。
  - 若 Callout 内不再有内容，则删除 Callout 容器本身。

### 5.4 辅助函数中的 Callout 处理

文件：`app/src/protyle/wysiwyg/getBlock.ts`

- 获取父块时，对 Callout 做特殊处理：

  ```ts
  export const getParentBlock = (element: Element) => {
      if (element.parentElement.classList.contains("callout-content")) {
          return element.parentElement.parentElement; // 返回外层 Callout 块
      }
      return element.parentElement;
  };
  ```

- 获取 Callout 简要信息：

  ```ts
  export const getCalloutInfo = (element: Element) => {
      const icon = element.querySelector(".callout-icon").textContent;
      return (icon ? icon + " " : "") + element.querySelector(".callout-title").textContent;
  };
  ```

- 在寻找"顶层空元素"时，避免误把 `.callout-content` 当作可合并目标：

  ```ts
  export const getTopEmptyElement = (element: Element) => {
      let topElement = element;
      while (topElement.parentElement && !topElement.parentElement.classList.contains("protyle-wysiwyg")) {
          if (!topElement.parentElement.getAttribute("data-node-id") &&
              !topElement.parentElement.classList.contains("callout-content")) {
              topElement = topElement.parentElement;
          } else {
              ...
          }
      }
      return topElement;
  };
  ```

---

## 6. Callout 类型、标题与图标编辑

### 6.1 点击标题修改类型与标题

文件：`app/src/protyle/wysiwyg/index.ts` + `app/src/protyle/wysiwyg/callout.ts`

在主事件中：

```ts
const calloutTitleElement = hasTopClosestByClassName(event.target, "callout-title");
if (!protyle.disabled && !event.shiftKey && !ctrlIsPressed && calloutTitleElement) {
    updateCalloutType(calloutTitleElement, protyle);
    event.preventDefault();
    event.stopPropagation();
    return;
}
```

`updateCalloutType` 逻辑（`callout.ts`）：

- 打开对话框，包含：
  1. **Type**（映射到 `data-subtype`）：文本输入框，初值为当前 `data-subtype`。
  2. **Title**（映射到 `.callout-title`）：文本输入框，初值为当前标题文本。

- 点击确认：
  - 更新 `data-subtype`：

    ```ts
    blockElement.setAttribute("data-subtype", textElements[0].value.trim());
    ```

  - 更新标题文本：
    - 若 Title 为空，则用 Type 自动生成（首字母大写，其余小写）：

    ```ts
    titleElement.textContent = escapeHtml(
        textElements[1].value.trim() ||
        (textElements[0].value.trim().substring(0, 1).toUpperCase() +
         textElements[0].value.trim().substring(1).toLowerCase())
    );
    ```

  - 如果之前通过预设菜单选择了类型，会更新 `.callout-icon`。
  - 使用 `updateTransaction` 记录前后 HTML 差异。

> 约定：`data-subtype` 通常使用全大写，如 `NOTE`、`TIP`、`IMPORTANT` 等；标题则为首字母大写的可读文本（`Note`、`Tip`）。

### 6.2 预设 Callout 类型菜单

在 `updateCalloutType` 中，点击类型输入框右侧的下拉图标，会弹出菜单：

```ts
[{
    icon: "✏️", type: "Note",      color: "var(--b3-callout-note)"
}, {
    icon: "💡", type: "Tip",       color: "var(--b3-callout-tip)"
}, {
    icon: "❗", type: "Important", color: "var(--b3-callout-important)"
}, {
    icon: "⚠️", type: "Warning",  color: "var(--b3-callout-warning)"
}, {
    icon: "🚨", type: "Caution",  color: "var(--b3-callout-caution)"
}].forEach((item) => {
    menu.addItem({
        iconHTML: `<span class="b3-menu__icon">${item.icon.toUpperCase()}</span>`,
        label: `<span style="color: ${item.color}">${item.type}</span>`,
        click() {
            if (textElements[0].value.toLowerCase() === textElements[1].value.toLowerCase()) {
                textElements[1].value = item.type; // 同时更新标题
            }
            textElements[0].value = item.type.toUpperCase(); // Type → 大写
            updateIcon = item.icon;
            textElements[1].focus();
            textElements[1].select();
        }
    });
});
```

说明：

- 预设项包括：Note / Tip / Important / Warning / Caution。
- 颜色通过 CSS 变量控制：`--b3-callout-note` 等。
- 选择预设项时：
  - Type 输入框更新为全大写（如 `NOTE`）。
  - 如果此前 Title 与 Type 文本一致，会同步更新 Title 为预设的类型名。
  - 记录图标，最终确认时更新 `.callout-icon`。

### 6.3 点击图标修改图标（emoji / 图片）

在 `index.ts` 中处理 `.callout-icon` 点击：

```ts
const calloutIconElement = hasTopClosestByClassName(event.target, "callout-icon");
if (!protyle.disabled && !event.shiftKey && !ctrlIsPressed && calloutIconElement) {
    const nodeElement = hasClosestBlock(calloutIconElement);
    if (nodeElement) {
        const emojiRect = calloutIconElement.getBoundingClientRect();
        openEmojiPanel("", "av", { ... }, (unicode) => {
            const oldHTML = nodeElement.outerHTML;
            let emojiHTML;
            if (unicode.startsWith("api/icon/getDynamicIcon")) {
                emojiHTML = `<img class="callout-img" src="${unicode}"/>`;
            } else if (unicode.indexOf(".") > -1) {
                emojiHTML = `<img class="callout-img" src="/emojis/${unicode}">`;
            } else {
                emojiHTML = unicode2Emoji(unicode);
            }
            calloutIconElement.innerHTML = emojiHTML;
            updateTransaction(protyle, nodeElement.getAttribute("data-node-id"), nodeElement.outerHTML, oldHTML);
        });
    }
}
```

- 使用统一的 emoji 选择面板：
  - 若返回值以 `api/icon/getDynamicIcon` 开头 → 动态图标地址。
  - 若包含 `.` → 视为 `/emojis/` 下的图片文件名。
  - 其它情况 → 视为 Unicode Emoji 码位。
- `.callout-icon` 的展示完全由 `innerHTML` 决定。

---

## 7. 搜索与图谱中的前端表现

### 7.1 搜索面板中的 Callout 开关

文件：`app/src/search/menu.ts`

搜索类型筛选菜单中包含 Callout：

```ts
<label class="fn__flex b3-label">
    <svg class="ft__on-surface svg fn__flex-center">
        <use xlink:href="#iconCallout"></use>
    </svg>
    <span class="fn__space"></span>
    <div class="fn__flex-1 fn__flex-center">
        ${window.siyuan.languages.callout} <sup>[1]</sup>
    </div>
    <span class="fn__space"></span>
    <input class="b3-switch fn__flex-center"
           data-type="callout"
           type="checkbox"
           ${config.types.callout ? " checked" : ""}>
</label>
```

- 用户可像"引用块"、"代码块"一样勾选"Callout"。
- 对应配置字段：
  - `ISearch.callout`
  - `IUILayoutTabSearchConfigTypes.callout`。

### 7.2 图谱中的类型过滤

前端 `IGraphType` / `IGraphCommon` 中包含 `callout` 字段，用来开关 Callout 节点的显示：

```ts
export interface IGraphType {
    blockquote: boolean;
    callout: boolean;  // 是否显示 Callout
    code: boolean;
    heading: boolean;
    list: boolean;
    listItem: boolean;
    math: boolean;
    paragraph: boolean;
    super: boolean;
    table: boolean;
    tag: boolean;
}
```

- 与内核 `TypeFilter.Callout` 一一对应。

---

## 8. 对资源插件实现的对齐建议

从以上原生设计可以提炼出，对资源插件 Callout 实现的关键对齐点：

1. **块类型语义对齐**
   - 如果插件需要在块级结构上完全兼容思源原生：
     - 最理想是直接复用/映射到 `NodeCallout`，而不是定义一套完全独立的块类型。
   - 至少在导出/转换到思源时，应能将插件侧 Callout 映射为：
     - 类型：`NodeCallout`
     - 缩写：`callout`
     - 结构：见下文 DOM 对齐。

2. **DOM 结构对齐**
   - 推荐插件侧 DOM 与原生保持完全一致：
     - 外层：`.callout[data-type="NodeCallout"][data-subtype]`
     - 信息区：`.callout-info > .callout-icon + .callout-title`
     - 内容区：`.callout-content` 包含子块
   - 这样可以直接享受原生 Protyle 的：
     - 键盘导航行为（Enter、Arrow、Backspace 等）。
     - 事务（Transaction）逻辑。
     - 搜索、图谱、批量替换集成。

3. **类型与显示的映射**
   - 将插件中的 Callout 类型映射到以下约定：
     - `data-subtype`：大写（`NOTE` / `TIP` / `IMPORTANT` / `WARNING` / `CAUTION`）。
     - `.callout-title`：首字母大写的人类可读字符串。
     - `.callout-icon`：Emoji 或 `<img class="callout-img" src="...">`。
   - 如插件有更多类型，可以考虑：
     - 继续沿用 `data-subtype` 扩展。
     - 在样式中增加对应的 `--b3-callout-xxx` 颜色变量。

4. **Markdown 语法兼容**
   - 若插件已有自己的 Callout 语法，建议：
     - 在导出到思源时转换为 `[!TYPE]` 风格引用块，由 Lute 负责识别并生成 `NodeCallout`。
     - 或直接生成带有 `data-type="NodeCallout"` 的 DOM 片段，让 Protyle 接管。

5. **编辑交互兼容**
   - 如插件有自己的编辑器：
     - 可参考原生的行为设计（退出容器、拉出首块等），保持用户体验一致。
   - 如插件只是生成数据，实际编辑在思源中完成，则尽量将数据格式对齐即可。

---

## 9. 后续工作

- 若资源插件当前已有 Callout 实现，请对照本说明检查：
  1. 块类型是否与 `NodeCallout` 对齐。
  2. DOM 结构是否与 `.callout` + `.callout-info` + `.callout-content` 一致。
  3. 类型字段（subtype、标题、图标）是否可映射到原生约定。
  4. Markdown/导出导入时，是否能无损转换成原生 Callout。

- 后续可以在插件项目另建一份：
  - 《插件 Callout 实现 vs 思源原生 Callout 差异清单》
  - 并逐项制定改造计划。
