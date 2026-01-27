package com.hecom.reporttable.table;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class TableEvent extends Event<TableEvent> {
    WritableMap map;
    String eventName = "";
    public TableEvent(
            int surfaceId,
            int viewId,
            String eventName,
            WritableMap map) {
        super(surfaceId, viewId);
        this.eventName = eventName;
        this.map = map;
    }

    @Override
    public String getEventName() {
        return this.eventName;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), getEventName(), getEventData());
    }

    protected WritableMap getEventData() {
        return this.map;
    }
}


