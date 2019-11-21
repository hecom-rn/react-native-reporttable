import React from 'react';
import {View} from 'react-native';
import ReportTableView from './ReportTableView';

interface Props {
 
}

export default class ReportTable extends React.PureComponent<Props> {
 
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ReportTableView
                {...this.props}
            >
            </ReportTableView>
        );
    }
}