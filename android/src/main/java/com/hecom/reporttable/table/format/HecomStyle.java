package com.hecom.reporttable.table.format;

import android.graphics.Paint;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.style.FontStyle;

/**
 * 集中处理单元格样式 Created by kevin.bai on 2024/3/6.
 */
public class HecomStyle extends FontStyle {
    private boolean isOverstriking;
    private int backgroundColor = TableConfig.INVALID_COLOR;

    private int lineColor = TableConfig.INVALID_COLOR;

    private int paddingHorizontal;

    public int getPaddingHorizontal() {
        return paddingHorizontal;
    }

    public void setPaddingHorizontal(int paddingHorizontal) {
        this.paddingHorizontal = paddingHorizontal;
    }

    public int getLineColor() {
        return lineColor;
    }

    public void setLineColor(int lineColor) {
        this.lineColor = lineColor;
    }

    public boolean isOverstriking() {
        return isOverstriking;
    }

    public void setOverstriking(boolean overstriking) {
        isOverstriking = overstriking;
    }

    public int getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(int backgroundColor) {
        this.backgroundColor = backgroundColor;
    }


    @Override
    public void fillPaint(Paint paint) {
        super.fillPaint(paint);
        paint.setFakeBoldText(isOverstriking);
    }
}
