package com.hecom.reporttable.form.data;

/**
 * Created by huang on 2018/1/24.
 */

public class Cell {
    public static final int INVALID = -1;

    public int col;
    public int row;
    public int firstColIndex;
    public int firstRowIndex;
    public int lastColIndex;
    public int lastRowIndex;
    public Cell realCell;
    public int width;
    public int height;

    public Cell(int col, int row, int firstColIndex, int firstRowIndex, int lastColIndex, int lastRowIndex) {
        this.col = col;
        this.row = row;
        this.firstColIndex = firstColIndex;
        this.firstRowIndex = firstRowIndex;
        this.lastColIndex = lastColIndex;
        this.lastRowIndex = lastRowIndex;
        realCell = this;
    }

    public Cell(Cell realCell) {
        this.col = INVALID;
        this.row = INVALID;
        this.realCell = realCell;
    }



}
