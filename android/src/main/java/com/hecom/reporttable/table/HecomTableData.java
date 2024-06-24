package com.hecom.reporttable.table;


import android.text.TextUtils;
import android.util.Log;

import com.hecom.reporttable.GsonHelper;
import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.draw.IDrawFormat;
import com.hecom.reporttable.form.data.table.ArrayTableData;
import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.bean.MergeBean;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.format.HecomFormat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class HecomTableData extends ArrayTableData<Cell> {
    public static Cell[][] initData(String json) {
        if (TextUtils.isEmpty(json)) {
            return new Cell[][]{};
        }
        try {
            Cell[][] tabArr = GsonHelper.getGson().fromJson(json, Cell[][].class);
            if (tabArr == null) {
                return new Cell[][]{};
            }
            return tabArr;
        } catch (Exception e) {
            Log.e("HecomTableData", e.getMessage(), e);
            return new Cell[][]{};
        }
    }

    /**
     * strArr 不再是全量表格内容 被合并的表格内容会缺失
     */
    public static void mergeTable(Cell[][] tabArr,
                                  ArrayList<CellRange> mergeList) {
        Set<Integer> mergeKeyMap = new HashSet<>();
        try {

            int rowLength = tabArr.length;
            int colLength = tabArr[0].length;
            MergeBean mergeBean = new MergeBean();
            for (int rowIndex = 0; rowIndex < rowLength; rowIndex++) {
                //1、合并列（从左往右找）；2、合并行（从上往下找）
                Cell[] columnArr = tabArr[rowIndex];
                for (int columnIndex = 0; columnIndex < colLength; columnIndex++) {
                    Cell rowObj = columnArr[columnIndex];
                    int uniqueKeyValue = rowObj.getKeyIndex();
                    mergeBean.clear();
                    mergeBean.setStartColum(columnIndex);
                    mergeColumn(uniqueKeyValue, columnIndex, columnArr, mergeBean);
                    mergeBean.setStartRow(rowIndex);
                    mergeRow(uniqueKeyValue, rowIndex, columnIndex, tabArr, mergeBean);

                    if (mergeBean.isMergeColumn()) {
                        columnIndex = mergeBean.getEndColum();
                    }

                    if (!mergeKeyMap.contains(uniqueKeyValue)) {
                        CellRange cellRange = new CellRange(-1, -1, -1, -1);
                        boolean isMerge = (mergeBean.isMergeColumn() || mergeBean.isMergeRow());
                        if (isMerge) {
                            if (mergeBean.isMergeColumn()) {
                                cellRange.setFirstCol(mergeBean.getStartColum());
                                cellRange.setLastCol(mergeBean.getEndColum());
                            } else {
                                cellRange.setFirstCol(mergeBean.getStartColum());
                                cellRange.setLastCol(mergeBean.getStartColum());
                            }
                            if (mergeBean.isMergeRow()) {
                                cellRange.setFirstRow(mergeBean.getStartRow());
                                cellRange.setLastRow(mergeBean.getEndRow());
                            } else {
                                cellRange.setFirstRow(mergeBean.getStartRow());
                                cellRange.setLastRow(mergeBean.getStartRow());
                            }
                            mergeList.add(cellRange);
                            mergeKeyMap.add(uniqueKeyValue);
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("table------合并异常了----------");
        }
    }

    private static void mergeRow(int uniqueKeyValue, int searchRowIndex, int searchColumnIndex,
                                 Cell[][] array, MergeBean mergeBean) {
        if (array == null) return;
        int index = searchRowIndex + 1;
        int length = array.length;
        Cell[] rowArr;
        Cell object;
        int keyValue;
        boolean needMerge = false;
        for (; index < length; index++) {
            rowArr = array[index];
            object = rowArr[searchColumnIndex];
            keyValue = object.getKeyIndex();
            if (uniqueKeyValue == keyValue) {
                needMerge = true;
            } else {
                if (needMerge) {
                    mergeBean.setMergeRow(true);
                    mergeBean.setEndRow(index - 1);
                }
                break;
            }
        }
        if (needMerge && index == length) {
            mergeBean.setMergeRow(true);
            mergeBean.setEndRow(index - 1);
        }
    }


    //合并列（从左往右找）
    private static void mergeColumn(int uniqueKeyValue, int searchColumnIndex,
                                    Cell[] columnArr, MergeBean mergeBean) {
        if (columnArr == null) return;
        int index = searchColumnIndex + 1;
        int length = columnArr.length;
        Cell object;
        int keyValue;
        boolean needMerge = false;
        for (; index < length; index++) {
            object = columnArr[index];
            keyValue = object.getKeyIndex();
            if (uniqueKeyValue == keyValue) {
                needMerge = true;
            } else {
                if (needMerge) {
                    mergeBean.setMergeColumn(true);
                    mergeBean.setEndColum(index - 1);
                }
                break;
            }
        }

        if (needMerge && index == length) { //最后一列的处理
            mergeBean.setMergeColumn(true);
            mergeBean.setEndColum(index - 1);
        }
    }

    /**
     * 创建二维数组表格数据 如果数据不是数组[row][col]，可以使用transformColumnArray方法转换
     *
     * @param drawFormat 数据格式化
     * @return 创建的二维数组表格数据
     */
    public static HecomTableData create(String json,
                                        HecomFormat format,
                                        IDrawFormat<Cell> drawFormat) {
        Cell[][] rawData = initData(json);
        ArrayList<CellRange> mergeList = new ArrayList<>();
        mergeTable(rawData, mergeList);
        Cell[][] data = ArrayTableData.transformColumnArray(rawData);


        List<Column<Cell>> columns = new ArrayList<>();
        int dataLength = data.length;
        for (int i = 0; i < dataLength; i++) {
            Cell[] dataArray = data[i];
            Column<Cell> column = new Column<>("",
                    null, format, drawFormat);
            List<int[]> ranges = new ArrayList<>();
            for (CellRange cellRange : mergeList) {
                if (cellRange.getFirstCol() == i && cellRange.getFirstRow() != cellRange.getLastRow()) {
                    ranges.add(new int[]{cellRange.getFirstRow(), cellRange.getLastRow()});
                }
            }
            column.setColumn(i);
            column.setDatas(Arrays.asList(dataArray));
            column.setRanges(ranges);
            columns.add(column);
        }
        List<Cell> arrayList;
        if (dataLength > 0) {
            arrayList = Arrays.asList(data[0]);
        } else {
            arrayList = new ArrayList<>();
        }
        HecomTableData result = new HecomTableData(arrayList, columns);
        result.setUserCellRange(mergeList);

        return result;
    }


    /**
     * 二维数组的构造方法
     *
     * @param t       数据
     * @param columns 列
     */
    protected HecomTableData(List<Cell> t,
                             List<Column<Cell>> columns) {
        super(null, t, columns);
    }

    public void setLimit(TableConfigBean config) {
        for (int i = 0; i < getArrayColumns().size(); i++) {
            Column<Cell> column = getArrayColumns().get(i);
            if (config.getMinWidth() > 0) column.setMinWidth(config.getMinWidth());
            if (config.getMinHeight() > 0) column.setMinHeight(config.getMinHeight());
            CellConfig cellConfig = config.getColumnConfigMap() != null ?
                    config.getColumnConfigMap()
                    .get(i) : null;
            if (null != cellConfig) {
                if (cellConfig.minWidth > 0) {
                    column.setMinWidth(cellConfig.minWidth);
                }
            }
        }
    }
}
