import React from 'react';
import { findNodeHandle, UIManager } from 'react-native';

import NativeReportTableComponent, {
    Commands,
} from './ReportTableNativeComponent';

const DEFAULT_MIN_WIDTH = 50;
const DEFAULT_MAX_WIDTH = 120;
const DEFAULT_MIN_HEIGHT = 40;
const DEFAULT_DOUBLE_CLICK_ZOOM = true;

const ensureJSONString = (value, fallback) => {
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value ?? fallback);
    } catch (error) {
        return JSON.stringify(fallback);
    }
};

const coerceNumber = (value, fallback) =>
    typeof value === 'number' ? value : fallback;

const coerceBoolean = (value, fallback) =>
    typeof value === 'boolean' ? value : fallback;

const isLegacyAndroidPayload = (value) =>
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value.data !== undefined || value.minWidth !== undefined || value.maxWidth !== undefined);

export default class ReportTableView extends React.Component {
    scrollTo = (params) => {
        const normalized = this._normalizeScrollParams(params);
        if (this._canUseFabricCommands()) {
            Commands.scrollTo(
                this._nativeRef,
                normalized.lineX,
                normalized.lineY,
                normalized.offsetX,
                normalized.offsetY,
                normalized.animated,
            );
        } else {
            this._dispatchLegacyCommand('scrollTo', [normalized]);
        }
    };

    updateData = (params) => {
        const { dataStr, y, x } = this._normalizeUpdateParams(params);
        if (this._canUseFabricCommands()) {
            Commands.updateData(this._nativeRef, dataStr, y, x);
        } else {
            this._dispatchLegacyCommand('updateData', [{ data: dataStr, y, x }]);
        }
    };

    spliceData = (params) => {
        const configArray = this._normalizeSpliceParams(params);
        if (this._canUseFabricCommands()) {
            Commands.spliceData(this._nativeRef, JSON.stringify(configArray));
        } else {
            this._dispatchLegacyCommand('spliceData', [configArray]);
        }
    };

    scrollToBottom = () => {
        if (this._canUseFabricCommands()) {
            Commands.scrollToBottom(this._nativeRef);
        } else {
            this._dispatchLegacyCommand('scrollToBottom');
        }
    };

    _canUseFabricCommands = () =>
        Boolean(global?.nativeFabricUIManager && Commands && this._nativeRef);

    _normalizeScrollParams = (params) => {
        if (Array.isArray(params)) {
            const [lineX = 0, lineY = 0, offsetX = 0, offsetY = 0, animated = true] = params;
            return { lineX, lineY, offsetX, offsetY, animated };
        }
        const { lineX = 0, lineY = 0, offsetX = 0, offsetY = 0, animated = true } = params || {};
        return { lineX, lineY, offsetX, offsetY, animated };
    };

    _normalizeUpdateParams = (params) => {
        if (Array.isArray(params)) {
            const [data, y = 0, x = 0] = params;
            return { dataStr: this._toJSONString(data, []), y, x };
        }
        const { data, y = 0, x = 0 } = params || {};
        return { dataStr: this._toJSONString(data, []), y, x };
    };

    _normalizeSpliceParams = (params) => {
        const source = Array.isArray(params) ? params : [params];
        return source
            .filter(Boolean)
            .map((item) => ({
                data: this._toJSONString(item?.data, []),
                y: item?.y ?? 0,
                l: item?.l ?? 0,
            }));
    };

    _toJSONString = (value, fallback) => {
        if (typeof value === 'string') {
            return value;
        }
        try {
            return JSON.stringify(value ?? fallback);
        } catch (error) {
            return JSON.stringify(fallback);
        }
    };

    _dispatchLegacyCommand = (command, args) => {
        const handle = findNodeHandle(this);
        if (!handle || !UIManager) {
            return;
        }
        const config = UIManager.getViewManagerConfig('ReportTable');
        const commandId = config?.Commands?.[command] ?? command;
        UIManager.dispatchViewManagerCommand(handle, commandId, args);
    };

    _normalizeIgnoreLocks = (value) => {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.map((entry) => parseInt(entry, 10) || 0);
    };

    _serializeProps = () => {
        const {
            data,
            columnsWidthMap,
            frozenAbility,
            replenishColumnsWidthConfig,
            ignoreLocks,
            minWidth,
            maxWidth,
            minHeight,
            doubleClickZoom,
            ...forwardProps
        } = this.props;

        const legacyBundle = isLegacyAndroidPayload(data) ? data : null;
        const resolvedData = legacyBundle ? legacyBundle.data : data;
        const resolvedColumnsWidthMap = columnsWidthMap ?? legacyBundle?.columnsWidthMap;
        const resolvedFrozenAbility = frozenAbility ?? legacyBundle?.frozenAbility;
        const resolvedReplenishConfig =
            replenishColumnsWidthConfig ?? legacyBundle?.replenishColumnsWidthConfig;

        return {
            ...forwardProps,
            minWidth: coerceNumber(minWidth, legacyBundle?.minWidth ?? DEFAULT_MIN_WIDTH),
            maxWidth: coerceNumber(maxWidth, legacyBundle?.maxWidth ?? DEFAULT_MAX_WIDTH),
            minHeight: coerceNumber(minHeight, legacyBundle?.minHeight ?? DEFAULT_MIN_HEIGHT),
            doubleClickZoom: coerceBoolean(
                doubleClickZoom,
                legacyBundle?.doubleClickZoom ?? DEFAULT_DOUBLE_CLICK_ZOOM,
            ),
            data: ensureJSONString(resolvedData, []),
            columnsWidthMap: ensureJSONString(resolvedColumnsWidthMap, {}),
            frozenAbility: ensureJSONString(resolvedFrozenAbility, {}),
            replenishColumnsWidthConfig: ensureJSONString(resolvedReplenishConfig, {}),
            ignoreLocks: this._normalizeIgnoreLocks(ignoreLocks ?? legacyBundle?.ignoreLocks),
        };
    };

    render() {
        const serializedProps = this._serializeProps();
        return (
            <NativeReportTableComponent
                ref={(ref) => (this._nativeRef = ref)}
                {...serializedProps}
            />
        );
    }
}
