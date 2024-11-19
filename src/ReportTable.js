import React from 'react';
import { View, Platform } from 'react-native';
import ReportTableWrapper from './ReportTableWrapper';

const itemConfig = {
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    textColor: '#222222',
    textPaddingHorizontal: 12, // 上左下右
    textAlignment: 0,  // 0左 1中 2右  default 0
    classificationLineColor:'#9cb3c8',
    isOverstriking: false,
    progressStyle: {
        height: 20,
        cornerRadius: 1,
        marginHorizontal: 8,
        antsLineStyle: {
            color: '#222222',
            lineWidth: 1,
            lineDashPattern: [4, 2]
        }
    }
};

export default class ReportTable extends React.Component{
    static defaultProps = {
        // data: [[]],
        minWidth: 50,
        minHeight: 40,
        maxWidth: 120,
        frozenColumns: 0,
        frozenRows: 0,
        lineColor: Platform.select({
            ios: '#e8e8e8',
            android: '#D1D1D1',
        }),
        size: {
            width: 0,
            height: 0,
        },
        onClickEvent: () => {},
        onScrollEnd: () => {},
        onScroll: () => {},
        onContentSize: () => {},
        frozenCount: 0,
        frozenPoint: 0,
        ignoreLocks: [],
        columnsWidthMap: {},
        replenishColumnsWidthConfig: {},
        itemConfig: itemConfig,
        permutable: false,
        showBorder: false,
        disableZoom: false,
    };

    scrollTo = (params) => {
        const { lineX = 0, lineY = 0, offsetX =0, offsetY = 0, animated = true } = params || {};
        this.table && this.table.scrollTo({ lineX, lineY, offsetX, offsetY, animated });
    }

    updateData = (params) => {
        const { data = [[]], x = 0, y = 0 } = params || {};
        this.table.updateData({ data, x , y });
    }

    spliceData = (params) => {
        let arr = params;
        if (!Array.isArray(arr)) {
            arr = [params];
        }

        this.table.spliceData(arr.map((item) => ({
            data: item?.data || [],
            y: item?.y || 0,
            l: item?.l || 0,
        })));
    }

    scrollToBottom = () => {
        this.table && this.table.scrollToBottom();
    }

    onContentSize = ({ nativeEvent }) => {
        this.props?.onContentSize(nativeEvent);
    }

    render() {
        return (
            <View style={{flex: 1}}>
                <ReportTableWrapper
                    ref={(ref)=> this.table = ref}
                    {...this.props}
                    itemConfig={{ ...itemConfig, ...this.props.itemConfig }}
                    onContentSize={this.onContentSize}
                />
            </View>
        );
    }
}
