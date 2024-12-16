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
public class ProgressStyleDeserializer implements JsonDeserializer<ProgressStyle> {
    Context context;

    public ProgressStyleDeserializer(Context context) {
        this.context = context;
    }

    @Override
    public ProgressStyle deserialize(JsonElement jsonStr, Type typeOfT,
                                     JsonDeserializationContext context) throws JsonParseException {
        JsonObject json = jsonStr.getAsJsonObject();
        ProgressStyle style = new ProgressStyle();
        if (json.has("colors")) {
            JsonArray colors = json.get("colors").getAsJsonArray();
            int[] colorArr = new int[colors.size()];
            for (int i = 0; i < colors.size(); i++) {
                colorArr[i] = Color.parseColor(colors.get(i).getAsString());
            }
            style.setColors(colorArr);
        }
        if (json.has("height")) {
            style.setHeight(DensityUtils.dp2px(this.context, json.get("height").getAsFloat()));
        }
        if (json.has("cornerRadius")) {
            style.setRadius(DensityUtils.dp2px(this.context, json.get("cornerRadius")
                    .getAsFloat()));
        }
        if (json.has("marginHorizontal")) {
            style.setMarginHorizontal(DensityUtils.dp2px(this.context, json.get("marginHorizontal")
                    .getAsFloat()));
        }
        if (json.has("startRatio")) {
            style.setStartRatio(json.get("startRatio").getAsFloat());
        }
        if (json.has("endRatio")) {
            style.setEndRatio(json.get("endRatio").getAsFloat());
        }
        if (json.has("antsLineStyle")) {
            style.setAntsLineStyle(context.<ProgressStyle.AntsLineStyle>deserialize(json.get(
                    "antsLineStyle"),
                    ProgressStyle.AntsLineStyle.class));
        }

        return style;
    }
}
