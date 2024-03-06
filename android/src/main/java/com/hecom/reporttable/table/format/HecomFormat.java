package com.hecom.reporttable.table.format;

import com.hecom.reporttable.form.data.format.IFormat;
import com.hecom.reporttable.table.bean.Cell;

/**
 * Created by kevin.bai on 2024/3/1.
 */
public class HecomFormat implements IFormat<Cell> {

    @Override
    public String format(Cell cell) {
        if (cell.getRichText() != null){
            StringBuilder sp =  new StringBuilder();
            for (Cell.RichText richText : cell.getRichText()) {
                sp.append(richText.getText());
            }
            return sp.toString();
        }
        return cell.getTitle();
    }
}
