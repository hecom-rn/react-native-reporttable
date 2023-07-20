import React from 'react';
import { findNodeHandle, requireNativeComponent, UIManager } from 'react-native';
export default class ReportTableView extends React.Component {

    scrollTo = (params) => {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(this),
            UIManager.getViewManagerConfig('ReportTable').Commands.scrollTo,
            params
        )
    }

    render() {
        return <NativeReportTable {...this.props} />
    }
}
const NativeReportTable = requireNativeComponent('ReportTable', ReportTableView);
