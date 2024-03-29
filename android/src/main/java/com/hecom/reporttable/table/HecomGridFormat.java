package com.hecom.reporttable.table;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.text.TextUtils;

import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.format.grid.BaseGridFormat;
import com.hecom.reporttable.table.bean.JsonTableBean;

/**
 * Created by kevin.bai on 2023/5/17.
 */
public class HecomGridFormat extends BaseGridFormat {
    static final int NORMAL = 0;

    static final int TOP = 1;
    static final int RIGHT = 2;
    static final int BOTTOM = 4;
    static final int LEFT = 8;
    static final int TOP_LEFT = 1;
    static final int TOP_RIGHT = 2;
    static final int BOTTOM_LEFT = 4;
    static final int BOTTOM_RIGHT = 8;

    private SmartTable table;

    /**
     * 特殊边标记，0代表无特殊颜色，非零代表有特殊颜色，四个数值依次代表上、右、下、左。
     */
    int[] mGridType = new int[]{NORMAL, NORMAL, NORMAL, NORMAL};
    private int mClassificationLineColor;
    private int mTriangleColor;
    private int mTrianglePosition;
    private Paint mTrianglePaint;
    private Boolean mForbidden;

    public HecomGridFormat(SmartTable table) {
        this.table = table;
        mTrianglePaint = new Paint();
        mTrianglePaint.setAntiAlias(false);
        mTrianglePaint.setStyle(Paint.Style.STROKE);
    }

    @Override
    public void drawContentGrid(Canvas canvas, int col, int row, Rect rect, CellInfo cellInfo,
                                Paint paint) {
        fillGridType(col, row);
        int oriColor = paint.getColor();
        int defColor = paint.getColor();
        if (0 != mClassificationLineColor) {
            defColor = mClassificationLineColor;
            paint.setColor(mClassificationLineColor);
        }
        if (needDraw(col, row)) {
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

        if (0 != mTriangleColor) {
            mTrianglePaint.setColor(mTriangleColor);
            mTrianglePaint.setStrokeWidth(paint.getStrokeWidth()*4);
            float strokeWidth = paint.getStrokeWidth();
            RectF rectF = new RectF(rect.left+ strokeWidth,rect.top+strokeWidth,rect.right-strokeWidth,rect.bottom-strokeWidth);
            canvas.save();
            canvas.clipRect(rectF);
            canvas.drawRect( new RectF(rect.left+ strokeWidth+1,rect.top+strokeWidth+1,rect.right-strokeWidth-1,rect.bottom-strokeWidth-1), mTrianglePaint);
            canvas.restore();
        }
    }

    private int getColor() {
        return this.table.getConfig().getItemCommonStyleConfig().getClassificationLineColor();
    }

    private void fillGridType(int col, int row) {
        JsonTableBean bean = this.table.getConfig().getCell(row,col);
        int position = bean.getClassificationLinePosition();
        mTrianglePosition = bean.getTrianglePosition();
        mForbidden = bean.getForbidden();
        mClassificationLineColor = TextUtils.isEmpty(bean.getClassificationLineColor()) ? 0 : Color.parseColor(bean.getClassificationLineColor());
        mTriangleColor = TextUtils.isEmpty(bean.getTriangleColor()) ? 0 : Color.parseColor(bean.getTriangleColor());
        mGridType[0] = position & TOP;
        mGridType[1] = position & RIGHT;
        mGridType[2] = position & BOTTOM;
        mGridType[3] = position & LEFT;
    }

    private boolean needDraw(int col, int row) {
        return mGridType[0] != NORMAL || mGridType[1] != NORMAL || mGridType[2] != NORMAL || mGridType[3] != NORMAL;
    }
}
