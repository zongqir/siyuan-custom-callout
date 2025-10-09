/**
 * 大纲主题样式接口定义
 */
export interface OutlineThemeStyle {
    id: string;
    name: string;
    description: string;
    preview: string; // emoji预览
    
    // 容器样式
    containerBackground: string;         // 容器背景
    containerBackdropFilter: string;     // 容器背景模糊
    
    // 头部样式  
    headerBackground: string;            // 头部背景
    headerBackdropFilter: string;        // 头部背景模糊
    headerBorder: string;                // 头部边框
    headerPadding: string;               // 头部内边距
    headerTitleColor: string;            // 标题颜色
    headerTitleFontSize: string;         // 标题字体大小
    headerTitleFontWeight: string;       // 标题字体粗细
    
    // 按钮样式
    buttonBackground: string;            // 按钮背景  
    buttonBorder: string;                // 按钮边框
    buttonBorderRadius: string;          // 按钮圆角
    buttonHoverBackground: string;       // 按钮悬停背景
    buttonHoverBorder: string;           // 按钮悬停边框
    buttonColor: string;                 // 按钮图标颜色
    
    // 列表样式
    listBackground: string;              // 列表背景
    listPadding: string;                 // 列表内边距
    listGap: string;                     // 列表项间距
    
    // 滚动条样式
    scrollbarWidth: string;              // 滚动条宽度
    scrollbarTrackBackground: string;    // 滚动条轨道背景
    scrollbarThumbBackground: string;    // 滚动条滑块背景
    scrollbarThumbHoverBackground: string; // 滚动条滑块悬停背景
    
    // 卡片样式
    cardBorderRadius: string;            // 卡片圆角
    cardPadding: string;                 // 卡片内边距
    cardBorder: string;                  // 卡片边框
    cardTransition: string;              // 卡片过渡动画
    cardHoverOpacity: number;            // 卡片悬停透明度
    
    // 卡片头部样式
    cardHeaderGap: string;               // 卡片头部间距
    cardHeaderMarginBottom: string;      // 卡片头部下边距
    
    // 图标样式
    iconSize: string;                    // 图标大小
    iconFilter: string;                  // 图标滤镜
    
    // 标签样式
    labelPadding: string;                // 标签内边距
    labelBorderRadius: string;           // 标签圆角
    labelFontSize: string;               // 标签字体大小
    labelFontWeight: string;             // 标签字体粗细
    labelColor: string;                  // 标签文字颜色
    labelBackground: string;             // 标签背景
    
    // 标题和内容样式
    titleFontSize: string;               // 标题字体大小
    titleFontWeight: string;             // 标题字体粗细
    titleColor: string;                  // 标题颜色
    titleMarginBottom: string;           // 标题下边距
    titleLineHeight: string;             // 标题行高
    
    contentFontSize: string;             // 内容字体大小
    contentColor: string;                // 内容颜色
    contentLineHeight: string;           // 内容行高
    contentMarginBottom: string;         // 内容下边距
    
    // 脚部样式
    footerPaddingTop: string;            // 脚部上边距
    footerBorder: string;                // 脚部边框
    footerOpacity: number;               // 脚部透明度
    footerHoverOpacity: number;          // 脚部悬停透明度
    footerIconColor: string;             // 脚部图标颜色
    footerIconOpacity: number;           // 脚部图标透明度
    footerIconHoverOpacity: number;      // 脚部图标悬停透明度
    footerIconTransform: string;         // 脚部图标变换
    
    // 加载和空状态样式
    loadingSpinnerBorder: string;        // 加载图标边框
    loadingSpinnerBorderTop: string;     // 加载图标顶部边框
    loadingTextColor: string;            // 加载文字颜色
    emptyIconOpacity: number;            // 空状态图标透明度
    emptyTextColor: string;              // 空状态文字颜色
}

/**
 * 大纲主题导出格式
 */
export interface OutlineThemeExport {
    version: string;                     // 导出格式版本
    theme: OutlineThemeStyle;            // 主题配置
    createdAt: string;                   // 创建时间
    author?: string;                     // 作者
}
