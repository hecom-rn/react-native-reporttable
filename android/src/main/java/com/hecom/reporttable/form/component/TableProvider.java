package com.hecom.reporttable.form.component;


import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.Rect;
import android.util.Log;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.TableInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.column.ColumnInfo;
import com.hecom.reporttable.form.data.format.bg.ICellBackgroundFormat;
import com.hecom.reporttable.form.data.format.selected.IDrawOver;
import com.hecom.reporttable.form.data.format.selected.ISelectFormat;
import com.hecom.reporttable.form.data.format.tip.ITip;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.form.listener.OnColumnClickListener;
import com.hecom.reporttable.form.listener.TableClickObserver;
import com.hecom.reporttable.form.utils.DrawUtils;
import java.util.ArrayList;
import java.util.List;
import com.hecom.reporttable.R;
import com.hecom.reporttable.form.data.format.draw.TextImageDrawFormat;
import com.hecom.reporttable.form.utils.DensityUtils;

/**
 * Created by huang on 2017/11/1.
 * 表格内容绘制
 */
public class TableProvider<T> implements TableClickObserver {

    private Context context;
    private Rect scaleRect;
    private Rect showRect;
    private TableConfig config;
    private PointF clickPoint;
    private ColumnInfo clickColumnInfo;
    private boolean isClickPoint;
    private OnColumnClickListener onColumnClickListener;
    /**
     * 选中格子格式化
     */
    private SelectionOperation operation;
    private TableData<T> tableData;
    private ITip<Column, ?> tip;
    private Rect clipRect;
    private Rect tempRect; //用于存储数据
    private Column tipColumn;
    private int tipPosition;
    private GridDrawer<T> gridDrawer;
    private PointF tipPoint = new PointF();
    private IDrawOver drawOver;
    private CellInfo cellInfo = new CellInfo();
    private boolean isFirstDraw = true;  //是否首次绘制
    private boolean isShowUnFixedArea;  //非固定区域是否已全部可见
    private boolean isScrollToBottom;  //是否滚动至底部
    private List<Integer> fixedTops = new ArrayList<>();  //固定行的top列表
    private List<Integer> fixedBottoms = new ArrayList<>();  //固定行的bottom列表
    private MyTextImageDrawFormat myTextImageDrawFormat;

    //private static final String TAG = "TableProvider";

    public TableProvider(Context context) {
        this.context = context;
        clickPoint = new PointF(-1, -1);
        clipRect = new Rect();
        tempRect  = new Rect();
        operation = new SelectionOperation();
        gridDrawer  = new GridDrawer<>();
        int size = DensityUtils.dp2px(context,15);
        myTextImageDrawFormat = new MyTextImageDrawFormat(size, size, TextImageDrawFormat.RIGHT, 10);
    }

    /**
     * 绘制
     * @param canvas 画布
     * @param scaleRect 缩放Rect
     * @param showRect 显示Rect
     * @param tableData 表格数据
     * @param config 配置
     */
    public void onDraw(Canvas canvas, Rect scaleRect, Rect showRect,
                       TableData<T> tableData, TableConfig config) {
        setData(scaleRect, showRect, tableData, config);
        canvas.save();
        canvas.clipRect(this.showRect);
        drawColumnTitle(canvas, config);
        drawCount(canvas);
        drawContent(canvas);
        operation.draw(canvas,showRect,config);
        if(drawOver !=null)
            drawOver.draw(canvas,scaleRect,showRect,config);
        canvas.restore();
        if (isClickPoint && clickColumnInfo != null) {
            onColumnClickListener.onClick(clickColumnInfo);
        }
        if (tipColumn != null) {
            drawTip(canvas, tipPoint.x, tipPoint.y, tipColumn, tipPosition);
        }
    }

    /**
     * 设置基本信息和清除数据
     * @param scaleRect 缩放Rect
     * @param showRect 显示Rect
     * @param tableData 表格数据
     * @param config 配置
     */
    private void setData(Rect scaleRect, Rect showRect, TableData<T> tableData, TableConfig config) {
        isClickPoint = false;
        clickColumnInfo = null;
        tipColumn = null;
        operation.reset();
        this.scaleRect = scaleRect;
        this.showRect = showRect;
        this.config = config;
        this.tableData = tableData;
        gridDrawer.setTableData(tableData);
    }


    private void drawColumnTitle(Canvas canvas, TableConfig config) {
        if(config.isShowColumnTitle()) {
            if (config.isFixedTitle()) {
                drawTitle(canvas);
                canvas.restore();
                canvas.save();
                canvas.clipRect(this.showRect);
            } else {
                drawTitle(canvas);
            }
        }
    }

    /**
     * 绘制统计行
     * @param canvas 画布
     */
    private void drawCount(Canvas canvas) {
        if (tableData.isShowCount()) {
            float left = scaleRect.left;
            float bottom = config.isFixedCountRow() ? Math.min(scaleRect.bottom,showRect.bottom) : scaleRect.bottom;
            int countHeight = tableData.getTableInfo().getCountHeight();
            float top = bottom - countHeight;
            if(config.getCountBackground() != null){
                tempRect.set((int)left, (int)top, showRect.right,(int)bottom);
                config.getCountBackground().drawBackground(canvas,tempRect,config.getPaint());
            }
            List<ColumnInfo> childColumnInfos = tableData.getChildColumnInfos();
            if (DrawUtils.isVerticalMixRect(showRect, (int)top, (int)bottom)) {
                List<Column> columns = tableData.getChildColumns();
                int columnSize = columns.size();
                boolean isPerColumnFixed = false;
                clipRect.set(showRect);
                int clipCount = 0;
                for (int i = 0; i < columnSize; i++) {
                    Column column = columns.get(i);
                    float tempLeft = left;
                    float width = column.getComputeWidth()*config.getZoom();
                    if(childColumnInfos.get(i).getTopParent().column.isFixed()){
                        if(left < clipRect.left) {
                            left = clipRect.left;
                            clipRect.left += width;
                            isPerColumnFixed = true;
                        }
                    }else if(isPerColumnFixed){
                        canvas.save();
                        clipCount++;
                        canvas.clipRect(clipRect.left, showRect.bottom - countHeight,
                                showRect.right, showRect.bottom);
                    }
                    tempRect.set((int)left, (int)top, (int)(left+width), (int)bottom);
                    drawCountText(canvas, column,i,tempRect, column.getTotalNumString(), config);
                    left = tempLeft;
                    left +=width;
                }
                for(int i = 0;i < clipCount;i++){
                    canvas.restore();
                }
            }
        }
    }

    /**
     * 绘制列标题
     * @param canvas 画布
     */
    private void drawTitle(Canvas canvas) {
        int dis = showRect.top - scaleRect.top;
        TableInfo tableInfo = tableData.getTableInfo();
        int titleHeight = tableInfo.getTitleHeight() * tableInfo.getMaxLevel();
        int clipHeight = config.isFixedTitle() ? titleHeight : Math.max(0, titleHeight - dis);
        if(config.getColumnTitleBackground() !=null){
            tempRect.set(showRect.left, showRect.top, showRect.right,
                    showRect.top + clipHeight);
            config.getColumnTitleBackground().drawBackground(canvas,tempRect,config.getPaint());
        }
        clipRect.set(showRect);
        List<ColumnInfo> columnInfoList = tableData.getColumnInfos();
        float zoom = config.getZoom();
        boolean isPerColumnFixed = false;
        int clipCount = 0;
        ColumnInfo parentColumnInfo = null;
        for (ColumnInfo info : columnInfoList) {
            int left = (int) (info.left*zoom + scaleRect.left);
            //根据top ==0是根部，根据最根部的Title判断是否需要固定
            if (info.top == 0 && info.column.isFixed()) {
                if (left < clipRect.left) {
                    parentColumnInfo = info;
                    left = clipRect.left;
                    fillColumnTitle(canvas, info, left);
                    clipRect.left += info.width * zoom;
                    isPerColumnFixed = true;
                    continue;
                }
                //根部需要固定，同时固定所有子类
            }else if(isPerColumnFixed && info.top != 0){
                    left = (int) (clipRect.left - info.width * zoom);
                    left += (info.left -parentColumnInfo.left);
            }else if(isPerColumnFixed){
                canvas.save();
                canvas.clipRect(clipRect.left, showRect.top, showRect.right,
                        showRect.top + clipHeight);
                isPerColumnFixed = false;
                clipCount++;
            }
            fillColumnTitle(canvas, info, left);
        }
        for(int i = 0;i < clipCount;i++){
            canvas.restore();
        }
        if (config.isFixedTitle()) {
            scaleRect.top += titleHeight;
            showRect.top += titleHeight;
        } else {
            showRect.top += clipHeight;
            scaleRect.top += titleHeight;
        }

    }

    /**
     * 填充列标题
     * @param canvas 画布
     * @param info 列信息
     * @param left 左边
     */
    private void fillColumnTitle(Canvas canvas, ColumnInfo info, int left) {

        int top = (int)(info.top*config.getZoom())
                + (config.isFixedTitle() ? showRect.top : scaleRect.top);
        int right = (int) (left + info.width *config.getZoom());
        int bottom = (int) (top + info.height*config.getZoom());
        if (DrawUtils.isMixRect(showRect, left, top, right, bottom)) {
            if (!isClickPoint && onColumnClickListener != null) {
                if (DrawUtils.isClick(left, top, right, bottom, clickPoint)) {
                    isClickPoint = true;
                    clickColumnInfo = info;
                    clickPoint.set(-1, -1);
                }
            }
            Paint paint = config.getPaint();
            tempRect.set(left,top,right,bottom);
            if(config.getTableGridFormat() !=null) {
                config.getColumnTitleGridStyle().fillPaint(paint);
                int position = tableData.getChildColumns().indexOf(info.column);
                config.getTableGridFormat().drawColumnTitleGrid(canvas,tempRect,info.column,position,paint);
            }
            tableData.getTitleDrawFormat().draw(canvas, info.column, tempRect, config);

        }
    }

    private void fillColumnTitle(Canvas canvas, ColumnInfo info, int left, int row) {

        int top = (int)(info.top*config.getZoom())
                + (config.isFixedTitle() ? showRect.top : scaleRect.top);
        int right = (int) (left + info.width *config.getZoom());
        int bottom = (int) (top + info.height*config.getZoom());
        if (DrawUtils.isMixRect(showRect, left, top, right, bottom)) {
            if (!isClickPoint && onColumnClickListener != null) {
                if (DrawUtils.isClick(left, top, right, bottom, clickPoint)) {
                    isClickPoint = true;
                    clickColumnInfo = info;
                    clickPoint.set(-1, -1);
                }
            }
            Paint paint = config.getPaint();
            tempRect.set(left,top,right,bottom);
            if(config.getTableGridFormat() !=null) {
                config.getColumnTitleGridStyle().fillPaint(paint);
                int position = tableData.getChildColumns().indexOf(info.column);
                config.getTableGridFormat().drawColumnTitleGrid(canvas,tempRect,info.column,position,paint);
            }
            tableData.getTitleDrawFormat().draw(canvas, info.column, tempRect, config, row);

        }
    }

    /**
     * 绘制内容
     * @param canvas 画布
     */
    private void drawContent(Canvas canvas) {
        float top;
        float left = scaleRect.left;
        List<Column> columns = tableData.getChildColumns();
        clipRect.set(showRect);
        TableInfo info = tableData.getTableInfo();
        int columnSize = columns.size();
        int dis = config.isFixedCountRow() ? info.getCountHeight()
                : showRect.bottom + info.getCountHeight() - scaleRect.bottom;
        int fillBgBottom = showRect.bottom - Math.max(dis, 0);
        if(config.getContentBackground() !=null){
            tempRect.set(showRect.left, showRect.top, showRect.right, fillBgBottom);
            config.getContentBackground().drawBackground(canvas,tempRect,config.getPaint());
        }
        if (config.isFixedCountRow()) {
            canvas.save();
            canvas.clipRect(showRect.left, showRect.top, showRect.right, showRect.bottom - info.getCountHeight());
        }
        List<ColumnInfo> childColumnInfo = tableData.getChildColumnInfos();
        boolean isPerFixed = false;
        int clipCount = 0;
        Rect correctCellRect;
        TableInfo tableInfo = tableData.getTableInfo();
        for (int i = 0; i < columnSize; i++) {
            //遍历列
            top = scaleRect.top;
            Column column = columns.get(i);
            float width = column.getComputeWidth()*config.getZoom();
            float tempLeft = left;
            //根据根部标题是否固定
            Column topColumn = childColumnInfo.get(i).getTopParent().column;
            if (topColumn.isFixed()) {
                isPerFixed = false;
                if(tempLeft < clipRect.left){
                    left = clipRect.left;
                    clipRect.left +=width;
                    isPerFixed = true;
                }
            }else if(isPerFixed){
                canvas.save();
                canvas.clipRect(clipRect);
                isPerFixed = false;
                clipCount++;
            }
            float right = left + width;

            if (left < showRect.right) {
                int size = column.getDatas().size();
                int realPosition = 0;
                for (int j = 0; j < size; j++) {
                    //遍历行
                    boolean isDrawLock = (j == 0 && column.isFixed());
                    String value = column.format(j);
                    int skip =tableInfo.getSeizeCellSize(column,j);
                    int totalLineHeight =0;
                    for(int k = realPosition;k<realPosition+skip;k++){
                        totalLineHeight += info.getLineHeightArray()[k];
                    }
                    realPosition+=skip;
                    float bottom = top + totalLineHeight*config.getZoom();
                    tempRect.set((int) left, (int) top, (int) right, (int) bottom);
                    correctCellRect = gridDrawer.correctCellRect(j, i, tempRect, config.getZoom()); //矫正格子的大小
                    if (correctCellRect != null) {
                        if(j < config.getFixedLines()) {
                            if(isFirstDraw) {
                                //保存固定行的top、bottom
                                fixedTops.add(correctCellRect.top);
                                fixedBottoms.add(correctCellRect.bottom);
                            } else {
                                //使用固定行的top、bottom
                                correctCellRect.top = fixedTops.get(j);
                                correctCellRect.bottom = fixedBottoms.get(j);
                            }
                        }
                        if (correctCellRect.top < showRect.bottom) {
                            if (correctCellRect.right > showRect.left && correctCellRect.bottom > showRect.top) {
                                Object data = column.getDatas().get(j);
                                if (DrawUtils.isClick(correctCellRect, clickPoint)) {
                                    operation.setSelectionRect(i, j, correctCellRect);
                                    tipPoint.x = (left + right) / 2;
                                    tipPoint.y = (top + bottom) / 2;
                                    tipColumn = column;
                                    tipPosition = j;
                                    clickColumn(column, j, value, data);
                                    isClickPoint = true;
                                    clickPoint.set(-Integer.MAX_VALUE, -Integer.MAX_VALUE);
                                }
                                operation.checkSelectedPoint(i, j, correctCellRect);
                                cellInfo.set(column,data,value,i,j);
                                config.setPartlyCellZoom(1);
                                if(config.getFixedLines() == 0) {
                                    drawContentCell(canvas, cellInfo, correctCellRect, config, isDrawLock);
                                } else if(isFirstDraw || j < config.getFixedLines()) {
                                    drawContentCell(canvas, cellInfo, correctCellRect, config, isDrawLock);
                                } else if(!isFirstDraw && j >= config.getFixedLines()) {
                                    if(correctCellRect.top >= fixedBottoms.get(config.getFixedLines() - 1)) {
                                        //绘制完整单元格
                                        drawContentCell(canvas, cellInfo, correctCellRect, config, isDrawLock);
                                        if (j == config.getFixedLines() && config.getScrollChangeListener() != null && !isShowUnFixedArea) {
                                            //非固定区域可见
                                            isShowUnFixedArea = true;
                                            config.getScrollChangeListener().showUnFixedArea();
                                        }
                                    } else {
                                        if (j == config.getFixedLines() && isShowUnFixedArea) {
                                            //非固定区域不可见
                                            isShowUnFixedArea = false;
                                        }
                                        if(correctCellRect.bottom > fixedBottoms.get(config.getFixedLines() - 1) + dip2px(context, 5)) {
                                            //float partlyCellZoom = (correctCellRect.bottom - fixedBottoms.get(config.getFixedLines() - 1)) / (float) correctCellRect.height();
                                            //绘制部分单元格
                                            //config.setPartlyCellZoom(partlyCellZoom);
                                            Rect partCellRect = new Rect(correctCellRect.left, fixedBottoms.get(config.getFixedLines() - 1), correctCellRect.right, correctCellRect.bottom);
                                            drawContentCell(canvas, cellInfo, partCellRect, config, isDrawLock);
                                        }
                                    }
                                }
                            }
                        } else {
                            break;
                        }
                    }
                    top = bottom;
                }
                if(top == showRect.bottom && !isScrollToBottom) {
                    //滚动至底部
                    isScrollToBottom = true;
                    config.getScrollChangeListener().scrollToBottom();
                } else if(top > showRect.bottom && isScrollToBottom) {
                    //未滚动至底部
                    isScrollToBottom = false;
                }
                left = tempLeft + width;
            } else {
                break;
            }
        }
        for(int i = 0;i < clipCount;i++){
            canvas.restore();
        }
        if (config.isFixedCountRow()) {
            canvas.restore();
        }
        if(isFirstDraw) {
            isFirstDraw = false;
        }
    }

    /**
     *绘制内容格子
     * @param c 画布
     * @param cellInfo 格子信息
     * @param rect 方位
     * @param config 表格配置
     * @param isDrawLock 是否绘制锁标志
     */
    protected void drawContentCell(Canvas c, CellInfo<T> cellInfo, Rect rect,TableConfig config, boolean isDrawLock) {
            if(config.getContentCellBackgroundFormat()!= null){
                config.getContentCellBackgroundFormat().drawBackground(c,rect,cellInfo,config.getPaint());
            }
            if(config.getTableGridFormat() !=null){
                config.getContentGridStyle().fillPaint(config.getPaint());
                config.getTableGridFormat().drawContentGrid(c,cellInfo.col,cellInfo.row,rect,cellInfo,config.getPaint());
            }
            rect.left += config.getTextLeftOffset();
            if(cellInfo.row == 0){
                if(isDrawLock){
                    myTextImageDrawFormat.setResourceId(R.mipmap.icon_lock);
                }else{
                    myTextImageDrawFormat.setResourceId(R.mipmap.icon_unlock);
                }
                myTextImageDrawFormat.draw(c, rect, cellInfo, config);
            }else{
                cellInfo.column.getDrawFormat().draw(c, rect, cellInfo, config);
            }
      }


    /**
     * 点击格子
     * @param column 列
     * @param position 位置
     * @param value 值
     * @param data 数据
     */
    private void clickColumn(Column column, int position, String value, Object data) {
        if (!isClickPoint && column.getOnColumnItemClickListener() != null) {
            column.getOnColumnItemClickListener().onClick(column, value, data, position);
        }
    }





    /**
     * 绘制提示
     */
    private void drawTip(Canvas canvas, float x, float y, Column c, int position) {
        if (tip != null) {
            tip.drawTip(canvas, x, y, showRect, c, position);
        }
    }

    private void drawCountText(Canvas canvas,Column column,int position, Rect rect, String text, TableConfig config) {
        Paint paint = config.getPaint();
        //绘制背景
        ICellBackgroundFormat<Column> backgroundFormat = config.getCountBgCellFormat();
        if(backgroundFormat != null){
            backgroundFormat.drawBackground(canvas,rect,column,config.getPaint());
        }
        //绘制网格
        if(config.getTableGridFormat() !=null){
            config.getContentGridStyle().fillPaint(paint);
            config.getTableGridFormat().drawCountGrid(canvas,position,rect,column,paint);
        }
        config.getCountStyle().fillPaint(paint);
        //字体颜色跟随背景变化
        if(backgroundFormat != null&& backgroundFormat.getTextColor(column) != TableConfig.INVALID_COLOR){
            paint.setColor(backgroundFormat.getTextColor(column));
        }
        //绘制字体
        paint.setTextSize(paint.getTextSize()*config.getZoom());
        if(column.getTextAlign() !=null) {
            paint.setTextAlign(column.getTextAlign());
        }
        canvas.drawText(text, DrawUtils.getTextCenterX(rect.left,rect.right,paint), DrawUtils.getTextCenterY(rect.centerY(), paint), paint);
    }


    @Override
    public void onClick(float x, float y) {
        clickPoint.x = x;
        clickPoint.y = y;
    }

    public OnColumnClickListener getOnColumnClickListener() {
        return onColumnClickListener;
    }

    public void setOnColumnClickListener(OnColumnClickListener onColumnClickListener) {
        this.onColumnClickListener = onColumnClickListener;
    }

    public ITip<Column, ?> getTip() {
        return tip;
    }

    public void setTip(ITip<Column, ?> tip) {
        this.tip = tip;
    }


    public void setSelectFormat(ISelectFormat selectFormat) {
        this.operation.setSelectFormat(selectFormat);
    }

    public GridDrawer<T> getGridDrawer() {
        return gridDrawer;
    }

    public void setGridDrawer(GridDrawer<T> gridDrawer) {
        this.gridDrawer = gridDrawer;
    }


    /**
     * 计算任何point在View的位置
     * @param row 列
     * @param col 行
     * @return
     */
    public int[] getPointLocation(double row,double col){
        List<Column> childColumns = tableData.getChildColumns();
        int[] lineHeights =  tableData.getTableInfo().getLineHeightArray();
        int x=0,y =0;
        int columnSize = childColumns.size();
        for(int i = 0; i <= (columnSize > col+1 ? col+1 : columnSize-1);i++){
            int w = childColumns.get(i).getComputeWidth();
            if(i == (int)col+1){
                x +=w *(col-(int)col);
            }else {
                x += w;
            }
        }
        for(int i = 0; i <= (lineHeights.length > row+1 ? row+1 : lineHeights.length-1);i++){
            int h = lineHeights[i];
            if(i == (int)row+1){
                y +=h *(row-(int)row);
            }else {
                y += h;
            }
        }
        x *= config.getZoom();
        y *= config.getZoom();
        x += scaleRect.left;
        y +=scaleRect.top;
        return new int[]{x,y};

    }
    /**
     * 计算任何point在View的大小
     * @param row 列
     * @param col 行
     * @return
     */
    public int[] getPointSize(int row,int col){
        List<Column> childColumns = tableData.getChildColumns();
        int[] lineHeights =  tableData.getTableInfo().getLineHeightArray();
        col= col < childColumns.size() ? col:childColumns.size()-1;//列
        row = row< lineHeights.length ? row:lineHeights.length;//行
        col = col< 0 ? 0 : col;
        row = row< 0 ? 0 : row;
        return new int[]{(int) (childColumns.get(col).getComputeWidth()*config.getZoom()),
                (int) (lineHeights[row]*config.getZoom())};

    }

    /**
     * 设置表面绘制
     */
    public void setDrawOver(IDrawOver drawOver) {
        this.drawOver = drawOver;
    }

    public SelectionOperation getOperation() {
        return operation;
    }

    private int dip2px(Context context, float dpValue) {
        final float scale = context.getResources().getDisplayMetrics().density;
        return (int) (dpValue * scale + 0.5f);
    }

    private final class MyTextImageDrawFormat extends TextImageDrawFormat<T> {
           public int getResourceId() {
               return resourceId;
           }

           public void setResourceId(int resourceId) {
               this.resourceId = resourceId;
           }

           private int resourceId;

           public MyTextImageDrawFormat(int imageWidth, int imageHeight, int direction, int drawPadding) {
               super(imageWidth, imageHeight, direction, drawPadding);
           }

           @Override
           protected Context getContext() {
               return context;
           }

           @Override
           protected int getResourceID(T object, String value, int position) {
               return getResourceId();
           }
       }

}
