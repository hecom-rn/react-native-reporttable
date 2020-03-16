package com.hecom.reporttable.form.data.format.draw;

import android.graphics.Canvas;
import android.graphics.Rect;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;


/**
 * Created by huang on 2017/10/30.
 * 绘制格式化
 */

public interface IDrawFormat<T>  {

    /**
     *测量宽
     */
    int measureWidth(Column<T> column, int position, TableConfig config);

    /**
     *测量高
     */
    int measureHeight(Column<T> column, int position, TableConfig config);


    void draw(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config);




}
