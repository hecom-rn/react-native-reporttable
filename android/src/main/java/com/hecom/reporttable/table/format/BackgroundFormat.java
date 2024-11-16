package com.hecom.reporttable.table.format;

import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;

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
    private final Paint progressPaint = new Paint();
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
        Cell.ProgressStyle style = cell.getProgressStyle();
        if (cell.getProgressStyle() != null) {
            float marginHor = style.getMarginHorizontal();
            float width = rect.width() - 2 * marginHor;
            if (width <= 0) {
                return;
            }
            progress.left = rect.left + marginHor + width * style.getStartRatio();
            progress.right = rect.left + marginHor + width * style.getEndRatio();
            progress.top = rect.centerY() - style.getHeight() / 2;
            progress.bottom = rect.centerY() + style.getHeight() / 2;
            LinearGradient linearGradient = new LinearGradient(progress.left, progress.top,
                    progress.right, progress.top, style.getColors(), null,
                    LinearGradient.TileMode.CLAMP);
            progressPaint.setShader(linearGradient);
            canvas.drawRoundRect(progress, style.getRadius(), style.getRadius(), progressPaint);
        }
    }

    /**
     * 字体颜色在 {@link HecomTextDrawFormat} 中处理
     */
    @Override
    public int getTextColor(CellInfo cellInfo) {
        return TableConfig.INVALID_COLOR;
    }
}
