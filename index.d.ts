declare module "@hecom/react-native-report-table" {
    import * as React from 'react';

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
        onClickEvent?: (item: ItemCilck) => void;
        onScrollEnd?: () => void;
        lineColor?: string;
        marginVertical?: number; // item

        frozenPoint?: number; // 首行 指定列支持冻结  第一优先
        frozenCount?: number; // 首行前几列 可支持点击冻结  第二优先
        
        headerView?: () => React.ReactElement;
    }

    export interface ItemCilck {
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
        backgroundColor?: string;
        fontSize?: number;
        textColor?: string;
        isLeft?: boolean;
        icon?: IconStyle;
    }

    export interface IconStyle {
        path: string; // bundle的 绝对路径
        width: number,
        height: number,
    }

    export default class ReportTable extends React.Component<ReportTableProps>{
    }

}