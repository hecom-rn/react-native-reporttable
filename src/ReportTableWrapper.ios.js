import React from 'react';
import {processColor} from 'react-native';
import ReportTableView from './ReportTableView';

export default class ReportTable extends React.Component{

    static defaultProps = {
        data: [[]],
        minWidth: 50,
        minHeight: 40,
        maxWidth: 120,
        frozenColumns: 0,
        frozenRows: 0,
        size: {
            width: 1,
            height: 1,
        },
        onClickEvent: () => {},
    };

    constructor(props) {
        super(props);
        this.data = props.data.map(itemArr => {
            return itemArr.map(item => {
                // default itemValue
                return {
                    fontSize: 10, 
                    ...item,
                    backgroundColor: item.backgroundColor ? processColor(item.backgroundColor) : processColor('#fff'),
                    textColor: item.textColor ? processColor(item.textColor) : processColor('#222'),
                }
            })
        });
        this.onClickEvent = ({nativeEvent: {keyIndex}}) => {
            props.onClickEvent && onClickEvent(keyIndex);
        };
    }

    render() {
        return (
            <ReportTableView 
                {...this.props}
                data={this.data}
                onClickEvent={this.onClickEvent}
            />
        );
    }
}