/**
 * Codegen spec for ReportTable Fabric native component.
 * Supports React Native New Architecture (RN 0.73+).
 */

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

type ScrollEventData = Readonly<{
    offsetX: Double;
    offsetY: Double;
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

// ---- ReplenishColumnsWidthConfig ----
type ReplenishColumnsWidthConfig = Readonly<{
    showNumber?: Int32;
}>;

// ---- Component props ----
export type NativeProps = ViewProps & {
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

    // Config with known shape
    replenishColumnsWidthConfig?: ReplenishColumnsWidthConfig;

    // Array of column indices to ignore locking
    ignoreLocks?: ReadonlyArray<Int32>;

    // Events
    onClickEvent?: DirectEventHandler<ClickEventData>;
    onScrollEnd?: DirectEventHandler<ScrollEventData>;
    onScroll?: DirectEventHandler<ScrollEventData>;
    onContentSize?: DirectEventHandler<ContentSizeEventData>;
};

// ---- Imperative commands ----
export interface NativeCommands {
    scrollTo(
        viewRef: React.RefObject<HostComponent<NativeProps>>,
        lineX: Int32,
        lineY: Int32,
        offsetX: Float,
        offsetY: Float,
        animated: boolean,
    ): void;
    updateData(
        viewRef: React.RefObject<HostComponent<NativeProps>>,
        data: string,
        y: Int32,
        x: Int32,
    ): void;
    spliceData(
        viewRef: React.RefObject<HostComponent<NativeProps>>,
        config: string,
    ): void;
    scrollToBottom(viewRef: React.RefObject<HostComponent<NativeProps>>): void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
    supportedCommands: ['scrollTo', 'updateData', 'spliceData', 'scrollToBottom'],
});

export default codegenNativeComponent<NativeProps>(
    'ReportTable',
) as HostComponent<NativeProps>;
