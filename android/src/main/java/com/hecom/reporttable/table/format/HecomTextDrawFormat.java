package com.hecom.reporttable.table.format;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.style.ForegroundColorSpan;
import android.text.style.RelativeSizeSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.StyleSpan;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.draw.IDrawFormat;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.form.utils.DrawUtils;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.bean.CellCache;
import com.hecom.reporttable.table.bean.ExtraTextConfig;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;

/**
 * Created by huang on 2017/10/30.
 */

public class HecomTextDrawFormat implements IDrawFormat<Cell> {

    private final Rect rect = new Rect();

    private final Rect asteriskRect = new Rect();

    private final Paint asteriskPaint;

    private final HecomTable table;
    private final CellDrawFormat cellDrawFormat;

    public HecomTextDrawFormat(HecomTable table, CellDrawFormat cellDrawFormat) {
        this.table = table;
        this.cellDrawFormat = cellDrawFormat;
        asteriskPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        asteriskPaint.setTextAlign(Paint.Align.CENTER);
    }

    @Override
    public int measureWidth(Column<Cell> column, int position, TableConfig config) {
        Paint paint = config.getPaint();
        Cell cell = column.getDatas().get(position);
        setTextPaint(config, cell, paint, false);
        CellCache result = getCellCache(column, position, paint, config);
        float asteriskWidth = getAsteriskWidth(config, cell);
        return (int) (result.getWidth() + asteriskWidth);
    }

    private float getAsteriskWidth(TableConfig config, Cell cell) {
        int asteriskColor = cell.getAsteriskColor();
        if ((asteriskColor) == TableConfig.INVALID_COLOR) {
            return 0;
        } else {
            asteriskPaint.setTextSize(getFontSize(config, cell));
            return asteriskPaint.measureText("*");
        }
    }


    @Override
    public int measureHeight(Column<Cell> column, int position, TableConfig config) {
        Paint paint = config.getPaint();
        setTextPaint(config, column.getDatas().get(position), paint, false);
        CellCache result = getCellCache(column, position, paint, config);
        return result.getHeight();
    }

    @Override
    public void draw(Canvas c, Rect rect, CellInfo<Cell> cellInfo, TableConfig config) {
        Cell cell = cellInfo.data;
        if (cell.isForbidden()) {
            return;
        }
        int asteriskWidth = (int) (getAsteriskWidth(config, cell) * config.getZoom());
        //  表头必填项增加必填符号*;左对齐字段*号放右边，右对产/居中对产字段*方左边
        Paint paint = config.getPaint();
        if (asteriskWidth > 0) {
            Paint.Align textAlign;
            if (cellInfo.data.getTextAlignment() != null) {
                textAlign = cellInfo.data.getTextAlignment();
            } else {
                textAlign = table.getHecomStyle().getAlign();
            }
            float textWidth =
                    (measureWidth(cellInfo.column, cellInfo.row, config) * config.getZoom()) - asteriskWidth;
            switch (textAlign) { //单元格内容的对齐方式
                case CENTER:
                    this.rect.set(rect.left + asteriskWidth, rect.top, rect.right, rect.bottom);
                    drawText(c, cellInfo, this.rect, paint, config);
                    int asteriskRight = (int) ((this.rect.right + this.rect.left - textWidth) / 2);
                    this.asteriskRect.set(asteriskRight - asteriskWidth, rect.top, asteriskRight,
                            rect.bottom);
                    this.drawAsterisk(c, this.asteriskRect, cellInfo, config);
                    break;
                case LEFT:
                    this.rect.set(rect.left, rect.top, rect.right - asteriskWidth, rect.bottom);
                    drawText(c, cellInfo, this.rect, paint, config);
                    int asteriskLeft = (int) (this.rect.left + textWidth);
                    this.asteriskRect.set(asteriskLeft, rect.top, asteriskLeft + asteriskWidth,
                            rect.bottom);
                    this.drawAsterisk(c, this.asteriskRect, cellInfo, config);

                    break;
                case RIGHT:
                    this.rect.set(rect.left + asteriskWidth, rect.top, rect.right, rect.bottom);
                    drawText(c, cellInfo, this.rect, paint, config);
                    asteriskRight = (int) (this.rect.right - textWidth);
                    this.asteriskRect.set(asteriskRight - asteriskWidth, rect.top, asteriskRight,
                            rect.bottom);
                    this.drawAsterisk(c, this.asteriskRect, cellInfo, config);
                    break;
            }
        } else {
            drawText(c, cellInfo, rect, paint, config);
        }
    }

    private void drawAsterisk(Canvas c, Rect rect, CellInfo<Cell> cellInfo, TableConfig config) {
        float textSize = getFontSize(config, cellInfo.data);
        asteriskPaint.setTextSize(textSize * config.getZoom());
        asteriskPaint.setColor(cellInfo.data.getAsteriskColor());
        DrawUtils.drawSingleText(c, asteriskPaint, rect, "*");
    }

    protected void drawText(Canvas c, CellInfo<Cell> cellInfo, Rect rect, Paint paint,
                            TableConfig config) {
        setTextPaint(config, cellInfo.data, paint, true);
        CellCache result = getCellCache(cellInfo.column, cellInfo.row, paint, config);
        int saveCount = c.getSaveCount();
        c.save();
        mTextPaint.set(paint);
        StaticLayout layout = new StaticLayout(result.getText(), mTextPaint, rect.width(),
                StaticLayout.Alignment.ALIGN_NORMAL, 1.0f, 0.0f, false);
        int dx = 0; // x 方向偏移量
        // 根据对齐方式计算偏移量
        switch (paint.getTextAlign()) {
            case LEFT: // 左对齐
                break;
            case CENTER: // 居中对齐
                dx = rect.centerX() - rect.left;
                break;
            case RIGHT: // 右对齐
                dx = rect.width();
                break;
        }
        // 计算垂直居中的偏移量
        int dy = (rect.height() - layout.getHeight()) / 2;
        c.translate(rect.left + dx, rect.top + dy);
        // 绘制文本
        layout.draw(c);
        c.restoreToCount(saveCount);
    }


    public void setTextPaint(TableConfig config, Cell cell, Paint paint, boolean onDraw) {
        config.getContentStyle().fillPaint(paint);
        paint.setTextSize(getFontSize(config, cell) * (onDraw ? config.getZoom() : 1));
        if (cell.getTextColor() != TableConfig.INVALID_COLOR) {
            paint.setColor(cell.getTextColor());
        }
        paint.setFakeBoldText(cell.isOverstriking());
        Paint.Align innerAlign = cell.getTextAlignment();
        if (innerAlign != null) {
            paint.setTextAlign(innerAlign);
        }
        paint.setStrikeThruText(cell.isStrikethrough());
    }

    private CellCache getCellCache(Column<Cell> column, int position, Paint paint,
                                   TableConfig config) {
        Cell cell = column.getDatas().get(position);
        if (cell.getCache() == null) {
            cell.setCache(measureText(column, position, paint, config));
        }
        return cell.getCache();
    }

    TextPaint mTextPaint = new TextPaint();

    private CellCache measureText(Column<Cell> column, int position, Paint paint,
                                  TableConfig config) {
        Cell cell = column.getDatas().get(position);
        float maxWidth =
                this.table.getMaxColumnWidth(column) - config.getHorizontalPadding() * 2 - getAsteriskWidth(config, cell) - cellDrawFormat.getImageWidth();
        CharSequence charSequence = getSpan(cell, config, paint);
        mTextPaint.set(paint);
        StaticLayout layout = new StaticLayout(charSequence, mTextPaint, (int) maxWidth,
                StaticLayout.Alignment.ALIGN_NORMAL, 1.0f, 0.0f, false);
        float maxLineWidth = 0;
        for (int i = 0; i < layout.getLineCount(); i++) {
            if (maxLineWidth == maxWidth) {
                break;
            }
            maxLineWidth = Math.max(maxLineWidth, layout.getLineWidth(i));
        }
        // 文字最大宽度增加一点冗余，防止缩放过程中文字意外换行
        return new CellCache(charSequence, maxLineWidth + this.table.getContext().getResources()
                .getDisplayMetrics().density * 2, layout.getHeight());
    }

    private SpannableStringBuilder getSpan(Cell cell, TableConfig config, Paint paint) {
        Context context = this.table.getContext();
        SpannableStringBuilder ssb = new SpannableStringBuilder();
        if (cell.getRichText() != null) {
            for (Cell.RichText richText : cell.getRichText()) {
                ssb.append(richText.getText());
                if (richText.getStyle() != null) {
                    List<Object> spanList = getSpan(cell, config, context, richText.getStyle(),
                            paint);
                    for (int i = 0; i < spanList.size(); i++) {
                        ssb.setSpan(spanList.get(i),
                                ssb.length() - richText.getText()
                                        .length(), ssb.length(),
                                SpannableStringBuilder.SPAN_EXCLUSIVE_EXCLUSIVE);
                    }

                }
            }
        } else {
            ssb.append(cell.getTitle());
        }
        if (cell.getExtraText() != null) {
            ExtraTextConfig extraText = cell.getExtraText();
            ssb.append(extraText.text);
            ssb.setSpan(new RadiusBackgroundSpan(Color.parseColor(extraText.backgroundStyle.color), Color.parseColor(extraText.style.color), DensityUtils.dp2px(context, 4), DensityUtils.dp2px(context, extraText.backgroundStyle.width), DensityUtils.dp2px(context, extraText.backgroundStyle.height), DensityUtils.dp2px(context, extraText.style.fontSize)), ssb.length() - extraText.text.length(), ssb.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
        return ssb;
    }

    @NonNull
    private static List<Object> getSpan(Cell cell, TableConfig config, Context context,
                                        Cell.RichTextStyle style, Paint paint) {
        List<Object> result = new ArrayList<>();
        if (style.getTextColor() != null) {
            result.add(new ForegroundColorSpan(Color.parseColor(style.getTextColor())));
        }
        if (style.getFontSize() != -1) {
            result.add(new RelativeSizeSpan(DensityUtils.dp2px(context, style.getFontSize()) / paint.getTextSize()));
        }
        if (style.getOverstriking() != null) {
            result.add(new StyleSpan(style.getOverstriking() ? Typeface.BOLD : Typeface.NORMAL));
        }
        if (style.getStrikethrough() != null && style.getStrikethrough()) {
            result.add(new StrikethroughSpan());
        }
        if (style.getBorderColor() != null && style.getBorderWidth() != -1) {
            result.add(new RichTextSpan(context, cell, style, config));
        }
        return result;
    }

    private float getFontSize(TableConfig config, Cell bean) {
        if (bean.getFontSize() != 0) {
            return bean.getFontSize();
        } else {
            return config.getContentStyle().getTextSize();
        }
    }
}
