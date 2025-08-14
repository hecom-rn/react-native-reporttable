import React from 'react';
import { PanResponder, ScrollView, UIManager } from 'react-native';
import ReportTableView from './ReportTableView';

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
            onPanResponderGrant: () => {
            },
            onPanResponderMove: (evt, gs) => {
                if (this.state.headerHeight == 0) return;
                if (gs.dy < 0 && this.showHeader) {
                    this.scrollView &&
                    this.scrollView.scrollTo({x: 0, y: -gs.dy + this.scrollY, animated: true}, 1);
                }
            },
            onPanResponderRelease: (evt, gs) => {
            }
        });
        this.data = this._toAndroidData(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.data = this._toAndroidData(nextProps);
    }

    render() {
        let {headerHeight} = this.state;
        const {headerView, size, headerViewOrientation, HeaderComponent = ScrollView} = this.props;
        return (
            <ScrollView
                ref={(ref) => (this.scrollView = ref)}
                style={{flex: 1}}
                scrollEventThrottle={1}
                stickyHeaderIndices={[1]}
                onScroll={(event) => {
                    {
                        this.scrollY = event.nativeEvent.contentOffset.y;
                        if (event.nativeEvent.contentOffset.y >= headerHeight) {
                            this.showHeader = false;
                        } else {
                            this.showHeader = true;
                        }
                    }
                }}
            >
                <HeaderComponent
                    horizontal={headerViewOrientation != 'vertical'}
                    showsHorizontalScrollIndicator={false}
                    onLayout={(event) => {
                        const {
                            nativeEvent: {
                                layout: {height},
                            },
                        } = event;
                        this.setState({headerHeight: height})
                    }}
                >
                    {headerView && headerView()}
                </HeaderComponent>

                <ReportTableView
                    ref={'AndroidReportTableView'}
                    onScrollEnd={this.props.onScrollEnd}
                    onScroll={this.props.onScroll}
                    onContentSize={this.props.onContentSize}
                    disableZoom={this.props.disableZoom}
                    frozenRows={this.props.frozenRows}
                    frozenPoint={this.props.frozenPoint}
                    frozenCount={this.props.frozenCount}
                    frozenColumns={this.props.frozenColumns}
                    frozenAbility={this.props.frozenAbility}
                    permutable={this.props.permutable}
                    ignoreLocks={this.props.ignoreLocks}
                    doubleClickZoom={this.props.doubleClickZoom}
                    replenishColumnsWidthConfig={this.props.replenishColumnsWidthConfig}
                    progressStyle={this.props.progressStyle}
                    lineColor={this.props.lineColor}
                    itemConfig={this.props.itemConfig}
                    onClickEvent={({nativeEvent: data}) => {
                        if (data) {
                            const {keyIndex, rowIndex, columnIndex, textColor} = data;
                            this.props.onClickEvent && this.props.onClickEvent({keyIndex, rowIndex, columnIndex});
                        }
                    }}
                    data={this.data}
                    style={{width: size.width, height: size.height}}
                    {...this.panResponder.panHandlers}
                />
            </ScrollView>
        )
    }

    scrollTo = (params) => {
        UIManager.dispatchViewManagerCommand(
            this._getTableHandle(),
            'scrollTo',
            [params]
        );
    }
    scrollToBottom = () => {
        UIManager.dispatchViewManagerCommand(
            this._getTableHandle(),
            'scrollToBottom',
            undefined
        );
    }

    updateData = (params) => {
        params.data = JSON.stringify(params.data);
        UIManager.dispatchViewManagerCommand(
            this._getTableHandle(),
            'updateData',
            [params]
        );
    }

    spliceData = (params) => {
        params?.forEach((item) => {
            item.data = JSON.stringify(item.data);
        })
        UIManager.dispatchViewManagerCommand(
            this._getTableHandle(),
            'spliceData',
            [params]
        );
    }

    _getTableHandle = () => {
        return ReactNative.findNodeHandle(this.refs.AndroidReportTableView);
    };

    _toAndroidData = (props) => {
        const {data, minWidth, minHeight, maxWidth, columnsWidthMap} = props;
        return {
            data: data && JSON.stringify(data),
            columnsWidthMap: columnsWidthMap && JSON.stringify(columnsWidthMap),
            minWidth: minWidth,
            minHeight: minHeight,
            maxWidth: maxWidth,
        };
    }
}

