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
        onContentSize?: ({ width, height }) => void; // 返回表格内容的宽高
        lineColor?: Color;

        disableZoom?: boolean; // 是否禁止缩放 default: false

        /*
         *  是否是可排列的，仅支持不包含合并单元格的表
         *  开启后，每列表头显示锁定按钮🔓(初始不锁定)，锁定后可冻结指定列，可取消，解锁后按原顺序排列
         *  开启后 frozenColumns生效，frozenPoint和 frozenCount 失效
         *  frozenColumns 不显示锁定按钮，始终冻结
         *  default: false
         */
        permutable?: boolean;
        
        /* 
         *  首行 指定列支持冻结  第一优先  使用指定列后显示带🔓的icon  默认不锁定
         *  frozenColumns 与 frozenPoint 相等时，可显示🔒
         *  取消锁定后冻结frozenColumns
         */
        frozenPoint?: number; 

        /*
         *  首行前几列支持冻结  第二优先  使用前几列后显示带🔓的icon  
         *   使用frozenColumns比frozenCount小时，可使🔒
         *   取消锁定后冻结点击列的前几列
        */
        frozenCount?: number;

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

    enum TrianglePosition {
        NONE = 0,
        TOP_LEFT = 1 << 0,
        TOP_RIGHT = 1 << 1,
        BOTTOM_LEFT = 1 << 2,
        BOTTOM_RIGHT  = 1 << 3,
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

        /* Android only */
        trianglePosition?: TrianglePosition; // 三角标位置
        triangleColor?: Color; // 三角标颜色

        /* ios only */
        boxLineColor?: Color; // 显示一个内嵌宽度为1的框线

        classificationLinePosition?: ClassificationLinePosition; // 特殊分割线颜色的位置
        classificationLineColor?: Color; // 分割线颜色，优先级比ItemConfig中的高，可选

        isForbidden?: boolean; // 显示禁用线
        asteriskColor?: Color; // 显示一个必填标识符 *， 显示位置与textAlignment相关，0显示在右侧，1，2是显示在左侧
        strikethrough?: boolean; // 文本显示删除线

        isOverstriking?: boolean; // 文本是否加粗。 default false
        icon?: IconStyle;

        extraText?: {
            backgroundStyle: {
                color: Color;
                width: number;
                height: number;
            },
            style: {
                color: Color;
                fontSize: number;
            }, 
            text: string;
            isLeft: boolean; // 在原本文本左边 default false
        }; // 在原本文本内容中额外追加的文本
    }

    export interface IconStyle {
        path: string; // bundle的 绝对路径
        width: number,
        height: number,
        imageAlignment: number; // 1左  2中  3右(默认)
        paddingHorizontal: number; // default 4
    }

    export default class ReportTable extends React.Component<ReportTableProps>{
        /**
         * default lineX = 0, lineY = 0, offsetX = 0, offsetY = 0, animated = true
         * lineX ｜ lineY 小于0 时，代表为保留当前偏移量 可用 -1
        */
        scrollTo(params: { lineX?: number; lineY?: number; offsetX?: number; offsetY?: number; animated?: boolean });


        /**
         * 滚动到底部，x偏移量保持不变
         */
        scrollToBottom();
    }
}
