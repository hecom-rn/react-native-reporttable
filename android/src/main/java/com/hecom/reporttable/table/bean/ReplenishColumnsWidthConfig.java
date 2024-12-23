package com.hecom.reporttable.table.bean;

import java.util.Set;

/**
 * Created by kevin.bai on 2024/10/24.
 */
public class ReplenishColumnsWidthConfig {
    private int showNumber;
    /**
     * 列数从1开始
     */
    private Set<Integer>  ignoreColumns;

    public boolean ignore(int col){
        return ignoreColumns != null && ignoreColumns.contains(col + 1);
    }

    public int getShowNumber() {
        return showNumber;
    }

    public void setShowNumber(int showNumber) {
        this.showNumber = showNumber;
    }

    public Set<Integer> getIgnoreColumns() {
        return ignoreColumns;
    }

    public void setIgnoreColumns(Set<Integer> ignoreColumns) {
        this.ignoreColumns = ignoreColumns;
    }
}
