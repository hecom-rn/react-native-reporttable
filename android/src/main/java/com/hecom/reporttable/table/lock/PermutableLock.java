package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.table.TableData;

import java.util.ArrayList;
import java.util.List;

/**
 * 可排列列锁定逻辑，permutable属性为true时使用此策略 Created by kevin.bai on 2024/1/4.
 */
public class PermutableLock extends Locker {

    List<Column> rawColumns;

    List<Column> fixedColumn = new ArrayList<>();

    TableData<String> lastTableData;

    public PermutableLock(SmartTable<String> table) {
        super(table);
        this.lastTableData = table.getTableData();
    }

    @Override
    public int getRawCol(int col){
        if(rawColumns == null){
            return col;
        } else {
            Column column = table.getTableData().getColumns().get(col);
            return rawColumns.indexOf(column);
        }
    }

    @Override
    protected void updateLock(int col) {
        if (rawColumns == null || lastTableData != table.getTableData()) {
            lastTableData = table.getTableData();
            rawColumns = lastTableData.getColumns();
        }

        Column column = table.getTableData().getColumns().get(col);
        if (column.isFixed()) {
            fixedColumn.remove(column);
        } else {
            fixedColumn.add(column);
        }
        column.setFixed(!column.isFixed());
        List<Column> newColumns = new ArrayList<>(rawColumns.size());
        for (int i = 0; i < rawColumns.size(); i++) {
            if (i < frozenColumns) {
                newColumns.add(i, rawColumns.get(i));
            } else if (i < fixedColumn.size() + frozenColumns) {
                newColumns.add(i, fixedColumn.get(i - frozenColumns));
            }
        }
        List<Column> other = new ArrayList<>(rawColumns.subList(frozenColumns, rawColumns.size()));
        other.removeAll(fixedColumn);
        newColumns.addAll(other);
        table.getTableData().setColumns(newColumns);
    }

    @Override
    protected boolean needShowLock(int col) {
        return col >= frozenColumns;
    }
}
