package com.hecom.reporttable.table.format;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.style.ForegroundColorSpan;
import android.text.style.LineHeightSpan;
import android.text.style.RelativeSizeSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.StyleSpan;
import android.util.Log;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.draw.IDrawFormat;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.bean.CellCache;
import com.hecom.reporttable.table.bean.ExtraText;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;

/**
 * Created by huang on 2017/10/30.
 */

public class HecomTextDrawFormat implements IDrawFormat<Cell> {

    private final HecomTable table;

    private final TextPaint mTextPaint = new TextPaint();

    private final TextPaint mMeasurePaint = new TextPaint();

    private final CellDrawFormat cellDrawFormat;

    public HecomTextDrawFormat(HecomTable table, CellDrawFormat cellDrawFormat) {
        this.table = table;
        this.cellDrawFormat = cellDrawFormat;
    }

    @Override
    public int measureWidth(Column<Cell> column, int position, TableConfig config) {
        Cell cell = column.getDatas().get(position);
        setTextPaint(config, cell, mMeasurePaint, false);
        CellCache result = getCellCache(column, position, mMeasurePaint, config);
        return (int) result.getWidth();
    }


    @Override
    public int measureHeight(Column<Cell> column, int position, TableConfig config) {
        setTextPaint(config, column.getDatas().get(position), mMeasurePaint, false);
        CellCache result = getCellCache(column, position, mMeasurePaint, config);
        return result.getHeight();
    }

    @Override
    public void draw(Canvas c, Rect rect, CellInfo<Cell> cellInfo, TableConfig config) {
        Cell cell = cellInfo.data;
        if (cell.isForbidden()) {
            return;
        }
        float drawWidth = drawText(c, cellInfo, rect, config);
        cellInfo.data.getCache().setDrawWidth(drawWidth);
    }

    protected float drawText(Canvas c, CellInfo<Cell> cellInfo, Rect rect, TableConfig config) {
        setTextPaint(config, cellInfo.data, mTextPaint, true);
        CellCache result = getCellCache(cellInfo.column, cellInfo.row, mTextPaint, config);
        int saveCount = c.getSaveCount();
        c.save();
        Paint.Align textAlign = mTextPaint.getTextAlign();
        mTextPaint.setTextAlign(Paint.Align.LEFT);

        Layout.Alignment align;
        // 根据对齐方式计算偏移量
        switch (textAlign) {
            case LEFT: // 左对齐
            default:
                align = Layout.Alignment.ALIGN_NORMAL;
                break;
            case CENTER: // 居中对齐
                align = Layout.Alignment.ALIGN_CENTER;
                break;
            case RIGHT: // 右对齐
                align = Layout.Alignment.ALIGN_OPPOSITE;
                break;
        }

        StaticLayout layout = new StaticLayout(result.getText(), mTextPaint, rect.width(), align,
                1.0f, 0.0f, false);

        // 计算垂直居中的偏移量
        int dy = (rect.height() - layout.getHeight()) / 2;
        c.clipRect(rect);
        c.translate(rect.left, rect.top + dy);
        // 绘制文本
        layout.draw(c);
        c.restoreToCount(saveCount);
        float drawWidth = 0;
        for (int i = 0; i < layout.getLineCount(); i++) {
            float lineWidth = layout.getLineWidth(i);
            if (lineWidth > drawWidth) {
                drawWidth = lineWidth;
            }
        }
        return drawWidth;
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


    private CellCache measureText(Column<Cell> column, int position, Paint paint,
                                  TableConfig config) {
        Cell cell = column.getDatas().get(position);
        float maxWidth = cellDrawFormat.getMaxTextWidth(column, position, config);
        CharSequence charSequence = getSpan(cell, config, paint, maxWidth);
        mTextPaint.set(paint);
        StaticLayout layout = new StaticLayout(charSequence, mTextPaint, (int) maxWidth,
                StaticLayout.Alignment.ALIGN_NORMAL, 1.0f, 0.0f, false);
        float maxLineWidth = 0;
        if (this.table.hasResizeWidth(column)) {
            maxLineWidth = maxWidth;
        } else {
            for (int i = 0; i < layout.getLineCount(); i++) {
                if (maxLineWidth == maxWidth) {
                    break;
                }
                maxLineWidth = Math.max(maxLineWidth, layout.getLineWidth(i));
            }
            maxLineWidth += this.table.getContext().getResources()
                    .getDisplayMetrics().density * 2;
        }
        // 文字最大宽度增加一点冗余，防止缩放过程中文字意外换行
        return new CellCache(charSequence, maxLineWidth, layout.getHeight());
    }

    private SpannableStringBuilder getSpan(Cell cell, TableConfig config, Paint paint, float maxWidth) {
        Context context = this.table.getContext();
        SpannableStringBuilder ssb = new SpannableStringBuilder();
        if (cell.getRichText() != null) {
            for (int i = 0; i < cell.getRichText().size(); ++i) {
                Cell.RichText richText = cell.getRichText().get(i);
                ssb.append(richText.getText());
                if (richText.getStyle() != null) {
                    List<Object> spanList = getSpan(cell, config, context, richText.getStyle(),
                            paint, maxWidth);
                    for (int j = 0; j < spanList.size(); j++) {
                        ssb.setSpan(spanList.get(j), ssb.length() - richText.getText()
                                        .length(), ssb.length(),
                                SpannableStringBuilder.SPAN_EXCLUSIVE_EXCLUSIVE);
                    }
                }
                if (i < cell.getRichText().size()) {
                    ssb.append(' ');
                }
            }
        } else {
            ssb.append(cell.getTitle());
        }
        if (cell.getExtraText() != null && cell.getExtraText().text != null && !cell.getExtraText().text.isEmpty()) {
            ExtraText extraText = cell.getExtraText();
            int start, end;
            if (extraText.isLeft) {
                ssb.insert(0, extraText.text);
                start = 0;
                end = extraText.text.length();
            } else {
                ssb.append(extraText.text);
                start = ssb.length() - extraText.text.length();
                end = ssb.length();
            }
            ssb.setSpan(new RadiusBackgroundSpan(config, extraText), start, end,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
        return ssb;
    }

    @NonNull
    private static List<Object> getSpan(Cell cell, TableConfig config, Context context,
                                        Cell.RichTextStyle style, Paint paint, float maxWidth) {
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
        if ((style.getBorderColor() != null && style.getBorderWidth() != -1) || style.getBackgroundColor() != null) {
            RichTextSpan richTextSpan = new RichTextSpan(context, cell, style, config, maxWidth);
            result.add(richTextSpan);
            result.add(new LineHeightSpan.Standard(richTextSpan.getBackHeight()));
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
