package com.hecom.reporttable.table.deserializer;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Paint;

import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.format.HecomStyle;

import java.lang.reflect.Type;

/**
 * Created by kevin.bai on 2023/5/18.
 */
public class HecomStyleDeserializer implements JsonDeserializer<HecomStyle> {

    Context context;

    public HecomStyleDeserializer(Context context) {
        this.context = context;
    }

    @Override
    public HecomStyle deserialize(JsonElement jsonStr, Type typeOfT,
                                  JsonDeserializationContext context) throws JsonParseException {
        JsonObject json = jsonStr.getAsJsonObject();
        HecomStyle config = new HecomStyle();
        // 颜色属性特殊处理，直接将字符串（#ffffff）转为int
        if (json.has("classificationLineColor")) {
            config.setLineColor(Color.parseColor(json.get("classificationLineColor")
                    .getAsString()));
        }

        // FIXME: 需要考虑提高扩展性，如何让其他属性自动使用通用处理，方便未来追加属性时可以自动处理
        if (json.has("backgroundColor")) {
            config.setBackgroundColor(Color.parseColor(json.get("backgroundColor").getAsString()));
        }
        if (json.has("textColor")) {
            config.setTextColor(Color.parseColor(json.get("textColor").getAsString()));
        }

        if (json.has("fontSize")) {
            config.setTextSize(DensityUtils.dp2px(this.context, json.get("fontSize").getAsInt()));
        }
        if (json.has("textPaddingHorizontal")) {
            config.setPaddingHorizontal(DensityUtils.dp2px(this.context,
                    json.get("textPaddingHorizontal").getAsInt()));
        }
        if (json.has("textAlignment")) {
            int textAlignment = json.get("textAlignment").getAsInt();
            Paint.Align align = textAlignment == 1 ? Paint.Align.CENTER :
                    textAlignment == 2 ? Paint.Align.RIGHT : Paint.Align.LEFT;
            config.setAlign(align);
        }
        if (json.has("isOverstriking")) {
            config.setOverstriking(json.get("isOverstriking").getAsBoolean());
        }
        return config;
    }
}