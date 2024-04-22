package com.hecom.reporttable.table.deserializer;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import android.content.Context;

import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.Cell;

import java.lang.reflect.Type;

/**
 * Created by kevin.bai on 2024/4/22.
 */
public class IconDeserializer implements JsonDeserializer<Cell.Icon> {
    Context context;

    public IconDeserializer(Context context) {
        this.context = context;
    }

    @Override
    public Cell.Icon deserialize(JsonElement jsonStr, Type typeOfT,
                                 JsonDeserializationContext context) throws JsonParseException {
        JsonObject json = jsonStr.getAsJsonObject();
        Cell.Icon icon = new Cell.Icon();
        if (json.has("name")) {
            icon.setName(json.get("name").getAsString());
        }
        if (json.has("width")) {
            icon.setWidth(DensityUtils.dp2px(this.context, json.get("width").getAsInt()));
        }
        if (json.has("height")) {
            icon.setHeight(DensityUtils.dp2px(this.context, json.get("height").getAsInt()));
        }
        icon.update();
        return icon;
    }
}
