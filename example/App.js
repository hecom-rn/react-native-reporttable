import React from 'react';
import { View, StyleSheet, processColor } from 'react-native';

import ReportTable from '@hecom/reportTable'

class App extends React.Component {
    constructor(props) {
        super(props);
        this.dataSource = [];
        const colmnCount = 500;
        const rowCount = 10;
        for (let i = 0; i < colmnCount; i++) {
            const arr = [];
            for (let j = 1; j <= rowCount; j++) {
                arr.push({
                    keyIndex: j + i * rowCount,
                    title: j + i * rowCount,
                    backgroundColor: i % 2 === 0 ? '#eee': '#fff',
                    fontSize: 10,
                    textColor: '#222',
                });
            }
            this.dataSource.push(arr);
        }
        this.dataSource[3][3].keyIndex = 33;
        this.dataSource[1][1].title = 1123123811231823098;
    }

    render() {
        return (
            <View style={styles.view}>
                <ReportTable
                    style={{width: 375, height: 700, marginTop: 100}}
                    data={this.dataSource}
                    minWidth={50}
                    maxWidth={120}
                    minHeight={40}
                    frozenColumns={1}
                    frozenRows={1}
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
