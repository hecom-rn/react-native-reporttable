package com.hecom.reporttable.table.format;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.style.ReplacementSpan;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.Cell;

import androidx.annotation.NonNull;

/**
 * Created by kevin.bai on 2024/3/8.
 */
public class RichTextSpan extends ReplacementSpan {
    private static final float[] ZERO = new float[]{0, 0, 0, 0};

    Cell.RichTextStyle style;

    Cell cell;

    Context context;

    TableConfig config;

    public RichTextSpan(Context context, Cell cell, Cell.RichTextStyle style, TableConfig config) {
        this.style = style;
        this.context = context;
        this.cell = cell;
        this.config = config;
    }

    @Override
    public int getSize(@NonNull Paint paint, CharSequence text, int start, int end,
                       Paint.FontMetricsInt fm) {
        float[] padding = getPadding(paint, false);
        float[] margin = getMargin();
        return Math.round(paint.measureText(text, start, end) + padding[0] + padding[2] + margin[0] + margin[2]);
    }

    @Override
    public void draw(@NonNull Canvas canvas, CharSequence text, int start, int end, float x,
                     int top,
                     int y, int bottom, Paint paint) {
        // 保存原始画笔颜色和样式
        int originalColor = paint.getColor();
        Paint.Style originalStyle = paint.getStyle();
        float originTextSize = paint.getTextSize();
        boolean isBold = paint.isFakeBoldText();
        Paint.Align originAlign = paint.getTextAlign();

        float textWidth = paint.measureText(text, start, end);
        float[] padding = getPadding(paint, true);
        float[] margin = getMargin();
        RectF rect = getBgRect(x, y, paint, textWidth, padding, margin);
        // 绘制文字
        drawText(canvas, text, start, end, rect, paint);
        // 绘制边框
        drawBorder(canvas, rect, paint);

        paint.setColor(originalColor);
        paint.setStyle(originalStyle);
        paint.setTextSize(originTextSize);
        paint.setFakeBoldText(isBold);
        paint.setTextAlign(originAlign);

    }

    /**
     * 四边的padding，分别为left,top,right,bottom
     */
    private float[] getPadding(Paint paint, boolean onDraw) {
        if (this.style.getBorderWidth() > 0) {
            float fontSize = paint.getTextSize();
            if (this.style.getFontSize() != -1) {
                fontSize =
                        (DensityUtils.dp2px(this.context, this.style.getFontSize())) * (onDraw ?
                                config.getZoom() : 1);
            }
            return new float[]{fontSize * 0.4f, fontSize * 0.25f, fontSize * 0.4f,
                    fontSize * 0.25f};
        }
        return ZERO;
    }

    private float[] getMargin() {
        return ZERO;
    }


    private RectF getBgRect(float x, float y, Paint paint, float textWidth, float[] padding,
                            float[] margin) {
        Paint.FontMetrics fontMetrics = paint.getFontMetrics();
        float bgStartX = x + margin[0];
        float bgStartY = y + fontMetrics.ascent - padding[1]; // marginBottom
        float bgEndX = bgStartX + padding[0] + textWidth + padding[2];
        float bgEndY = fontMetrics.descent + y + padding[3];

        return new RectF(bgStartX, bgStartY, bgEndX, bgEndY);
    }

    private void drawBorder(Canvas canvas, RectF rect, Paint paint) {
        if (this.style.getBorderColor() != null && this.style.getBorderWidth() != -1) {
            paint.setColor(Color.parseColor(this.style.getBorderColor()));
            paint.setStrokeWidth(DensityUtils.dp2px(this.context, this.style.getBorderWidth()));
            paint.setStyle(Paint.Style.STROKE);
            float cornerRadius = DensityUtils.dp2px(this.context, this.style.getBorderRadius());
            canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint);
        }
    }

    private void drawText(Canvas canvas, CharSequence text, int start, int end, RectF rect,
                          Paint paint) {
        paint.setStyle(Paint.Style.FILL);
        paint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText(text, start, end, rect.centerX(),
                rect.centerY() + paint.getFontMetrics().bottom, paint);
    }
}
