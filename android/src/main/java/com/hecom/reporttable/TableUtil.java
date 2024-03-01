package com.hecom.reporttable;

import android.graphics.Paint;
import android.text.TextUtils;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.TypicalCell;

import java.util.List;

/**
 * Description : Created on 2023/5/12.
 */
public class TableUtil {
    public static int parseIconName2ResourceId(String name) {
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
            case "unSelectIcon":
                return R.mipmap.checkbox;
            case "selectedIcon":
                return R.mipmap.checkbox_hl;
            default:
                return 0;

        }
    }

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

    public static int calculateIconWidth(TableConfig config,int col, int row, JsonTableBean bean){
        JsonTableBean.Icon icon = bean.getIcon();
        int id = icon != null ? parseIconName2ResourceId(icon.name) : 0;
        if (id != 0) {
            return config.getContext().getDrawable(id).getIntrinsicWidth();
        } else if (config.mLocker.needShowLock(row, col)) {
            return config.getContext().getDrawable(R.mipmap.icon_lock)
                    .getIntrinsicWidth();
        }
        return 0;
    }

    public static int calculateIconWidth(TableConfig config, TypicalCell cell) {
        return calculateIconWidth(config, cell.columnIndex, cell.rowIndex, cell.jsonTableBean);
    }

    public static float calculateAsteriskWidth(TableConfig config, JsonTableBean jsonTableBean) {
        String asteriskColor = jsonTableBean.getAsteriskColor();
        if (TextUtils.isEmpty(asteriskColor)) {
            return 0;
        } else {
            Paint asteriskPaint = config.getAsteriskPaint();
            asteriskPaint.setTextSize((jsonTableBean.getFontSize() != null && jsonTableBean.getFontSize()
                    .compareTo(0) > 0) ? jsonTableBean.getFontSize() : config.getContentStyle()
                    .getTextSize());
            return asteriskPaint.measureText(config.ASTERISK);
        }
    }

    public static Paint.Align getAlignConfig(TableConfig config, CellInfo cellInfo) {
        JsonTableBean tableBean = (JsonTableBean) cellInfo.data;
        ItemCommonStyleConfig itemCommonStyleConfig = config.getItemCommonStyleConfig();
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
