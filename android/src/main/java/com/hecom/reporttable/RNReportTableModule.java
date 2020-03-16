
package com.hecom.reporttable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactMethod;
import com.hecom.reporttable.RNReportTableManager;
import com.facebook.react.bridge.UiThreadUtil;

public class RNReportTableModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  public RNReportTableModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "ReportTable";
  }


  @ReactMethod
  public void setReportData(String data){
    android.widget.Toast.makeText(reactContext, data, android.widget.Toast.LENGTH_SHORT).show();
  }

  @ReactMethod
  public void setFreeze(String freeze){

      if("0".equals(freeze)){ //冻猪

        try{
          UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
              RNReportTableManager.reportTableConfig.getTable().getConfig().setFixedXSequence(true);
              RNReportTableManager.reportTableConfig.getTable().invalidate();
            }
          });
        }catch (Exception e){
        }
      }else if("1".equals(freeze)){
        try{
          UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
              RNReportTableManager.reportTableConfig.getTable().getConfig().setFixedXSequence(true);
              RNReportTableManager.reportTableConfig.getTable().invalidate();
            }
          });
        }catch (Exception e){
        }
      }
  }
}
