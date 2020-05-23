import React from 'react';
import {View, ScrollView, PanResponder, Animated, Dimensions,
     DeviceEventEmitter} from 'react-native';
import ReportTableView from './ReportTableView';
import StickyHeader from './androidComp/StickyHeader';

const screenWidth =  Dimensions.get('window').width;
export default class ReportTableWrapper extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            scrollY: new Animated.Value(0),
            headHeight: -1,
            isShowShadow: true,
            cannotSeeHeader: false,
            isListener: true
        };
        this.headerHeight = this.props.headerView() && this.props.headerView().props.style
            && this.props.headerView().props.style.height;

        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponder:  (evt, gestureState) => true,
            onPanResponderGrant: (evt, gestureState) => {},
            onPanResponderMove: (evt, gs) => {
                // console.log(`gestureState.dx : ${gs.dx}   gestureState.dy : ${gs.dy}`);
                const currentDX = Math.abs(gs.dx);
                const currentDY = Math.abs(gs.dy);
                const {isShowShadow, cannotSeeHeader, isListener} = this.state;
                if(!isListener){
                    return;
                }
                if(!cannotSeeHeader){
                    if(currentDY >= 0 && currentDX > 0){ //左右滑动
                        if(isShowShadow){
                            this.setState({isShowShadow: false})
                        }
                    }else{ //竖直滑动
                        if(!isShowShadow){
                            this.setState({isShowShadow: true})
                        }
                    }

                }
            },
            onPanResponderRelease: (evt, gestureState) => {},
            onPanResponderTerminate: (evt, gestureState) => {},
        });
    }


    componentDidMount() {
        this.listener = DeviceEventEmitter.addListener('com.hecom.reporttable.clickData', (data) => {
            if(data){
                const {keyIndex, rowIndex, columnIndex} = data;
                this.props.onClickEvent && this.props.onClickEvent({keyIndex, rowIndex, columnIndex});
            }
        });
        if(!this.headerHeight){
            this.setState({
                isShowShadow: false,
                cannotSeeHeader: true,
                isListener: false})
        }
    }


    _onVerticalScroll = (event) => {
        const {isListener} = this.state;
        if(!isListener){
            return;
        }
        if( event.nativeEvent.contentOffset.y <  (this.headerHeight)){
            if(!this.state.isShowShadow){
                this.setState({isShowShadow: true, cannotSeeHeader: false})
            }
        }else{
            if(this.state.isShowShadow){
                this.setState({isShowShadow: false, cannotSeeHeader: true})
            }
        }
    };


    render() {
        const {isShowShadow} = this.state;
        const {headerView, size} = this.props;
        const data = this._toAndroidData();
        let shadowWidth = screenWidth;
        let shadowHeight = 0;
        let shadowMarginT = this.headerHeight || 0;
        if(size && size.height){
            shadowHeight = size.height;
        }
        return (
            <Animated.ScrollView
                style={{flex: 1}}
                onScroll={Animated.event([{nativeEvent: {contentOffset: {y: this.state.scrollY}}}], {
                    useNativeDriver: true,
                    listener: this._onVerticalScroll
                })}
                scrollEventThrottle={1}
                {...this._panResponder.panHandlers}
            >

                <View onLayout={(e) => {
                    let {height} = e.nativeEvent.layout;
                    this.setState({headHeight: height}); // 给头部高度赋值
                }}>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        {headerView && headerView()}
                    </ScrollView>
                </View>

                <StickyHeader
                    stickyHeaderY={this.state.headHeight} // 把头部高度传入
                    stickyScrollY={this.state.scrollY}  // 把滑动距离传入
                >
                    <ReportTableView
                        data={data}
                        style={[size]}
                    ></ReportTableView>
                </StickyHeader>
                {isShowShadow ?
                    <View style={{width: shadowWidth, height: shadowHeight, marginTop: shadowMarginT,
                        backgroundColor: '#0000', zIndex: 9999, position: 'absolute'}}
                    />
                    : null
                }
                <View style={{display: 'flex', height: shadowMarginT}}></View>
            </Animated.ScrollView>
        )
    }

    _toAndroidData = () => {
        const { data, size, minWidth, minHeight, maxWidth, frozenColumns, frozenRows} = this.props;
        const dataSource = {
            data: data,
            minWidth: minWidth,
            minHeight: minHeight,
            maxWidth: maxWidth,
            frozenRows: frozenRows,
            frozenColumns: frozenColumns
        };
        const dataStr = JSON.stringify(dataSource);
        return dataStr;
    }

}
