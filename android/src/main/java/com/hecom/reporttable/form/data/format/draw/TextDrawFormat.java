package com.hecom.reporttable.form.data.format.draw;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;


import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.bg.ICellBackgroundFormat;
import com.hecom.reporttable.form.utils.DrawUtils;

import java.lang.ref.SoftReference;
import java.util.HashMap;
import java.util.Map;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.form.utils.DensityUtils;

/**
 * Created by huang on 2017/10/30.
 */

public class TextDrawFormat<T> implements IDrawFormat<T> {


    private Map<String,SoftReference<String[]>> valueMap; //避免产生大量对象

    public TextDrawFormat() {
        valueMap = new HashMap<>();
    }

    private static final String TAG = "TextDrawFormat";

    @Override
    public int measureWidth(Column<T>column, int position, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
        String value = getWrapText( column.format(position), paint, config, 0);
        return DrawUtils.getMultiTextWidth(paint, getSplitString(value)) + 40;
    }


    @Override
    public int measureHeight(Column<T> column,int position, TableConfig config) {
        Paint paint = config.getPaint();
        config.getContentStyle().fillPaint(paint);
       // return DrawUtils.getMultiTextHeight(paint,getSplitString(column.format(position)));
       String value = getWrapText( column.format(position), paint, config, 0);
       return DrawUtils.getMultiTextHeight(paint, getSplitString(value)) + 40;
    }

    @Override
    public void draw(Canvas c,Rect rect, CellInfo<T> cellInfo, TableConfig config) {
//        Log.e(TAG, "draw");
        Paint paint = config.getPaint();
        setTextPaint(config,cellInfo, paint);
        if(cellInfo.column.getTextAlign() !=null) {
            paint.setTextAlign(cellInfo.column.getTextAlign());
        }
        drawText(c, cellInfo.value, rect, paint, config, 0);
    }


    public void drawImageText(Canvas c,Rect rect, CellInfo<T> cellInfo, TableConfig config) {
        //Log.e(TAG, "draw");
        JsonTableBean tableBean = null;
        try {
            tableBean = (JsonTableBean) cellInfo.data;
        } catch (Exception e) {
            e.printStackTrace();
        }
        boolean isLeft = true;
        if(tableBean != null){
            isLeft = tableBean.isLeft();
        }
        Paint paint = config.getPaint();
        setTextPaint(config,cellInfo, paint);
        if(isLeft){
            paint.setTextAlign(Paint.Align.LEFT);
        }else{
            paint.setTextAlign(Paint.Align.RIGHT);
        }
        drawText(c, cellInfo.value, rect, paint, config, 40);
    }


    protected void drawText(Canvas c, String value, Rect rect, Paint paint,TableConfig config, int marginRight) {
        value = getWrapText( value, paint, config, marginRight);
        DrawUtils.drawMultiText(c,paint,rect,getSplitString(value));
    }



    public void setTextPaint(TableConfig config,CellInfo<T> cellInfo, Paint paint) {
        config.getContentStyle().fillPaint(paint);
        ICellBackgroundFormat<CellInfo> backgroundFormat = config.getContentCellBackgroundFormat();
        if(backgroundFormat!=null && backgroundFormat.getTextColor(cellInfo) != TableConfig.INVALID_COLOR){
            paint.setColor(backgroundFormat.getTextColor(cellInfo));
        }
        paint.setTextSize(paint.getTextSize()*config.getZoom()*config.getPartlyCellZoom());

    }

    protected String[] getSplitString(String val){
        String[] values = null;
        if(valueMap.get(val)!=null){
            values= valueMap.get(val).get();
        }
        if(values == null){
            values = val.split("\n");

            valueMap.put(val, new SoftReference<>(values));
        }
        return values;
    }


    public String getWrapText( String value, Paint paint, TableConfig config, int marginRight){
            int paddingLeftSize = config.getTextLeftOffset();
            int paddingRightSize = config.getTextRightOffset();
            float strLen = paint.measureText(value);
            int minWidth = config.getMinCellWidth();
            int maxWidth = config.getMaxCellWidth();
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

           // realWidth = realWidth - paddingLeftSize - paddingRightSize;
            String newStr = "";
            float totalLen = 0;
            for (int i = 0; i < value.length(); i++) {
                char tempChar =  value.charAt(i);
                String tempStr =  String.valueOf(tempChar);
                float tempStrLen = paint.measureText(tempStr);
                totalLen = totalLen + tempStrLen ;
                if(totalLen + 10 > realWidth){
                    newStr = newStr + "\n";
                    totalLen = tempStrLen;
                }
                newStr = newStr + tempStr;
            }
            return "".equals(newStr) ? value : newStr;
        }
}
