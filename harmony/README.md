# 鸿蒙（HarmonyOS）表格适配说明

## 架构概述

```
┌─────────────────────────────────────────────────┐
│  JS Layer (ReportTableWrapper.harmony.js)        │
│  - 数据模型转换 (DataSource[][] → VTable format) │
│  - 事件回调解包                                   │
│  - Native命令分发                                 │
├─────────────────────────────────────────────────┤
│  ArkTS Native Layer (harmony/)                   │
│  - RNReportTablePackage (组件注册)                │
│  - RNReportTableViewManager (ViewManager)        │
│  - ReportTableComponent (XComponent + VTable)    │
│  - CustomCellLayout (自定义单元格渲染)             │
├─────────────────────────────────────────────────┤
│  @ohos/vtable ^1.25.0 (Canvas渲染)              │
└─────────────────────────────────────────────────┘
```

## 文件结构

```
src/
  vtableDataConverter.js       # 数据模型转换工具
  ReportTableWrapper.harmony.js # JS 层桥接组件（已重写）

harmony/
  oh-package.json5             # OHPM 包配置
  index.ets                    # 模块入口
  src/main/
    module.json5               # 模块描述
    ets/
      RNReportTablePackage.ets          # RN包注册
      RNReportTableViewManager.ets      # ViewManager + View实现
      ReportTableComponent.ets          # ArkTS UI组件（XComponent + VTable）
      RNReportTableDescriptor.ets       # Props描述器
      RNReportTableComponentBuilder.ets # 组件构建器
      CustomCellLayout.ets              # 自定义单元格渲染
```

## 使用方式

宿主工程中注册：

```typescript
// entry/src/main/ets/pages/Index.ets
import { RNReportTablePackage } from 'react-native-report-table/harmony';

// 在RN初始化时注册
const packages = [
  new RNReportTablePackage(),
  // ...其他packages
];
```

## Props映射表

| ReportTable Prop | VTable 对应 | 状态 |
|---|---|---|
| frozenColumns | frozenColCount | ✅ 已实现 |
| frozenRows | frozenRowCount | ✅ 已实现 |
| lineColor | theme borderColor | ✅ 已实现 |
| showBorder | theme frameStyle | ✅ 已实现 |
| minWidth/maxWidth | column width config | ✅ 已实现 |
| columnsWidthMap | 各column width覆盖 | ✅ 已实现 |
| itemConfig.backgroundColor | theme bodyStyle.bgColor | ✅ 已实现 |
| itemConfig.fontSize | theme bodyStyle.fontSize | ✅ 已实现 |
| itemConfig.textColor | theme bodyStyle.color | ✅ 已实现 |
| itemConfig.textAlignment | theme bodyStyle.textAlign | ✅ 已实现 |
| itemConfig.isOverstriking | theme bodyStyle.fontWeight | ✅ 已实现 |
| disableZoom | 手势层处理 | ✅ 已实现 |
| doubleClickZoom | 手势层处理 | ✅ 已实现 |
| permutable | 见缺口说明 | ⚠️ 部分实现 |
| replenishColumnsWidthConfig | 手动计算列宽 | ⚠️ 传入native侧，需业务验证 |

## Commands 实现

| 命令 | VTable API | 状态 |
|---|---|---|
| scrollTo | scrollToCell + setScrollLeft/Top | ✅ |
| scrollToBottom | getAllRowsHeight + setScrollTop | ✅ |
| updateData | changeCellValues | ✅ |
| spliceData | deleteRecords + addRecords | ✅ |

## 事件回调

| 事件 | 实现方式 | 状态 |
|---|---|---|
| onClickEvent | VTable click_cell → 解包emit | ✅ |
| onScroll | VTable scroll → emit(translateX/Y/scale) | ✅ |
| onScrollEnd | scroll位置判断是否到底 | ✅ |
| onContentSize | getAllColsWidth + getAllRowsHeight | ✅ |

## 自定义单元格渲染（customLayout）

| 特性 | 实现状态 |
|---|---|
| progressStyle (进度条) | ✅ 渐变矩形 + antsLine虚线 |
| floatIcon (悬浮图标) | ✅ Image绝对定位 |
| extraText (角标文字) | ✅ 背景矩形+文字 |
| isForbidden (禁用斜线) | ✅ 对角线 |
| boxLineColor (内嵌边框) | ✅ stroke rect |
| classificationLinePosition | ✅ 位掩码解析 + 边线绘制 |
| richText (富文本) | ✅ 分段文本渲染 |
| gradient (渐变背景) | ✅ linearGradient |

---

## 缺口与限制

### 缺口 #1：缩放（Pinch-to-zoom）
- **现状**：通过 PinchGesture 监听对整个 XComponent 做 scale transform
- **限制**：缩放后 VTable 内部的点击坐标需要做反向换算，目前 scale 值已随 onScroll 上报
- **降级处理**：基本可用，但与原生表格的像素级精确缩放有差异

### 缺口 #2：permutable / frozenAbility 锁列 UI
- **现状**：props 已传递到 native 侧，frozenColCount 可动态更新
- **限制**：VTable 无内置锁图标 UI，需要在列表头上叠加自定义图标并监听点击
- **降级处理**：当前未绘制锁图标。frozenColumns 的基础冻结功能正常工作。需后续迭代添加锁图标 overlay

### 缺口 #3：HeaderComponent prop
- **现状**：在 JS 层用 ScrollView 包裹 headerView() 渲染在 NativeReportTable 上方
- **限制**：与 VTable 本身无关，通过外部容器实现，行为与 Android 一致

### 缺口 #4：lineBreakMode: 'aLine'
- **现状**：VTable 使用 `autoWrapText: false` + 省略号模拟
- **限制**：VTable 的 ellipsis 行为与 ReportTable 的 "同一行显示不下换一行，单行省略" 不完全相同
- **降级处理**：单行超出时显示省略号，不会自动换行

### 缺口 #5：gradient 渐变背景
- **现状**：通过 customLayout 绘制 linearGradient 矩形
- **限制**：VTable column style 不直接支持 gradient fill，已用 customLayout 完整实现

### 缺口 #6：icon 的 imageAlignment
- **现状**：通过 customLayout 中的 Image 定位实现
- **限制**：icon 的 1(左)/2(中)/3(右) 对齐需要在 customLayout 中手动计算位置
- **降级处理**：已支持基本的左/中/右定位逻辑

### 无法实现的功能
- **AppRegistry.registerComponent('ReportTableHeaderView')**：鸿蒙 RN 不需要此注册方式，headerView 直接作为 JSX 渲染
- **react-native-harmony 的具体版本差异**：需要根据实际使用的 RNOH 版本（0.72.x / 0.73.x）调整 ViewManager 基类接口。当前代码基于 RNOH 最新 API 编写

---

## 集成步骤

1. 在宿主工程的 `oh-package.json5` 中添加依赖：
   ```json
   "dependencies": {
     "react-native-report-table": "file:../path/to/ReportTable/harmony"
   }
   ```

2. 在宿主工程入口注册 Package：
   ```typescript
   import { RNReportTablePackage } from 'react-native-report-table';
   // 添加到 packages 列表
   ```

3. 在 `build-profile.json5` 中将 harmony 模块加入编译：
   ```json
   {
     "modules": [
       { "name": "react-native-report-table", "srcPath": "./oh_modules/react-native-report-table" }
     ]
   }
   ```

4. JS 侧无需额外配置，Platform.select 会自动加载 `.harmony.js` 后缀文件
