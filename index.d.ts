declare module "@hecom/reportTable"{
    import * as React from 'react';
    import * as ReactNative from "react-native";

    export interface ReportTableProps {
        size: PropTypes.objectOf({
            width: PropTypes.number.isRequired,
            height: PropTypes.number.isRequired,
        }).isRequired;

        data: PropTypes.arrayOf(
            PropTypes.arrayOf(
                PropTypes.objectOf(DataSource)
            ).isRequired;
        ).isRequired;

        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        frozenColumns?: number;
        frozenRows?: number;
        onClickEvent?: () => void;
    }

    export interface DataSource {
        title: string;
        keyIndex: number;
        backgroundColor?: string;
        fontSize?: number;
        textColor?: string;
    }

    export default class ReportTable extends React.Component<ReportTableProps>{
    }

}




