package com.hecom.reporttable.table.bean;

/**
 * Description :
 * Created on 2023/5/12.
 */
public class TypicalCell {
    public JsonTableBean jsonTableBean;
    public int columnIndex;
    public int rowIndex;

    public TypicalCell(JsonTableBean jsonTableBean, int columnIndex, int rowIndex) {
        this.jsonTableBean = jsonTableBean;
        this.columnIndex = columnIndex;
        this.rowIndex = rowIndex;
    }

}
