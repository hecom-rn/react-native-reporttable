package com.hecom.reporttable.form.data.format.draw;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.style.ReplacementSpan;

/**
 * Description :
 * Created on 2023/11/30.
 */
public class RadiusBackgroundSpan  extends ReplacementSpan {
   private int backgroundColor;
   private int cornerRadius;

   public RadiusBackgroundSpan(int backgroundColor, int cornerRadius) {
      this.backgroundColor = backgroundColor;
      this.cornerRadius = cornerRadius;
   }

   @Override
   public int getSize(Paint paint, CharSequence text, int start, int end, Paint.FontMetricsInt fm) {
      return Math.round(paint.measureText(text, start, end));
   }

   @Override
   public void draw(Canvas canvas, CharSequence text, int start, int end, float x, int top, int y, int bottom, Paint paint) {
      // 保存原始画笔颜色和样式
      int originalColor = paint.getColor();
      Paint.Style originalStyle = paint.getStyle();

      // 绘制圆角矩形背景
      paint.setColor(backgroundColor);
      paint.setStyle(Paint.Style.FILL);
      RectF rect = new RectF(x, top, x + paint.measureText(text, start, end), bottom);
      canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint);

      // 绘制文字
      paint.setColor(originalColor);
      paint.setStyle(originalStyle);
      canvas.drawText(text, start, end, x, y, paint);
   }
}