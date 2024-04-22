package com.hecom.reporttable;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import android.content.Context;

import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.deserializer.CellConfigDeserializer;
import com.hecom.reporttable.table.deserializer.CellDeserializer;
import com.hecom.reporttable.table.deserializer.IconDeserializer;

/**
 * Description : Created on 2023/5/12.
 */
public class GsonHelper {

    private static Gson mGson;

    public static void initGson(Context context) {
        if (mGson != null) {
            return;
        }
        mGson = new GsonBuilder()
                .registerTypeAdapter(Cell.Icon.class, new IconDeserializer(context))
                .registerTypeAdapter(Cell.class, new CellDeserializer(context))
                .registerTypeAdapter(CellConfig.class, new CellConfigDeserializer(context))
                .create();
    }

    public static Gson getGson() {
        return mGson;
    }

}
