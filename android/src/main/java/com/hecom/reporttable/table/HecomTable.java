package com.hecom.reporttable.table;

import android.util.AttributeSet;

import com.hecom.reporttable.form.core.SmartTable;
import com.facebook.react.uimanager.ThemedReactContext;
/**
 * Created by kevin.bai on 2024/2/2.
 * 由于目前很多外挂的数据都保存在ReportTableStore中，而ReportTableStore之前是单例的，
 * 导致如果出现多个表格实例会有串数据的情况，暂时将ReportTableStore放到表格中
 */
public class HecomTable<T> extends SmartTable<T> {
    public ReportTableStore getStore() {
        return mStore;
    }

    public void setStore(ReportTableStore store) {
        mStore = store;
    }

    ReportTableStore mStore;
    public HecomTable(ThemedReactContext context) {
        super(context);
    }

    public HecomTable(ThemedReactContext context, AttributeSet attrs) {
        super(context, attrs);
    }

    public HecomTable(ThemedReactContext context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }
}
