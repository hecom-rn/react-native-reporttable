package com.hecom.reporttable.table.deserializer;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import android.content.Context;

import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.CellConfig;

import java.lang.reflect.Type;

/**
 * Created by kevin.bai on 2023/5/18.
 */
public class CellConfigDeserializer implements JsonDeserializer<CellConfig> {

    Context context;

    public CellConfigDeserializer(Context context) {
        this.context = context;
    }

    @Override
    public CellConfig deserialize(JsonElement jsonStr, Type typeOfT,
                                  JsonDeserializationContext context) throws JsonParseException {
        JsonObject json = jsonStr.getAsJsonObject();
        CellConfig config = new CellConfig();
        if (json.has("minWidth")) {
            config.setMinWidth(DensityUtils.dp2px(this.context, json.get("minWidth").getAsInt()));
        }
        if (json.has("maxWidth")) {
            config.setMaxWidth(DensityUtils.dp2px(this.context, json.get("maxWidth").getAsInt()));
        }
        return config;
    }
}