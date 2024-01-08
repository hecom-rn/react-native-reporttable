package com.hecom.reporttable.form.core;

import android.graphics.Paint;
import android.graphics.Rect;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.hecom.reporttable.TableUtil;
import com.hecom.reporttable.form.component.IComponent;
import com.hecom.reporttable.form.component.ITableTitle;
import com.hecom.reporttable.form.data.Cell;
import com.hecom.reporttable.form.data.TableInfo;
import com.hecom.reporttable.form.data.column.ArrayColumn;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.column.ColumnInfo;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.form.listener.OnContentSizeChangeListener;
import com.hecom.reporttable.form.utils.DrawUtils;
import com.hecom.reporttable.table.bean.TypicalCell;

import java.util.List;

/**
 * 表格测量器 Created by huang on 2017/11/2.
 */

public class TableMeasurer<T> {

    private boolean isReMeasure; //是否重新计算

    private ThemedReactContext context;

    private OnContentSizeChangeListener listener;

    public void setAddTableHeight(int addTableHeight) {
        this.addTableHeight = addTableHeight;
    }

    private int addTableHeight = 0;

    public void setLimitTableHeight(int limitTableHeight) {
        this.limitTableHeight = limitTableHeight;
    }

    private int limitTableHeight = 0;

    public TableInfo measure(TableData<T> tableData, TableConfig config) {
        isReMeasure = true;
        TableInfo tableInfo = tableData.getTableInfo();
        int columnLen = tableData.getMaxValues4Column().length;
        int rowLen = tableData.getMaxValues4Row().length;
        boolean fastModel = columnLen * rowLen > 10000;
        int width = getTableWidth(tableData, config, fastModel);
        int height = getTableHeight(tableData, config, fastModel);
//        if (height > limitTableHeight) {
//              height = height + addTableHeight;
//        }
        this.onMeasure(tableInfo, width, height);
        tableInfo.setTableRect(new Rect(0, 0, width, height));
        measureColumnSize(tableData);
        if (this.context != null) {
            this.context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("tableDidLayout", "tableDidLayout");
        }
        return tableInfo;
    }

    private void onMeasure(TableInfo tableInfo, int width, int height) {
        if (this.listener != null) {
            Rect tableRect = tableInfo.getTableRect();
            if (tableRect == null) {
                this.listener.onContentSizeChanged(width, height);
            } else {
                int oldWidth = tableInfo.getTableRect().width();
                int oldHeight = tableInfo.getTableRect().height();
                if (oldHeight != height || oldWidth != width) {
                    this.listener.onContentSizeChanged(width, height);
                }
            }
        }
    }


    public void measureTableTitle(TableData<T> tableData, ITableTitle tableTitle, Rect showRect) {
        TableInfo tableInfo = tableData.getTableInfo();
        Rect tableRect = tableInfo.getTableRect();
        if (isReMeasure) {
            isReMeasure = false;
            int size = tableTitle.getSize();
            tableInfo.setTitleDirection(tableTitle.getDirection());
            tableInfo.setTableTitleSize(size);
            if (tableTitle.getDirection() == IComponent.TOP ||
                    tableTitle.getDirection() == IComponent.BOTTOM) {
                int height = size;
                tableRect.bottom += height;
                reSetShowRect(showRect, tableRect);
            } else {
                int width = size;
                tableRect.right += width;
                reSetShowRect(showRect, tableRect);
            }
        } else {
            reSetShowRect(showRect, tableRect);
        }

    }

    /**
     * 重新计算显示大小
     */
    public void reSetShowRect(Rect showRect, Rect tableRect) {
        if (showRect.bottom > tableRect.bottom) {
            showRect.bottom = tableRect.bottom;
        }
        if (showRect.right > tableRect.right) {
            showRect.right = tableRect.right;
        }
    }

    /**
     * 计算table高度
     */
    private int getTableHeight(TableData<T> tableData, TableConfig config, boolean fastModel) {
        Paint paint = config.getPaint();
        int topHeight = 0;
        if (config.isShowXSequence()) {
            topHeight = DrawUtils.getTextHeight(config.getXSequenceStyle(), paint)
                    + 2 * config.getSequenceVerticalPadding();
        }
        int titleHeight = config.isShowColumnTitle() ? (tableData.getTitleDrawFormat()
                .measureHeight(config)
                + 2 * config.getColumnTitleVerticalPadding()) : 0;
        TableInfo tableInfo = tableData.getTableInfo();
        tableInfo.setTitleHeight(titleHeight);
        tableInfo.setTopHeight(topHeight);
        int totalContentHeight = 0;
        if (fastModel) {
            Cell[][] rangeCells = tableData.getTableInfo().getRangeCells();
            TypicalCell[][] maxValues4Row = tableData.getMaxValues4Row();
            List<Column> childColumns = tableData.getChildColumns();
            Column column = childColumns.get(0);
            int[] lineHeightArray = tableData.getTableInfo()
                    .getLineHeightArray();//如果有的行是图片会造成误差 暂时按照全是文字
            int rowLength = maxValues4Row.length;
            int tempHeight = 0;
            int rowHeight = 0;
            for (int rowIndex = 0; rowIndex < rowLength; rowIndex++) {
                rowHeight = 0;
                for (TypicalCell typicalCell : maxValues4Row[rowIndex]) {
                    if (typicalCell != null) {
                        Cell cell = rangeCells[typicalCell.rowIndex][typicalCell.columnIndex];
                        if (cell == null || cell.realCell.col == 0) {
                            tempHeight = column.getDrawFormat()
                                    .measureHeight(column, typicalCell, config, -1);
                        } else {
                            int totalWidth = 0;
                            for (int i = cell.realCell.firstColIndex; i <= cell.realCell.lastColIndex; i++) {
                                totalWidth += childColumns.get(i).getComputeWidth();
                            }
                            tempHeight = column.getDrawFormat()
                                    .measureHeight(column, typicalCell, config, totalWidth);
                        }
                        if (tempHeight > rowHeight) rowHeight = tempHeight;
                    }
                }
                lineHeightArray[rowIndex] = rowHeight + 2 * config.getVerticalPadding();
                totalContentHeight += lineHeightArray[rowIndex];
            }
        } else {
            for (int height : tableInfo.getLineHeightArray()) {
                totalContentHeight += height;
            }
        }
        int totalTitleHeight = titleHeight * tableInfo.getMaxLevel();
        int totalHeight = topHeight + totalTitleHeight + totalContentHeight;
        if (tableData.isShowCount()) {
            int countHeight = DrawUtils.getTextHeight(config.getCountStyle(), paint)
                    + 2 * config.getVerticalPadding();
            tableInfo.setCountHeight(countHeight);
            totalHeight += countHeight;
        }
        return totalHeight;
    }

    /**
     * 计算table宽度
     */
    private int getTableWidth(TableData<T> tableData, TableConfig config, boolean fastModel) {
        if (fastModel) {
            //大数据量方案
            TypicalCell[][] maxValues4Column = tableData.getMaxValues4Column();
            int totalWidth = 0;
            Paint paint = config.getPaint();
            config.getYSequenceStyle().fillPaint(paint);
            int totalSize = tableData.getLineSize();
            if (config.isShowYSequence()) {
                int yAxisWidth = (int) paint.measureText(tableData.getYSequenceFormat()
                        .format(totalSize)
                        + 2 * config.getSequenceHorizontalPadding());
                tableData.getTableInfo().setyAxisWidth(yAxisWidth);
                totalWidth += yAxisWidth;
            }

            int contentWidth = 0;
            TableInfo tableInfo = tableData.getTableInfo();
            int size;
            List<Column> childColumns = tableData.getChildColumns();
            int horizontalPadding = config.getTextRightOffset() + config.getTextLeftOffset();
            int columnLength = childColumns.size();
            int columnWidth = 0, iconWidth, textWidth, iconPadding, tempWidth;
            float asteriskWidth;
            for (int columnPos = 0; columnPos < columnLength; columnPos++) {
                Column column = childColumns.get(columnPos);
//                float columnNameWidth = tableData.getTitleDrawFormat().measureWidth(column,
//                config)
//                        + config.getColumnTitleHorizontalPadding() * 2;
                columnWidth = 0;
                for (TypicalCell typicalCell : maxValues4Column[columnPos]) {
                    if (typicalCell != null) {
                        iconWidth = TableUtil.calculateIconWidth(config, typicalCell.columnIndex,
                                typicalCell.rowIndex);
                        asteriskWidth = TableUtil.calculateAsteriskWidth(config,
                                typicalCell.columnIndex, typicalCell.rowIndex);
                        textWidth = column.getDrawFormat()
                                .measureWidth(column, typicalCell, config);
                        iconPadding = textWidth > 0 && iconWidth > 0 ? config.dp4 : 0;
                        tempWidth = (int) (textWidth + iconWidth + iconPadding + asteriskWidth);
                        columnWidth = tempWidth > columnWidth ? tempWidth : columnWidth;
                    }
                }

                size = column.getDatas().size();
                boolean isArrayColumn = column instanceof ArrayColumn;
                Cell[][] rangeCells = tableInfo.getRangeCells();
                for (int position = 0; position < size; position++) {
                    int width = columnWidth;
                    if (!isArrayColumn) {
                        if (rangeCells != null) {
                            Cell cell = rangeCells[position][columnPos];
                            if (cell != null) {
                                if (cell.row != Cell.INVALID && cell.col != Cell.INVALID) {
                                    cell.width = columnWidth;
                                }
                            }
                        }
                    }
                }

//                int width = (int) (Math.max(columnNameWidth, columnWidth + horizontalPadding));
                int width = columnWidth + horizontalPadding;
                if (tableData.isShowCount()) {
                    int totalCountWidth = column.getCountFormat() != null ?
                            (int) paint.measureText(column.getTotalNumString()) : 0;
                    width = Math.max(totalCountWidth + horizontalPadding, width);
                }
                width = Math.max(column.getMinWidth(), width);
                column.setComputeWidth(width);
                contentWidth += width;
            }
            int minWidth = config.getMinTableWidth();
            //计算出来的宽度大于最小宽度
            if (minWidth == -1 || minWidth - totalWidth < contentWidth) {
                totalWidth += contentWidth;
            } else {
                minWidth -= totalWidth;
                float widthScale = ((float) minWidth) / contentWidth;
                for (Column column : tableData.getChildColumns()) {
                    column.setComputeWidth((int) (widthScale * column.getComputeWidth()));
                }
                totalWidth += minWidth;
            }
            return totalWidth;
        } else {
            //原方案
            int totalWidth = 0;
            Paint paint = config.getPaint();
            config.getYSequenceStyle().fillPaint(paint);
            int totalSize = tableData.getLineSize();
            if (config.isShowYSequence()) {
                int yAxisWidth = (int) paint.measureText(tableData.getYSequenceFormat()
                        .format(totalSize)
                        + 2 * config.getSequenceHorizontalPadding());
                tableData.getTableInfo().setyAxisWidth(yAxisWidth);
                totalWidth += yAxisWidth;
            }

            int columnPos = 0;
            int contentWidth = 0;
            int[] lineHeightArray = tableData.getTableInfo().getLineHeightArray();
            TableInfo tableInfo = tableData.getTableInfo();
            int currentPosition, size;
            List<Column> childColumns = tableData.getChildColumns();
            int horizontalPadding = config.getTextRightOffset() + config.getTextLeftOffset();
            int iconWidth = 0;
            float asteriskWidth = 0;
            for (int columnIndex = 0; columnIndex < childColumns.size(); columnIndex++) {
                Column column = childColumns.get(columnIndex);
//                float columnNameWidth =tableData.getTitleDrawFormat().measureWidth(column,config)
//                        +config.getColumnTitleHorizontalPadding()*2;
                int columnWidth = 0;
                size = column.getDatas().size();
                currentPosition = 0;
                boolean isArrayColumn = column instanceof ArrayColumn;
                Cell[][] rangeCells = tableData.getTableInfo().getRangeCells();
                boolean hasMergedCell = false;
                for (int rowIndex = 0; rowIndex < size; rowIndex++) {
                    iconWidth = TableUtil.calculateIconWidth(config, columnIndex, rowIndex);
                    asteriskWidth = TableUtil.calculateAsteriskWidth(config, columnIndex, rowIndex);
                    int textWidth;
                    int iconPadding;
                    int width;
                    Cell cell = rangeCells[rowIndex][columnPos];
                    if (cell == null || cell.realCell.col == 0) {
                        textWidth = column.getDrawFormat()
                                .measureWidth(column, rowIndex, config, false, -1);
                        iconPadding = textWidth > 0 && iconWidth > 0 ? config.dp4 : 0;
                        width = (int) (textWidth + iconWidth + iconPadding + asteriskWidth);
                        measureRowHeight(config, lineHeightArray, column, currentPosition,
                                rowIndex);
                    } else {
                        hasMergedCell = true;
                        textWidth = column.getDrawFormat()
                                .measureWidth(column, rowIndex, config, true, -1);
                        iconPadding = textWidth > 0 && iconWidth > 0 ? config.dp4 : 0;
                        width = (int) (textWidth + iconWidth + iconPadding + asteriskWidth);
                    }
                    int skipPosition = tableInfo.getSeizeCellSize(column, rowIndex);
                    currentPosition += skipPosition;
                    /**
                     *Todo 为了解决合并单元宽度过大问题
                     */
                    // 合并单元格的分配会在合适场景下表现为列宽会超出列宽最大限制
                    if (!isArrayColumn) {
                        if (rangeCells != null) {
                            Cell rangeCell = rangeCells[rowIndex][columnPos];
                            if (rangeCell != null) {
                                if (rangeCell.row != Cell.INVALID && rangeCell.col != Cell.INVALID) {
                                    rangeCell.width = width;
                                    width = width / rangeCell.col;
                                } else if (rangeCell.realCell != null) {
                                    width = rangeCell.realCell.width / rangeCell.realCell.col;
                                }

                            }
                        }
                    }

                    if (columnWidth < width) {
                        columnWidth = width;
                    }
                }
//                int width = (int) (Math.max(columnNameWidth,columnWidth + horizontalPadding));
                int width = columnWidth + horizontalPadding;
                if (tableData.isShowCount()) {
                    int totalCountWidth = column.getCountFormat() != null ?
                            (int) paint.measureText(column.getTotalNumString()) : 0;
                    width = Math.max(totalCountWidth + horizontalPadding, width);
                }
                width = Math.max(column.getMinWidth(), width);
                column.setComputeWidth(width);

                if (hasMergedCell) {//计算合并单元格行高
                    int tempPosition = 0;
                    for (int rowIndex = 0; rowIndex < size; rowIndex++) {
//                        iconWidth = TableUtil.calculateIconWidth(config, columnIndex, rowIndex);
                        Cell cell = rangeCells[rowIndex][columnPos];
                        if (cell != null && cell.realCell.col > 0 && cell.realCell.lastColIndex == columnPos) {
                            int maxWidth = 0;
                            for (int i = cell.realCell.firstColIndex; i <= cell.realCell.lastColIndex; i++) {
                                maxWidth += childColumns.get(i).getComputeWidth();
                            }
                            column.getDrawFormat()
                                    .measureWidth(childColumns.get(cell.realCell.firstColIndex),
                                            rowIndex, config, false, maxWidth);
                            measureRowHeight(config, lineHeightArray,
                                    childColumns.get(cell.realCell.firstColIndex), tempPosition,
                                    rowIndex);
                        }
                        int skipPosition = tableInfo.getSeizeCellSize(column, rowIndex);
                        tempPosition += skipPosition;
                    }
                }

                contentWidth += width;
                columnPos++;
            }
            int minWidth = config.getMinTableWidth();
            //计算出来的宽度大于最小宽度
            if (minWidth == -1 || minWidth - totalWidth < contentWidth) {
                totalWidth += contentWidth;
            } else {
                minWidth -= totalWidth;
                float widthScale = ((float) minWidth) / contentWidth;
                for (Column column : tableData.getChildColumns()) {
                    column.setComputeWidth((int) (widthScale * column.getComputeWidth()));
                }
                totalWidth += minWidth;
            }
            return totalWidth;
        }
    }


    /**
     * 测量行高
     */
    private void measureRowHeight(TableConfig config, int[] lineHeightArray, Column column,
                                  int currentPosition, int position) {

        int height = 0;
        if (column.getRanges() != null && column.getRanges().size() > 0) {
            //如果有合并的情况，将合并的高度分散到各个格子里面去
            for (int i = 0; i < column.getRanges().size(); i++) {
                int[] range = (int[]) column.getRanges().get(i);
                if (range != null && range.length == 2) {
                    if (range[0] <= position && range[1] >= position) {
                        height = (column.getDrawFormat().measureHeight(column, range[0], config) +
                                2 * config.getVerticalPadding()) / (range[1] - range[0] + 1);
                    }
                }
            }
        }
       /* if(tableData.getUserCellRange() != null && tableData.getUserCellRange().size() >0){
            //如果有合并的情况，将合并的高度分散到各个格子里面去
            for(int i = 0; i < column.getRanges().size();i++){
                int[] range = (int[]) column.getRanges().get(i);
                if(range !=null && range.length ==2){
                    if(range[0] <= position && range[1] >=position){
                        height = (column.getDrawFormat().measureHeight(column,range[0],config) +
                                2*config.getVerticalPadding())/(range[1]- range[0]+1);
                    }
                }
            }
        }*/
        if (height == 0) {
            height = column.getDrawFormat().measureHeight(column, position, config) +
                    2 * config.getVerticalPadding();
        }
        height = Math.max(column.getMinHeight(), height);
        if (height > lineHeightArray[currentPosition]) {
            lineHeightArray[currentPosition] = height;
        }
    }

    /**
     * 测量列的Rect
     */
    private void measureColumnSize(TableData<T> tableData) {
        long start = System.currentTimeMillis();
        List<Column> columnList = tableData.getColumns();
        int left = 0;
        int maxLevel = tableData.getTableInfo().getMaxLevel();
        tableData.getColumnInfos().clear();
        tableData.getChildColumnInfos().clear();
        for (int i = 0; i < columnList.size(); i++) {
            int top = 0;
            Column column = columnList.get(i);
            ColumnInfo columnInfo = getColumnInfo(tableData, column, null, left, top, maxLevel);
            left += columnInfo.width;
        }
    }

    public ColumnInfo getColumnInfo(TableData<T> tableData, Column column, ColumnInfo parent,
                                    int left, int top, int overLevel) {
        TableInfo tableInfo = tableData.getTableInfo();
        ColumnInfo columnInfo = new ColumnInfo();
        columnInfo.value = column.getColumnName();
        columnInfo.column = column;
        columnInfo.setParent(parent);
        tableData.getColumnInfos().add(columnInfo);
        if (!column.isParent()) {
            columnInfo.width = column.getComputeWidth();
            columnInfo.top = top;
            columnInfo.height = tableInfo.getTitleHeight() * overLevel;
            tableData.getChildColumnInfos().add(columnInfo);
            columnInfo.left = left;
            return columnInfo;
        } else {
            List<Column> children = column.getChildren();
            int size = children.size();
            int level = column.getLevel();
            int height = (level == 2 ? overLevel - 1 : 1) * tableInfo.getTitleHeight();
            overLevel = level == 2 ? 1 : overLevel - 1;
            columnInfo.left = left;
            columnInfo.top = top;
            columnInfo.height = height;
            top += height;
            int width = 0;
            for (int i = 0; i < size; i++) {
                Column child = children.get(i);
                ColumnInfo childInfo = getColumnInfo(tableData, child, columnInfo, left, top,
                        overLevel);
                width += childInfo.width;
                left += childInfo.width;
            }
            columnInfo.width = width;
        }
        return columnInfo;
    }


    public void setContext(ThemedReactContext context) {
        this.context = context;
    }

    public OnContentSizeChangeListener getOnContentSizeChangeListener() {
        return listener;
    }

    public void setOnContentSizeChangeListener(OnContentSizeChangeListener listener) {
        this.listener = listener;
    }
}
