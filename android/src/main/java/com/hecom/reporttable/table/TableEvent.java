package com.hecom.reporttable.table;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.hecom.reporttable.BuildConfig;

/**
 * Unified event class for both Paper and Fabric architectures.
 *
 * Paper: uses dispatch() → RCTEventEmitter.receiveEvent(name, data)
 *        event name includes "top" prefix (e.g., "topOnContentSize")
 *
 * Fabric: uses getEventName() directly
 *         event name must match the JS prop name from the Codegen spec
 *         (e.g., "onContentSize")
 */
public class TableEvent extends Event<TableEvent> {
    private final WritableMap map;
    private final String mPaperEventName;

    public TableEvent(
            int surfaceId,
            int viewId,
            String eventName,
            WritableMap map) {
        super(surfaceId, viewId);
        this.mPaperEventName = eventName;
        this.map = map;
    }

    @Override
    public String getEventName() {
        // Fabric path: return the JS event name (matching Codegen spec)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            return paperToFabricEventName(mPaperEventName);
        }
        // Paper path: use the "top"-prefixed name
        return mPaperEventName;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        // Paper path only — always use the Paper event name with "top" prefix
        rctEventEmitter.receiveEvent(getViewTag(), mPaperEventName, getEventData());
    }

    protected WritableMap getEventData() {
        return this.map;
    }

    /**
     * Maps Paper "top"-prefixed event names to Codegen-compliant JS event names.
     */
    private static String paperToFabricEventName(String paperName) {
        switch (paperName) {
            case "topClickOnItem":
                return "onClickEvent";
            case "topOnScrollEnd":
                return "onScrollEnd";
            case "topOnScroll":
                return "onScroll";
            case "topOnContentSize":
                return "onContentSize";
            default:
                return paperName;
        }
    }
}
