package com.hecom.reporttable.table.deserializer;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.reflect.TypeToken;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Paint;

import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.bean.ExtraText;
import com.hecom.reporttable.table.bean.ProgressStyle;

import java.lang.reflect.Type;
import java.util.ArrayList;

/**
 * Created by kevin.bai on 2023/5/18.
 */
public class CellDeserializer implements JsonDeserializer<Cell> {

    Context context;

    public CellDeserializer(Context context) {
        this.context = context;
    }

    @Override
    public Cell deserialize(JsonElement jsonStr, Type typeOfT,
                            JsonDeserializationContext context) throws JsonParseException {
        JsonObject json = jsonStr.getAsJsonObject();
        Cell cell = new Cell();
        if (json.has("keyIndex")) {
            cell.setKeyIndex(json.get("keyIndex").getAsInt());
        }
        if (json.has("title")) {
            cell.setTitle(json.get("title").getAsString());
        }
        if (json.has("richText")) {
            cell.setRichText(context.<ArrayList<Cell.RichText>>deserialize(json.get("richText"),
                    new TypeToken<ArrayList<Cell.RichText>>() {
                    }.getType()));
        }
        if (json.has("backgroundColor")) {
            cell.setBackgroundColor(Color.parseColor(json.get("backgroundColor").getAsString()));
        }
        if (json.has("fontSize")) {
            cell.setFontSize(DensityUtils.dp2px(this.context, json.get("fontSize").getAsInt()));
        }

        if (json.has("textColor")) {
            cell.setTextColor(Color.parseColor(json.get("textColor").getAsString()));
        }

        if (json.has("textAlignment")) {
            int textAlignment = json.get("textAlignment").getAsInt();
            Paint.Align align = textAlignment == 1 ? Paint.Align.CENTER :
                    textAlignment == 2 ? Paint.Align.RIGHT : Paint.Align.LEFT;
            cell.setTextAlignment(align);
        }
        if (json.has("icon")) {
            cell.setIcon(context.<Cell.Icon>deserialize(json.get("icon"), Cell.Icon.class));
        }
        if (json.has("isOverstriking")) {
            cell.setOverstriking(json.get("isOverstriking").getAsBoolean());
        }
        if (json.has("isForbidden")) {
            cell.setForbidden(json.get("isForbidden").getAsBoolean());
        }
        if (json.has("classificationLinePosition")) {
            cell.setClassificationLinePosition(json.get("classificationLinePosition").getAsInt());
        }

        if (json.has("classificationLineColor")) {
            cell.setClassificationLineColor(Color.parseColor(json.get("classificationLineColor")
                    .getAsString()));
        }
        if (json.has("boxLineColor")) {
            cell.setBoxLineColor(Color.parseColor(json.get("boxLineColor").getAsString()));
        }
        if (json.has("strikethrough")) {
            cell.setStrikethrough(json.get("strikethrough").getAsBoolean());
        }
        if (json.has("textPaddingLeft")) {
            cell.setTextPaddingLeft(DensityUtils.dp2px(this.context, json.get("textPaddingLeft").getAsInt()));
        }
        if (json.has("textPaddingRight")) {
            cell.setTextPaddingRight(DensityUtils.dp2px(this.context, json.get("textPaddingRight").getAsInt()));
        }
        if (json.has("textPaddingHorizontal")) {
            cell.setTextPaddingHorizontal(DensityUtils.dp2px(this.context, json.get("textPaddingHorizontal").getAsInt()));
        }
        if (json.has("extraText")) {
            cell.setExtraText(context.<ExtraText>deserialize(json.get("extraText"),
                    ExtraText.class));
        }
        if (json.has("progressStyle")) {
            cell.setProgressStyle(context.<ProgressStyle>deserialize(json.get("progressStyle"),
                    ProgressStyle.class));
        }
        return cell;
    }
}