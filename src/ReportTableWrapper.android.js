import React from 'react';
import { PanResponder, ScrollView } from 'react-native';
import ReportTableView from './ReportTableView';

/**
 * Android wrapper component.
 * Manages header view + ScrollView + native ReportTable.
 * For Fabric/New Architecture, props are passed individually
 * (data as JSON string, cellMinWidth/cellMinHeight/cellMaxWidth as numbers).
 */
export default class ReportTableWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            headerHeight: 0,
        };

        this.showHeader = true;
        this.scrollY = 0;

        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {},
            onPanResponderMove: (evt, gs) => {
                if (this.state.headerHeight == 0) return;
                if (gs.dy < 0 && this.showHeader) {
                    this.scrollView &&
                        this.scrollView.scrollTo(
                            { x: 0, y: -gs.dy + this.scrollY, animated: true },
                            1,
                        );
                }
            },
            onPanResponderRelease: () => {},
        });
    }

    render() {
        const { headerHeight } = this.state;
        const {
            headerView,
            size,
            headerViewOrientation,
            HeaderComponent = ScrollView,
            data,
            cellMinWidth,
            cellMinHeight,
            cellMaxWidth,
            columnsWidthMap,
            // Fabric props (passed through directly)
            onScrollEnd,
            onScroll,
            onContentSize,
            disableZoom,
            frozenRows,
            frozenPoint,
            frozenCount,
            frozenColumns,
            frozenAbility,
            permutable,
            ignoreLocks,
            doubleClickZoom,
            replenishColumnsWidthConfig,
            lineColor,
            itemConfig,
            onClickEvent,
        } = this.props;

        return (
            <ScrollView
                ref={(ref) => (this.scrollView = ref)}
                style={{ flex: 1 }}
                scrollEventThrottle={1}
                stickyHeaderIndices={[1]}
                onScroll={(event) => {
                    this.scrollY = event.nativeEvent.contentOffset.y;
                    if (event.nativeEvent.contentOffset.y >= headerHeight) {
                        this.showHeader = false;
                    } else {
                        this.showHeader = true;
                    }
                }}
            >
                <HeaderComponent
                    horizontal={headerViewOrientation != 'vertical'}
                    showsHorizontalScrollIndicator={false}
                    onLayout={(event) => {
                        const {
                            nativeEvent: {
                                layout: { height: h },
                            },
                        } = event;
                        this.setState({ headerHeight: h });
                    }}
                >
                    {headerView && headerView()}
                </HeaderComponent>

                <ReportTableView
                    ref={'AndroidReportTableView'}
                    onScrollEnd={onScrollEnd}
                    onScroll={onScroll}
                    onContentSize={onContentSize}
                    disableZoom={disableZoom}
                    frozenRows={frozenRows}
                    frozenColumns={frozenColumns}
                    frozenAbility={frozenAbility}
                    permutable={permutable}
                    ignoreLocks={ignoreLocks}
                    doubleClickZoom={doubleClickZoom}
                    replenishColumnsWidthConfig={replenishColumnsWidthConfig}
                    lineColor={lineColor}
                    itemConfig={itemConfig}
                    onClickEvent={({ nativeEvent: data }) => {
                        if (data) {
                            const { keyIndex, rowIndex, columnIndex } = data;
                            onClickEvent &&
                                onClickEvent({ keyIndex, rowIndex, columnIndex });
                        }
                    }}
                    // Fabric: individual props instead of a single packed "data" object
                    data={data}
                    cellMinWidth={cellMinWidth}
                    cellMinHeight={cellMinHeight}
                    cellMaxWidth={cellMaxWidth}
                    columnsWidthMap={columnsWidthMap}
                    style={{ width: size.width, height: size.height }}
                    {...this.panResponder.panHandlers}
                />
            </ScrollView>
        );
    }

    scrollTo = (params) => {
        this.refs.AndroidReportTableView &&
            this.refs.AndroidReportTableView.scrollTo(params);
    };

    scrollToBottom = () => {
        this.refs.AndroidReportTableView &&
            this.refs.AndroidReportTableView.scrollToBottom();
    };

    updateData = (params) => {
        this.refs.AndroidReportTableView &&
            this.refs.AndroidReportTableView.updateData(params);
    };

    spliceData = (params) => {
        this.refs.AndroidReportTableView &&
            this.refs.AndroidReportTableView.spliceData(params);
    };
}
