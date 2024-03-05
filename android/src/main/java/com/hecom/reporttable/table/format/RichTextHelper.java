package com.hecom.reporttable.table.format;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.SpannableStringBuilder;
import android.text.style.ReplacementSpan;

import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.JsonTableBean;

/**
 * Created by kevin.bai on 2024/2/23.
 */
public class RichTextHelper {

    public static SpannableStringBuilder buildRichText(Context context,
                                                       JsonTableBean cell) {
        SpannableStringBuilder builder = new SpannableStringBuilder();
        for (JsonTableBean.RichText richText : cell.richText) {
            builder.append(richText.getText());
            if (richText.getStyle() != null) {
                builder.setSpan(new RichTextSpan(context, cell, richText.getStyle()),
                        builder.length() - richText.getText()
                                .length(), builder.length(),
                        SpannableStringBuilder.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
        }
        return builder;
    }

}

class RichTextSpan extends ReplacementSpan {
    private static float[] ZERO = new float[]{0, 0, 0, 0};

    JsonTableBean.RichTextStyle style;

    JsonTableBean cell;

    Context context;

    public RichTextSpan(Context context, JsonTableBean cell, JsonTableBean.RichTextStyle style) {
        this.style = style;
        this.context = context;
        this.cell = cell;
    }

    @Override
    public int getSize(Paint paint, CharSequence text, int start, int end,
                       Paint.FontMetricsInt fm) {
        float[] padding = getPadding(paint);
        float[] margin = getMargin();
        return Math.round(paint.measureText(text, start, end) + padding[0] + padding[2] + margin[0] + margin[2]);
    }

    @Override
    public void draw(Canvas canvas, CharSequence text, int start, int end, float x, int top,
                     int y, int bottom, Paint paint) {
        // 保存原始画笔颜色和样式
        int originalColor = paint.getColor();
        Paint.Style originalStyle = paint.getStyle();
        float originTextSize = paint.getTextSize();
        boolean isBold = paint.isFakeBoldText();

        float textWidth = paint.measureText(text, start, end);
        float[] padding = getPadding(paint);
        float[] margin = getMargin();
        RectF rect = getBgRect(x, y, paint, textWidth, padding, margin);
        // 绘制背景
        drawBg(canvas, rect, paint);
        // 绘制文字
        drawText(canvas, text, start, end, rect, padding, y, paint);
        // 绘制边框
        drawBorder(canvas, rect, paint);

        paint.setColor(originalColor);
        paint.setStyle(originalStyle);
        paint.setTextSize(originTextSize);
        paint.setFakeBoldText(isBold);

    }

    /**
     * 四边的padding，分别为left,top,right,bottom
     */
    private float[] getPadding(Paint paint) {
        if (this.style.getBorderWidth() > 0) {
            float fontSize = paint.getTextSize();
            if (this.style.getFontSize() != -1) {
                fontSize = (DensityUtils.dp2px(this.context, this.style.getFontSize()));
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

    private void drawBg(Canvas canvas, RectF rect, Paint paint) {
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
                          float[] padding, int y, Paint paint) {
        paint.setStyle(Paint.Style.FILL);
        if (this.style.getTextColor() != null) {
            paint.setColor(Color.parseColor(this.style.getTextColor()));
        }
        if (this.style.getFontSize() != -1) {
            paint.setTextSize(DensityUtils.dp2px(this.context, this.style.getFontSize()));
        }
        if (this.style.getOverstriking() != null) {
            paint.setFakeBoldText(this.style.getOverstriking());
        }
        switch (paint.getTextAlign()) {
            case LEFT:
                canvas.drawText(text, start, end, rect.left + padding[0], y, paint);
                break;
            case RIGHT:
                canvas.drawText(text, start, end, rect.right - padding[2], y, paint);
                break;
            case CENTER:
            default:
                canvas.drawText(text, start, end, rect.centerX(), y, paint);
                break;
        }
    }
}
