import React from 'react';
import { View, Platform, processColor } from 'react-native';
import ReportTableWrapper from './ReportTableWrapper';

const itemConfig = {
    backgroundColor: Platform.select({
        ios: processColor('#fff'),
        android: '#FFFFFF',
    }),
    fontSize: 14,
    textColor: Platform.select({
        ios: processColor('#222'),
        android: '#222222',
    }),
    textPaddingHorizontal: 12, // 上左下右
    textAlignment: 0,  // 0左 1中 2右  default 0
    splitLineColor:  Platform.select({
        ios: processColor('#e8e8e8'),
        android: '#e8e8e8',
    }),
    classificationLineColor: Platform.select({
        ios: processColor('#9cb3c8'),
        android: '#9cb3c8',
    }),
    isOverstriking: false,
};

export default class ReportTable extends React.Component{
    static defaultProps = {
        // data: [[]],
        minWidth: 50,
        minHeight: 40,
        maxWidth: 120,
        frozenColumns: 0,
        frozenRows: 0,
        lineColor: '#e8e8e8',
        size: {
            width: 0,
            height: 0,
        },
        onClickEvent: () => {},
        onScrollEnd: () => {},
        onScroll: () => {},
        frozenCount: 0,
        frozenPoint: 0,
        columnsWidthMap: {},
        itemConfig: itemConfig,
    };

    scrollTo = () => {
        this.table.scrollTo();
    }

    render() {
        return (
            <View style={{flex: 1}}>
                <ReportTableWrapper
                    ref={(ref)=> this.table = ref}
                    {...this.props}
                    itemConfig={{...itemConfig, ...this.props.itemConfig}}
                />
            </View>
        );
    }
}
