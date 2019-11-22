import React from 'react';
import {SafeAreaView} from 'react-native';
import ReportTableView from './ReportTableView';

interface Props {
}

export default class ReportTable extends React.PureComponent<Props> {
 
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <SafeAreaView style={{flex: 1}}>
                <ReportTableView {...this.props} />
            </SafeAreaView>
        );
    }
}