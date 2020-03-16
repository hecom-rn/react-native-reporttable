package com.hecom.reporttable.form.data.format.selected;

import android.graphics.Canvas;
import android.graphics.Rect;

import com.hecom.reporttable.form.core.TableConfig;


/**
 * Created by huang on 2018/1/18.
 */

public interface IDrawOver {

     void draw(Canvas canvas, Rect scaleRect, Rect showRect, TableConfig config);
}
