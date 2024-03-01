package com.hecom.reporttable.table;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;

import com.hecom.reporttable.R;
import com.hecom.reporttable.TableUtil;
import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.draw.ImageResDrawFormat;
import com.hecom.reporttable.form.data.format.draw.TextDrawFormat;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.TypicalCell;
import com.hecom.reporttable.table.lock.Locker;


/**
 * 绘制单元格
 */
public class CellDrawFormat extends ImageResDrawFormat<JsonTableBean> {

    public static final int LEFT = 0;
    public static final int TOP = 1;
    public static final int RIGHT = 2;
    public static final int BOTTOM = 3;

    private TextDrawFormat<JsonTableBean> textDrawFormat;
    private int drawPadding;
    private int direction;
    private Rect rect;
    private int resourceId;
    private Context context;

    private Locker locker;


    public CellDrawFormat(Context context, Locker locker) {
        super(1, 1);
        textDrawFormat = new TextDrawFormat<JsonTableBean>() {
            @Override
            public void setTextPaint(TableConfig config, CellInfo<JsonTableBean> cellInfo,
                                     Paint paint) {
                super.setTextPaint(config, cellInfo, paint);
                JsonTableBean tableBean = cellInfo.data;
                Integer textAlignment = tableBean.getTextAlignment();
                if (null == textAlignment) {
                    textAlignment = config.getItemCommonStyleConfig().getTextAlignment();
                }
                switch (textAlignment) {
                    case 1:
                        paint.setTextAlign(Paint.Align.CENTER);
                        break;
                    case 2:
                        paint.setTextAlign(Paint.Align.RIGHT);
                        break;
                    default:
                        paint.setTextAlign(Paint.Align.LEFT);
                        break;

                }
            }
        };
        this.rect = new Rect();
        this.context = context;
        this.drawPadding = DensityUtils.dp2px(context, 4);
        this.locker = locker;
    }

    @Override
    protected Context getContext() {
        return context;
    }

    public void setContext(Context context) {
        this.context = context;
    }

    @Override
    protected int getResourceID(JsonTableBean object, String value, int position) {
        return resourceId;
    }

    @Override
    public int measureWidth(Column<JsonTableBean> column, TypicalCell cell, TableConfig config) {
        return textDrawFormat.measureWidth(column, cell, config);
//        if(direction == LEFT || direction == RIGHT) {
//            return getImageWidth() + textWidth+drawPadding;
//        }else {
//            return Math.max(this.imageWidth,textWidth);
//        }
    }


    @Override
    public int measureWidth(Column<JsonTableBean> column, int position, TableConfig config,
                            boolean onlyCalculate, int sepcWidth) {
        int textWidth = textDrawFormat.measureWidth(column, position, config, false, -1);
        return textWidth;
//        if(direction == LEFT || direction == RIGHT) {
//            return getImageWidth() + textWidth+drawPadding;
//        }else {
//            return Math.max(super.measureWidth(column,position,config),textWidth);
//        }
    }

    @Override
    public int measureHeight(Column<JsonTableBean> column, TypicalCell cell, TableConfig config,
                             int sepcWidth) {
        int imgHeight = this.imageHeight;
        int textHeight = textDrawFormat.measureHeight(column, cell, config, -1);

        if (direction == TOP || direction == BOTTOM) {
            return getImageHeight() + textHeight + drawPadding;
        } else {
            return Math.max(imgHeight, textHeight);
        }

    }

    @Override
    public int measureHeight(Column<JsonTableBean> column, int position, TableConfig config) {
        int imgHeight = super.measureHeight(column, position, config);
        int textHeight = textDrawFormat.measureHeight(column, position, config);

        if (direction == TOP || direction == BOTTOM) {
            return getImageHeight() + textHeight + drawPadding;
        } else {
            return Math.max(imgHeight, textHeight);
        }
    }

    @Override
    public float draw(Canvas c, Rect rect, CellInfo<JsonTableBean> cellInfo, TableConfig config) {

        update(cellInfo, config);

        if (getBitmap(cellInfo.data, cellInfo.value, cellInfo.row) == null) {
            textDrawFormat.draw(c, rect, cellInfo, config);
            return 0;
        }
//        int imgWidth = (int) (getImageWidth()*config.getZoom());
//        int imgHeight = (int) (getImageHeight()*config.getZoom());
        int imgWidth = (int) (context.getDrawable(resourceId)
                .getIntrinsicWidth() * config.getZoom());
        rect.left += config.getHorizontalPadding();
        rect.right -= config.getHorizontalPadding();
        rect.top += config.getVerticalPadding();
        rect.bottom -= config.getVerticalPadding();
        float textWidth;
//        Paint.Align textAlign = cellInfo.column.getTextAlign();
        Paint.Align textAlign = TableUtil.getAlignConfig(config, cellInfo);
        if (textAlign == null) textAlign = Paint.Align.CENTER;
        int imgRight = 0, imgLeft = 0;
        switch (direction) {//单元格icon的相对位置
            case LEFT:
//                this.rect.set(rect.left+(imgWidth+drawPadding),rect.top,rect.right,rect.bottom);
//                textDrawFormat.draw(c,this.rect,cellInfo,config);
////                int imgRight = (rect.right+rect.left)/2- textDrawFormat.measureWidth(cellInfo
// .column,cellInfo.row,config)/2+drawPadding;
//                int imgRight = Math.min(this.rect.right, this.rect.left) - drawPadding;
//                this.rect.set(imgRight-imgWidth,rect.top,imgRight,rect.bottom);
//                super.draw(c,this.rect,cellInfo,config);
                this.rect.set(rect.left + imgWidth + drawPadding, rect.top, rect.right,
                        rect.bottom);
                textWidth = textDrawFormat.draw(c, this.rect, cellInfo, config);
                switch (textAlign) { //单元格内容的对齐方式
                    case CENTER:
                        imgRight = (int) Math.min(this.rect.right,
                                (this.rect.right + this.rect.left - textWidth) / 2) - drawPadding;
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
//                this.rect.set(rect.left, rect.top, rect.right - (imgWidth + drawPadding), rect
//                .bottom);
//                textDrawFormat.drawImageText(c, this.rect, cellInfo, config);
//                //int imgLeft = (rect.right+rect.left)/2+ textDrawFormat.measureWidth(cellInfo
//                .column,cellInfo.row,config)/2 + drawPadding;
//                int imgLeft = rect.right - imgWidth;
//                this.rect.set(imgLeft, rect.top, imgLeft + imgWidth, rect.bottom);
//                super.draw(c, this.rect, cellInfo, config);
                this.rect.set(rect.left, rect.top, rect.right - (imgWidth + drawPadding),
                        rect.bottom);
                textWidth = textDrawFormat.draw(c, this.rect, cellInfo, config);
                switch (textAlign) { //单元格内容的对齐方式
                    case CENTER:
                        imgLeft = (int) Math.min(this.rect.right,
                                (this.rect.right + this.rect.left + textWidth) / 2) + drawPadding;
                        break;
                    case LEFT:
                        imgLeft = (int) (this.rect.left + textWidth + drawPadding);
//                        imgLeft = (int) (Math.min(this.rect.right, this.rect.left) +textWidth+
//                        drawPadding);
                        break;
                    case RIGHT:
                        imgLeft = this.rect.right + drawPadding;
                        break;
                }
                this.rect.set(imgLeft, rect.top, imgLeft + imgWidth, rect.bottom);
                super.draw(c, this.rect, cellInfo, config);
                break;
            case TOP:
//                this.rect.set(rect.left, rect.top + (imgHeight + drawPadding) / 2, rect.right,
//                rect.bottom);
//                textDrawFormat.draw(c, this.rect, cellInfo, config);
//                int imgBottom = (rect.top + rect.bottom) / 2 - textDrawFormat.measureHeight
//                (cellInfo.column, cellInfo.row, config) / 2 + drawPadding;
//                this.rect.set(rect.left, imgBottom - imgHeight, rect.right, imgBottom);
//                super.draw(c, this.rect, cellInfo, config);
                break;
            case BOTTOM:
//                this.rect.set(rect.left, rect.top, rect.right, rect.bottom - (imgHeight +
//                drawPadding) / 2);
//                textDrawFormat.draw(c, this.rect, cellInfo, config);
//                int imgTop = (rect.top + rect.bottom) / 2 + textDrawFormat.measureHeight
//                (cellInfo.column, cellInfo.row, config) / 2 - drawPadding;
//                this.rect.set(rect.left, imgTop, rect.right, imgTop + imgHeight);
//                super.draw(c, this.rect, cellInfo, config);
                break;

        }
        return 0;
    }

    private void update(CellInfo<JsonTableBean> cellInfo, TableConfig config) {
        this.resourceId = 0;
        if (locker.needShowLock(cellInfo.row, cellInfo.col)) {
            if (cellInfo.column.isFixed()) {
                this.resourceId = R.mipmap.icon_lock;
            } else {
                this.resourceId = R.mipmap.icon_unlock;
            }
            this.direction = RIGHT;
        } else {
            JsonTableBean.Icon icon = cellInfo.data.getIcon();
            if (icon != null) {
                String name = icon.getName();
                if ("normal".equals(name)) {
                    this.resourceId = R.mipmap.normal;
                    this.direction = RIGHT;
                } else if ("up".equals(name)) {
                    this.resourceId = R.mipmap.up;
                    this.direction = RIGHT;
                } else if ("down".equals(name)) {
                    this.resourceId = R.mipmap.down;
                    this.direction = RIGHT;
                } else if ("dot_new".equals(name)) {
                    this.resourceId = R.mipmap.dot_new;
                    this.direction = LEFT;
                } else if ("dot_edit".equals(name)) {
                    this.resourceId = R.mipmap.dot_edit;
                    this.direction = LEFT;
                } else if ("dot_delete".equals(name)) {
                    this.resourceId = R.mipmap.dot_delete;
                    this.direction = LEFT;
                } else if ("dot_readonly".equals(name)) {
                    this.resourceId = R.mipmap.dot_readonly;
                    this.direction = LEFT;
                } else if ("dot_white".equals(name)) {
                    this.resourceId = R.mipmap.dot_white;
                    this.direction = LEFT;
                } else if ("dot_select".equals(name)) {
                    this.resourceId = R.mipmap.dot_select;
                    this.direction = LEFT;
                } else if ("portal_icon".equals(name)) {
                    this.resourceId = R.mipmap.portal_icon;
                    this.direction = LEFT;
                } else if ("trash".equals(name)) {
                    this.resourceId = R.mipmap.trash;
                    this.direction = RIGHT;
                } else if ("revert".equals(name)) {
                    this.resourceId = R.mipmap.revert;
                    this.direction = RIGHT;
                } else if ("copy".equals(name)) {
                    this.resourceId = R.mipmap.copy;
                    this.direction = RIGHT;
                } else if ("edit".equals(name)) {
                    this.resourceId = R.mipmap.edit;
                    this.direction = RIGHT;
                } else if ("selected".equals(name)) {
                    this.resourceId = R.mipmap.selected;
                    this.direction = RIGHT;
                } else if ("unselected".equals(name)) {
                    this.resourceId = R.mipmap.unselected;
                    this.direction = RIGHT;
                } else if ("unselected_disable".equals(name)) {
                    this.resourceId = R.mipmap.unselected_disable;
                    this.direction = RIGHT;
                } else if ("copy_disable".equals(name)) {
                    this.resourceId = R.mipmap.copy_disable;
                    this.direction = RIGHT;
                } else if ("edit_disable".equals(name)) {
                    this.resourceId = R.mipmap.edit_disable;
                    this.direction = RIGHT;
                } else if ("trash_disable".equals(name)) {
                    this.resourceId = R.mipmap.trash_disable;
                    this.direction = RIGHT;
                } else if ("unSelectIcon".equals(name)) {
                    this.resourceId = R.mipmap.checkbox;
                    this.direction = RIGHT;
                } else if ("selectedIcon".equals(name)) {
                    this.resourceId = R.mipmap.checkbox_hl;
                    this.direction = RIGHT;
                }
            }
        }
    }
}
