/**
 * Codegen spec for ReportTable Fabric native component.
 * Supports React Native New Architecture (RN 0.73+).
 */

import type * as React from 'react';
import type { HostComponent, ViewProps } from 'react-native';
import type {
    DirectEventHandler,
    Double,
    Float,
    Int32,
} from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

// ---- Event payload types ----
type ClickEventData = Readonly<{
    keyIndex: Int32;
    rowIndex: Int32;
    columnIndex: Int32;
    verticalCount: Int32;
    horizontalCount: Int32;
}>;

type ScrollEndEventData = Readonly<{
    isEnd: boolean;
}>;

type ScrollProEventData = Readonly<{
    translateX: Double;
    translateY: Double;
    scale: Double;
}>;

type ContentSizeEventData = Readonly<{
    width: Double;
    height: Double;
}>;

// ---- Size type ----
type SizeType = Readonly<{ width: Double; height: Double }>;

// ---- ItemConfig sub-types ----
type AntsLineStyle = Readonly<{
    color?: string;
    lineWidth?: Float;
    lineDashPattern?: ReadonlyArray<Double>;
}>;

type ProgressStyle = Readonly<{
    height?: Float;
    cornerRadius?: Float;
    marginHorizontal?: Float;
    antsLineStyle?: AntsLineStyle;
}>;

type ItemConfig = Readonly<{
    backgroundColor?: string;
    fontSize?: Float;
    textColor?: string;
    textAlignment?: Int32;
    textPaddingHorizontal?: Int32;
    classificationLineColor?: string;
    isOverstriking?: boolean;
    progressStyle?: ProgressStyle;
}>;

// ---- Component props ----
export interface NativeProps extends ViewProps {
    // Layout
    size?: SizeType;
    headerViewSize?: SizeType;

    // Data – complex nested array; serialized as JSON string in JS
    data?: string;

    // Column/row sizing
    minWidth?: Float;
    maxWidth?: Float;
    minHeight?: Float;

    // Frozen
    frozenColumns?: Int32;
    frozenRows?: Int32;

    // Style
    lineColor?: string;
    showBorder?: boolean;
    disableZoom?: boolean;
    permutable?: boolean;

    // Item style config (typed object)
    itemConfig?: ItemConfig;

    // Dynamic-key maps – serialized as JSON string in JS
    columnsWidthMap?: string;
    frozenAbility?: string;

    // Config – serialized as JSON string in JS (may contain showNumber, ignoreColumns, etc.)
    replenishColumnsWidthConfig?: string;

    // Array of column indices to ignore locking
    ignoreLocks?: ReadonlyArray<Int32>;

    // Events
    onClickEvent?: DirectEventHandler<ClickEventData>;
    onScrollEnd?: DirectEventHandler<ScrollEndEventData>;
    onScroll?: DirectEventHandler<ScrollProEventData>;
    onContentSize?: DirectEventHandler<ContentSizeEventData>;
}

type ReportTableViewType = HostComponent<NativeProps>;

// ---- Imperative commands ----
export interface NativeCommands {
    scrollTo(
        viewRef: React.ElementRef<ReportTableViewType>,
        lineX: Int32,
        lineY: Int32,
        offsetX: Float,
        offsetY: Float,
        animated: boolean,
    ): void;
    updateData(
        viewRef: React.ElementRef<ReportTableViewType>,
        data: string,
        y: Int32,
        x: Int32,
    ): void;
    spliceData(
        viewRef: React.ElementRef<ReportTableViewType>,
        config: string,
    ): void;
    scrollToBottom(viewRef: React.ElementRef<ReportTableViewType>): void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
    supportedCommands: ['scrollTo', 'updateData', 'spliceData', 'scrollToBottom'],
});

export default codegenNativeComponent<NativeProps>(
    'ReportTable',
) as HostComponent<NativeProps>;
