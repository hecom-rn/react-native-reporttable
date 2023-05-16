package com.hecom.reporttable.form.data.format.draw;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;

import com.hecom.reporttable.TableUtil;
import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.exception.TableException;
import com.hecom.reporttable.table.bean.TypicalCell;


/**
 * Created by huang on 2017/10/30.
 */

public  class TextImageDrawFormat<T> extends ImageResDrawFormat<T> {

    public static final int LEFT =0;
    public static final int TOP =1;
    public static final int RIGHT =2;
    public static final int BOTTOM =3;

   private TextDrawFormat<T> textDrawFormat;
   private int drawPadding;
    private int direction;
    private Rect rect;
    private int resourceId;
    private Context context;

    public TextImageDrawFormat(int imageWidth, int imageHeight,int drawPadding) {
       this(imageWidth,imageHeight,LEFT,drawPadding);

    }

    public TextImageDrawFormat(int imageWidth, int imageHeight,int direction,int drawPadding) {
        super(imageWidth, imageHeight);
        textDrawFormat = new TextDrawFormat<>();
        this.rect = new Rect();
        this.direction = direction;
        this.drawPadding = drawPadding;
        if(direction >BOTTOM || direction <LEFT){
            throw  new TableException("Please set the direction less than 3 greater than 0");
        }

    }

    public int getResourceId() {
        return resourceId;
    }

    public void setResourceId(int resourceId) {
        this.resourceId = resourceId;
    }

    @Override
    protected Context getContext() {
        return context;
    }

    public void setContext(Context context) {
        this.context = context;
    }

    @Override
    protected int getResourceID(T object, String value, int position) {
        return getResourceId();
    }

    @Override
    public int measureWidth(Column<T> column, TypicalCell cell, TableConfig config) {
        return textDrawFormat.measureWidth(column, cell, config);
//        if(direction == LEFT || direction == RIGHT) {
//            return getImageWidth() + textWidth+drawPadding;
//        }else {
//            return Math.max(this.imageWidth,textWidth);
//        }
    }


    @Override
    public int measureWidth(Column<T> column, int position, TableConfig config) {
        int textWidth = textDrawFormat.measureWidth(column,position, config);
        return textWidth;
//        if(direction == LEFT || direction == RIGHT) {
//            return getImageWidth() + textWidth+drawPadding;
//        }else {
//            return Math.max(super.measureWidth(column,position,config),textWidth);
//        }
    }

    @Override
    public int measureHeight(Column<T> column, String value, TableConfig config) {
        int imgHeight = this.imageHeight;
        int textHeight = textDrawFormat.measureHeight(column,value,config);

        if(direction == TOP || direction == BOTTOM) {
            return getImageHeight() + textHeight+drawPadding;
        }else {
            return Math.max(imgHeight,textHeight);
        }

    }

    @Override
    public int measureHeight(Column<T> column,int position, TableConfig config) {
        int imgHeight = super.measureHeight(column,position,config);
        int textHeight = textDrawFormat.measureHeight(column,position,config);

        if(direction == TOP || direction == BOTTOM) {
            return getImageHeight() + textHeight+drawPadding;
        }else {
            return Math.max(imgHeight,textHeight);
        }
    }

    @Override
    public float draw(Canvas c, Rect rect, CellInfo<T> cellInfo, TableConfig config) {

        if (getBitmap(cellInfo.data, cellInfo.value, cellInfo.row) == null) {
            textDrawFormat.draw(c, rect, cellInfo, config);
            return 0;
        }
//        int imgWidth = (int) (getImageWidth()*config.getZoom());
//        int imgHeight = (int) (getImageHeight()*config.getZoom());
        int imgWidth = (int) (context.getDrawable(resourceId).getIntrinsicWidth() * config.getZoom());
        rect.left += config.getHorizontalPadding();
        rect.right -= config.getHorizontalPadding();
        rect.top += config.getVerticalPadding();
        rect.bottom -= config.getVerticalPadding();
        float textWidth;
//        Paint.Align textAlign = cellInfo.column.getTextAlign();
        Paint.Align textAlign = TableUtil.getAlignConfig(config, cellInfo.row, cellInfo.col);
        if (textAlign == null) textAlign = Paint.Align.CENTER;
        int imgRight = 0, imgLeft = 0;
        switch (direction) {//单元格icon的相对位置
            case LEFT:
//                this.rect.set(rect.left+(imgWidth+drawPadding),rect.top,rect.right,rect.bottom);
//                textDrawFormat.draw(c,this.rect,cellInfo,config);
////                int imgRight = (rect.right+rect.left)/2- textDrawFormat.measureWidth(cellInfo.column,cellInfo.row,config)/2+drawPadding;
//                int imgRight = Math.min(this.rect.right, this.rect.left) - drawPadding;
//                this.rect.set(imgRight-imgWidth,rect.top,imgRight,rect.bottom);
//                super.draw(c,this.rect,cellInfo,config);
                this.rect.set(rect.left + imgWidth + drawPadding, rect.top, rect.right, rect.bottom);
                textWidth = textDrawFormat.draw(c, this.rect, cellInfo, config);
                switch (textAlign) { //单元格内容的对齐方式
                    case CENTER:
                        imgRight = (int) Math.min(this.rect.right, (this.rect.right + this.rect.left - textWidth) / 2) - drawPadding;
                        break;
                    case LEFT:
                        imgRight = this.rect.left - drawPadding;
//                        imgRight = Math.min(this.rect.right, this.rect.left) - drawPadding;
                        break;
                    case RIGHT:
                        imgRight = (int) (this.rect.right - textWidth - drawPadding);
                        break;
                }
                this.rect.set(imgRight - imgWidth, rect.top, imgRight, rect.bottom);
                super.draw(c, this.rect, cellInfo, config);
                break;
            case RIGHT:
//                this.rect.set(rect.left, rect.top, rect.right - (imgWidth + drawPadding), rect.bottom);
//                textDrawFormat.drawImageText(c, this.rect, cellInfo, config);
//                //int imgLeft = (rect.right+rect.left)/2+ textDrawFormat.measureWidth(cellInfo.column,cellInfo.row,config)/2 + drawPadding;
//                int imgLeft = rect.right - imgWidth;
//                this.rect.set(imgLeft, rect.top, imgLeft + imgWidth, rect.bottom);
//                super.draw(c, this.rect, cellInfo, config);
                this.rect.set(rect.left, rect.top, rect.right - (imgWidth + drawPadding), rect.bottom);
                textWidth = textDrawFormat.draw(c, this.rect, cellInfo, config);
                switch (textAlign) { //单元格内容的对齐方式
                    case CENTER:
                        imgLeft = (int) Math.min(this.rect.right, (this.rect.right + this.rect.left + textWidth) / 2) + drawPadding;
                        break;
                    case LEFT:
                        imgLeft = (int) ( this.rect.left +textWidth+ drawPadding);
//                        imgLeft = (int) (Math.min(this.rect.right, this.rect.left) +textWidth+ drawPadding);
                        break;
                    case RIGHT:
                        imgLeft = this.rect.right+ drawPadding;
                        break;
                }
                this.rect.set(imgLeft, rect.top,imgLeft + imgWidth, rect.bottom);
                super.draw(c, this.rect, cellInfo, config);
                break;
            case TOP:
//                this.rect.set(rect.left, rect.top + (imgHeight + drawPadding) / 2, rect.right, rect.bottom);
//                textDrawFormat.draw(c, this.rect, cellInfo, config);
//                int imgBottom = (rect.top + rect.bottom) / 2 - textDrawFormat.measureHeight(cellInfo.column, cellInfo.row, config) / 2 + drawPadding;
//                this.rect.set(rect.left, imgBottom - imgHeight, rect.right, imgBottom);
//                super.draw(c, this.rect, cellInfo, config);
                break;
            case BOTTOM:
//                this.rect.set(rect.left, rect.top, rect.right, rect.bottom - (imgHeight + drawPadding) / 2);
//                textDrawFormat.draw(c, this.rect, cellInfo, config);
//                int imgTop = (rect.top + rect.bottom) / 2 + textDrawFormat.measureHeight(cellInfo.column, cellInfo.row, config) / 2 - drawPadding;
//                this.rect.set(rect.left, imgTop, rect.right, imgTop + imgHeight);
//                super.draw(c, this.rect, cellInfo, config);
                break;

        }
        return 0;
    }

      /**
         * 计算中英文字符串的字节长度 <br/>
         * 一个中文占3个字节
         *
         * @param str
         * @return int 字符串的字节长度
         */
        public static int getLength(String str) {
            if (str == null || str.length() == 0) {
                return 0;
            }
            try {
                return str.getBytes("UTF-8").length;
            } catch (Exception e) {
                System.out.println("计算中英文字符串的字节长度失败");
            }
            return 0;
        }
}
