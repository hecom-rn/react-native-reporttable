import React from 'react';
import {processColor, AppRegistry, View, ScrollView, PanResponder, Animated, NativeModules} from 'react-native';
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


    render() {
        console.log(this.props)
        const { data, size } = this.props;
        const dataStr = JSON.stringify(data);
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
            {this.props.headerView && this.props.headerView()}
            <ReportTableView
                ref={v => this.reportTable = v}
                freezeRowFun={this.state.freezeRow}
                data={dataStr}
                style={[size]}
            />

        </Animated.ScrollView>
    }


    _onVerticalScroll = (event) => {
        const {currentFreezeRow} = this.state;
        if(currentFreezeRow && event.nativeEvent.contentOffset.y <  this.headerHeight){
            this.setState({currentFreezeRow: !currentFreezeRow})
            reportTableModule.setFreeze("1");
        }else if(!currentFreezeRow && event.nativeEvent.contentOffset.y >=  this.headerHeight){
            this.setState({currentFreezeRow: !currentFreezeRow})
            reportTableModule.setFreeze("0");
        }
    };
}
