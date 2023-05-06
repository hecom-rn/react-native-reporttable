package com.hecom.reporttable.form.data.format.draw;

import android.graphics.Canvas;
import android.graphics.Rect;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;


/**
 * Created by huang on 2017/10/30.
 * 左上角格式化
 */

public abstract class LeftTopDrawFormat extends ImageResDrawFormat<String> {


    public LeftTopDrawFormat() {
        super(20, 20);
    }

    @Override
    protected int getResourceID(String s, String value, int position) {
        return getResourceID();
    }

    protected abstract int getResourceID();

   public void setImageSize(int w,int h){
       setImageWidth(w);
       setImageHeight(h);
   }


    @Override
    public float draw(Canvas c, Rect rect, CellInfo<String> cellInfo , TableConfig config) {
       //为了保持三角形不变形，不跟随缩放
       float zoom = config.getZoom();
        config.setZoom(zoom>1?1:zoom);
        super.draw(c,  rect, cellInfo, config);
        config.setZoom(zoom);
        return 0;
    }
}
