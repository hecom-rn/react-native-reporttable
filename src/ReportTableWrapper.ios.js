import React from 'react';
import { StyleSheet } from 'react-native';
import ReportTableView from './ReportTableView';

export default class ReportTableWrapper extends React.Component{

    constructor(props) {
        super(props);
        this.headerViewSize = { width: 0, height: 0 };
        this.handleData(props);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.handleData(nextProps);
    }

    handleData = (props) => {
        if (props.headerView && props.headerView()) {
            const flatStyle = StyleSheet.flatten(props.headerView().props.style) || {};
            const width = flatStyle.width || 0;
            const height = flatStyle.height || 0;
            this.headerViewSize = {height, width};
        } else {
            this.headerViewSize = {width: 0, height: 0};
        }
    }

    scrollTo = (params) => {
        const { lineX = 0, lineY = 0, offsetX = 0, offsetY = 0, animated = true } = params || {};
        // Pass as array for backward compat with ReportTableView.ios.js
        this.table && this.table.scrollTo([lineX, lineY, offsetX, offsetY, animated]);
    }

    spliceData = (params) => {
        this.table && this.table.spliceData([params]);
    }

    updateData = (params) => {
        this.table && this.table.updateData([params.data, params.y, params.x]);
    }

    scrollToBottom = () => {
        this.table && this.table.scrollToBottom();
    }

    onClickEvent = ({nativeEvent: {keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount}}) => {
        this.props.onClickEvent && this.props.onClickEvent({keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount});
    };

    render() {
        const { headerView, ...tableProps } = this.props;
        return (
            <ReportTableView
                ref={ref => this.table = ref}
                {...tableProps}
                headerViewSize={this.headerViewSize}
                onClickEvent={this.onClickEvent}
                style={{ collapsible: false, flex: 1 }} //  阻止扁平化 防止被判定为"不需要创建原生视图"，它的事件处理器可能不会被正确注册。
            >
                {headerView?.()}
            </ReportTableView>
        );
    }
}

