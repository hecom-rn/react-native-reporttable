/**
 * ReportTableView.ios.js
 *
 * iOS-specific native view wrapper.
 * On iOS with New Architecture (Fabric) the component is registered via
 * codegenNativeComponent; commands are invoked via codegenNativeCommands.
 * Falls back to the legacy UIManager path when the old architecture is active.
 */
import React from 'react';
import { findNodeHandle, UIManager } from 'react-native';

import NativeReportTableComponent, {
    Commands,
} from './ReportTableNativeComponent';

export default class ReportTableView extends React.Component {
    /**
     * Scroll to a specific cell.
     * Accepts [lineX, lineY, offsetX, offsetY, animated] array (old-arch
     * compatibility) or an options object.
     */
    scrollTo = (params) => {
        const ref = findNodeHandle(this);
        if (!ref) return;

        // params may be either an array (legacy call from Wrapper) or object
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
                ref,
                UIManager.getViewManagerConfig('ReportTable').Commands.scrollTo,
                [lineX, lineY, offsetX, offsetY, animated],
            );
        }
    };

    /**
     * Update a sub-range of cells.
     * params = [dataJSON, y, x] (legacy array) or { data, y, x }
     */
    updateData = (params) => {
        const ref = findNodeHandle(this);
        if (!ref) return;

        let data, y, x;
        if (Array.isArray(params)) {
            [data, y = 0, x = 0] = params;
        } else {
            ({ data, y = 0, x = 0 } = params || {});
        }

        // Ensure data is a JSON string
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data ?? []);

        if (Commands) {
            Commands.updateData(this._nativeRef, dataStr, y, x);
        } else {
            UIManager.dispatchViewManagerCommand(
                ref,
                UIManager.getViewManagerConfig('ReportTable').Commands.updateData,
                [dataStr, y, x],
            );
        }
    };

    /**
     * Splice rows into the data source.
     * params = [configArray] (legacy) or configArray directly
     */
    spliceData = (params) => {
        const ref = findNodeHandle(this);
        if (!ref) return;

        // The Wrapper always passes [configArray]; extract the inner array
        const config = Array.isArray(params) && Array.isArray(params[0]) ? params[0] : params;
        const configStr = typeof config === 'string' ? config : JSON.stringify(config ?? []);

        if (Commands) {
            Commands.spliceData(this._nativeRef, configStr);
        } else {
            UIManager.dispatchViewManagerCommand(
                ref,
                UIManager.getViewManagerConfig('ReportTable').Commands.spliceData,
                [configStr],
            );
        }
    };

    scrollToBottom = () => {
        const ref = findNodeHandle(this);
        if (!ref) return;

        if (Commands) {
            Commands.scrollToBottom(this._nativeRef);
        } else {
            UIManager.dispatchViewManagerCommand(
                ref,
                UIManager.getViewManagerConfig('ReportTable').Commands.scrollToBottom,
                undefined,
            );
        }
    };

    render() {
        // Serialize complex props that are typed as `string` in the codegen spec.
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
        };

        // replenishColumnsWidthConfig is typed as an object in codegen, pass as-is
        // ignoreLocks is typed as ReadonlyArray<Int32>, pass as-is

        return (
            <NativeReportTableComponent
                ref={(ref) => (this._nativeRef = ref)}
                {...rest}
                {...serializedProps}
                replenishColumnsWidthConfig={replenishColumnsWidthConfig}
                ignoreLocks={ignoreLocks}
            />
        );
    }
}
