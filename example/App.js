import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import ReportTable from '@hecom/reportTable'

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
                    backgroundColor: i % 2 === 0 ? '#eeeeee': '#ffffff',
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
                    style={{marginTop: 100}}
                    data={this.dataSource}
                    minWidth={50}
                    maxWidth={120}
                    minHeight={40}
                    frozenColumns={1}
                    frozenRows={1}
                    headerView={() => (
                        <Text style={{width: 750, height: 100, backgroundColor: 'red'}} >
                            {'行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了行业产品研发中心30人全了'}
                        </Text>
                    )}
                    onScrollEnd={() => {
                        console.log('到底了');
                    }}
                    size={{width: 300, height: 500}}
                    onClickEvent={({nativeEvent})=> {
                        console.log(nativeEvent);
                    }}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    view: {
        flex: 1
    }
});

export default App;
