package com.hecom.reporttable.form.data.format.draw;

import android.graphics.Canvas;
import android.graphics.Rect;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.table.bean.TypicalCell;


/**
 * Created by huang on 2017/10/30.
 * 绘制格式化
 */

public interface IDrawFormat<T>  {

    /**
     *测量宽
     */
    int measureWidth(Column<T> column, int position, TableConfig config, boolean onlyCalculate, int sepcWidth);
    int measureWidth(Column<T> column, TypicalCell cell, TableConfig config);

    /**
     *测量高
     */
    int measureHeight(Column<T> column, int position, TableConfig config);
    int measureHeight(Column<T> column, TypicalCell cell, TableConfig config, int sepcWidth);


    float draw(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config);




}
