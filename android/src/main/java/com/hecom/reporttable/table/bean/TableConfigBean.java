package com.hecom.reporttable.table.bean;

public class TableConfigBean {
    private int minWidth;
    private int frozenRows;
    private int frozenCount = 0;
    private int frozenPoint = 0;
    private ItemCommonStyleConfig itemCommonStyleConfig;

    public ItemCommonStyleConfig getItemCommonStyleConfig() {
        return itemCommonStyleConfig;
    }

    public void setItemCommonStyleConfig(ItemCommonStyleConfig itemCommonStyleConfig) {
        this.itemCommonStyleConfig = itemCommonStyleConfig;
    }

    public int getFrozenRows() {
        return frozenRows;
    }

    public void setFrozenRows(int frozenRows) {
        this.frozenRows = frozenRows;
    }

    public int getFrozenColumns() {
        return frozenColumns;
    }

    public void setFrozenColumns(int frozenColumns) {
        this.frozenColumns = frozenColumns;
    }

    private int frozenColumns;

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

    public int getFrozenPoint() {
        return frozenPoint;
    }

    public void setFrozenPoint(int frozenPoint) {
        this.frozenPoint = frozenPoint;
    }

    public int getFrozenCount() {
        return frozenCount;
    }

    public void setFrozenCount(int frozenCount) {
        this.frozenCount = frozenCount;
    }
}
