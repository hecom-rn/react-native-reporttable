package com.hecom.reporttable.table.format;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.text.SpannableString;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextUtils;
import android.util.Log;

import com.hecom.reporttable.TableUtil;
import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.bg.ICellBackgroundFormat;
import com.hecom.reporttable.form.data.format.draw.IDrawFormat;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.form.utils.DrawUtils;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.ExtraTextConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;

import java.lang.ref.SoftReference;
import java.text.BreakIterator;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by huang on 2017/10/30.
 */

public class HecomTextDrawFormat<T> implements IDrawFormat<T> {
    private final Map<String, SoftReference<String[]>> valueMap; //避免产生大量对象

    private final Map<Column, Map<Integer, SoftReference<WrapTextResult>>> cacheMap =
            new HashMap<>();

    private final Rect rect = new Rect();

    private final Rect asteriskRect = new Rect();

    private Paint asteriskPaint;

    private HecomTable table;

    private int dp8;

    public HecomTextDrawFormat() {
        valueMap = new HashMap<>();
        asteriskPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        asteriskPaint.setTextAlign(Paint.Align.CENTER);
    }

    public void setTable(HecomTable table) {
        this.table = table;
        dp8 = DensityUtils.dp2px(table.getContext(), 8);
    }

    @Override
    public int measureWidth(Column<T> column, int position, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        JsonTableBean jsonTableBean = (JsonTableBean) column.getDatas().get(position);
        ExtraTextConfig extraText = jsonTableBean.extraText;
        WrapTextResult result = getCacheWrapText(column, position, paint, config);
        float asteriskWidth = getAsteriskWidth(config, jsonTableBean);
        int mainTextWidth =
                DrawUtils.getMultiTextWidth(paint, getSplitString(result.text)) + (int) asteriskWidth;
        if (extraText == null) {
            return mainTextWidth;
        } else {
            int maxWidth = column.getMaxWidth();
            int extraWidth = DensityUtils.sp2px(this.table.getContext(),
                    extraText.backgroundStyle.width + 2);
            if (maxWidth < 0) {
                return mainTextWidth + extraWidth;
            } else {
                if (maxWidth - result.lastLineWidth > extraWidth) {
                    return (int) Math.max(result.lastLineWidth + extraWidth, mainTextWidth);
                } else {
                    return Math.max(extraWidth, mainTextWidth);
                }
            }
        }
    }

    private float getAsteriskWidth(TableConfig config, JsonTableBean jsonTableBean) {
        String asteriskColor = jsonTableBean.getAsteriskColor();
        if (TextUtils.isEmpty(asteriskColor)) {
            return 0;
        } else {
            asteriskPaint.setTextSize((jsonTableBean.getFontSize() != null && jsonTableBean.getFontSize()
                    .compareTo(0) > 0) ? jsonTableBean.getFontSize() : config.getContentStyle()
                    .getTextSize());
            return asteriskPaint.measureText("*");
        }
    }


    @Override
    public int measureHeight(Column<T> column, int position, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        WrapTextResult result = getCacheWrapText(column, position, paint, config);
        return DrawUtils.getMultiTextHeight(paint, getSplitString(result.text)) + dp8 * 2;
    }

    @Override
    public void draw(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config) {
        JsonTableBean cell = (JsonTableBean) cellInfo.data;
        if (cell.getForbidden()) {
            return;
        }
        int asteriskWidth = (int) (getAsteriskWidth(config, cell) * config.getZoom());
        //  表头必填项增加必填符号*;左对齐字段*号放右边，右对产/居中对产字段*方左边
        Paint paint = config.getPaint();
        if (asteriskWidth > 0) {
            Paint.Align textAlign = TableUtil.getAlignConfig(table.getItemCommonStyleConfig(),
                    cellInfo);
            if (textAlign == null) textAlign = Paint.Align.CENTER;
            float textWidth =
                    (measureWidth(cellInfo.column, cellInfo.row, config) * config.getZoom()) - asteriskWidth;
            setTextPaint(config, cellInfo, paint);
            switch (textAlign) { //单元格内容的对齐方式
                case CENTER:
                    this.rect.set(rect.left + asteriskWidth, rect.top, rect.right,
                            rect.bottom);
                    drawText(c, cellInfo, this.rect, paint, config);
                    int asteriskRight = (int) ((this.rect.right + this.rect.left - textWidth) / 2);
                    this.asteriskRect.set(asteriskRight - asteriskWidth, rect.top, asteriskRight
                            , rect.bottom);
                    this.drawAsterisk(c, this.asteriskRect, cellInfo, config);
                    break;
                case LEFT:
                    this.rect.set(rect.left, rect.top, rect.right - asteriskWidth,
                            rect.bottom);
                    drawText(c, cellInfo, this.rect, paint, config);
                    int asteriskLeft = (int) (this.rect.left + textWidth);
                    this.asteriskRect.set(asteriskLeft, rect.top, asteriskLeft + asteriskWidth,
                            rect.bottom);
                    this.drawAsterisk(c, this.asteriskRect, cellInfo, config);

                    break;
                case RIGHT:
                    this.rect.set(rect.left + asteriskWidth, rect.top, rect.right,
                            rect.bottom);
                    drawText(c, cellInfo, this.rect, paint, config);
                    asteriskRight = (int) (this.rect.right - textWidth);
                    this.asteriskRect.set(asteriskRight - asteriskWidth, rect.top, asteriskRight
                            , rect.bottom);
                    this.drawAsterisk(c, this.asteriskRect, cellInfo, config);
                    break;
            }
        } else {
            setTextPaint(config, cellInfo, paint);
            drawText(c, cellInfo, rect, paint, config);
        }
    }

    private void drawAsterisk(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config) {
        JsonTableBean jsonTableBean = (JsonTableBean) cellInfo.data;
        String asteriskColor = jsonTableBean.getAsteriskColor();
        int textSize = (jsonTableBean.getFontSize() != null && jsonTableBean.getFontSize()
                .compareTo(0) > 0) ? jsonTableBean.getFontSize() : config.getContentStyle()
                .getTextSize();
        asteriskPaint.setTextSize(textSize * config.getZoom());
        asteriskPaint.setColor(Color.parseColor(asteriskColor));
        DrawUtils.drawSingleText(c, asteriskPaint, rect, "*");
    }

    protected void drawText(Canvas c, CellInfo<T> cellInfo, Rect rect, Paint paint,
                            TableConfig config) {
        WrapTextResult result = getCacheWrapText(cellInfo.column, cellInfo.row, paint, config);
        JsonTableBean bean = (JsonTableBean) cellInfo.data;
        if (bean.richText != null) {
            SpannableStringBuilder span = RichTextHelper.buildRichText(this.table.getContext(),
                    bean);
            DrawUtils.drawMultiText(c, paint, rect, span);
        } else if (bean.extraText == null) {
            DrawUtils.drawMultiText(c, paint, rect, result.text);
        } else {
            ExtraTextConfig extraText = bean.extraText;
            int width = (int) (DensityUtils.dp2px(this.table.getContext(),
                    extraText.backgroundStyle.width) * config.getZoom());
            SpannableString span = new SpannableString(result.text + extraText.text);
            span.setSpan(new RadiusBackgroundSpan(
                            Color.parseColor(extraText.backgroundStyle.color),
                            Color.parseColor(extraText.style.color),
                            (int) (DensityUtils.dp2px(this.table.getContext(), 4) * config.getZoom()),
                            width,
                            (int) (DensityUtils.dp2px(this.table.getContext(),
                                    extraText.backgroundStyle.height) * config.getZoom()),
                            (int) (DensityUtils.dp2px(this.table.getContext(),
                                    extraText.style.fontSize) * config.getZoom())),
                    result.text.length(), result.text.length() + extraText.text.length(),
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            DrawUtils.drawMultiText(c, paint, rect, span);
        }
    }


    public void setTextPaint(TableConfig config, CellInfo<T> cellInfo, Paint paint) {
        JsonTableBean jsonTableBean = (JsonTableBean) cellInfo.data;
        config.getContentStyle().fillPaint(paint);
        ICellBackgroundFormat<CellInfo> backgroundFormat = config.getContentCellBackgroundFormat();
        if (backgroundFormat != null && backgroundFormat.getTextColor(cellInfo) != TableConfig.INVALID_COLOR) {
            paint.setColor(backgroundFormat.getTextColor(cellInfo));
        }
        paint.setTextSize(paint.getTextSize() * config.getZoom());
        paint.setFakeBoldText(jsonTableBean.isOverstriking);
        paint.setTextAlign(TableUtil.getAlignConfig(table.getItemCommonStyleConfig(), cellInfo));
        paint.setStrikeThruText(null == jsonTableBean.strikethrough ? false :
                jsonTableBean.strikethrough);
    }

    protected String[] getSplitString(String val) {
        String[] values = null;
        if (valueMap.get(val) != null) {
            values = valueMap.get(val).get();
        }
        if (values == null) {
            values = val.split("\n");

            valueMap.put(val, new SoftReference<>(values));
        }
        return values;
    }

    private WrapTextResult getCacheWrapText(Column column, int position, Paint paint,
                                            TableConfig config) {
        Map<Integer, SoftReference<WrapTextResult>> positionMap = cacheMap.get(column);
        if (positionMap == null) {
            positionMap = new HashMap<>();
            cacheMap.put(column, positionMap);
        }
        SoftReference<WrapTextResult> result = positionMap.get(position);
        if (result == null) {
            float asteriskWidth = getAsteriskWidth(config, (JsonTableBean) column.getDatas()
                    .get(position));
            result = new SoftReference<>(getWrapText(column, column.format(position), paint,
                    config, asteriskWidth));
            positionMap.put(position, result);
        }
        return result.get();
    }


    public WrapTextResult getWrapText(Column column, String value, Paint paint,
                                      TableConfig config, float marginRight) {
        int paddingSize = config.getHorizontalPadding();
        return getWrapText(value, paint, marginRight, paddingSize, paddingSize,
                column.getMaxWidth());
    }

    private WrapTextResult getWrapText(String value, Paint paint, float marginRight,
                                       int paddingLeftSize, int paddingRightSize, int maxWidth) {
        if (TextUtils.isEmpty(value) || maxWidth <= 0) {
            return new WrapTextResult(value, 0);
        } else {
            float strLen = paint.measureText(value);
            float leeway = paddingLeftSize + paddingRightSize + (marginRight > 0 ? marginRight : 0);
            float expect = strLen + leeway;
            float realWidth = expect > maxWidth
                    ? maxWidth - leeway
                    : expect - leeway;
            StringBuilder stringBuilder = new StringBuilder();

            BreakIterator breakIterator = BreakIterator.getCharacterInstance();
            breakIterator.setText(value);

            String temp = "";
            String curLineStr = "";
            int start = breakIterator.first();
            int end = breakIterator.next();
            boolean limitWidthError = false;
            float curStrLen = 0f;
            float tempStrLen = 0f;
            while (end != BreakIterator.DONE) {
                temp = value.substring(start, end);
                curStrLen = tempStrLen = paint.measureText(temp);
                if (tempStrLen <= realWidth) {
                    curLineStr = temp;
                    if (curLineStr.endsWith("\n")) {
                        stringBuilder.append(curLineStr);
                        curLineStr = "";
                        curStrLen = 0;
                        start = end;
                    }
                } else {
                    if (end - start == 1) {
                        limitWidthError = true;
                        curLineStr = temp;
                        start = end;
                        end = breakIterator.next();
                        if (end != BreakIterator.DONE) {
                            stringBuilder.append(curLineStr);
                            stringBuilder.append("\n");
                        }
                    } else {
                        stringBuilder.append(curLineStr);
                        stringBuilder.append("\n");
                        start = end - 1;
                    }
                    continue;
                }
                end = breakIterator.next();
            }
            if (limitWidthError) {
                Log.w("TextDrawFormat", value + "————外部限定所在单元格宽度过小！！！");
            }
            stringBuilder.append(curLineStr);
            return new WrapTextResult(stringBuilder.toString(), curStrLen);
        }
    }
}
