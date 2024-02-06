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

    updateData = (params) => {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(this),
            UIManager.getViewManagerConfig('ReportTable').Commands.updateData,
            params
        )
    }

    scrollToBottom = () => {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(this),
            UIManager.getViewManagerConfig('ReportTable').Commands.scrollToBottom,
            undefined
        )
    }

    render() {
        return <NativeReportTable {...this.props} />
    }
}
const NativeReportTable = requireNativeComponent('ReportTable', ReportTableView);
