package com.hecom.reporttable.form.data.format.draw;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.text.TextUtils;


import com.hecom.reporttable.TableUtil;
import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.bg.ICellBackgroundFormat;
import com.hecom.reporttable.form.utils.DrawUtils;

import java.lang.ref.SoftReference;
import java.util.HashMap;
import java.util.Map;

import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.TypicalCell;
import com.yy.mobile.emoji.EmojiReader;

/**
 * Created by huang on 2017/10/30.
 */

public class TextDrawFormat<T> implements IDrawFormat<T> {


    private Map<String, SoftReference<String[]>> valueMap; //避免产生大量对象

    public TextDrawFormat() {
        valueMap = new HashMap<>();
    }

    private static final String TAG = "TextDrawFormat";

    @Override
    public int measureWidth(Column<T> column, TypicalCell cell, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        int iconSpace = TableUtil.calculateIconWidth(config,cell.columnIndex,cell.rowIndex);
        String text = getWrapText(column, cell.jsonTableBean.title, paint, config, iconSpace);
//        column.setFormatData(position,value);
        return DrawUtils.getMultiTextWidth(paint, getSplitString(text));
    }

    @Override
    public int measureHeight(Column<T> column, String value, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
//        int iconSpace = TableUtil.calculateIconWidth(config,column.getColumn(),position);
        String text = getWrapText(column, value, paint, config, 0);
        return DrawUtils.getMultiTextHeight(paint, getSplitString(text)) + 40;
    }

    @Override
    public int measureWidth(Column<T> column, int position, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        String value = column.getCacheWrapText(position);
        if(null == value) {
            int iconSpace = TableUtil.calculateIconWidth(config, column.getColumn(), position);
            value = getWrapText(column, column.format(position), paint, config, iconSpace);
        }
        column.setFormatData(position, value);
        return DrawUtils.getMultiTextWidth(paint, getSplitString(value));
    }


    @Override
    public int measureHeight(Column<T> column, int position, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        String value = column.getCacheWrapText(position);
        if(null == value) {
            int iconSpace = TableUtil.calculateIconWidth(config, column.getColumn(), position);
            value = getWrapText(column, column.format(position), paint, config, iconSpace);
        }
        return DrawUtils.getMultiTextHeight(paint, getSplitString(value)) + config.dp8*2;
    }

    @Override
    public float draw(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config) {
//        Log.e(TAG, "draw");
        Paint paint = config.getPaint();
        setTextPaint(config, cellInfo, paint);
//        if (cellInfo.column.getTextAlign() != null) {
//            paint.setTextAlign(cellInfo.column.getTextAlign());
//        }
        return drawText(c, cellInfo, rect, paint, config, 0);
    }


//    public void drawImageText(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config) {
//        //Log.e(TAG, "draw");
//        JsonTableBean tableBean = null;
//        try {
//            tableBean = (JsonTableBean) cellInfo.data;
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//        Paint paint = config.getPaint();
//        setTextPaint(config, cellInfo, paint);
//        if (tableBean != null) {
//            Integer innerAlign = tableBean.getTextAlignment();
//            ItemCommonStyleConfig itemCommonStyleConfig = config.getItemCommonStyleConfig();
//            Paint.Align align = innerAlign != null
//                    ? (innerAlign == 1 ? Paint.Align.CENTER : innerAlign == 2 ? Paint.Align.RIGHT : Paint.Align.LEFT)
//                    : (itemCommonStyleConfig.getTextAlignment() == 1
//                    ? Paint.Align.CENTER
//                    : itemCommonStyleConfig.getTextAlignment() == 2
//                    ? Paint.Align.RIGHT
//                    : Paint.Align.LEFT);
//            paint.setTextAlign(align);
//        }else{
//            paint.setTextAlign(Paint.Align.LEFT);
//        }
//        drawText(c, cellInfo, rect, paint, config, 40);
//    }


    protected float drawText(Canvas c, CellInfo<T> cellInfo, Rect rect, Paint paint, TableConfig config, int marginRight) {
        String value = cellInfo.wrapFlag?cellInfo.value:getWrapText(cellInfo.value, paint, config, marginRight, rect);
        DrawUtils.drawMultiText(c, paint, rect, getSplitString(value));
        return paint.measureText(value);
    }


    public void setTextPaint(TableConfig config, CellInfo<T> cellInfo, Paint paint) {
        config.getContentStyle().fillPaint(paint);
        ICellBackgroundFormat<CellInfo> backgroundFormat = config.getContentCellBackgroundFormat();
        if (backgroundFormat != null && backgroundFormat.getTextColor(cellInfo) != TableConfig.INVALID_COLOR) {
            paint.setColor(backgroundFormat.getTextColor(cellInfo));
        }
        paint.setTextSize(paint.getTextSize() * config.getZoom() * config.getPartlyCellZoom());
        paint.setFakeBoldText(config.getTabArr()[cellInfo.row][cellInfo.col].isOverstriking);
        paint.setTextAlign(TableUtil.getAlignConfig(config,cellInfo.row,cellInfo.col));
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


    public String getWrapText(Column column, String value, Paint paint, TableConfig config, int marginRight) {
        int paddingLeftSize = config.getTextLeftOffset();
        int paddingRightSize = config.getTextRightOffset();
        int maxWidth = column.getMaxWidth();
        return getWrapText(value, paint, marginRight, paddingLeftSize, paddingRightSize, maxWidth);
            /* int paddingLeftSize = config.getTextLeftOffset();
            int paddingRightSize = config.getTextRightOffset();
            float strLen = paint.measureText(value);
            int minWidth = config.getMinCellWidth();
            int maxWidth = config.getMaxCellWidth();
            strLen = strLen + paddingLeftSize + paddingRightSize + 24;
            float realWidth = 0;
            if(strLen < minWidth){
                realWidth = minWidth;
            }else if(strLen >= minWidth && strLen <= maxWidth){
                realWidth = strLen;
            }else if(strLen > maxWidth){
                realWidth = maxWidth;
            }
            if(marginRight > 0){
                realWidth = realWidth - marginRight;
            }

            realWidth = realWidth - paddingLeftSize - paddingRightSize;
            String newStr = "";
            float totalLen = 0;
            for (int i = 0; i < value.length(); i++) {
                char tempChar =  value.charAt(i);
                String tempStr =  String.valueOf(tempChar);
                float tempStrLen = paint.measureText(tempStr);
                totalLen = totalLen + tempStrLen ;
                if(totalLen + 10  > realWidth){
                    newStr = newStr + "\n";
                    totalLen = tempStrLen;
                }
                newStr = newStr + tempStr;
            }
            return "".equals(newStr) ? value : newStr; */
    }

    public String getWrapText(String value, Paint paint, TableConfig config, int marginRight, Rect rect) {
        int maxWidth = rect.right - rect.left;
        return getWrapText(value, paint, 0, 0, 0, maxWidth);
    }

    private String getWrapText(String value, Paint paint, int marginRight, int paddingLeftSize, int paddingRightSize, int maxWidth) {
        if (TextUtils.isEmpty(value)) return value;
        if (maxWidth <= 0) {
            return value;
        } else {
            float strLen = paint.measureText(value);
            int leeway = paddingLeftSize + paddingRightSize + (marginRight > 0 ? marginRight : 0);
            float expect = strLen + leeway;
            float realWidth = expect > maxWidth
                    ? maxWidth - leeway
                    : expect - leeway;
            String newStr = "";
            StringBuilder stringBuilder = new StringBuilder();
            EmojiReader instance = EmojiReader.INSTANCE;
            int length = instance.getTextLength(value);
            int lineStartIndex = 0;
            String temp = "";
            String curLineStr = "";
            for (int i = 1; i <= length; i++) {
                temp = instance.subSequence(value, lineStartIndex, i).toString();
                float tempStrLen = paint.measureText(temp);
                if (tempStrLen <= realWidth) {
                    curLineStr = temp;
                    continue;
                } else {
                    stringBuilder.append(curLineStr);
                    stringBuilder.append("\n");
                    lineStartIndex = i - 1;
                    curLineStr = instance.subSequence(value, lineStartIndex, i).toString();
                }
            }
            stringBuilder.append(curLineStr);
            return stringBuilder.toString();
        }
    }
}
