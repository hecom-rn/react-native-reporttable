package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.core.SmartTable;

/**
 * Created by kevin.bai on 2024/1/7.
 */
public class LockHelper extends Locker {
    Locker locker;

    public LockHelper(SmartTable<String> table) {
        super(table);
    }

    public void setPermutable(boolean permutable) {
        locker = permutable ? new PermutableLock(this.table) : new CommonLock(this.table);
    }

    @Override
    protected void updateLock(int column) {
        if( locker != null){
            locker.updateLock(column);
        }
    }
}
