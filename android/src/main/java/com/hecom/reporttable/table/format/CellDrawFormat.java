package com.hecom.reporttable.table.format;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.text.TextUtils;

import com.hecom.reporttable.R;
import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.draw.ImageResDrawFormat;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.lock.Locker;


/**
 * 绘制单元格
 */
public class CellDrawFormat extends ImageResDrawFormat<Cell> {

    public static final int LEFT = 0;
    public static final int TOP = 1;
    public static final int RIGHT = 2;
    public static final int BOTTOM = 3;

    private final HecomTextDrawFormat textDrawFormat;
    private final int drawPadding;
    private final Rect rect = new Rect();

    private final HecomTable table;

    private final Locker locker;

//    private final Rect imgRect;
//    private final Rect drawRect;

//    private final Paint imgPaint = new Paint();

    private final Cell.Icon lockIcon = new Cell.Icon();

    public CellDrawFormat(final HecomTable table, Locker locker) {
        super(1, 1);
        this.table = table;
        textDrawFormat = new HecomTextDrawFormat(table, this);
        this.drawPadding = DensityUtils.dp2px(getContext(), 4);
        this.locker = locker;
//        imgRect = new Rect();
//        drawRect = new Rect();
//        imgPaint.setStyle(Paint.Style.FILL);
        lockIcon.setDirection(Cell.Icon.RIGHT);
        lockIcon.setWidth(DensityUtils.dp2px(getContext(), 15));
        lockIcon.setHeight(DensityUtils.dp2px(getContext(), 15));
    }

    @Override
    protected Context getContext() {
        return table.getContext();
    }


    @Override
    protected int getResourceID(Cell cell, String value, int position) {
        Cell.Icon icon = cell.getIcon();
        // 调用到getResourceID时，一定是需要绘制icon的，如果icon为空，说明是锁定列
        if (position == 0 && icon == null) {
            return lockIcon.getResourceId();
        }
        return icon.getResourceId();
    }


    @Override
    public int measureWidth(Column<Cell> column, int position, TableConfig config) {
        Cell.Icon icon = getIcon(column, position);
        int textWidth = textDrawFormat.measureWidth(column, position, config);
        if (icon == null) {
            return textWidth;
        }
        if (icon.getDirection() == LEFT || icon.getDirection() == RIGHT) {
            return icon.getWidth() + textWidth + drawPadding;
        } else {
            return Math.max(icon.getWidth(), textWidth);
        }
    }

    @Override
    public int measureHeight(Column<Cell> column, int position, TableConfig config) {
        Cell.Icon icon = getIcon(column, position);
        int textHeight = textDrawFormat.measureHeight(column, position, config);
        if (icon == null) {
            return textHeight;
        }
        if (icon.getDirection() == TOP || icon.getDirection() == BOTTOM) {
            return icon.getHeight() + textHeight + drawPadding;
        } else {
            return Math.max(icon.getHeight(), textHeight);
        }
    }

    @Override
    public void draw(Canvas c, Rect rect, CellInfo<Cell> cellInfo, TableConfig config) {

        Cell.Icon icon = getIcon(cellInfo.column, cellInfo.row);

        rect.left += config.getHorizontalPadding() * config.getZoom();
        rect.right -= config.getHorizontalPadding() * config.getZoom();
        rect.top += config.getVerticalPadding() * config.getZoom();
        rect.bottom -= config.getVerticalPadding() * config.getZoom();

        if (icon == null) {
            textDrawFormat.draw(c, rect, cellInfo, config);
            return;
        }
        setImageWidth(icon.getWidth());
        setImageHeight(icon.getHeight());

        int imgWidth = (int) (getImageWidth() * config.getZoom());
        int imgHeight = (int) (getImageHeight() * config.getZoom());

        int textWidth, drawPadding = 0;
        if (!TextUtils.isEmpty(cellInfo.value.trim())) {
            drawPadding = (int) (this.drawPadding * config.getZoom());
        }
        Paint.Align textAlign;
        if (cellInfo.data.getTextAlignment() != null) {
            textAlign = cellInfo.data.getTextAlignment();
        } else {
            textAlign = table.getHecomStyle().getAlign();
        }
        int imgRight = 0, imgLeft = 0;
        switch (icon.getDirection()) {//单元格icon的相对位置
            case LEFT:
                this.rect.set(rect.left + (imgWidth + drawPadding), rect.top, rect.right,
                        rect.bottom);
                textDrawFormat.draw(c, this.rect, cellInfo, config);
                textWidth = getDrawWidth(cellInfo);
                switch (textAlign) { //单元格内容的对齐方式
                    case CENTER:
                        imgRight = Math.min(this.rect.right,
                                (this.rect.right + this.rect.left - textWidth) / 2) - drawPadding;
                        break;
                    case LEFT:
                        imgRight = this.rect.left - drawPadding;
                        break;
                    case RIGHT:
                        imgRight = this.rect.right - textWidth - drawPadding;
                        break;
                }
                this.rect.set(imgRight - imgWidth, rect.top, imgRight, rect.bottom);
                this.drawImg(c, this.rect, cellInfo, config);
                break;
            case RIGHT:
                this.rect.set(rect.left, rect.top, rect.right - (imgWidth + drawPadding),
                        rect.bottom);
                textDrawFormat.draw(c, this.rect, cellInfo, config);
                textWidth = getDrawWidth(cellInfo);
                switch (textAlign) { //单元格内容的对齐方式
                    case CENTER:
                        imgLeft = Math.min(this.rect.right,
                                (this.rect.right + this.rect.left + textWidth) / 2) + drawPadding;
                        break;
                    case LEFT:
                        imgLeft = this.rect.left + textWidth + drawPadding;
                        break;
                    case RIGHT:
                        imgLeft = this.rect.right + drawPadding;
                        break;
                }
                this.rect.set(imgLeft, rect.top, imgLeft + imgWidth, rect.bottom);
                this.drawImg(c, this.rect, cellInfo, config);
                break;
            case TOP:
                this.rect.set(rect.left, rect.top + (imgHeight + drawPadding) / 2, rect.right,
                        rect.bottom);
                textDrawFormat.draw(c, this.rect, cellInfo, config);
                int imgBottom = (rect.top + rect.bottom) / 2 - textDrawFormat.measureHeight
                        (cellInfo.column, cellInfo.row, config) / 2 + drawPadding;
                this.rect.set(rect.left, imgBottom - imgHeight, rect.right, imgBottom);
                this.drawImg(c, this.rect, cellInfo, config);
                break;
            case BOTTOM:
                this.rect.set(rect.left, rect.top, rect.right, rect.bottom - (imgHeight +
                        drawPadding) / 2);
                textDrawFormat.draw(c, this.rect, cellInfo, config);
                int imgTop = (rect.top + rect.bottom) / 2 + textDrawFormat.measureHeight
                        (cellInfo.column, cellInfo.row, config) / 2 - drawPadding;
                this.rect.set(rect.left, imgTop, rect.right, imgTop + imgHeight);
                this.drawImg(c, this.rect, cellInfo, config);
                break;

        }
    }

    private void drawImg(Canvas c, Rect rect, CellInfo<Cell> cellInfo, TableConfig config) {
        super.draw(c, rect, cellInfo, config);
    }

//    public void drawImg(Canvas c, Rect rect, CellInfo<Cell> cellInfo, TableConfig config) {
//        Bitmap bitmap = (cellInfo == null
//                ? getBitmap(null, null, 0)
//                : getBitmap(cellInfo.data, cellInfo.value, cellInfo.row));
//        if (bitmap != null) {
//            int width = bitmap.getWidth();
//            int height = bitmap.getHeight();
//            imgRect.set(0, 0, width, height);
//            float scaleX = (float) width / getImageWidth();
//            float scaleY = (float) height / getImageHeight();
//            if (scaleX > 1 || scaleY > 1) {
//                if (scaleX > scaleY) {
//                    width = (int) (width / scaleX);
//                    height = getImageHeight();
//                } else {
//                    height = (int) (height / scaleY);
//                    width = getImageWidth();
//                }
//            }
//            width = (int) (width * config.getZoom());
//            height = (int) (height * config.getZoom());
//            int disX = (rect.right - rect.left - width) / 2;
//            int disY = (rect.bottom - rect.top - height) / 2;
//            drawRect.left = rect.left + disX;
//            drawRect.top = rect.top + disY;
//            drawRect.right = rect.right - disX;
//            drawRect.bottom = rect.bottom - disY;
//            c.drawBitmap(bitmap, imgRect, drawRect, imgPaint);
//        }
//    }

    private int getDrawWidth(CellInfo<Cell> cellInfo) {
        return (int) (cellInfo.data.getCache().getDrawWidth());
    }

    private Cell.Icon getIcon(Column<Cell> column, int position) {
        if (locker.needShowLock(position, column.getColumn())) {
            if (column.isFixed()) {
                lockIcon.setResourceId(R.mipmap.icon_lock);
            } else {
                lockIcon.setResourceId(R.mipmap.icon_unlock);
            }
            return lockIcon;
        } else {
            return column.getDatas().get(position).getIcon();
        }
    }
}
