import React from 'react';
import { View } from 'react-native';
import ReportTableWrapper from './ReportTableWrapper';

export default class ReportTable extends React.Component{

    static defaultProps = {
        data: [[]],
        minWidth: 50,
        minHeight: 40,
        maxWidth: 120,
        frozenColumns: 0,
        frozenRows: 0,
        textPaddingHorizontal:12,
        lineColor: '#E6E8EA',
        size: {
            width: 0,
            height: 0,
        },
        onClickEvent: () => {},
        onScrollEnd: () => {},
        frozenCount: 0,
    };

    // 处理通用逻辑
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View style={{flex: 1}}>
                <ReportTableWrapper 
                    {...this.props}
                />
            </View>
        );
    }
}