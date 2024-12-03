package com.hecom.reporttable.table.format;

import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.format.bg.BaseCellBackgroundFormat;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.bean.ProgressStyle;

/**
 * Created by kevin.bai on 2024/2/22.
 */
public class BackgroundFormat extends BaseCellBackgroundFormat<CellInfo> {
    private final HecomTable table;
    private final Paint bgPaint = new Paint();
    private final Paint progressPaint = new Paint();
    private final Paint antsLinePaint = new Paint();
    private final RectF progress = new RectF();

    public BackgroundFormat(HecomTable table) {
        this.table = table;
        this.bgPaint.setStyle(Paint.Style.FILL);
        this.progressPaint.setStyle(Paint.Style.FILL);
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
        if (color != TableConfig.INVALID_COLOR) {
            bgPaint.setColor(color);
            canvas.drawRect(rect, bgPaint);
        }
        this.drawProgress(canvas, rect, t);
    }

    private void drawProgress(Canvas canvas, Rect rect, CellInfo t) {
        Cell cell = (Cell) t.data;
        ProgressStyle style = cell.getProgressStyle();
        if (cell.getProgressStyle() != null) {
            ProgressStyle defStyle = this.table.getProgressStyle();
            float marginHor = style.getMarginHorizontal() == 0 ? defStyle.getMarginHorizontal() :
                    style.getMarginHorizontal();
            float radius = style.getRadius() == 0 ? defStyle.getRadius() : style.getRadius();
            float width = rect.width() - 2 * marginHor;
            float height = style.getHeight() == 0 ? defStyle.getHeight() : style.getHeight();
            if (width <= 0) {
                return;
            }
            progress.left = rect.left + marginHor + width * style.getStartRatio();
            progress.right = rect.left + marginHor + width * style.getEndRatio();
            progress.top = rect.centerY() - height / 2;
            progress.bottom = rect.centerY() + height / 2;
            LinearGradient linearGradient = new LinearGradient(progress.left, progress.top,
                    progress.right, progress.top, style.getColors(), null,
                    LinearGradient.TileMode.CLAMP);
            progressPaint.setShader(linearGradient);
            canvas.drawRoundRect(progress, radius, radius, progressPaint);
            this.drawAntsLine(canvas, rect, style.getAntsLineStyle(), marginHor);
        }
    }

    private void drawAntsLine(Canvas canvas, Rect rect, ProgressStyle.AntsLineStyle style,
                              float marginHor) {
        if (style == null) {
            return;
        }
        ProgressStyle.AntsLineStyle defStyle = this.table.getProgressStyle().getAntsLineStyle();
        antsLinePaint.setColor(style.getColor() == TableConfig.INVALID_COLOR ?
                defStyle.getColor() : style.getColor());
        antsLinePaint.setStrokeWidth(style.getWidth() == 0 ? defStyle.getWidth() :
                style.getWidth());
        antsLinePaint.setStyle(Paint.Style.STROKE);
        antsLinePaint.setPathEffect(new DashPathEffect(style.getDashPattern() == null ?
                defStyle.getDashPattern() : style.getDashPattern(), 0));
        float startX = rect.left + marginHor + (rect.width() - 2 * marginHor) * style.getRatio();
        canvas.drawLine(startX, rect.top, startX, rect.bottom, antsLinePaint);

    }

    /**
     * 字体颜色在 {@link HecomTextDrawFormat} 中处理
     */
    @Override
    public int getTextColor(CellInfo cellInfo) {
        return TableConfig.INVALID_COLOR;
    }
}
