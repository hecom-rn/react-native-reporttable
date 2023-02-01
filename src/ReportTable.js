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
};

export default class ReportTable extends React.Component{
    static defaultProps = {
        // data: [[]],
        minWidth: 50,
        minHeight: 40,
        maxWidth: 120,
        frozenColumns: 0,
        frozenRows: 0,
        lineColor: '#E6E8EA',
        size: {
            width: 0,
            height: 0,
        },
        onClickEvent: () => {},
        onScrollEnd: () => {},
        onScroll: () => {},
        frozenCount: 0,
        frozenPoint: 0,
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
