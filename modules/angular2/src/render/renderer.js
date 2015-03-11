export class Renderer {
  change():ChangeBuilder {}
}

class ChangeBuilder {
  createView(protoViewId, viewId):ViewRenderer {}
  updateView(viewId):ViewRenderer {}
  destroyView(viewId) {}

  // Note: this promise is important, as
  // the ViewPool can't mark a view as reusable until
  // all animations are done on that view!
  execute():Promise {}
}

class ViewRender {
  updateBoundElement(boundElementIndex):ElementRenderer {}
  updateText(boundTextNodeIndex, value:string) {}
  updateViewContainer(viewContainerIndex):ViewContainerRenderer {}
}

class ElementRenderer {
  setProperty(propertyName, value) {}
  setComponentView(viewId):ViewRenderer {}
}

class ViewContainerRenderer {
  addView(viewId) {}
  // TODO add, remove, move, ...
  // RenderViewContainer.remove: needs to be recursive...
}
