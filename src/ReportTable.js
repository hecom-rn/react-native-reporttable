import React from 'react';
import { View } from 'react-native';
import ReportTableWrapper from './ReportTableWrapper';

export default class ReportTable extends React.Component{

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