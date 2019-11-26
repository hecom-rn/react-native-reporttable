import React from 'react';
import { requireNativeComponent } from 'react-native';

export default class ReportTableView extends React.Component {
    render() {
        return <NativeReportTable {...this.props} />
    }
}
const NativeReportTable= requireNativeComponent('ReportTable', ReportTableView);