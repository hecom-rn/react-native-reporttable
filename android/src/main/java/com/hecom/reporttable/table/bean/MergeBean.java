package com.hecom.reporttable.table.bean;

public class MergeBean {
    private boolean mergeRow;

    public boolean isMergeRow() {
        return mergeRow;
    }

    public void setMergeRow(boolean mergeRow) {
        this.mergeRow = mergeRow;
    }

    public boolean isMergeColumn() {
        return mergeColumn;
    }

    public void setMergeColumn(boolean mergeColumn) {
        this.mergeColumn = mergeColumn;
    }

    private boolean mergeColumn;
    private int startColum;
    private int endColum;
    private int startRow;

    public int getStartColum() {
        return startColum;
    }

    public void setStartColum(int startColum) {
        this.startColum = startColum;
    }

    public int getEndColum() {
        return endColum;
    }

    public void setEndColum(int endColum) {
        this.endColum = endColum;
    }

    public int getStartRow() {
        return startRow;
    }

    public void setStartRow(int startRow) {
        this.startRow = startRow;
    }

    public int getEndRow() {
        return endRow;
    }

    public void setEndRow(int endRow) {
        this.endRow = endRow;
    }

    private int endRow;

    public void clear(){
        setStartColum(-1);
        setEndColum(-1);
        setStartRow(-1);
        setEndRow(-1);
        setMergeColumn(false);
        setMergeRow(false);
    }
}
