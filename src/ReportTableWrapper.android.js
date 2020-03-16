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
        this.headerHeight = 100;
    }


    render() {
        const { data } = this.props;
        const dataStr = JSON.stringify(data);
        console.log(dataStr)
        return  <Animated.ScrollView
            ref={v => this.outVScroll = v}
            automaticallyAdjustContentInsets={false}
            scrollEventThrottle={1}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event([{nativeEvent: {contentOffset: {y: this.state.scrollY}}}], {
                useNativeDriver: true,
                listener: this._onVerticalScroll
            })}
        >

            {this.props.headerView && this.props.headerView()}
            <ReportTableView
                ref={v => this.reportTable = v}
                style={{width: 300, height: 600 }}
                {...this.props}
                data={dataStr}
                freezeRowFun={this.state.freezeRow}
            />

        </Animated.ScrollView>
    }


    _onVerticalScroll = (event) => {
        console.log(event.nativeEvent.contentOffset)
        //currentFreezeRow是false的时候，大于50冻结
        //true的时候，小于50解冻
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
