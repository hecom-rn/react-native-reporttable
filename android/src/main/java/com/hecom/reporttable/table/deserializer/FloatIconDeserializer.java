package com.hecom.reporttable.table.deserializer;

import android.content.Context;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.Cell;

import java.lang.reflect.Type;

/**
 * Created by kevin.bai on 2024/4/22.
 */
public class FloatIconDeserializer extends IconDeserializer {
    Context context;

    public FloatIconDeserializer(Context context) {
        super(context);
        this.context = context;
    }

    @Override
    public Cell.FloatIcon deserialize(JsonElement jsonStr, Type typeOfT,
                                 JsonDeserializationContext context) throws JsonParseException {
        Cell.Icon icon = super.deserialize(jsonStr, typeOfT, context);
        Cell.FloatIcon floatIcon = new Cell.FloatIcon();
        floatIcon.name = icon.name;
        floatIcon.setWidth(icon.getWidth());
        floatIcon.setHeight(icon.getHeight());
        floatIcon.setDirection(icon.getDirection());
        floatIcon.setPath(icon.getPath());

        JsonObject json = jsonStr.getAsJsonObject();
        if (json.has("top")) {
            floatIcon.setTop(DensityUtils.dp2px(this.context, json.get("top").getAsInt()));
        }
        if (json.has("bottom")) {
            floatIcon.setBottom(DensityUtils.dp2px(this.context, json.get("bottom").getAsInt()));
        }
        if (json.has("left")) {
            floatIcon.setLeft(DensityUtils.dp2px(this.context, json.get("left").getAsInt()));
        }
        if (json.has("right")) {
            floatIcon.setRight(DensityUtils.dp2px(this.context, json.get("right").getAsInt()));
        }


        return floatIcon;
    }
}
