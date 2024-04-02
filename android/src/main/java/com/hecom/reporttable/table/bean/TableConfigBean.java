package com.hecom.reporttable.table.bean;

import java.util.Map;

public class TableConfigBean {
    private int minWidth;
    private Map<Integer, CellConfig> columnConfigMap;

    public int getMinWidth() {
        return minWidth;
    }


    public int getMaxWidth() {
        return maxWidth;
    }


    public int getMinHeight() {
        return minHeight;
    }


    private int maxWidth;


    private int minHeight;

    public TableConfigBean(int minWidth, int maxWidth, int minHeight) {
        this.minWidth = minWidth;
        this.maxWidth = maxWidth;
        this.minHeight = minHeight;
    }

    public void setColumnConfigMap(Map<Integer, CellConfig> columnConfigMap) {
        this.columnConfigMap = columnConfigMap;
    }

    public Map<Integer, CellConfig> getColumnConfigMap() {
        return columnConfigMap;
    }
}
