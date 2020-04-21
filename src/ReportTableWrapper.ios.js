import React from 'react';
import {processColor, AppRegistry} from 'react-native';
import ReportTableView from './ReportTableView';

export default class ReportTableWrapper extends React.Component{

    static defaultProps = {
        data: [[]],
        minWidth: 50,
        minHeight: 40,
        maxWidth: 120,
        frozenColumns: 0,
        frozenRows: 0,
        size: {
            width: 0,
            height: 0,
        },
        onClickEvent: () => {},
        onScrollEnd: () => {},
    };

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
                    ...item,
                    backgroundColor: item.backgroundColor ? processColor(item.backgroundColor) : processColor('#fff'),
                    textColor: item.textColor ? processColor(item.textColor) : processColor('#222'),
                }
            })
        });
        this.onClickEvent = ({nativeEvent: {keyIndex, rowIndex, columnIndex}}) => {
            props.onClickEvent && props.onClickEvent({keyIndex, rowIndex, columnIndex});
        };
        this.headerViewSize = {width: 0, height:0}
        if (props.headerView && props.headerView()) {
            AppRegistry.registerComponent('ReportTableHeaderView', () => props.headerView);
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
