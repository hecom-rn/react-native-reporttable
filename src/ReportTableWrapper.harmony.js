import React from 'react';
import { View, ScrollView, UIManager, findNodeHandle, requireNativeComponent } from 'react-native';
import {
    convertDataSourceToVTable,
    buildVTableTheme,
    convertUpdateData,
    convertSpliceData,
} from './vtableDataConverter';

const NativeReportTable = requireNativeComponent('RNReportTable');

export default class ReportTableWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            headerHeight: 0,
        };
        this.showHeader = true;
        this.scrollY = 0;
        this._vtableData = this._buildVTableData(props);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this._vtableData = this._buildVTableData(nextProps);
    }

    /**
     * Build VTable-compatible data from ReportTable props.
     */
    _buildVTableData = (props) => {
        const {
            data,
            frozenRows = 1,
            itemConfig,
            columnsWidthMap,
            minWidth,
            maxWidth,
            frozenColumns = 0,
            permutable = false,
            frozenAbility,
            ignoreLocks = [],
        } = props;

        if (!data || data.length === 0) {
            return { records: '[]', columns: '[]', theme: '{}' };
        }

        const { records, columns } = convertDataSourceToVTable(data, {
            frozenRows,
            itemConfig,
            columnsWidthMap,
            minWidth,
            maxWidth,
            frozenColumns,
            permutable,
            frozenAbility,
            ignoreLocks,
        });

        const theme = buildVTableTheme(props);

        return {
            records: JSON.stringify(records),
            columns: JSON.stringify(columns),
            theme: JSON.stringify(theme),
        };
    };

    // ---- Public API (called by ReportTable.js) ----

    scrollTo = (params) => {
        const { lineX = 0, lineY = 0, offsetX = 0, offsetY = 0, animated = true } = params || {};
        UIManager.dispatchViewManagerCommand(
            this._getTableHandle(),
            'scrollTo',
            [lineX, lineY, offsetX, offsetY, animated],
        );
    };

    scrollToBottom = () => {
        UIManager.dispatchViewManagerCommand(
            this._getTableHandle(),
            'scrollToBottom',
            [],
        );
    };

    updateData = (params) => {
        const { data = [[]], x = 0, y = 0 } = params || {};
        const frozenRows = this.props.frozenRows || 1;
        const converted = convertUpdateData(data, x, y, frozenRows);
        UIManager.dispatchViewManagerCommand(
            this._getTableHandle(),
            'updateData',
            [JSON.stringify(converted)],
        );
    };

    spliceData = (params) => {
        let arr = params;
        if (!Array.isArray(arr)) {
            arr = [params];
        }
        const colCount = this.props.data?.[0]?.length ?? 0;
        const operations = convertSpliceData(arr, colCount);
        UIManager.dispatchViewManagerCommand(
            this._getTableHandle(),
            'spliceData',
            [JSON.stringify(operations)],
        );
    };

    // ---- Event handlers ----

    _onClickEvent = (event) => {
        const { keyIndex, rowIndex, columnIndex, verticalCount, horizontalCount } = event.nativeEvent;
        this.props.onClickEvent && this.props.onClickEvent({
            keyIndex,
            rowIndex,
            columnIndex,
            verticalCount,
            horizontalCount,
        });
    };

    _onScroll = (event) => {
        const { translateX, translateY, scale } = event.nativeEvent;
        this.props.onScroll && this.props.onScroll({ translateX, translateY, scale: scale ?? 1.0 });
    };

    _onScrollEnd = (event) => {
        const { isEnd } = event.nativeEvent;
        this.props.onScrollEnd && this.props.onScrollEnd(isEnd);
    };

    _onContentSize = (event) => {
        const { width, height } = event.nativeEvent;
        this.props.onContentSize && this.props.onContentSize({ width, height });
    };

    // ---- Private helpers ----

    _getTableHandle = () => {
        return findNodeHandle(this._tableRef);
    };

    // ---- Render ----

    render() {
        const {
            headerView,
            headerViewOrientation,
            HeaderComponent = ScrollView,
            size,
            frozenColumns,
            frozenRows,
            lineColor,
            disableZoom,
            permutable,
            frozenAbility,
            ignoreLocks,
            doubleClickZoom,
            replenishColumnsWidthConfig,
            progressStyle,
            itemConfig,
            showBorder,
        } = this.props;

        const { records, columns, theme } = this._vtableData;

        return (
            <ScrollView
                ref={(ref) => (this._scrollView = ref)}
                style={{ flex: 1 }}
                scrollEventThrottle={1}
                stickyHeaderIndices={headerView ? [1] : undefined}
                onScroll={(event) => {
                    this.scrollY = event.nativeEvent.contentOffset.y;
                    if (this.state.headerHeight > 0) {
                        this.showHeader = event.nativeEvent.contentOffset.y < this.state.headerHeight;
                    }
                }}
            >
                {headerView && (
                    <HeaderComponent
                        horizontal={headerViewOrientation !== 'vertical'}
                        showsHorizontalScrollIndicator={false}
                        onLayout={(event) => {
                            const { height } = event.nativeEvent.layout;
                            if (height !== this.state.headerHeight) {
                                this.setState({ headerHeight: height });
                            }
                        }}
                    >
                        {headerView()}
                    </HeaderComponent>
                )}

                <NativeReportTable
                    ref={(ref) => (this._tableRef = ref)}
                    style={{ width: size?.width || '100%', height: size?.height || 300 }}
                    records={records}
                    columns={columns}
                    theme={theme}
                    frozenColCount={frozenColumns || 0}
                    frozenRowCount={frozenRows || 1}
                    lineColor={lineColor || '#e8e8e8'}
                    disableZoom={disableZoom || false}
                    showBorder={showBorder || false}
                    permutable={permutable || false}
                    frozenAbility={frozenAbility ? JSON.stringify(frozenAbility) : '{}'}
                    ignoreLocks={ignoreLocks || []}
                    doubleClickZoom={doubleClickZoom !== false}
                    itemConfig={itemConfig ? JSON.stringify(itemConfig) : '{}'}
                    progressStyle={progressStyle ? JSON.stringify(progressStyle) : '{}'}
                    replenishColumnsWidthConfig={
                        replenishColumnsWidthConfig ? JSON.stringify(replenishColumnsWidthConfig) : '{}'
                    }
                    onClickEvent={this._onClickEvent}
                    onScroll={this._onScroll}
                    onScrollEnd={this._onScrollEnd}
                    onContentSize={this._onContentSize}
                />
            </ScrollView>
        );
    }
}
