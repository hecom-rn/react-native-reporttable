import React from 'react';
import {processColor, AppRegistry, View, ScrollView, PanResponder, Animated, NativeModules, DeviceEventEmitter} from 'react-native';
import ReportTableView from './ReportTableView';
const reportTableModule = NativeModules.ReportTable;

export default class ReportTableWrapper extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            scrollY: new Animated.Value(0),
            currentFreezeRow: false,
        };
        this.headerHeight = this.props.headerView() && this.props.headerView().props.style
            && this.props.headerView().props.style.height;
    }


    componentDidMount() {
        this.listener = DeviceEventEmitter.addListener('com.hecom.reporttable.clickData', (data) => {
            if(data){
                const {keyIndex, rowIndex, columnIndex} = data;
                this.props.onClickEvent && this.props.onClickEvent({keyIndex, rowIndex, columnIndex});
            }
        });
    }

    componentWillUnmount(){
        this.listener && this.listener.remove();
    }

    render() {
        const { size, headerView } = this.props;
        const { currentFreezeRow } = this.state;
        return  <Animated.ScrollView
            ref={v => this.outVScroll = v}
            automaticallyAdjustContentInsets={false}
            scrollEventThrottle={1}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event([{nativeEvent: {contentOffset: {y: this.state.scrollY}}}], {
                useNativeDriver: true,
                listener: this._onVerticalScroll
            })}
            style={{flex: 1}}
        >
            {headerView && headerView()}
            {/*{currentFreezeRow ? this._renderFixedRows(): null}*/}
            <ReportTableView
                ref={v => this.reportTable = v}
                data={this._toAndroidData()}
                style={[size]}
            />

        </Animated.ScrollView>
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

    _onVerticalScroll = (event) => {
        const {currentFreezeRow} = this.state;
        if(currentFreezeRow && event.nativeEvent.contentOffset.y <  this.headerHeight){
            this.setState({currentFreezeRow: !currentFreezeRow})
        }else if(!currentFreezeRow && event.nativeEvent.contentOffset.y >=  this.headerHeight){
            this.setState({currentFreezeRow: !currentFreezeRow})
        }
    };

    // _renderFixedRows = () => {
    //     const { data, size, minWidth, minHeight, maxWidth, frozenColumns, frozenRows} = this.props;
    //     return <ReportTableView
    //         ref={v => this.fixedTable = v}
    //         style={{flex: 1}}
    //     />
    // }


}
