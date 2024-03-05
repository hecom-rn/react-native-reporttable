package com.hecom.reporttable;

import android.graphics.Paint;

import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;

import java.util.List;

/**
 * Description : Created on 2023/5/12.
 */
public class TableUtil {

    public static int getFirstColumnMaxMerge(TableData tableData) {
        int maxColumn = -1;
        List<CellRange> list = tableData.getUserCellRange();
        for (int i = 0; i < list.size(); i++) {
            CellRange cellRange = list.get(i);
            if (cellRange.getFirstCol() == 0 && cellRange.getFirstRow() == 0 && cellRange.getLastCol() > 0) {
                if (maxColumn < cellRange.getLastCol()) {
                    maxColumn = cellRange.getLastCol();
                }
            }
        }
        return maxColumn;
    }

    public static Paint.Align getAlignConfig(ItemCommonStyleConfig itemCommonStyleConfig, CellInfo cellInfo) {
        JsonTableBean tableBean = (JsonTableBean) cellInfo.data;
        Integer innerAlign = tableBean == null ? null : tableBean.getTextAlignment();
        return innerAlign != null
                ? (innerAlign == 1 ? Paint.Align.CENTER : innerAlign == 2 ? Paint.Align.RIGHT :
                Paint.Align.LEFT)
                : (itemCommonStyleConfig.getTextAlignment() == 1
                ? Paint.Align.CENTER
                : itemCommonStyleConfig.getTextAlignment() == 2
                ? Paint.Align.RIGHT
                : Paint.Align.LEFT);
    }
}
