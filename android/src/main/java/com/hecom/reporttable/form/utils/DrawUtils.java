package com.hecom.reporttable.form.utils;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.NinePatch;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.Rect;
import android.os.Build;
import android.text.StaticLayout;
import android.text.TextPaint;

import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.style.FontStyle;

import androidx.annotation.RequiresApi;


/**
 * Created by huang on 2017/11/1.
 */


public class DrawUtils {

    private static final String TAG = "DrawUtils";

    public static int getTextHeight(FontStyle style, Paint paint) {
        style.fillPaint(paint);
        Paint.FontMetrics fontMetrics = paint.getFontMetrics();
        return (int) (fontMetrics.descent - fontMetrics.ascent);
    }

    public static int getTextHeight(Paint paint) {
        Paint.FontMetrics fontMetrics = paint.getFontMetrics();
        return (int) (fontMetrics.descent - fontMetrics.ascent);
    }

    public static float getTextCenterY(int centerY, Paint paint) {
        return centerY - ((paint.descent() + paint.ascent()) / 2);
    }

    public static float getTextCenterX(int left, int right, Paint paint) {
        Paint.Align align = paint.getTextAlign();
        if (align == Paint.Align.RIGHT) {
            return right;
        } else if (align == Paint.Align.LEFT) {
            return left;
        } else {
            return (right + left) / 2;
        }
    }

    public static boolean isMixRect(Rect rect, int left, int top, int right, int bottom) {

        return rect.bottom >= top && rect.right >= left && rect.top < bottom && rect.left < right;
    }

    public static boolean isClick(int left, int top, int right, int bottom, PointF clickPoint) {
        return clickPoint.x >= left && clickPoint.x <= right && clickPoint.y >= top && clickPoint.y <= bottom;
    }

    public static boolean isClick(Rect rect, PointF clickPoint) {
        return rect.contains((int) clickPoint.x, (int) clickPoint.y);
    }

    public static void fillBackground(Canvas canvas, int left, int top, int right, int bottom,
                                      int bgColor, Paint paint) {
        if (bgColor != TableConfig.INVALID_COLOR) {
            paint.setColor(bgColor);
            paint.setStyle(Paint.Style.FILL);
            canvas.drawRect(left, top, right, bottom, paint);
        }
    }

    public static boolean isMixHorizontalRect(Rect rect, int left, int right) {

        return rect.right >= left && rect.left <= right;
    }

    public static boolean isVerticalMixRect(Rect rect, int top, int bottom) {

        return rect.bottom >= top && rect.top <= bottom;
    }

    /**
     * 获取多行文字高度
     */
    public static int getMultiTextHeight(Paint paint, String[] values) {

        return getTextHeight(paint) * values.length;
    }

    /**
     * 获取多行文字宽度
     */
    public static int getMultiTextWidth(Paint paint, String[] values) {

        String longestString = findLongestString(values);
        int maxWidth = (int) paint.measureText(longestString);
        return maxWidth;
    }

    public static String findLongestString(String[] strings) {
        String longest = strings[0] == null ? "" : strings[0];
        for (int i = 1; i < strings.length; i++) {
            if (strings[i] != null && strings[i].length() > longest.length()) {
                longest = strings[i];
            }
        }
        return longest;
    }

    /**
     * 绘制.9图片
     *
     * @param canvas     画布
     * @param context    上下文
     * @param drawableID Res资源ID
     * @param rect       矩形
     */
    public static void drawPatch(Canvas canvas, Context context, int drawableID, Rect rect) {
        Bitmap bmp_9 = BitmapFactory.decodeResource(context.getResources(), drawableID);
        NinePatch ninePatch = new NinePatch(bmp_9, bmp_9.getNinePatchChunk(), null);
        ninePatch.draw(canvas, rect);
    }


    /**
     * 绘制多行文字
     */
    public static void drawMultiText(Canvas canvas, Paint paint, Rect rect, String[] values) {
        for (int i = 0; i < values.length; i++) {
            int centerY =
                    (int) ((rect.bottom + rect.top) / 2 + (values.length / 2f - i - 0.5) * getTextHeight(paint));
            canvas.drawText(values[values.length - i - 1], DrawUtils.getTextCenterX(rect.left,
                            rect.right, paint),
                    DrawUtils.getTextCenterY(centerY, paint), paint);
        }
    }

    /**
     * 绘制多行文字
     */
    @RequiresApi(api = Build.VERSION_CODES.M)
    public static void drawMultiText(Canvas canvas, Paint paint, Rect rect,
                                     CharSequence spannableString) {
        int saveCount = canvas.getSaveCount();
        canvas.save();
        StaticLayout.Builder builder = StaticLayout.Builder.obtain(spannableString, 0,
                spannableString.length(), new TextPaint(paint), rect.width());

        int dy = 0; // y 方向偏移量
        int dx = 0; // x 方向偏移量

        // 根据对齐方式计算偏移量
        switch (paint.getTextAlign()) {
            case LEFT: // 左对齐
                break;
            case CENTER: // 居中对齐
                dx = rect.centerX() - rect.left;
                break;
            case RIGHT: // 右对齐
                dx = rect.width();
                break;
        }
        StaticLayout staticLayout = builder.build();
        // 计算垂直居中的偏移量
        dy = (rect.height() - staticLayout.getHeight()) / 2;
        canvas.translate(rect.left + dx, rect.top + dy);

        // 绘制文本
        staticLayout.draw(canvas);
        canvas.restoreToCount(saveCount);
//        }
    }

    /**
     * 绘制单行文字
     */
    public static void drawSingleText(Canvas canvas, Paint paint, Rect rect, String value) {
        canvas.drawText(value, DrawUtils.getTextCenterX(rect.left, rect.right, paint),
                DrawUtils.getTextCenterY(rect.centerY(), paint), paint);
    }

}

