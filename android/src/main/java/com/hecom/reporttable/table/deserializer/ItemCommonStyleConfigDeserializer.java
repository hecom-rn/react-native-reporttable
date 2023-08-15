package com.hecom.reporttable.table.deserializer;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import android.graphics.Color;

import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;

import java.lang.reflect.Type;

/**
 * Created by kevin.bai on 2023/5/18.
 */
public class ItemCommonStyleConfigDeserializer implements JsonDeserializer<ItemCommonStyleConfig> {

    @Override
    public ItemCommonStyleConfig deserialize(JsonElement json, Type typeOfT,
                                             JsonDeserializationContext context) throws JsonParseException {
        JsonObject jsonObject = json.getAsJsonObject();
        ItemCommonStyleConfig config = new ItemCommonStyleConfig();
        // 颜色属性特殊处理，直接将字符串（#ffffff）转为int
        if (jsonObject.has("splitLineColor")) {
            config.setSplitLineColor(Color.parseColor(jsonObject.get("splitLineColor")
                    .getAsString()));
        }
        if (jsonObject.has("classificationLineColor")) {
            config.setClassificationLineColor(Color.parseColor(jsonObject.get("classificationLineColor")
                    .getAsString()));
        }

        // FIXME: 需要考虑提高扩展性，如何让其他属性自动使用通用处理，方便未来追加属性时可以自动处理
        if (jsonObject.has("backgroundColor")) {
            config.setBackgroundColor(jsonObject.get("backgroundColor").getAsString());
        }
        if (jsonObject.has("textColor")) {
            config.setTextColor(jsonObject.get("textColor").getAsString());
        }

        if (jsonObject.has("fontSize")) {
            config.setFontSize(jsonObject.get("fontSize").getAsInt());
        }
        if (jsonObject.has("textPaddingHorizontal")) {
            config.setTextPaddingHorizontal(jsonObject.get("textPaddingHorizontal").getAsInt());
        }
        if (jsonObject.has("textAlignment")) {
            config.setTextAlignment(jsonObject.get("textAlignment").getAsInt());
        }
        if (jsonObject.has("textAlignment")) {
            config.setOverstriking(jsonObject.get("textAlignment").getAsBoolean());
        }
        return config;
    }
}