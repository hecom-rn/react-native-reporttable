import React from 'react';
import { PanResponder, ScrollView, UIManager, findNodeHandle } from 'react-native';
import * as NativeComponentRegistry from 'react-native/Libraries/NativeComponent/NativeComponentRegistry';
import {
    convertDataSourceToVTable,
    buildVTableTheme,
    convertUpdateData,
    convertSpliceData,
    computeInitialFrozenColCount,
} from './vtableDataConverter';

const COMPONENT_NAME = 'RNReportTable';

const __INTERNAL_VIEW_CONFIG = {
    uiViewClassName: COMPONENT_NAME,
    bubblingEventTypes: {},
    directEventTypes: {
        topClickEvent: { registrationName: 'onClickEvent' },
        topScroll: { registrationName: 'onScroll' },
        topScrollEnd: { registrationName: 'onScrollEnd' },
        topContentSize: { registrationName: 'onContentSize' },
    },
    validAttributes: {
        records: true,
        columns: true,
        theme: true,
        mergedCells: true,
        customCellStyle: true,
        customCellStyleArrangement: true,
        widthMode: true,
        frozenColCount: true,
        frozenRowCount: true,
        lineColor: true,
        disableZoom: true,
        showBorder: true,
        permutable: true,
        frozenAbility: true,
        ignoreLocks: true,
        doubleClickZoom: true,
        itemConfig: true,
        progressStyle: true,
        replenishColumnsWidthConfig: true,
        onClickEvent: true,
        onScroll: true,
        onScrollEnd: true,
        onContentSize: true,
    },
};

const NativeReportTable = NativeComponentRegistry.get(
    COMPONENT_NAME,
    () => __INTERNAL_VIEW_CONFIG,
);

export default class ReportTableWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            headerHeight: 0,
        };
        this.showHeader = true;
        this.scrollY = 0;
        this._vtableData = this._buildVTableData(props);

        // PanResponder to link table area swipes to outer ScrollView (hide header)
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {},
            onPanResponderMove: (evt, gs) => {
                if (this.state.headerHeight === 0) return;
                if (gs.dy < 0 && this.showHeader) {
                    this._scrollView &&
                        this._scrollView.scrollTo({ x: 0, y: -gs.dy + this.scrollY, animated: true });
                }
            },
            onPanResponderRelease: () => {},
        });
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
            frozenRows = 0,
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
            return { records: '[]', columns: '[]', theme: '{}', mergedCells: '[]', customCellStyle: '[]', customCellStyleArrangement: '[]', widthMode: 'autoWidth', frozenColCount: 0, frozenRowCount: 0 };
        }

        const { records, columns, mergedCells, customCellStyle, customCellStyleArrangement } = convertDataSourceToVTable(data, {
            frozenRows: frozenRows || 1, // at least 1 header row for conversion
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

        // Compute effective frozenColCount from frozenAbility initial locked state
        const colCount = data[0]?.length ?? 0;
        const effectiveFrozenColCount = computeInitialFrozenColCount(frozenAbility, frozenColumns, colCount);

        // VTable frozenRowCount: column titles are always the header (from frozenRows=1 in converter).
        // VTable's frozenRowCount means additional body rows to freeze.
        // If user wants frozenRows=1 (just header), VTable should freeze 0 body rows.
        // If user wants frozenRows=2, VTable should freeze 1 body row.
        const vtableFrozenRowCount = Math.max(0, (frozenRows || 1) - 1);

        return {
            records: JSON.stringify(records),
            columns: JSON.stringify(columns),
            theme: JSON.stringify(theme),
            mergedCells: JSON.stringify(mergedCells),
            customCellStyle: JSON.stringify(customCellStyle),
            customCellStyleArrangement: JSON.stringify(customCellStyleArrangement),
            widthMode: 'autoWidth',
            frozenColCount: effectiveFrozenColCount,
            frozenRowCount: vtableFrozenRowCount,
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
            keyIndex: keyIndex ?? 0,
            rowIndex: rowIndex ?? 0,
            columnIndex: columnIndex ?? 0,
            verticalCount: verticalCount ?? 1,
            horizontalCount: horizontalCount ?? 1,
        });
    };

    _onScroll = (event) => {
        const { translateX, translateY, scale } = event.nativeEvent;
        this.props.onScroll && this.props.onScroll({
            translateX: translateX ?? 0,
            translateY: translateY ?? 0,
            scale: scale ?? 1.0,
        });
    };

    _onScrollEnd = (event) => {
        const { isEnd } = event.nativeEvent;
        this.props.onScrollEnd && this.props.onScrollEnd(isEnd !== false);
    };

    _onContentSize = (event) => {
        const { width, height } = event.nativeEvent;
        this.props.onContentSize && this.props.onContentSize({ width: width ?? 0, height: height ?? 0 });
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

        const {
            records, columns, theme, mergedCells,
            customCellStyle, customCellStyleArrangement,
            widthMode, frozenColCount, frozenRowCount,
        } = this._vtableData;

        return (
            <ScrollView
                ref={(ref) => (this._scrollView = ref)}
                style={{ flex: 1 }}
                scrollEventThrottle={1}
                bounces={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                stickyHeaderIndices={headerView ? [1] : undefined}
                onScroll={(event) => {
                    this.scrollY = event.nativeEvent.contentOffset.y;
                    if (this.state.headerHeight > 0) {
                        this.showHeader = event.nativeEvent.contentOffset.y < this.state.headerHeight;
                    } else {
                        this.showHeader = false;
                    }
                }}
            >
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
                    {headerView && headerView()}
                </HeaderComponent>

                <NativeReportTable
                    ref={(ref) => (this._tableRef = ref)}
                    style={{ width: size?.width || '100%', height: size?.height || 300 }}
                    records={records}
                    columns={columns}
                    theme={theme}
                    mergedCells={mergedCells}
                    customCellStyle={customCellStyle}
                    customCellStyleArrangement={customCellStyleArrangement}
                    widthMode={widthMode}
                    frozenColCount={frozenColCount}
                    frozenRowCount={frozenRowCount}
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
                    {...this.panResponder.panHandlers}
                />
            </ScrollView>
        );
    }
}
