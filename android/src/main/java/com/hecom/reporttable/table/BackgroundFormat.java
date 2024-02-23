package com.hecom.reporttable.table;

import android.graphics.Color;

import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.format.bg.BaseCellBackgroundFormat;
import com.hecom.reporttable.table.bean.JsonTableBean;

/**
 * Created by kevin.bai on 2024/2/22.
 */
public class BackgroundFormat extends BaseCellBackgroundFormat<CellInfo> {
    private SmartTable<String> table;
    public BackgroundFormat(SmartTable<String> table) {
        this.table = table;
    }
    @Override
    public int getBackGroundColor(CellInfo cellInfo) {
        JsonTableBean tableBean = this.table.getConfig().getCell(cellInfo.row,cellInfo.col);
        String color = this.table.getConfig().getItemCommonStyleConfig().getBackgroundColor();
        if (tableBean != null) {
            color = tableBean.getBackgroundColor();
        }
        return Color.parseColor(color);
    }

    @Override
    public int getTextColor(CellInfo cellInfo) {
        JsonTableBean tableBean = this.table.getConfig().getCell(cellInfo.row,cellInfo.col);
        String textColor = this.table.getConfig().getItemCommonStyleConfig().getTextColor();
        if (tableBean != null) {
            textColor = tableBean.getTextColor();
        }
        return Color.parseColor(textColor);
    }
}
