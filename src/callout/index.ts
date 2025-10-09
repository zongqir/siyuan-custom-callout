/**
 * Callout模块主入口
 */

// V1 - 原始基于文档解析的实现（保留用于向后兼容）
export * from './types';
export * from './processor';
export * from './menu';
export * from './styles';
export * from './manager';
export * from './config';
export * from './icons';
export * from './colors';
export * from './themes/index';
export * from './proxy-button';
export * from './drag-resize';

// V2 - 新的基于块属性的实现（推荐使用）
export * from './processor-v2';
export * from './menu-v2';
export * from './styles-v2';
export * from './manager-v2';


