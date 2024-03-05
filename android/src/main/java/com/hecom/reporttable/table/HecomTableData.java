package com.hecom.reporttable.table;


import android.text.TextUtils;

import com.hecom.JacksonUtil;
import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.draw.IDrawFormat;
import com.hecom.reporttable.form.data.table.ArrayTableData;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.MergeBean;
import com.hecom.reporttable.table.bean.TypicalCell;
import com.hecom.reporttable.table.format.HecomFormat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class HecomTableData extends ArrayTableData<JsonTableBean> {
    public static JsonTableBean[][] initData(String json) {
        if (TextUtils.isEmpty(json)) {
            return new JsonTableBean[][]{};
        }
        try {
            JsonTableBean[][] tabArr = JacksonUtil.decode(json, JsonTableBean[][].class);
            if (tabArr == null || tabArr.length == 0 || tabArr[0].length == 0) {
                return new JsonTableBean[][]{};
            }
            return tabArr;
        } catch (Exception e) {
            return new JsonTableBean[][]{};
        }
    }

    private static void updateBean(JsonTableBean rowObj, ItemCommonStyleConfig commonStyleConfig) {
        if (rowObj.isForbidden != null && rowObj.isForbidden) {
            rowObj.setTitle("");
        }
        if (TextUtils.isEmpty(rowObj.backgroundColor)) {
            rowObj.setBackgroundColor(commonStyleConfig.backgroundColor);
        }
        if (TextUtils.isEmpty(rowObj.textColor)) {
            rowObj.setTextColor(commonStyleConfig.textColor);
        }
        if (null == rowObj.textAlignment) {
            rowObj.setTextAlignment(commonStyleConfig.textAlignment);
        }
        if (null == rowObj.fontSize) {
            rowObj.setFontSize(commonStyleConfig.fontSize);
        }
        if (null == rowObj.isOverstriking) {
            rowObj.setOverstriking(commonStyleConfig.isOverstriking);
        }
    }


    /**
     * strArr 不再是全量表格内容 被合并的表格内容会缺失
     */
    public static void mergeTable(JsonTableBean[][] tabArr,
                                  ItemCommonStyleConfig commonStyleConfig,
                                  ArrayList<CellRange> mergeList,
                                  TypicalCell[][] maxValues4Column, TypicalCell[][] maxValues4Row) {
        Set<Integer> mergeKeyMap = new HashSet<>();
        try {

            int rowLength = tabArr.length;
            int colLength = tabArr[0].length;
            MergeBean mergeBean = new MergeBean();
            TypicalCell preMaxContentCloumn, preMaxIconCloumn, preMaxMergeRow;
            for (int rowIndex = 0; rowIndex < rowLength; rowIndex++) {
                //1、合并列（从左往右找）；2、合并行（从上往下找）
                JsonTableBean[] columnArr = tabArr[rowIndex];
                for (int columnIndex = 0; columnIndex < colLength; columnIndex++) {
                    JsonTableBean rowObj = columnArr[columnIndex];
                    int uniqueKeyValue = rowObj.keyIndex;
                    mergeBean.clear();
                    mergeBean.setStartColum(columnIndex);
                    mergeColumn(uniqueKeyValue, columnIndex, columnArr, mergeBean);
                    mergeBean.setStartRow(rowIndex);
                    mergeRow(uniqueKeyValue, rowIndex, columnIndex, tabArr, mergeBean);

                    updateBean(rowObj, commonStyleConfig);

                    if (mergeBean.isMergeColumn()) {
                        columnIndex = mergeBean.getEndColum();
                    } else {
                        if (maxValues4Column[columnIndex][0] == null) {
                            maxValues4Column[columnIndex][0] = new TypicalCell(rowObj,
                                    columnIndex, rowIndex);
                        }

                        preMaxContentCloumn = maxValues4Column[columnIndex][1];
                        if (null == preMaxContentCloumn) {
                            maxValues4Column[columnIndex][1] = new TypicalCell(rowObj,
                                    columnIndex, rowIndex);
                        } else if (preMaxContentCloumn.jsonTableBean.title.length() < rowObj.title.length()) {
                            preMaxContentCloumn.rowIndex = rowIndex;
                            preMaxContentCloumn.jsonTableBean = rowObj;
                        }
                        if (rowObj.icon != null) {
                            preMaxIconCloumn = maxValues4Column[columnIndex][2];
                            if (null == preMaxIconCloumn) {
                                maxValues4Column[columnIndex][2] = new TypicalCell(rowObj,
                                        columnIndex, rowIndex);
                            } else if (preMaxIconCloumn.jsonTableBean.title.length() < rowObj.title.length()) {
                                preMaxIconCloumn.rowIndex = rowIndex;
                                preMaxIconCloumn.jsonTableBean = rowObj;
                            }
                        }
                    }
                    if (!mergeBean.isMergeRow()) {
                        if (mergeBean.isMergeColumn()) {
                            // 合并列中的最大值
                            preMaxMergeRow = maxValues4Row[rowIndex][0];
                            if (preMaxMergeRow == null) {
                                maxValues4Row[rowIndex][0] = new TypicalCell(rowObj,
                                        mergeBean.getStartColum(), rowIndex);
                            } else if (preMaxMergeRow.jsonTableBean.title.length() < rowObj.title.length()) {
                                preMaxMergeRow.columnIndex = mergeBean.getStartColum();
                                preMaxMergeRow.jsonTableBean = rowObj;
                            }
                        } else {
                            //非合并列的最大值
                            preMaxMergeRow = maxValues4Row[rowIndex][1];
                            if (preMaxMergeRow == null) {
                                maxValues4Row[rowIndex][1] = new TypicalCell(rowObj, columnIndex,
                                        rowIndex);
                            } else if (preMaxMergeRow.jsonTableBean.title.length() < rowObj.title.length()) {
                                preMaxMergeRow.columnIndex = mergeBean.getStartColum();
                                preMaxMergeRow.jsonTableBean = rowObj;
                            }
                        }
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
                                 JsonTableBean[][] array, MergeBean mergeBean) {
        if (array == null) return;
        int index = searchRowIndex + 1;
        int length = array.length;
        JsonTableBean[] rowArr;
        JsonTableBean object;
        int keyValue;
        boolean needMerge = false;
        for (; index < length; index++) {
            rowArr = array[index];
            object = rowArr[searchColumnIndex];
            keyValue = object.keyIndex;
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
                                    JsonTableBean[] columnArr, MergeBean mergeBean) {
        if (columnArr == null) return;
        int index = searchColumnIndex + 1;
        int length = columnArr.length;
        JsonTableBean object;
        int keyValue;
        boolean needMerge = false;
        for (; index < length; index++) {
            object = columnArr[index];
            keyValue = object.keyIndex;
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
    public static HecomTableData create(String json, ItemCommonStyleConfig config, HecomFormat format,
                                        IDrawFormat<JsonTableBean> drawFormat) {
        JsonTableBean[][] rawData = initData(json);
        ArrayList<CellRange> mergeList = new ArrayList<>();
        TypicalCell[][] maxValues4Column = new TypicalCell[rawData[0].length][3];
        TypicalCell[][] maxValues4Row = new TypicalCell[rawData.length][2];
        mergeTable(rawData, config, mergeList, maxValues4Column, maxValues4Row);
        JsonTableBean[][] data = ArrayTableData.transformColumnArray(rawData);


        List<Column<JsonTableBean>> columns = new ArrayList<>();
        int dataLength = data.length;
        for (int i = 0; i < dataLength; i++) {
            JsonTableBean[] dataArray = data[i];
            Column<JsonTableBean> column = new Column<>("",
                    null, format, drawFormat);
            column.setColumn(i, dataLength);
            column.setDatas(Arrays.asList(dataArray));
            columns.add(column);
        }
        List<JsonTableBean> arrayList;
        if (dataLength > 0) {
            arrayList = Arrays.asList(data[0]);
        } else {
            arrayList = new ArrayList<>();
        }
        HecomTableData result = new HecomTableData(arrayList, columns);
        result.setMaxValues4Column(maxValues4Column);
        result.setMaxValues4Row(maxValues4Row);
        result.setUserCellRange(mergeList);

        return result;
    }


    /**
     * 二维数组的构造方法
     *
     * @param t       数据
     * @param columns 列
     */
    protected HecomTableData(List<JsonTableBean> t,
                             List<Column<JsonTableBean>> columns) {
        super(null, t, columns);
    }

    public void updateData(String json, int x, int y) {
        JsonTableBean[][] updateData = initData(json);
    }
}
