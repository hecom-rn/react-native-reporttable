package com.hecom.reporttable.table;

import android.text.TextUtils;

import com.hecom.JacksonUtil;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.MergeBean;
import com.hecom.reporttable.table.bean.MergeResult;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.bean.TypicalCell;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class ReportTableData {
    private ArrayList<CellRange> mergeList = new ArrayList<>();
    private Map<Integer, Integer> mergeKeyMap = new HashMap<>();
    private SmartTable<String> table;
    private MergeBean mergeBean = new MergeBean();
    private String uniqueKey = "keyIndex";
    private String valueKey = "title";
    private JsonTableBean[][] tabArr;
    private int strUnit = 10;
    public Map<Integer, Integer> columnMapWidth = new HashMap<>();

    public ArrayList<CellRange> getMergeList() {
        return new ArrayList<>(mergeList);
    }

    public JsonTableBean[][] getTabArr() {
        return tabArr;
    }


    /**
     * strArr 不再是全量表格内容 被合并的表格内容会缺失
     *
     * @param json
     * @param configBean
     * @return
     */
    public MergeResult mergeTable(String json, TableConfigBean configBean) {
        long start = System.currentTimeMillis();
        mergeList.clear();
        mergeKeyMap.clear();
        if (TextUtils.isEmpty(json)) {
            tabArr = new JsonTableBean[][]{};
            return new MergeResult(new String[][]{}, new TypicalCell[][]{}, new String[]{});
        }
        try {
            tabArr = JacksonUtil.decode(json, JsonTableBean[][].class);
            String[][] strArr = creatArr(tabArr);
            TypicalCell[][] maxValues4Column = new TypicalCell[strArr.length][3];
            String[] maxValues4Row = new String[strArr[0].length];
            if (strArr == null) {
                return null;
            }
            int rowLength = tabArr.length;
            int colLength = tabArr[0].length;

            TypicalCell preMaxContentCloumn,preMaxIconCloumn;
            String preMaxRow;
            ItemCommonStyleConfig commonStyleConfig = configBean.getItemCommonStyleConfig();
            for (int rowIndex = 0; rowIndex < rowLength; rowIndex++) {
                //1、合并列（从左往右找）；2、合并行（从上往下找）
                JsonTableBean[] columnArr = tabArr[rowIndex];
                for (int columnIndex = 0; columnIndex < colLength; columnIndex++) {
                    JsonTableBean rowObj = columnArr[columnIndex];
                    int uniqueKeyValue = rowObj.keyIndex;
                    mergeBean.clear();
                    mergeBean.setStartColum(columnIndex);
                    mergeColumn(uniqueKeyValue, columnIndex, columnArr);
                    mergeBean.setStartRow(rowIndex);
                    mergeRow(uniqueKeyValue, rowIndex, columnIndex, tabArr);

                    if (TextUtils.isEmpty(rowObj.title)) {
                        strArr[columnIndex][rowIndex] = "-";
                        rowObj.setTitle("-");
                    } else {
                        strArr[columnIndex][rowIndex] = rowObj.title;
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
                    if (mergeBean.isMergeColumn()) {
                        columnIndex = mergeBean.getEndColum();
                    } else {
                        if(maxValues4Column[columnIndex][0] ==null){
                            maxValues4Column[columnIndex][0]= new TypicalCell(rowObj,columnIndex,rowIndex);
                        }

                        preMaxContentCloumn = maxValues4Column[columnIndex][1];
                        if (null == preMaxContentCloumn){
                            maxValues4Column[columnIndex][1] =new TypicalCell(rowObj,columnIndex,rowIndex);
                        }else if(  preMaxContentCloumn.jsonTableBean.title.length() < rowObj.title.length()) {
                            preMaxContentCloumn.rowIndex=rowIndex;
                            preMaxContentCloumn.jsonTableBean=rowObj;
                        }
                        if(rowObj.icon!=null){
                            preMaxIconCloumn = maxValues4Column[columnIndex][2];
                            if (null == preMaxIconCloumn){
                                maxValues4Column[columnIndex][2] =new TypicalCell(rowObj,columnIndex,rowIndex);
                            }else if(  preMaxIconCloumn.jsonTableBean.title.length() < rowObj.title.length()) {
                                preMaxIconCloumn.rowIndex=rowIndex;
                                preMaxIconCloumn.jsonTableBean=rowObj;
                            }
                        }
                    }
                    if (!mergeBean.isMergeRow()){
                        preMaxRow = maxValues4Row[rowIndex];
                        if (null == preMaxRow || preMaxRow.length() < rowObj.title.length()) {
                            maxValues4Row[rowIndex] = rowObj.title;
                        }
                    }

                    if (!mergeKeyMap.containsKey(uniqueKeyValue)) {
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
                            mergeKeyMap.put(uniqueKeyValue, uniqueKeyValue);
                        }
                    }
                }
            }
            return new MergeResult(strArr, maxValues4Column, maxValues4Row);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("table------合并异常了----------");
            tabArr = new JsonTableBean[][]{};
            return new MergeResult(new String[][]{}, new TypicalCell[][]{}, new String[]{});
        }
    }

    public void mergeRow(int uniqueKeyValue, int searchRowIndex, int searchColumnIndex, JsonTableBean[][] array) {
        long start = System.currentTimeMillis();
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
                    mergeBean.setKeyValue(uniqueKeyValue);
                }
                break;
            }
        }
        if (needMerge && index == length) {
            mergeBean.setMergeRow(true);
            mergeBean.setEndRow(index - 1);
            mergeBean.setKeyValue(uniqueKeyValue);
        }
    }


    //合并列（从左往右找）
    public void mergeColumn(int uniqueKeyValue, int searchColumnIndex, JsonTableBean[] columnArr) {
        long start = System.currentTimeMillis();
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
                    mergeBean.setKeyValue(uniqueKeyValue);
                }
                break;
            }
        }

        if (needMerge && index == length) { //最后一列的处理
            mergeBean.setMergeColumn(true);
            mergeBean.setEndColum(index - 1);
            mergeBean.setKeyValue(uniqueKeyValue);
        }
    }

    public String[][] creatArr(JsonTableBean[][] jsonArray) {
        String[][] arr = null;
        if (jsonArray == null) return arr;
        try {
            JsonTableBean[] columnArr = jsonArray[0];
            if (columnArr == null) return arr;
            arr = new String[columnArr.length][jsonArray.length];
        } catch (Exception e) {
            e.printStackTrace();
            return arr;
        }
        return arr;
    }

}
