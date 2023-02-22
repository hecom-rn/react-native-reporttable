package com.hecom.reporttable.form.data;


import com.hecom.reporttable.form.data.column.Column;

/**
 * Created by huang on 2017/11/15.
 * 单元格数据
 */

public class CellInfo<T> {
    /**
     * 数据
     */
    public T data;
    /**
     * 所在行位置
     */
    public int row;
    /**
     * 所在列位置
     */
    public int col;

    /**
     * 所在列
     */
    public Column<T> column;
    /**
     * 显示的值
     */
    public String value;

    /*是否已经动态截取过*/
    public boolean wrapFlag;

    public void set(Column<T> column,T t,String value,int col, int row, boolean wrapFlag){
        this.column = column;
        this.value= value;
        this.data = t;
        this.row = row;
        this.col = col;
        this.wrapFlag = wrapFlag;
    }

}
