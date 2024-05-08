package com.hecom.reporttable.table.format;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.format.selected.IDrawOver;
import com.hecom.reporttable.table.HecomTable;

/**
 * Created by kevin.bai on 2024/4/23.
 */
public class ShadowDrawOver implements IDrawOver {
    HecomTable mTable;

    public ShadowDrawOver(HecomTable table) {
        this.mTable = table;
    }

    @Override
    public void draw(Canvas canvas, Rect scaleRect, Rect showRect, TableConfig config) {
        int x = mTable.getMatrixHelper().getFixedReactRight();
        int top = showRect.top;
        int bottom = Math.min(showRect.bottom, scaleRect.bottom);
        if(x > 0 && x < showRect.right && this.needDrawShadow(scaleRect)){
            Paint paint = config.getPaint();
            drawShadow(canvas, x, top, bottom, paint);
        }
    }

    /**
     * 根据非锁定区域与锁定区域有重叠，才绘制阴影
     * @return
     */
    private boolean needDrawShadow(Rect scaleRect) {
        return mTable.getMatrixHelper().getFixedReactLeft() != scaleRect.left;
    }


    private void drawShadow(Canvas canvas, int x, int top, int bottom, Paint paint) {
            int originColor = paint.getColor();
            paint.setShadowLayer(12, 4, 0, Color.parseColor("#66000000"));
            paint.setColor(Color.TRANSPARENT);

            canvas.drawLine(x, top,x, bottom , paint);

            paint.setShadowLayer(0, 10, 10, Color.BLACK);
            paint.setColor(originColor);
    }
}
