import { webview } from "@kit.ArkWeb";
import { VTableOnEvent } from "../interface";
import { VTableController } from "../util/VTableController";

@Component
export struct VTable {
  @ObjectLink controller: VTableController;
  private ports: webview.WebMessagePort[] = [];
  private webController: webview.WebviewController = new webview.WebviewController();
  private receivedFromHtml: string = '';
  @Prop option: Record<string, Object> = {};
  @Prop onEvent: VTableOnEvent = {};

  aboutToAppear() {
    if (this.controller !== undefined) {
      this.controller.initController(this.webController);
      this.controller.tableOnEvent = this.onEvent;
    }
  }

  build() {
    Column() {
      Web({
        src: $rawfile('index.html'),
        controller: this.webController
      })
        .javaScriptProxy({
          object: this.controller,
          name: 'vTableController',
          methodList: [],
          controller: this.webController,
          asyncMethodList: []
        })
        .size({ width: '100%', height: '100%' })
        .horizontalScrollBarAccess(false)
        .verticalScrollBarAccess(false)
        .onPageEnd(() => {
          try {
            this.controller.initTable(this.option)
            this.ports = this.webController.createWebMessagePorts();
            this.ports[1].onMessageEvent((result: webview.WebMessage) => {
              let msg = '';
              if (typeof (result) == "string") {
                console.info("======received string message from html5, string is:" + result);
                msg = msg + result;
              } else {
                console.info("======not support");
              }
              this.receivedFromHtml = msg;
              this.controller.emitCallback(JSON.stringify(result))
              console.log("======receivedFromHtml:" + this.receivedFromHtml);
            })
            this.webController.postMessage('__init_port__', [this.ports[0]], '*');
          } catch (error) {
            console.error(`ErrorCode: ${(error as BusinessError).code},  Message: ${(error as BusinessError).message}`);
          }
        })
    }
    .width('100%')
    .height('100%')
  }
}