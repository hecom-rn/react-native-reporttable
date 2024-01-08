package com.hecom.reporttable.table;

import android.content.Context;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.lock.Locker;

/**
 * 处理表格基础的点击事件，以及点击表头时的列锁定逻辑 Created by kevin.bai on 2024/1/4.
 */
public class ClickHandler implements TableData.OnItemClickListener<String> {

    private SmartTable<String> table;

    private Locker locker;


    public ClickHandler(SmartTable<String> table) {
        this.table = table;

    }

    public Locker getLocker() {
        return locker;
    }

    public void setLocker(Locker locker){
        this.locker = locker;
    }

    @Override
    public void onClick(Column column, String value, String o, int col, int row) {
        boolean isLockItem = table.getConfig().isLockItem(col, row);
        if (isLockItem) {
            table.postDelayed(new Runnable() {
                @Override
                public void run() {
                    table.notifyDataChanged();
                }
            }, 10);
            if (this.locker != null) {
                this.locker.onClick(row, col);
            }
            return;
        }
        try {
            Context context = table.getContext();
            JsonTableBean tableBean = table.getConfig().getTabArr()[row][col];
            int keyIndex = tableBean.getKeyIndex();
            if (context != null) {
                WritableMap map = Arguments.createMap();
                map.putInt("keyIndex", keyIndex);
                map.putInt("rowIndex", row);
                map.putInt("columnIndex", col);
                ((ReactContext) context).getJSModule(RCTEventEmitter.class)
                        .receiveEvent(table.getId(), "onClickEvent", map);
            }
        } catch (Exception exception) {
            exception.printStackTrace();
            System.out.println("点击异常---" + exception);
        }
    }


}

