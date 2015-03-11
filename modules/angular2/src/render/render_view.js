import { FINAL } from 'angular2/src/facade/lang';

export class RenderView {
  rootNodes:List;
  boundElements:List;
  textNodes:List;
  componentViews:List<RenderView>;
  viewContainers:List<ViewContainer>;

  constructor(rootNodes:List, boundElements:List, textNodes:List, viewContainers:List<ViewContainer>) {
    this.rootNodes = rootNodes;
    this.boundElements = boundElements;
    this.textNodes = textNodes;
    this.componentViews = [];
    this.viewContainers = viewContainers;
  }

  // TODO: call this method from the renderer
  addComponentChildView(boundElementIndex:number, view:RenderView) {
    // TODO: create a shadowRoot and append the View to it...
    ListWrapper.push(this.componentViews, view);
  }

  // TODO: call this method from the renderer
  setElementProperty(boundElementIndex:number, property:string, value) {
    // TODO: Use the DomFacade
  }

  // TODO: call this method from the renderer
  setText(boundTextNodeIndex:number, value:string) {
    // TODO: Use the DomFacade
    this.textNodes[boundTextNodeIndex].text = value;
  }
}
