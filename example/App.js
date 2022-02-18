import ReportTable from '@hecom/reportTable'
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.dataSource = [];
        const colmnCount = 30;
        const rowCount = 10;
        for (let i = 0; i < colmnCount; i++) {
            const arr = [];
            for (let j = 1; j <= rowCount; j++) {
                arr.push({
                    keyIndex: j + i * rowCount,
                    title: j + i * rowCount + "",
                    backgroundColor: i % 2 === 0 ? '#eeeeee' : '#ffffff',
                    fontSize: 10,
                    textColor: '#222222',
                });
            }
            this.dataSource.push(arr);
        }
        // this.dataSource[3][3].keyIndex = 33;
        // this.dataSource[1][1].title = "1123123811231823098";
    }

    render() {
        return (
            <View style={styles.view}>

                <ReportTable
                    ref={(ref) => this.table = ref}
                    style={{marginTop: 100}}
                    data={this.dataSource}
                    minWidth={50}
                    maxWidth={120}
                    minHeight={40}
                    frozenColumns={2}
                    frozenRows={2}
                    headerView={() => (
                        <Text style={{width: 750, height: 100, backgroundColor: 'red'}}>
                            {'行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了'}
                        </Text>
                    )}
                    onScrollEnd={() => {
                        console.log('到底了');
                    }}
                    onScroll={({nativeEvent: data}) => {
                        console.log('onScroll', data)
                    }}
                    size={Dimensions.get('window')}
                    onClickEvent={(nativeEvent) => {
                        console.log(nativeEvent);
                    }}
                />
                <TouchableOpacity style={styles.Btn} onPress={() => {
                    console.log('点击回到顶部')
                    this.table.scrollTo();
                }}>
                    <View style={styles.topBtn}>
                        <Text style={styles.topBtnText}>
                            顶
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    view: {
        flex: 1
    },
    Btn: {
        position: 'absolute',
        bottom: 30, width: 48,
        height: 48,
        right: 15,
    },
    topBtn: {

        width: 48,
        height: 48,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99,
    },
    topBtnText: {
        color: 'white',
        fontSize: 22
    }
});

export default App;
