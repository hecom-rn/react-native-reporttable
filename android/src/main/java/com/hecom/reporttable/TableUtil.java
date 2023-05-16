package com.hecom.reporttable;

import android.content.Context;
import android.graphics.Paint;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;

import java.util.List;

/**
 * Description :
 * Created on 2023/5/12.
 */
public class TableUtil {
  public   static int parseIconName2ResourceId(String name) {
        switch (name) {
            case "normal":
                return R.mipmap.normal;
            case "up":
                return R.mipmap.up;
            case "down":
                return R.mipmap.down;
            case "dot_new":
                return R.mipmap.dot_new;
            case "dot_edit":
                return R.mipmap.dot_edit;
            case "dot_delete":
                return R.mipmap.dot_delete;
            case "dot_readonly":
                return R.mipmap.dot_readonly;
            case "dot_white":
                return R.mipmap.dot_white;
            case "portal_icon":
                return R.mipmap.portal_icon;
            case "trash":
                return R.mipmap.trash;
            case "revert":
                return R.mipmap.revert;
            default:
                return 0;

        }
    }

    public static int getFirstColumnMaxMerge(  TableData tableData){
        int maxColumn = -1;
        List<CellRange> list =  tableData.getUserCellRange();
        for (int i = 0; i < list.size(); i++) {
            CellRange cellRange = list.get(i);
            if(cellRange.getFirstCol() == 0 && cellRange.getFirstRow() == 0 && cellRange.getLastCol() > 0){
                if(maxColumn < cellRange.getLastCol()){
                    maxColumn = cellRange.getLastCol();
                }
            }
        }
        return maxColumn;
    }

    public static int calculateIconWidth(TableConfig config, int col, int row ){
        JsonTableBean.Icon icon = config.getTabArr()[row][col].getIcon();
        int id = icon!=null?parseIconName2ResourceId(icon.name):0;
        if(id!=0){
           return config.getContext().getDrawable(id).getIntrinsicWidth() ;
        }else if(row==0) {
            if(config.getFrozenPoint() > 0){
                if(col == 0 && config.firstColMaxMerge > 0){
                    col = config.firstColMaxMerge;
                }
                if(col == config.getFrozenPoint() - 1 ){
                    return config.getContext().getDrawable(R.mipmap.icon_lock).getIntrinsicWidth() ;
                }
            }else{
                if(config.getFrozenCount() > 0 && col < config.getFrozenCount()){
                    return config.getContext().getDrawable(R.mipmap.icon_lock).getIntrinsicWidth() ;
                }
            }
        }
        return 0;
    }

    public static Paint.Align getAlignConfig(TableConfig config, int row, int col) {
        JsonTableBean tableBean = config.getTabArr()[row][col];
        ItemCommonStyleConfig itemCommonStyleConfig = config.getItemCommonStyleConfig();
        Integer innerAlign = tableBean == null ? null : tableBean.getTextAlignment();
        return innerAlign != null
                ? (innerAlign == 1 ? Paint.Align.CENTER : innerAlign == 2 ? Paint.Align.RIGHT : Paint.Align.LEFT)
                : (itemCommonStyleConfig.getTextAlignment() == 1
                ? Paint.Align.CENTER
                : itemCommonStyleConfig.getTextAlignment() == 2
                ? Paint.Align.RIGHT
                : Paint.Align.LEFT);
    }
}
