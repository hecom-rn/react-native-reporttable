/**
 * ReportTableView.js
 *
 * Android native view wrapper.
 * Uses codegenNativeComponent for Fabric/New Architecture,
 * falls back to UIManager for Paper/Old Architecture.
 */
import React from 'react';
import { findNodeHandle, UIManager } from 'react-native';

import NativeReportTableComponent, {
    Commands,
} from './ReportTableNativeComponent';

export default class ReportTableView extends React.Component {
    /**
     * Scroll to a specific cell.
     * params may be an array [lineX, lineY, offsetX, offsetY, animated] (legacy)
     * or an options object.
     */
    scrollTo = (params) => {
        let lineX, lineY, offsetX, offsetY, animated;
        if (Array.isArray(params)) {
            [lineX = 0, lineY = 0, offsetX = 0, offsetY = 0, animated = true] = params;
        } else {
            ({ lineX = 0, lineY = 0, offsetX = 0, offsetY = 0, animated = true } = params || {});
        }

        if (Commands) {
            Commands.scrollTo(this._nativeRef, lineX, lineY, offsetX, offsetY, animated);
        } else {
            UIManager.dispatchViewManagerCommand(
                findNodeHandle(this),
                UIManager.getViewManagerConfig('ReportTable').Commands.scrollTo,
                [{ lineX, lineY, offsetX, offsetY, animated }],
            );
        }
    };

    /**
     * Update a sub-range of cells.
     * params = [dataJSON, y, x] (legacy array) or { data, y, x }
     */
    updateData = (params) => {
        let data, y, x;
        if (Array.isArray(params)) {
            [data, y = 0, x = 0] = params;
        } else {
            ({ data, y = 0, x = 0 } = params || {});
        }

        const dataStr = typeof data === 'string' ? data : JSON.stringify(data ?? []);

        if (Commands) {
            Commands.updateData(this._nativeRef, dataStr, y, x);
        } else {
            UIManager.dispatchViewManagerCommand(
                findNodeHandle(this),
                UIManager.getViewManagerConfig('ReportTable').Commands.updateData,
                [{ data: dataStr, x, y }],
            );
        }
    };

    /**
     * Splice rows into the data source.
     * params = [configArray] (legacy) or configArray directly
     */
    spliceData = (params) => {
        const config = Array.isArray(params) && Array.isArray(params[0]) ? params[0] : params;

        // Android native expects each item's 'data' field as a JSON string
        const processedConfig = (config || []).map((item) => ({
            ...item,
            data:
                typeof item.data === 'string'
                    ? item.data
                    : JSON.stringify(item.data ?? []),
        }));

        if (Commands) {
            Commands.spliceData(this._nativeRef, JSON.stringify(processedConfig));
        } else {
            UIManager.dispatchViewManagerCommand(
                findNodeHandle(this),
                UIManager.getViewManagerConfig('ReportTable').Commands.spliceData,
                [processedConfig],
            );
        }
    };

    scrollToBottom = () => {
        if (Commands) {
            Commands.scrollToBottom(this._nativeRef);
        } else {
            UIManager.dispatchViewManagerCommand(
                findNodeHandle(this),
                UIManager.getViewManagerConfig('ReportTable').Commands.scrollToBottom,
                undefined,
            );
        }
    };

    render() {
        const {
            data,
            columnsWidthMap,
            frozenAbility,
            replenishColumnsWidthConfig,
            ignoreLocks,
            ...rest
        } = this.props;

        const serializedProps = {
            data: typeof data === 'string' ? data : JSON.stringify(data ?? []),
            columnsWidthMap:
                typeof columnsWidthMap === 'string'
                    ? columnsWidthMap
                    : JSON.stringify(columnsWidthMap ?? {}),
            frozenAbility:
                typeof frozenAbility === 'string'
                    ? frozenAbility
                    : JSON.stringify(frozenAbility ?? {}),
            replenishColumnsWidthConfig:
                typeof replenishColumnsWidthConfig === 'string'
                    ? replenishColumnsWidthConfig
                    : JSON.stringify(replenishColumnsWidthConfig ?? {}),
        };

        return (
            <NativeReportTableComponent
                ref={(ref) => (this._nativeRef = ref)}
                {...rest}
                {...serializedProps}
                ignoreLocks={ignoreLocks}
            />
        );
    }
}
