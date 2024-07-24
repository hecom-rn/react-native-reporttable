package com.hecom.reporttable.table.deserializer;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Log;

import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.Cell;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.net.URL;

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

        // 1表示靠左，2表示居中，3表示靠右（默认靠右）
        if (json.has("imageAlignment")) {
            int position = json.get("imageAlignment").getAsInt();
            if (position == 1) {
                icon.setDirection(Cell.Icon.LEFT);
            } else if (position == 2 || position == 3) {
                icon.setDirection(Cell.Icon.RIGHT);
            }
        }

        if (json.has("path")) {
            JsonObject obj = json.get("path").getAsJsonObject();
            boolean __packager_asset = obj.get("__packager_asset").getAsBoolean();
            int width = obj.get("width").getAsInt();
            int height = obj.get("height").getAsInt();
            String scale = obj.get("scale").getAsString();
            String uri = obj.get("uri").getAsString();
            Cell.Path path = new Cell.Path();
            path.setWidth(width);
            path.setHeight(height);
            path.setScale(scale);
            path.setUri(uri);
            path.set__packager_asset(__packager_asset);
            icon.setPath(path);
        }

        return icon;
    }
}
