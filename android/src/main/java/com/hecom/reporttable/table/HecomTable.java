package com.hecom.reporttable.table;

import android.util.AttributeSet;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.table.ArrayTableData;
import com.hecom.reporttable.form.listener.OnMeasureListener;
import com.hecom.reporttable.form.listener.OnTableChangeListener;
import com.hecom.reporttable.form.matrix.MatrixHelper;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.format.BackgroundFormat;
import com.hecom.reporttable.table.format.CellDrawFormat;
import com.hecom.reporttable.table.format.HecomFormat;
import com.hecom.reporttable.table.format.HecomGridFormat;
import com.hecom.reporttable.table.format.HecomStyle;
import com.hecom.reporttable.table.format.ShadowDrawOver;
import com.hecom.reporttable.table.lock.LockHelper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * 基于SmartTable定制的表格组件
 * <p>
 * 针对SmartTable的设置代码尽量封装在这里
 * <p>
 */
public class HecomTable extends SmartTable<Cell> {
    private ClickHandler mClickHandler;

    public LockHelper mLockHelper;

    private TableConfigBean lastConfigBean;
    private String lastJson;

    public HecomTable(ThemedReactContext context) {
        super(context);
        init(context);
    }

    public HecomTable(ThemedReactContext context, AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    public HecomTable(ThemedReactContext context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context);
    }

    private void init(final ThemedReactContext context) {
        mClickHandler = new ClickHandler(this);
        mLockHelper = new LockHelper(this);
        mClickHandler.setLocker(mLockHelper);
        getConfig().setVerticalPadding(DensityUtils.dp2px(getContext(), 4))
                .setShowTableTitle(false).setShowColumnTitle(false).setShowXSequence(false)
                .setShowYSequence(false);
        getConfig().setTableGridFormat(new HecomGridFormat(this));
        getConfig().setContentCellBackgroundFormat(new BackgroundFormat(this));

        setZoom(true, 2, 0.5f);

        final OnTableChangeListener listener = getMatrixHelper().getOnTableChangeListener();

        getProvider().setDrawOver(new ShadowDrawOver(this));

        getMatrixHelper().setOnTableChangeListener(new OnTableChangeListener() {
            @Override
            public void onTableChanged(float scale, float translateX, float translateY) {
                listener.onTableChanged(scale, translateX, translateY);
                WritableMap map = Arguments.createMap();
                map.putDouble("translateX", translateX);
                map.putDouble("translateY", translateY);
                map.putDouble("scale", scale);
                context.getJSModule(RCTEventEmitter.class)
                        .receiveEvent(getId(), "onScroll", map);
                MatrixHelper mh = getMatrixHelper();
                boolean notBottom = (mh.getZoomRect().bottom - mh.getOriginalRect().bottom) > 0;
                if (!notBottom) {
                    (context).getJSModule(RCTEventEmitter.class)
                            .receiveEvent(getId(), "onScrollEnd", null);
                }
            }
        });
        getMeasurer().setOnMeasureListener(new OnMeasureListener() {
            @Override
            public void onContentSizeChanged(float width, float height) {
                float widthDp = DensityUtils.px2dp(getContext(), width);
                float heightDp = DensityUtils.px2dp(getContext(), height);
                WritableMap map = Arguments.createMap();
                map.putDouble("width", widthDp);
                map.putDouble("height", heightDp);
                context.getJSModule(RCTEventEmitter.class)
                        .receiveEvent(getId(), "onContentSize", map);
            }

            @Override
            public void onDidLayout() {
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("tableDidLayout", "tableDidLayout");
            }
        });
    }

    private HecomStyle hecomStyle;

    public void setHecomStyle(HecomStyle hecomStyle) {
        this.hecomStyle = hecomStyle;
        getConfig().setContentStyle(hecomStyle);
        getConfig().setHorizontalPadding(hecomStyle.getPaddingHorizontal());
    }

    public HecomStyle getHecomStyle() {
        return hecomStyle;
    }

    public int getMaxColumnWidth(Column<Cell> column) {
        CellConfig config = lastConfigBean.getColumnConfigMap().get(column.getColumn());
        if (config != null && config.getMaxWidth() > 0) {
            return config.getMaxWidth();
        }
        return lastConfigBean.getMaxWidth();
    }


    private void setDataInMainThread(String json,
                                     final TableConfigBean configBean) {
        try {
            final HecomTableData rawTableData = (HecomTableData) getTableData();
            final HecomTableData tableData = HecomTableData.create(json,

                    new HecomFormat(), new CellDrawFormat(this, mLockHelper));
            tableData.setLimit(configBean);
            tableData.setOnItemClickListener(mClickHandler);


            int arrayColumnSize = tableData.getColumns().size();
            for (int i = 0; i < mLockHelper.getFrozenColumns() && i < arrayColumnSize; i++) {
                tableData.getColumns().get(i).setFixed(true);
            }

            if (rawTableData != null) {
                for (int i = 0; i < arrayColumnSize; i++) {
                    if (rawTableData.getArrayColumns() != null &&
                            rawTableData.getArrayColumns().size() > i) {
                        Column<Cell> column = rawTableData.getArrayColumns().get(i);
                        if (column.isFixed()) {
                            tableData.getArrayColumns().get(i).setFixed(true);
                        }
                    }
                }
            }
            setTableData(tableData);
            mLockHelper.update();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void updateData(String data, int x, int y) {
        HecomTableData tableData = (HecomTableData) getTableData();
        Cell[][] newData = ArrayTableData.transformColumnArray(HecomTableData.initData(data));
        List<Column> list = new ArrayList<>(tableData.getColumns());
        Collections.sort(list, new Comparator<Column>() {
            @Override
            public int compare(Column o1, Column o2) {
                return o1.getColumn() - o2.getColumn();
            }
        });

        for (int i = 0; i < newData.length; i++) {
            int col = i + y;
            for (int j = 0; j < newData[i].length; j++) {
                int row = j + x;
                Cell newCell = newData[i][j];
                Column column = list.get(col);
                if (row < column.getDatas().size() && col < list.size()) {
                    Cell cell = (Cell) column.getDatas().get(row);
                    cell.merge(newCell);
                }
            }
        }
        notifyDataChanged();
    }

    public void setData(final String json,
                        final TableConfigBean configBean) {
        if (json == null) {
            return;
        }
        try {
            //横竖屏切换
            if (!json.equals(lastJson)) {
                lastJson = json;
                lastConfigBean = configBean;
                Runnable runnable = new Runnable() {
                    @Override
                    public void run() {
                        setDataInMainThread(json, configBean);
                    }
                };
                getIsNotifying().set(true);
                getmExecutor().execute(runnable);
            } else if (configChanged(configBean)) {
                lastConfigBean = configBean;
                HecomTableData tableData = (HecomTableData) getTableData();
                tableData.setLimit(configBean);
                setTableData(tableData);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private boolean configChanged(TableConfigBean configBean) {
        return lastConfigBean == null
                || lastConfigBean.getMinWidth() != configBean.getMinWidth()
                || lastConfigBean.getMaxWidth() != configBean.getMaxWidth();
    }

    public LockHelper getLockHelper() {
        return mLockHelper;
    }

}
