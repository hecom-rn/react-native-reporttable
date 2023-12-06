package com.hecom.reporttable.form.data.format.draw;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.TextUtils;
import android.util.Log;

import com.hecom.reporttable.TableUtil;
import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.bg.ICellBackgroundFormat;
import com.hecom.reporttable.form.utils.DrawUtils;
import com.hecom.reporttable.table.bean.ExtraTextConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.TypicalCell;

import java.lang.ref.SoftReference;
import java.text.BreakIterator;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by huang on 2017/10/30.
 */

public class TextDrawFormat<T> implements IDrawFormat<T> {


    private Map<String, SoftReference<String[]>> valueMap; //避免产生大量对象

    public TextDrawFormat() {
        valueMap = new HashMap<>();
    }

    private static final String TAG = "TextDrawFormat";
    int asteriskRight, asteriskLeft;
    float textWidth;

    private Rect contentReact = new Rect();
    private Rect asteriskReact = new Rect();

    @Override
    public int measureWidth(Column<T> column, TypicalCell cell, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        int iconSpace = TableUtil.calculateIconWidth(config, cell.columnIndex, cell.rowIndex);
        float asteriskWidth = TableUtil.calculateAsteriskWidth(config, cell.columnIndex, cell.rowIndex);
        WrapTextResult result = getWrapText(column, cell.jsonTableBean.title, paint, config, (int) (iconSpace + asteriskWidth), -1);
//        column.setFormatData(position,value);
        ExtraTextConfig extraText = cell.jsonTableBean.extraText;
        int mainTextWidth = DrawUtils.getMultiTextWidth(paint, getSplitString(result.text));
        if (extraText == null) {
            return mainTextWidth;
        } else {
            int maxWidth = column.getMaxWidth();
            int extraWidth = config.getSp2Px(extraText.backgroundStyle.width + 2);
            if (maxWidth < 0) {
                return mainTextWidth + extraWidth;
            } else {
                int paddingLeftSize = config.getTextLeftOffset();
                int paddingRightSize = config.getTextRightOffset();
                int margin = (int) (iconSpace + asteriskWidth);
                if (maxWidth - paddingLeftSize - paddingRightSize - margin - result.lastLineWidth > extraWidth) {
                    return (int) Math.max(result.lastLineWidth + extraWidth, mainTextWidth);
                } else {
                    return Math.max(extraWidth, mainTextWidth);
                }
            }
        }
    }

    @Override
    public int measureHeight(Column<T> column, TypicalCell cell, TableConfig config, int sepcWidth) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        int iconSpace = TableUtil.calculateIconWidth(config, cell.columnIndex, cell.rowIndex);
        float asteriskWidth = TableUtil.calculateAsteriskWidth(config, cell.columnIndex, cell.rowIndex);
        WrapTextResult result = getWrapText(column, cell.jsonTableBean.title, paint, config, (int) (iconSpace + asteriskWidth), sepcWidth);

        ExtraTextConfig extraText = cell.jsonTableBean.extraText;
        int mainTextHeight = DrawUtils.getMultiTextHeight(paint, getSplitString(result.text)) + config.dp8 * 2;
        if (extraText == null) {
            return mainTextHeight;
        } else {
            int maxWidth = column.getMaxWidth();
            if (maxWidth < 0) {
                return mainTextHeight;
            } else {
                int extraWidth = config.getSp2Px(extraText.backgroundStyle.width + 2);
                int extraHeight = extraText.backgroundStyle.height;
                int paddingLeftSize = config.getTextLeftOffset();
                int paddingRightSize = config.getTextRightOffset();
                int margin = (int) (iconSpace + asteriskWidth);
                if (maxWidth - paddingLeftSize - paddingRightSize - margin - result.lastLineWidth > extraWidth) {
                    return mainTextHeight;
                } else {
                    return mainTextHeight + extraHeight;
                }
            }
        }
    }

    @Override
    public int measureWidth(Column<T> column, int position, TableConfig config, boolean onlyCalculate, int specWidth) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        JsonTableBean jsonTableBean = config.getTabArr()[position][column.getColumn()];
        ExtraTextConfig extraText = jsonTableBean.extraText;
        WrapTextResult result = column.getCacheWrapText(position);
        float asteriskWidth = 0;
        int iconSpace = 0;
        if (null == result || extraText != null) {
            asteriskWidth = TableUtil.calculateAsteriskWidth(config, column.getColumn(), position);
            iconSpace = TableUtil.calculateIconWidth(config, column.getColumn(), position);
        }
        if (null == result) {
            result = getWrapText(column, column.format(position), paint, config, (int) (iconSpace + asteriskWidth), specWidth);
        }
        if (!onlyCalculate) {
            column.setFormatData(position, result);
        }
        int mainTextWidth = DrawUtils.getMultiTextWidth(paint, getSplitString(result.text));
        if (extraText == null) {
            return mainTextWidth;
        } else {
            int maxWidth = column.getMaxWidth();
            int extraWidth = config.getSp2Px(extraText.backgroundStyle.width + 2);
            if (maxWidth < 0) {
                return mainTextWidth + extraWidth;
            } else {
                int paddingLeftSize = config.getTextLeftOffset();
                int paddingRightSize = config.getTextRightOffset();
                int margin = (int) (iconSpace + asteriskWidth);
                if (maxWidth - paddingLeftSize - paddingRightSize - margin - result.lastLineWidth > extraWidth) {
                    return (int) Math.max(result.lastLineWidth + extraWidth, mainTextWidth);
                } else {
                    return Math.max(extraWidth, mainTextWidth);
                }
            }
        }
    }


    @Override
    public int measureHeight(Column<T> column, int position, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        JsonTableBean jsonTableBean = config.getTabArr()[position][column.getColumn()];
        ExtraTextConfig extraText = jsonTableBean.extraText;
        WrapTextResult result = column.getCacheWrapText(position);
        float asteriskWidth = 0;
        int iconSpace = 0;
        if (null == result || extraText != null) {
            asteriskWidth = TableUtil.calculateAsteriskWidth(config, column.getColumn(), position);
            iconSpace = TableUtil.calculateIconWidth(config, column.getColumn(), position);
        }
        if (null == result) {
            result = getWrapText(column, column.format(position), paint, config, (int) (iconSpace + asteriskWidth), -1);
        }
//        return DrawUtils.getMultiTextHeight(paint, getSplitString(result.text)) + config.dp8 * 2;

        int mainTextHeight = DrawUtils.getMultiTextHeight(paint, getSplitString(result.text)) + config.dp8 * 2;
        if (extraText == null) {
            return mainTextHeight;
        } else {
            int maxWidth = column.getMaxWidth();
            if (maxWidth < 0) {
                return mainTextHeight;
            } else {
                int extraWidth = config.getSp2Px(extraText.backgroundStyle.width + 2);
                int extraHeight = extraText.backgroundStyle.height;
                int paddingLeftSize = config.getTextLeftOffset();
                int paddingRightSize = config.getTextRightOffset();
                int margin = (int) (iconSpace + asteriskWidth);
                if (maxWidth - paddingLeftSize - paddingRightSize - margin - result.lastLineWidth > extraWidth) {
                    return mainTextHeight;
                } else {
                    return mainTextHeight + extraHeight;
                }
            }
        }
    }

    @Override
    public float draw(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config) {
        int asteriskWidth = (int) (TableUtil.calculateAsteriskWidth(config, cellInfo.col, cellInfo.row) * config.getZoom());
        //  表头必填项增加必填符号*;左对齐字段*号放右边，右对产/居中对产字段*方左边
        Paint paint = config.getPaint();
        setTextPaint(config, cellInfo, paint);
        if (asteriskWidth > 0) {
            Paint.Align textAlign = TableUtil.getAlignConfig(config, cellInfo.row, cellInfo.col);
            if (textAlign == null) textAlign = Paint.Align.CENTER;
            switch (textAlign) { //单元格内容的对齐方式
                case CENTER:
                    this.contentReact.set(rect.left + asteriskWidth, rect.top, rect.right, rect.bottom);
                    textWidth = drawText(c, cellInfo, this.contentReact, paint, config, 0);
                    asteriskRight = (int) ((this.contentReact.right + this.contentReact.left - textWidth) / 2);
                    this.asteriskReact.set(asteriskRight - asteriskWidth, rect.top, asteriskRight, rect.bottom);
                    this.drawAsterisk(c, this.asteriskReact, cellInfo, config);
                    break;
                case LEFT:
                    this.contentReact.set(rect.left, rect.top, rect.right - asteriskWidth, rect.bottom);
                    textWidth = drawText(c, cellInfo, this.contentReact, paint, config, 0);
                    asteriskLeft = (int) (this.contentReact.left + textWidth);
                    this.asteriskReact.set(asteriskLeft, rect.top, asteriskLeft + asteriskWidth, rect.bottom);
                    this.drawAsterisk(c, this.asteriskReact, cellInfo, config);

                    break;
                case RIGHT:
                    this.contentReact.set(rect.left + asteriskWidth, rect.top, rect.right, rect.bottom);
                    textWidth = drawText(c, cellInfo, this.contentReact, paint, config, 0);
                    asteriskRight = (int) (this.contentReact.right - textWidth);
                    this.asteriskReact.set(asteriskRight - asteriskWidth, rect.top, asteriskRight, rect.bottom);
                    this.drawAsterisk(c, this.asteriskReact, cellInfo, config);
                    break;
            }
            return textWidth + asteriskWidth;
        } else {
            return drawText(c, cellInfo, rect, paint, config, 0);
        }
    }

    private void drawAsterisk(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config) {
        Paint asteriskPaint = config.getAsteriskPaint();
        JsonTableBean jsonTableBean = config.getTabArr()[cellInfo.row][cellInfo.col];
        String asteriskColor = jsonTableBean.getAsteriskColor();
        int textSize = (jsonTableBean.getFontSize() != null && jsonTableBean.getFontSize().compareTo(0) > 0) ? jsonTableBean.getFontSize() : config.getContentStyle().getTextSize();
        asteriskPaint.setTextSize(textSize * config.getZoom());
        asteriskPaint.setColor(Color.parseColor(asteriskColor));
        DrawUtils.drawMultiText(c, asteriskPaint, rect, config.ASTERISK_ARRAY);
    }

    protected float drawText(Canvas c, CellInfo<T> cellInfo, Rect rect, Paint paint, TableConfig config, int marginRight) {
        WrapTextResult result = null;
        if (cellInfo.wrapFlag) {
            result = cellInfo.column.getCacheWrapText(cellInfo.row);
        } else {
            result = getWrapText(cellInfo.value, paint, config, marginRight, rect);
        }
        String[] values = getSplitString(result.text);
        ExtraTextConfig extraText = config.getTabArr()[cellInfo.row][cellInfo.col].extraText;
        if (extraText == null) {
            DrawUtils.drawSingleText(c, paint, rect, result.text);
            return DrawUtils.getMultiTextWidth(paint, values);
        } else {
            if (rect.width() - result.lastLineWidth < config.getSp2Px(extraText.backgroundStyle.width)) {
                SpannableString span = new SpannableString(result.text + "\n" + extraText.text);
                span.setSpan(new RadiusBackgroundSpan(
                                Color.parseColor(extraText.backgroundStyle.color),
                                Color.parseColor(extraText.style.color),
                                2,
                                config.getSp2Px(config.getSp2Px(extraText.backgroundStyle.width)),
                                config.getSp2Px(config.getSp2Px(extraText.backgroundStyle.width)),
                                config.getSp2Px(config.getSp2Px(extraText.style.fontSize))),
                        result.text.length(), result.text.length() + extraText.text.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                DrawUtils.drawMultiText(c, paint, rect, span);
                return DrawUtils.getMultiTextWidth(paint, values);
            } else {
                SpannableString span = new SpannableString(result.text + extraText.text);
                span.setSpan(new RadiusBackgroundSpan(
                                Color.parseColor(extraText.backgroundStyle.color),
                                Color.parseColor(extraText.style.color),
                                2,
                                config.getSp2Px(config.getSp2Px(extraText.backgroundStyle.width)),
                                config.getSp2Px(config.getSp2Px(extraText.backgroundStyle.width)),
                                config.getSp2Px(config.getSp2Px(extraText.style.fontSize))),
                        result.text.length(), result.text.length() + extraText.text.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                DrawUtils.drawMultiText(c, paint, rect, span);
                return Math.max(DrawUtils.getMultiTextWidth(paint, values), result.lastLineWidth + config.getSp2Px(extraText.backgroundStyle.width));
            }
        }
    }


    public void setTextPaint(TableConfig config, CellInfo<T> cellInfo, Paint paint) {
        JsonTableBean jsonTableBean = config.getTabArr()[cellInfo.row][cellInfo.col];
        config.getContentStyle().fillPaint(paint);
        ICellBackgroundFormat<CellInfo> backgroundFormat = config.getContentCellBackgroundFormat();
        if (backgroundFormat != null && backgroundFormat.getTextColor(cellInfo) != TableConfig.INVALID_COLOR) {
            paint.setColor(backgroundFormat.getTextColor(cellInfo));
        }
        paint.setTextSize(paint.getTextSize() * config.getZoom() * config.getPartlyCellZoom());
        paint.setFakeBoldText(config.getTabArr()[cellInfo.row][cellInfo.col].isOverstriking);
        paint.setTextAlign(TableUtil.getAlignConfig(config, cellInfo.row, cellInfo.col));
        paint.setStrikeThruText(null == jsonTableBean.strikethrough ? false : jsonTableBean.strikethrough);
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


    public WrapTextResult getWrapText(Column column, String value, Paint paint, TableConfig config, int marginRight, int specWidth) {
        int paddingLeftSize = config.getTextLeftOffset();
        int paddingRightSize = config.getTextRightOffset();
        int maxWidth = specWidth < 0 ? column.getMaxWidth() : specWidth;
        return getWrapText(value, paint, marginRight, paddingLeftSize, paddingRightSize, maxWidth);
    }

    public WrapTextResult getWrapText(String value, Paint paint, TableConfig config, int marginRight, Rect rect) {
        int maxWidth = rect.right - rect.left;
        return getWrapText(value, paint, 0, 0, 0, maxWidth);
    }

    private WrapTextResult getWrapText(String value, Paint paint, int marginRight, int paddingLeftSize, int paddingRightSize, int maxWidth) {
        if (TextUtils.isEmpty(value) || maxWidth <= 0) {
            return new WrapTextResult(value, 0);
        } else {
            float strLen = paint.measureText(value);
            int leeway = paddingLeftSize + paddingRightSize + (marginRight > 0 ? marginRight : 0);
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
