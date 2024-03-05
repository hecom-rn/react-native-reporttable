package com.hecom.reporttable.table.format;

import com.hecom.reporttable.form.data.format.IFormat;
import com.hecom.reporttable.table.bean.JsonTableBean;

/**
 * Created by kevin.bai on 2024/3/1.
 */
public class HecomFormat implements IFormat<JsonTableBean> {

    @Override
    public String format(JsonTableBean jsonTableBean) {
        if (jsonTableBean.richText != null){
            StringBuilder sp =  new StringBuilder();
            for (JsonTableBean.RichText richText : jsonTableBean.richText) {
                sp.append(richText.getText());
            }
            return sp.toString();
        }
        return jsonTableBean.title;
    }
}
