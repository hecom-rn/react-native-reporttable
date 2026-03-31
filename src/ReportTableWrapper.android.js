import React from 'react';
import { PanResponder, ScrollView } from 'react-native';
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
    }

    render() {
        let {headerHeight} = this.state;
        const {
            headerView,
            size,
            headerViewOrientation,
            HeaderComponent = ScrollView,
            ...tableProps
        } = this.props;
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
                    ref={(ref) => (this.table = ref)}
                    {...tableProps}
                    size={size}
                    onClickEvent={({nativeEvent: data}) => {
                        if (data) {
                            const {keyIndex, rowIndex, columnIndex, textColor} = data;
                            this.props.onClickEvent && this.props.onClickEvent({keyIndex, rowIndex, columnIndex});
                        }
                    }}
                    style={{width: size.width, height: size.height}}
                    {...this.panResponder.panHandlers}
                />
            </ScrollView>
        )
    }

    scrollTo = (params) => {
        this.table && this.table.scrollTo(params);
    }
    scrollToBottom = () => {
        this.table && this.table.scrollToBottom();
    }

    updateData = (params) => {
        this.table && this.table.updateData(params);
    }

    spliceData = (params) => {
        this.table && this.table.spliceData(params);
    }
}

