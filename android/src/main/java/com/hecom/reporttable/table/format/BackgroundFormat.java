package com.hecom.reporttable.table.format;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.format.bg.BaseCellBackgroundFormat;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.Cell;

/**
 * Created by kevin.bai on 2024/2/22.
 */
public class BackgroundFormat extends BaseCellBackgroundFormat<CellInfo> {
    private final HecomTable table;
    private final Paint bgPaint = new Paint();
    public BackgroundFormat(HecomTable table) {
        this.table = table;
        this.bgPaint.setStyle(Paint.Style.FILL);
    }
    @Override
    public int getBackGroundColor(CellInfo cellInfo) {
        Cell tableBean = (Cell) cellInfo.data;
        int color = tableBean.getBackgroundColor();
        if (color != TableConfig.INVALID_COLOR) {
            return color;
        }
        return this.table.getHecomStyle().getBackgroundColor();
    }

    @Override
    public void drawBackground(Canvas canvas, Rect rect, CellInfo t, Paint paint) {
        int color = getBackGroundColor(t);
        if(color != TableConfig.INVALID_COLOR) {
            bgPaint.setColor(color);
            canvas.drawRect(rect, bgPaint);
        }
    }

    /**
     * 字体颜色在 {@link HecomTextDrawFormat} 中处理
     * @param cellInfo
     * @return
     */
    @Override
    public int getTextColor(CellInfo cellInfo) {
        return TableConfig.INVALID_COLOR;
    }
}
