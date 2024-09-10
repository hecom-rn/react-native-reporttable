import React from 'react';
import { AppRegistry, View } from 'react-native';
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
        const defaultHeader = () => <View />;
        AppRegistry.registerComponent('ReportTableHeaderView', () => props.headerView || defaultHeader);
        if (props.headerView && props.headerView()) {
            const {width, height} = props.headerView().props.style;
            this.headerViewSize = {height, width};
        } else {
            this.headerViewSize = {width: 0, height:0};
        }
    }

    scrollTo = (params) => {
        const { lineX = 0, lineY = 0, offsetX = 0, offsetY = 0, animated = true } = params || {};
        this.table.scrollTo([lineX, lineY, offsetX, offsetY, animated]);
    }

    spliceData = (params) => {
        this.table.spliceData([params]);
    }
    
    updateData = (params) => {
        this.table.updateData([params.data, params.y, params.x]);
    }

    scrollToBottom = () => {
        this.table.scrollToBottom();
    }

    onClickEvent = ({nativeEvent: {keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount}}) => {
        this.props.onClickEvent && this.props.onClickEvent({keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount});
    };
    
    render() {
        return (
            <ReportTableView
                ref={ref => this.table = ref}
                {...this.props}
                headerViewSize={this.headerViewSize}
                onClickEvent={this.onClickEvent}
            >
                {this.props.headerView?.()}
            </ReportTableView>
        );
    }
}
