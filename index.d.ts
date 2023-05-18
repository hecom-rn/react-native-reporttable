declare module "@hecom/react-native-report-table" {
    import * as React from 'react';
    import { ProcessedColorValue } from 'react-native';

    export interface ReportTableProps {
        size: {
            width: number;
            height: number;
        }
        data: DataSource[][];

        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        frozenColumns?: number;
        frozenRows?: number;
        onClickEvent?: (item: ItemClick) => void;
        onScrollEnd?: (isEnd: boolean) => void;
        onScroll?: (pro: ScrollPro) => void;
        lineColor?: Color;

        frozenPoint?: number; // 首行 指定列支持冻结  第一优先  使用后带🔒的icon   优先级比 frozenColumns 高
        frozenCount?: number; // 首行前几列 可支持点击冻结  第二优先 🔒自动锁住

        headerView?: () => React.ReactElement;

        itemConfig?: ItemConfig; // 优先级比 DataSource中的属性低

        columnsWidthMap?: ColumnsWidthMap; // index 为指定index的列宽， 未设置则还使用原minWidth， maxWidth
    }

    type Color =  string | ProcessedColorValue; // ios ProcessedColorValue,   android 16进制色值，需6位

    // 默认值配置
    export interface ItemConfig {
        backgroundColor: Color;
        fontSize: number;  // default 14
        textColor: Color;
        textAlignment: 0 | 1 | 2; // default 0
        textPaddingHorizontal: number; // default 12
        splitLineColor: Color; // default #e8e8e8
        classificationLineColor: Color; // default #9cb3c8
        isOverstriking: boolean; // 文本是否加粗。 default false
    }

    enum ClassificationLinePosition {
        none = 0,
        top = 1 << 0,
        right = 1 << 1,
        bottom = 1 << 2,
        left = 1 << 3,
    }

    interface ColumnsWidthMap  {
        [index: string]: {
            maxWidth: number;
            minWidth: number;
        };
    }

    export interface ScrollPro {
        translateY: number;
        translateX: number;
        scale: number;
    }

    export interface ItemClick {
        keyIndex: number;
        rowIndex: number;
        columnIndex: number;
        verticalCount: number;
        horizontalCount: number;
    }

    export interface DataSource {
        [key: string]: any;

        title: string;
        keyIndex: number;

        backgroundColor?: Color;

        fontSize?: number;  // default 14
        textColor?: Color;
        textPaddingHorizontal?: number; // default 12
        textAlignment?: 0 | 1 | 2; // default 0

        classificationLinePosition?: ClassificationLinePosition; // 特殊分割线颜色的位置

        isOverstriking?: boolean; // 文本是否加粗。 default false
        icon?: IconStyle;
    }

    export interface IconStyle {
        path: string; // bundle的 绝对路径
        width: number,
        height: number,
        imageAlignment: number; // 1左  2中  3右(默认)
        paddingHorizontal: number; // default 4
    }

    export default class ReportTable extends React.Component<ReportTableProps>{
    }
}
