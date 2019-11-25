import React from 'react';
import {SafeAreaView, processColor} from 'react-native';
import ReportTableView from './ReportTableView';

interface DataSource {
    title: string;
    keyIndex: number;
    backgroundColor?: string;
    fontSize?: number;
    textColor?: string;
}
interface Props {
    data: [[DataSource]];
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    frozenColumns?: number;
    frozenRows?: number;
    onClickEvent?: () => void;
}

export default class ReportTable extends React.PureComponent<Props> {

    static defaultProps = {
        data: [],
        minWidth: 50,
        minHeight: 40,
        maxWidth: 120,
        frozenColumns: 0,
        frozenRows: 0,
        onClickEvent: ({nativeEvent: {keyIndex}}) => {
            
        },
    };
    constructor(props) {
        super(props);
        this.data = props.data.map(itemArr => {
            return itemArr.map(item => {
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
            <SafeAreaView style={{flex: 1}}>
                <ReportTableView 
                    {...this.props}
                    data={this.data}
                    onClickEvent={this.onClickEvent}
                />
            </SafeAreaView>
        );
    }
}