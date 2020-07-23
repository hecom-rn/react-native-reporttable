import React from 'react';
import {processColor, AppRegistry, View} from 'react-native';
import ReportTableView from './ReportTableView';

export default class ReportTableWrapper extends React.Component{

    constructor(props) {
        super(props);
        this.handleData(props);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.handleData(nextProps);
    }

    handleData = (props) => {
        this.data = props.data.map(itemArr => {
            return itemArr.map(item => {
                // default itemValue
                return {
                    paddingHorizontal: props.textPaddingHorizontal,
                    ...item,
                    backgroundColor: item.backgroundColor ? processColor(item.backgroundColor) : processColor('#fff'),
                    textColor: item.textColor ? processColor(item.textColor) : processColor('#222'),
                }
            })
        });
        this.onClickEvent = ({nativeEvent: {keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount}}) => {
            props.onClickEvent && props.onClickEvent({keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount});
        };
        this.headerViewSize = {width: 0, height:0}
        const defultHeader = () => <View />;
        AppRegistry.registerComponent('ReportTableHeaderView', () => props.headerView || defultHeader);
        if (props.headerView && props.headerView()) {
            const {width, height} = props.headerView().props.style;
            this.headerViewSize = {height, width};
        }
    }

    render() {
        return (
            <ReportTableView 
                headerViewSize={this.headerViewSize}
                {...this.props}
                data={this.data}
                onClickEvent={this.onClickEvent}
            />
        );
    }
}
