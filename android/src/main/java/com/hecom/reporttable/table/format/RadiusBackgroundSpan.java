package com.hecom.reporttable.table.format;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.style.ReplacementSpan;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.table.bean.ExtraText;

/**
 * Description : Created on 2023/11/30.
 */
public class RadiusBackgroundSpan extends ReplacementSpan {
    private final int foregroundColor;
    private final int height;
    private final int fontSize;
    private final int backgroundColor;
    private final int cornerRadius;
    private final int width;

    private TableConfig config;

    public RadiusBackgroundSpan(TableConfig config, ExtraText extraText) {
        this.backgroundColor = extraText.backgroundStyle.color;
        this.cornerRadius = extraText.backgroundStyle.radius;
        this.width = extraText.backgroundStyle.width;
        this.height = extraText.backgroundStyle.height;
        this.foregroundColor = extraText.style.color;
        this.fontSize = extraText.style.fontSize;
        this.config = config;
    }

    @Override
    public int getSize(Paint paint, CharSequence text, int start, int end,
                       Paint.FontMetricsInt fm) {
        return (int) (this.width * config.getZoom());
    }

    @Override
    public void draw(Canvas canvas, CharSequence text, int start, int end, float x, int top,
                     int y, int bottom, Paint paint) {
        // 保存原始画笔颜色和样式
        int originalColor = paint.getColor();
        Paint.Style originalStyle = paint.getStyle();
        Paint.Align originAlign = paint.getTextAlign();

        float zoomWidth = this.width * config.getZoom();
        float zoomHeight = this.height * config.getZoom();
        float zoomRadius = this.cornerRadius * config.getZoom();

        // 绘制圆角矩形背景
        paint.setColor(backgroundColor);
        paint.setStyle(Paint.Style.FILL);
        int height = bottom - top;
        RectF rect = new RectF(x, top + (height - zoomHeight) / 2f, x + zoomWidth,
                top + (height + zoomHeight) / 2f);
        canvas.drawRoundRect(rect, zoomRadius, zoomRadius, paint);

        // 绘制文字
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setColor(foregroundColor);
        paint.setTextSize(fontSize * config.getZoom());
        Paint.FontMetrics fm = paint.getFontMetrics();
        canvas.drawText(text, start, end, rect.centerX(),
                rect.centerY() - (fm.top + fm.bottom) / 2, paint);

        paint.setColor(originalColor);
        paint.setStyle(originalStyle);
        paint.setTextAlign(originAlign);
    }
}
