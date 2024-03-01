package com.hecom.reporttable.table;

import android.graphics.Color;

import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.format.bg.BaseCellBackgroundFormat;
import com.hecom.reporttable.table.bean.JsonTableBean;

/**
 * Created by kevin.bai on 2024/2/22.
 */
public class BackgroundFormat extends BaseCellBackgroundFormat<CellInfo> {
    private final HecomTable table;
    public BackgroundFormat(HecomTable table) {
        this.table = table;
    }
    @Override
    public int getBackGroundColor(CellInfo cellInfo) {
        JsonTableBean tableBean = (JsonTableBean) cellInfo.data;
        String color = this.table.getConfig().getItemCommonStyleConfig().getBackgroundColor();
        if (tableBean != null) {
            color = tableBean.getBackgroundColor();
        }
        return Color.parseColor(color);
    }

    @Override
    public int getTextColor(CellInfo cellInfo) {
        JsonTableBean tableBean =  (JsonTableBean) cellInfo.data;;
        String textColor = this.table.getConfig().getItemCommonStyleConfig().getTextColor();
        if (tableBean != null) {
            textColor = tableBean.getTextColor();
        }
        return Color.parseColor(textColor);
    }
}
