package com.hecom.reporttable.table.bean;

import java.util.Map;

public class TableConfigBean {
    private int minWidth;
    private ItemCommonStyleConfig itemCommonStyleConfig;
    private Map<Integer, CellConfig> columnConfigMap;

    public ItemCommonStyleConfig getItemCommonStyleConfig() {
        return itemCommonStyleConfig;
    }

    public void setItemCommonStyleConfig(ItemCommonStyleConfig itemCommonStyleConfig) {
        this.itemCommonStyleConfig = itemCommonStyleConfig;
    }


    public int getMinWidth() {
        return minWidth;
    }

    public void setMinWidth(int minWidth) {
        this.minWidth = minWidth;
    }

    public int getMaxWidth() {
        return maxWidth;
    }

    public void setMaxWidth(int maxWidth) {
        this.maxWidth = maxWidth;
    }

    public int getMinHeight() {
        return minHeight;
    }

    public void setMinHeight(int minHeight) {
        this.minHeight = minHeight;
    }

    private int maxWidth;


    private int minHeight;

    public TableConfigBean(int minWidth, int maxWidth, int minHeight) {
        this.minWidth = minWidth;
        this.maxWidth = maxWidth;
        this.minHeight = minHeight;
        this.itemCommonStyleConfig = new ItemCommonStyleConfig();
    }

    public int getTextPaddingHorizontal() {
        return textPaddingHorizontal;
    }

    public void setTextPaddingHorizontal(int textPaddingHorizontal) {
        this.textPaddingHorizontal = textPaddingHorizontal;
    }

    private int textPaddingHorizontal;

    private String lineColor;

    public String getLineColor() {
        return lineColor;
    }

    public void setLineColor(String lineColor) {
        this.lineColor = lineColor;
    }



    public int getHeaderHeight() {
        return headerHeight;
    }

    public void setHeaderHeight(int headerHeight) {
        this.headerHeight = headerHeight;
    }

    private int headerHeight;


    public int getLimitTableHeight() {
        return limitTableHeight;
    }

    public void setLimitTableHeight(int limitTableHeight) {
        this.limitTableHeight = limitTableHeight;
    }

    private int limitTableHeight;

    public void setColumnConfigMap(Map<Integer, CellConfig> columnConfigMap) {
        this.columnConfigMap = columnConfigMap;
    }

    public Map<Integer, CellConfig> getColumnConfigMap() {
        return columnConfigMap;
    }
}
