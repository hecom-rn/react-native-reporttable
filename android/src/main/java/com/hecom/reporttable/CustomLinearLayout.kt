package com.hecom.reporttable

import android.R.attr.textSize
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.tencent.kuikly.core.render.android.IKuiklyRenderExport
import com.tencent.kuikly.core.render.android.adapter.KuiklyRenderAdapterManager
import com.tencent.kuikly.core.render.android.css.ktx.toMap
import com.tencent.kuikly.core.render.android.expand.KuiklyRenderViewBaseDelegatorDelegate
import com.tencent.kuikly.core.render.android.expand.KuiklyRenderViewBaseDelegator
import org.json.JSONObject

class CustomLinearLayout constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
    kuiklyRenderViewBaseDelegator: KuiklyRenderViewBaseDelegator
) : LinearLayout(context, attrs, defStyleAttr) {

    public lateinit var id: Number
    public var kuiklyRenderViewDelegator: KuiklyRenderViewBaseDelegator =
        kuiklyRenderViewBaseDelegator

    init {
        val btn = Button(this.context).apply {
            text = "Hello Kotlin!"      // 设置文本
            textSize = 16f              // 字号（sp单位）
            setTextColor(Color.BLACK)   // 文字颜色
        }
        btn.setOnClickListener {
            var map: HashMap<String, Number> = HashMap<String, Number>()
            map.put("id", this.id)
            this.kuiklyRenderViewDelegator.sendEvent("event", map)
        }

// 添加至 LinearLayout
        this.addView(btn)
        this.kuiklyRenderViewDelegator?.onAttach(this, "", "routerbk", HashMap<String, Any>());
    }

}