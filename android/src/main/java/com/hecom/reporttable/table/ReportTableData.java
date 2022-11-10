package com.hecom.reporttable.table;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.table.bean.MergeBean;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.google.gson.Gson;

public class ReportTableData {
    private ArrayList<CellRange> mergeList = new ArrayList<>();
    private Map<Integer,Integer> mergeKeyMap = new HashMap<>();
    private SmartTable<String> table;
    private MergeBean mergeBean = new MergeBean();
    private String uniqueKey = "keyIndex";
    private String valueKey = "title";
    private JsonTableBean[][] tabArr;
    private int strUnit = 10;
    public Map<Integer,Integer> columnMapWidth = new HashMap<>();
    public ArrayList<CellRange> getMergeList() {
        return new ArrayList<>(mergeList);
    }

    public JsonTableBean[][] getTabArr() {
        return tabArr;
    }

    public String[][] mergeTable(String json){
        if(json == null){
            return null;
        }

        mergeList.clear();
        mergeKeyMap.clear();
        try {
            JSONArray jsonArray = new JSONArray(json);
            String[][] strArr =  creatArr(jsonArray);
            if(strArr == null){
                return null;
            }
            tabArr = new JsonTableBean[jsonArray.length()][];
            for (int row = 0; row < jsonArray.length(); row++) {
                //1、合并列（从左往右找）；2、合并行（从上往下找）
                JSONArray columnArr = (JSONArray) jsonArray.get(row);
                JsonTableBean[] rowBean = new JsonTableBean[columnArr.length()];
                for (int column = 0; column < columnArr.length(); column++) {
                    JSONObject rowObj = (JSONObject) columnArr.get(column);
                    int uniqueKeyValue = getUniqueKeyValue(rowObj);
                    mergeBean.clear();
                    mergeBean.setStartColum(column);
                    mergeColumn(uniqueKeyValue, column ,columnArr);
                    mergeBean.setStartRow(row);
                    mergeRow(uniqueKeyValue, row, column, jsonArray);
                    if(!rowObj.has(valueKey) || rowObj.get(valueKey) == null ||  "".equals(rowObj.get(valueKey))){
                        strArr[column][row] = "-";
                        JsonTableBean jsonTableBean = new JsonTableBean("-");
                        rowBean[column] =  jsonTableBean;
                    }else{
                        strArr[column][row] = (String) rowObj.get(valueKey).toString();
                        JsonTableBean columnBean = new Gson().fromJson(rowObj.toString(),JsonTableBean.class);
                        rowBean[column] =  columnBean;
                    }
                    //优化
                    if(mergeBean.isMergeColumn()){
                        column=mergeBean.getEndColum();
                    }

                    if(!mergeKeyMap.containsKey(uniqueKeyValue)){
                        CellRange cellRange = new CellRange(-1,-1,-1,-1);
                        boolean isMerge = (mergeBean.isMergeColumn() && mergeBean.getStartColum() != -1 && mergeBean.getEndColum() != -1)
                                || (mergeBean.isMergeRow() && mergeBean.getStartRow() != -1 && mergeBean.getEndRow() != -1);
                        if(isMerge){
                            if(mergeBean.isMergeColumn()){
                                cellRange.setFirstCol(mergeBean.getStartColum());
                                cellRange.setLastCol(mergeBean.getEndColum());
                            }else{
                                cellRange.setFirstCol(mergeBean.getStartColum());
                                cellRange.setLastCol(mergeBean.getStartColum());
                            }
                            if(mergeBean.isMergeRow()){
                                cellRange.setFirstRow(mergeBean.getStartRow());
                                cellRange.setLastRow(mergeBean.getEndRow());
                            }else{
                                cellRange.setFirstRow(mergeBean.getStartRow());
                                cellRange.setLastRow(mergeBean.getStartRow());
                            }
                            mergeList.add(cellRange);
                            mergeKeyMap.put(uniqueKeyValue,uniqueKeyValue);
                        }
                    }
                }
                tabArr[row] = rowBean;
            }
            return strArr;
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("table------合并异常了----------");
        }
        return null;
    }


    public int getUniqueKeyValue(JSONObject obj){
        int value = -1;
        try {
            if(obj.has(uniqueKey)){
                return  (int) obj.get(uniqueKey);
            }
            long nanoTime = System.nanoTime();
            value = new Long(nanoTime).intValue();
        } catch (JSONException e) {
            e.printStackTrace();
            return value;
        }
        return value;
    }

    public void mergeRow(int uniqueKeyValue, int searchRowIndex, int searchColumnIndex, JSONArray array){
        if(array == null) return;
        int index = searchRowIndex + 1;
        int length = array.length();
//        if(index >= array.length()) return;
        try {
//            JSONArray rowArr =  (JSONArray) array.get(index);
//            JSONObject object = (JSONObject) rowArr.get(searchColumnIndex);
//            int keyValue = getUniqueKeyValue(object);
//            if(uniqueKeyValue != keyValue) return;
            JSONArray rowArr;
            JSONObject object;
            int keyValue;
            boolean needMerge = false;
            for (int i = index; i < length ; i++) {
                rowArr =  (JSONArray) array.get(i);
                object = (JSONObject) rowArr.get(searchColumnIndex);
                keyValue = getUniqueKeyValue(object);
                if(uniqueKeyValue == keyValue){
                    needMerge=true;
                }else {
                    if(needMerge){
                        mergeBean.setMergeRow(true);
                        mergeBean.setEndRow(i-1);
                        mergeBean.setKeyValue(uniqueKeyValue);
                    }
                }
            }

//            mergeBean.setMergeRow(true);
//            mergeBean.setEndRow(index);
//            mergeBean.setKeyValue(uniqueKeyValue);
//            mergeRow(uniqueKeyValue, index, searchColumnIndex, array);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("row-----合并异常了----------");
        }
    }

    //合并列（从左往右找）
    public void mergeColumn(int uniqueKeyValue,int searchColumnIndex, JSONArray columnArr){
        if(columnArr == null) return;
        int index = searchColumnIndex + 1;
        int length = columnArr.length();
//        if(index >= length) return;
        try {
//            JSONObject object =  (JSONObject) columnArr.get(index);
//            int keyValue = getUniqueKeyValue(object);
//            if(uniqueKeyValue != keyValue) return;
            JSONObject object;
            int keyValue;
            boolean needMerge=false;
            for (int i = index; i < length; i++) {
                object =  (JSONObject) columnArr.get(i);
                keyValue = getUniqueKeyValue(object);
                if(uniqueKeyValue == keyValue){
                    needMerge=true;
                }else {
                    if(needMerge){
                        mergeBean.setMergeColumn(true);
                        mergeBean.setEndColum(i-1);
                        mergeBean.setKeyValue(uniqueKeyValue);
                    }
                    break;
                }
            }
//            mergeBean.setEndColum(index);
//            mergeBean.setKeyValue(uniqueKeyValue);
//            mergeColumn(uniqueKeyValue, index, columnArr);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("column------合并异常了----------");
        }
    }

    public String[][] creatArr(JSONArray jsonArray){
        String[][] arr = null;
        if(jsonArray == null) return arr;
        try {
            JSONArray columnArr = (JSONArray)jsonArray.get(0);
            if(columnArr == null) return arr;
            arr = new String[columnArr.length()][jsonArray.length()];
        } catch (Exception e) {
            e.printStackTrace();
            return arr;
        }
        return arr;
    }

}
