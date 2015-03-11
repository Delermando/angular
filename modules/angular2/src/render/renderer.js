export class Renderer {
  createView(protoViewId, viewId):ViewRenderer {}

  updateView(viewId):ViewRenderer {}
  commit() {}
}

class ViewRender {
  updateBoundElement(boundElementIndex):ElementRenderer {}
  updateText(boundTextNodeIndex, value:string) {}
  updateViewContainer(viewContainerIndex):ViewContainerRenderer {}
  commit() {}
}

class ElementRenderer {
  setProperty(propertyName, value) {}
  setComponentView(viewId):ViewRenderer {}
  commit() {}
}

class ViewContainerRenderer {
  addView(viewId) {}
  // TODO add, remove, move, ...
  // RenderViewContainer.remove: needs to be recursive...
  commit() {}
}
