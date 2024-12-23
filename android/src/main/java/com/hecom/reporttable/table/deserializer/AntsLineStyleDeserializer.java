package com.hecom.reporttable.table.deserializer;

import com.google.gson.JsonArray;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import android.content.Context;
import android.graphics.Color;

import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.ProgressStyle;

import java.lang.reflect.Type;

/**
 * Created by kevin.bai on 2024/4/22.
 */
public class AntsLineStyleDeserializer implements JsonDeserializer<ProgressStyle.AntsLineStyle> {
    Context context;

    public AntsLineStyleDeserializer(Context context) {
        this.context = context;
    }

    @Override
    public ProgressStyle.AntsLineStyle deserialize(JsonElement jsonStr, Type typeOfT,
                                                   JsonDeserializationContext context) throws JsonParseException {
        JsonObject json = jsonStr.getAsJsonObject();
        ProgressStyle.AntsLineStyle style = new ProgressStyle.AntsLineStyle();
        if (json.has("color")) {
            style.setColor(Color.parseColor(json.get("color").getAsString()));
        }
        if (json.has("lineWidth")) {
            style.setWidth(DensityUtils.dp2px(this.context, json.get("lineWidth").getAsFloat()));
        }
        if (json.has("lineDashPattern")) {
            JsonArray colors = json.get("lineDashPattern").getAsJsonArray();
            float[] pattern = new float[colors.size()];
            for (int i = 0; i < colors.size(); i++) {
                pattern[i] = DensityUtils.dp2px(this.context, colors.get(i).getAsFloat());
            }
            style.setDashPattern(pattern);
        }
        if (json.has("lineRatio")) {
            style.setRatio(json.get("lineRatio").getAsFloat());
        }
        return style;
    }
}
