package com.hecom.reporttable.table.deserializer;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import android.content.Context;
import android.graphics.Color;

import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.ExtraText;

import java.lang.reflect.Type;

/**
 * Created by kevin.bai on 2024/6/17.
 */
public class ExtraTextDeserializer implements JsonDeserializer<ExtraText> {
    @Override
    public ExtraText deserialize(JsonElement jsonStr, Type typeOfT,
                                 JsonDeserializationContext context) throws JsonParseException {
        JsonObject json = jsonStr.getAsJsonObject();
        ExtraText config = new ExtraText();
        if (json.has("text")) {
            config.text = json.get("text").getAsString();
        }
        if (json.has("isLeft")) {
            config.isLeft = json.get("isLeft").getAsBoolean();
        }
        if (json.has("style")) {
            config.style = context.deserialize(json.get("style"), ExtraText.Style.class);
        }
        if (json.has("backgroundStyle")) {
            config.backgroundStyle = context.deserialize(json.get("backgroundStyle"),
                    ExtraText.Style.class);
        }
        return config;
    }

    public static class StyleDeserializer implements JsonDeserializer<ExtraText.Style> {

        Context context;

        public StyleDeserializer(Context context) {
            this.context = context;
        }

        @Override
        public ExtraText.Style deserialize(JsonElement jsonStr, Type typeOfT,
                                           JsonDeserializationContext context) throws JsonParseException {
            JsonObject json = jsonStr.getAsJsonObject();
            ExtraText.Style style = new ExtraText.Style();
            if (json.has("color")) {
                style.color = Color.parseColor(json.get("color").getAsString());
            }
            if (json.has("width")) {
                style.width = DensityUtils.dp2px(this.context, json.get("width").getAsInt());
            }
            if (json.has("height")) {
                style.height = DensityUtils.dp2px(this.context, json.get("height").getAsInt());
            }
            if (json.has("fontSize")) {
                style.fontSize = DensityUtils.dp2px(this.context, json.get("fontSize").getAsInt());
            }
            if (json.has("radius")) {
                style.radius = DensityUtils.dp2px(this.context, json.get("radius").getAsInt());
            }
            return style;
        }
    }
}
