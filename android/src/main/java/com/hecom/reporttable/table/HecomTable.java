package com.hecom.reporttable.table;

import android.content.Context;
import android.util.AttributeSet;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.listener.OnMeasureListener;
import com.hecom.reporttable.form.listener.OnTableChangeListener;
import com.hecom.reporttable.form.matrix.MatrixHelper;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.format.BackgroundFormat;
import com.hecom.reporttable.table.format.CellDrawFormat;
import com.hecom.reporttable.table.format.HecomFormat;
import com.hecom.reporttable.table.format.HecomGridFormat;
import com.hecom.reporttable.table.lock.LockHelper;

/**
 * 基于SmartTable定制的表格组件
 * <p>
 * 针对SmartTable的设置代码尽量封装在这里
 * <p>
 * Created by kevin.bai on 2024/2/2. 由于目前很多外挂的数据都保存在ReportTableStore中，而ReportTableStore之前是单例的，
 * 导致如果出现多个表格实例会有串数据的情况，暂时将ReportTableStore放到表格中
 */
public class HecomTable extends SmartTable<JsonTableBean> {
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
        getConfig().setVerticalPadding(getConfig().dp4)
                .setShowTableTitle(false).setShowColumnTitle(false).setShowXSequence(false)
                .setShowYSequence(false);
        getConfig().setTableGridFormat(new HecomGridFormat(this));
        getConfig().setContentCellBackgroundFormat(new BackgroundFormat(this));

        setZoom(true, 2, 0.5f);

        final OnTableChangeListener listener = getMatrixHelper().getOnTableChangeListener();

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

    private ItemCommonStyleConfig itemCommonStyleConfig = new ItemCommonStyleConfig();

    public ItemCommonStyleConfig getItemCommonStyleConfig() {
        return itemCommonStyleConfig;
    }

    public void setItemCommonStyleConfig(ItemCommonStyleConfig itemCommonStyleConfig) {
        this.itemCommonStyleConfig = itemCommonStyleConfig;
        getConfig().setHorizontalPadding(DensityUtils.dp2px(getContext(),
                itemCommonStyleConfig.getTextPaddingHorizontal()));
    }


    private void setDataInMainThread(String json,
                                     final TableConfigBean configBean) {

        final HecomTableData rawTableData = (HecomTableData) getTableData();
        int minWidth = configBean.getMinWidth();
        int maxWidth = configBean.getMaxWidth();
        int minHeight = configBean.getMinHeight();
        Context context = getContext();
        try {

            final HecomTableData tableData = HecomTableData.create(json,
                    getItemCommonStyleConfig(),
                    new HecomFormat(), new CellDrawFormat(this, mLockHelper));

            tableData.setWidthLimit(DensityUtils.dp2px(context, minWidth),
                    DensityUtils.dp2px(context, maxWidth), configBean.getColumnConfigMap());
            tableData.setMinHeight(DensityUtils.dp2px(context, minHeight));
            tableData.setOnItemClickListener(mClickHandler);


            int arrayColumnSize = tableData.getColumns().size();
            for (int i = 0; i < mLockHelper.getFrozenColumns() && i < arrayColumnSize; i++) {
                tableData.getColumns().get(i).setFixed(true);
            }

            if (rawTableData != null) {
                for (int i = 0; i < arrayColumnSize; i++) {
                    if (rawTableData.getArrayColumns() != null &&
                            rawTableData.getArrayColumns().size() > i) {
                        Column<JsonTableBean> column = rawTableData.getArrayColumns().get(i);
                        if (column.isFixed()) {
                            tableData.getArrayColumns().get(i).setFixed(true);
                        }
                    }
                }
            }
            setTableData(tableData);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void updateData(String data, int x, int y) {
        HecomTableData tableData = (HecomTableData) getTableData();
        tableData.updateData(data, x, y);
        setTableData(tableData);
    }

    public void setData(final String json,
                        final TableConfigBean configBean) {
        if (json == null) {
            return;
        }
        try {
            //横竖屏切换
            boolean configChanged = lastConfigBean == null
                    || lastConfigBean.getMinWidth() != configBean.getMinWidth()
                    || lastConfigBean.getMaxWidth() != configBean.getMaxWidth();
            boolean contentChanged = !json.equals(lastJson);
            if (contentChanged) {
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
            } else if (configChanged) {
                lastConfigBean = configBean;
                HecomTableData tableData = (HecomTableData) getTableData();
                tableData.setWidthLimit(DensityUtils.dp2px(getContext(),
                                configBean.getMinWidth()),
                        DensityUtils.dp2px(getContext(), configBean.getMaxWidth()),
                        configBean.getColumnConfigMap());
                setTableData(tableData);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public LockHelper getLockHelper() {
        return mLockHelper;
    }

}
