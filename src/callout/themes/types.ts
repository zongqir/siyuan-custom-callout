/**
 * 主题样式接口定义
 */
export interface ThemeStyle {
    id: string;
    name: string;
    description: string;
    preview: string; // emoji预览
    
    // 基础样式
    borderRadius: string;          // 圆角大小
    borderWidth: string;           // 边框粗细
    leftBorderWidth: string;       // 左侧强调边框粗细
    padding: string;               // 内边距
    
    // 标题样式
    titleFontSize: string;         // 标题字体大小
    titleFontWeight: string;       // 标题字体粗细
    titleHeight: string;           // 标题栏高度
    titlePadding: string;          // 标题内边距
    iconSize: string;              // 图标大小
    
    // 内容样式
    contentFontSize: string;       // 内容字体大小
    contentLineHeight: string;     // 内容行高
    contentPadding: string;        // 内容内边距
    
    // 视觉效果
    boxShadow: string;             // 阴影效果
    backgroundOpacity: number;     // 背景透明度 (0-1)
    hoverTransform: string;        // 悬停变换效果
    transition: string;            // 过渡动画
    
    // 背景样式
    backgroundStyle: 'solid' | 'gradient';  // 纯色 or 渐变
}

/**
 * 主题导出格式
 * 用于分享和导入自定义主题
 */
export interface ThemeExport {
    version: string;               // 导出格式版本
    theme: ThemeStyle;            // 主题配置
    createdAt: string;            // 创建时间
    author?: string;              // 作者
}

