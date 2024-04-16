package com.hecom.reporttable.table.format;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;

import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.format.grid.BaseGridFormat;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.Cell;

/**
 * Created by kevin.bai on 2023/5/17.
 */
public class HecomGridFormat extends BaseGridFormat {
    static final int NORMAL = 0;

    static final int TOP = 1;
    static final int RIGHT = 2;
    static final int BOTTOM = 4;
    static final int LEFT = 8;

    private HecomTable table;

    /**
     * 特殊边标记，0代表无特殊颜色，非零代表有特殊颜色，四个数值依次代表上、右、下、左。
     */
    int[] mGridType = new int[]{NORMAL, NORMAL, NORMAL, NORMAL};
    private int mClassificationLineColor;
    private int mBoxLineColor;
    private Paint mBoxLinePaint;
    private Boolean mForbidden;

    public HecomGridFormat(HecomTable table) {
        this.table = table;
        mBoxLinePaint = new Paint();
        mBoxLinePaint.setAntiAlias(false);
        mBoxLinePaint.setStyle(Paint.Style.STROKE);
    }

    @Override
    public void drawContentGrid(Canvas canvas, int col, int row, Rect rect, CellInfo cellInfo,
                                Paint paint) {
        fillGridType(cellInfo);
        int oriColor = paint.getColor();
        int defColor = paint.getColor();
        if (0 != mClassificationLineColor) {
            defColor = mClassificationLineColor;
            paint.setColor(mClassificationLineColor);
        }
        if (needDraw()) {
            int spColor = 0 != mClassificationLineColor ? mClassificationLineColor : getColor();

            paint.setColor(mGridType[0] != NORMAL ? spColor : defColor);
            canvas.drawLine(rect.left, rect.top, rect.right, rect.top, paint);

            paint.setColor(mGridType[1] != NORMAL ? spColor : defColor);
            canvas.drawLine(rect.right, rect.top, rect.right, rect.bottom, paint);

            paint.setColor(mGridType[2] != NORMAL ? spColor : defColor);
            canvas.drawLine(rect.right, rect.bottom, rect.left, rect.bottom, paint);

            paint.setColor(mGridType[3] != NORMAL ? spColor : defColor);
            canvas.drawLine(rect.left, rect.bottom, rect.left, rect.top, paint);

        } else {
            super.drawContentGrid(canvas, col, row, rect, cellInfo, paint);
        }

        paint.setColor(oriColor);
        if (mForbidden != null && mForbidden) {
            canvas.drawLine(rect.left, rect.top, rect.right, rect.bottom, paint);
        }

        if (0 != mBoxLineColor) {
            mBoxLinePaint.setColor(mBoxLineColor);
            mBoxLinePaint.setStrokeWidth(paint.getStrokeWidth()*4);
            float strokeWidth = paint.getStrokeWidth();
            RectF rectF = new RectF(rect.left+ strokeWidth,rect.top+strokeWidth,rect.right-strokeWidth,rect.bottom-strokeWidth);
            canvas.save();
            canvas.clipRect(rectF);
            canvas.drawRect( new RectF(rect.left+ strokeWidth+1,rect.top+strokeWidth+1,rect.right-strokeWidth-1,rect.bottom-strokeWidth-1), mBoxLinePaint);
            canvas.restore();
        }
    }

    private int getColor() {
        return this.table.getHecomStyle().getLineColor();
    }

    private void fillGridType(CellInfo cellInfo) {
        Cell bean = (Cell) cellInfo.data;
        int position = bean.getClassificationLinePosition();
        mForbidden = bean.isForbidden();
        mClassificationLineColor = bean.getClassificationLineColor();
        mBoxLineColor = bean.getBoxLineColor();
        mGridType[0] = position & TOP;
        mGridType[1] = position & RIGHT;
        mGridType[2] = position & BOTTOM;
        mGridType[3] = position & LEFT;
    }

    private boolean needDraw() {
        return mGridType[0] != NORMAL || mGridType[1] != NORMAL || mGridType[2] != NORMAL || mGridType[3] != NORMAL;
    }
}