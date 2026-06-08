import React from 'react';
import { Alert, DeviceEventEmitter, PanResponder, ScrollView, UIManager, findNodeHandle } from 'react-native';
import * as NativeComponentRegistry from 'react-native/Libraries/NativeComponent/NativeComponentRegistry';
import {
    buildVTableTheme,
    computeInitialFrozenColCount,
    convertDataSourceToVTable,
    convertSpliceData,
    convertUpdateData,
} from './vtableDataConverter';

const COMPONENT_NAME = 'RNReportTable';

const __INTERNAL_VIEW_CONFIG = {
    uiViewClassName: COMPONENT_NAME,
    bubblingEventTypes: {},
    directEventTypes: {},
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
        this._nativeTag = null;
        this._eventSubscriptions = [];
        this._gestureStartScrollY = 0;
        this._vtableData = this._buildVTableData(props);

        // PanResponder: mirror Android behaviour.
        // While the header is visible, claim every touch start so RN owns the gesture
        // and only the outer ScrollView moves (pushing the header out of view).
        // Once the header is gone, release the gesture so VTable's WebView scrolls freely.
        this.panResponder = PanResponder.create({
            // Claim the gesture at touch-start whenever header is still visible.
            // This prevents VTable's WebView from getting touchstart and starting its
            // own internal scroll before we've had a chance to push the header away.
            onStartShouldSetPanResponder: () => this.showHeader && this.state.headerHeight > 0,
            onMoveShouldSetPanResponder: () => this.showHeader && this.state.headerHeight > 0,
            onPanResponderGrant: () => {
                this._gestureStartScrollY = this.scrollY;
            },
            onPanResponderMove: (evt, gs) => {
                if (this.state.headerHeight === 0) return;
                if (gs.dy < 0 && this.showHeader) {
                    const newY = Math.min(
                        -gs.dy + this._gestureStartScrollY,
                        this.state.headerHeight,
                    );
                    this._scrollView &&
                        this._scrollView.scrollTo({ x: 0, y: newY, animated: false });
                    this.scrollY = newY;
                    this.showHeader = this.scrollY < this.state.headerHeight;
                }
            },
            onPanResponderRelease: () => {},
            onPanResponderTerminate: () => {},
        });
    }

    componentDidMount() {
        this._setupEventListeners();
    }

    componentWillUnmount() {
        this._removeEventListeners();
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this._vtableData = this._buildVTableData(nextProps);
    }

    componentDidUpdate() {
        // Re-setup listeners if native tag changed (e.g., after re-render)
        const tag = this._tableRef ? findNodeHandle(this._tableRef) : null;
        if (tag !== this._nativeTag) {
            this._removeEventListeners();
            this._nativeTag = tag;
            this._setupEventListeners();
        }
    }

    _setupEventListeners = () => {
        const tag = this._tableRef ? findNodeHandle(this._tableRef) : null;
        if (!tag) return;
        this._nativeTag = tag;

        this._eventSubscriptions = [
            DeviceEventEmitter.addListener(
                `RNReportTable_clickEvent_${tag}`,
                (data) => {
                    this.props.onClickEvent && this.props.onClickEvent({
                        keyIndex: data.keyIndex ?? 0,
                        rowIndex: data.rowIndex ?? 0,
                        columnIndex: data.columnIndex ?? 0,
                        verticalCount: data.verticalCount ?? 1,
                        horizontalCount: data.horizontalCount ?? 1,
                    });
                }
            ),
            DeviceEventEmitter.addListener(
                `RNReportTable_scroll_${tag}`,
                (data) => {
                    const translateY = data.translateY ?? 0;
                    // When VTable scrolls back to the very top, scroll the outer ScrollView
                    // back to 0 so the header becomes visible again.
                    if (translateY === 0 && this._scrollView && this.state.headerHeight > 0) {
                        this._scrollView.scrollTo({ x: 0, y: 0, animated: false });
                        this.scrollY = 0;
                        this.showHeader = true;
                    }
                    this.props.onScroll && this.props.onScroll({nativeEvent: {
                        translateX: data.translateX ?? 0,
                        translateY,
                        scale: data.scale ?? 1.0,
                    }});
                }
            ),
            DeviceEventEmitter.addListener(
                `RNReportTable_scrollEnd_${tag}`,
                (data) => {
                    this.props.onScrollEnd && this.props.onScrollEnd(data.isEnd !== false);
                }
            ),
            DeviceEventEmitter.addListener(
                `RNReportTable_contentSize_${tag}`,
                (data) => {
                    this.props.onContentSize && this.props.onContentSize({nativeEvent:{
                        width: data.width ?? 0,
                        height: data.height ?? 0,
                    }});
                }
            ),
            DeviceEventEmitter.addListener(
                `RNReportTable_lockToggle_${tag}`,
                (data) => {
                    // Handle lock toggle: update frozenAbility and frozenColCount
                    this._handleLockToggle(data.col, data.locked);
                }
            ),
            DeviceEventEmitter.addListener(
                `RNReportTable_lockFailed_${tag}`,
                (_data) => {
                    Alert.alert('', '已超出最大冻结范围');
                }
            ),
        ];
    };

    _removeEventListeners = () => {
        this._eventSubscriptions.forEach(sub => sub && sub.remove());
        this._eventSubscriptions = [];
    };

    _handleLockToggle = (col, locked) => {
        // Emit click event with lock info - the parent component handles frozen logic
        // Following iOS pattern: clicking lock toggles frozenAbility state
        this.props.onClickEvent && this.props.onClickEvent({
            keyIndex: 0,
            rowIndex: 0,
            columnIndex: col,
            verticalCount: 1,
            horizontalCount: 1,
            lockToggle: { col, locked },
        });
    };

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
            minHeight = 40,
        } = props;

        if (!data || data.length === 0) {
            return {
                records: '[]', columns: '[]', theme: '{}', mergedCells: '[]',
                customCellStyle: '[]', customCellStyleArrangement: '[]',
                widthMode: 'autoWidth', frozenColCount: 0, frozenRowCount: 0,
            };
        }

        // Inject __minHeight so buildColumnStyle can compute correct vertical padding.
        const itemConfigWithMinHeight = Object.assign({}, itemConfig || {}, { __minHeight: minHeight ?? 40 });

        const { records, columns, mergedCells, customCellStyle, customCellStyleArrangement } = convertDataSourceToVTable(data, {
            frozenRows: frozenRows > 0 ? frozenRows : 1,
            itemConfig: itemConfigWithMinHeight,
            columnsWidthMap,
            minWidth,
            maxWidth,
            frozenColumns,
            permutable,
            frozenAbility,
            ignoreLocks,
        });

        const theme = buildVTableTheme(props);

        // Compute effective frozenColCount
        const colCount = data[0]?.length ?? 0;
        const effectiveFrozenColCount = computeInitialFrozenColCount(frozenAbility, frozenColumns, colCount);

        // frozenRowCount: data[0] always maps to VTable header (column titles).
        // frozenRows=0 or not set => no frozen body rows (vtableFrozenRowCount=0).
        // frozenRows=N => freeze N-1 additional body rows (N>=1 means data[0] is already the header).
        const vtableFrozenRowCount = frozenRows > 0 ? Math.max(0, frozenRows - 1) : 0;

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
            minHeight = 40,
        } = this.props;

        const {
            records, columns, theme, mergedCells,
            customCellStyle, customCellStyleArrangement,
            widthMode, frozenColCount, frozenRowCount,
        } = this._vtableData;

        const tableView = (
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
                itemConfig={JSON.stringify(Object.assign({}, itemConfig || {}, { __minHeight: minHeight ?? 40 }))}
                progressStyle={progressStyle ? JSON.stringify(progressStyle) : '{}'}
                replenishColumnsWidthConfig={
                    replenishColumnsWidthConfig ? JSON.stringify(replenishColumnsWidthConfig) : '{}'
                }
                {...this.panResponder.panHandlers}
            />
        );

        if (!headerView) {
            // No header: render table directly without outer ScrollView
            return tableView;
        }

        // With header: use ScrollView + stickyHeaderIndices pattern (like Android)
        // Index 0 = header, Index 1 = table (sticky)
        return (
            <ScrollView
                ref={(ref) => (this._scrollView = ref)}
                style={{ flex: 1 }}
                scrollEventThrottle={1}
                bounces={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                stickyHeaderIndices={[1]}
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
                    {headerView()}
                </HeaderComponent>

                {tableView}
            </ScrollView>
        );
    }
}
