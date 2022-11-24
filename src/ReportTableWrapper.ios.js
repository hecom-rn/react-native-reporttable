import React from 'react';
import { AppRegistry, View } from 'react-native';
import ReportTableView from './ReportTableView';

export default class ReportTableWrapper extends React.Component{

    constructor(props) {
        super(props);
        this.headerViewSize = { width: 0, height: 0 };
        this.onClickEvent = ({nativeEvent: {keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount}}) => {
            props.onClickEvent && props.onClickEvent({keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount});
        };
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

    scrollTo = () => {
        this.table.scrollTo();
    }

    render() {
        return (
            <ReportTableView
                ref={ref => this.table = ref}
                {...this.props}
                headerViewSize={this.headerViewSize}
                onClickEvent={this.onClickEvent}
            />
        );
    }
}
