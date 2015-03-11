
export class RenderProtoViewBuilder {
  elementBinders:List<RenderElementBinder>;
  instantiateInPlace:boolean;
  rootElement;

  constructor(rootElement) {
    this.rootElement = rootElement;
    this.elementBinders = [];
    this.instantiateInPlace = false;
  }

  instantiateInPlace() {
    this.instantiateInPlace = true;
  }

  bindElement(nestedProtoView):RenderElementBinder {
    var elBinder = new RenderElementBinder(nestedProtoView);
    ListWrapper.push(this.elementBinders, elBinder);
    return elBinder;
  }

  /**
   * Adds a text node binding for the last created ElementBinder via bindElement
   */
  bindTextNode(indexInParent:int) {
    var elBinder = this.elementBinders[this.elementBinders.length-1];
    if (isBlank(elBinder.textNodeIndices)) {
      elBinder.textNodeIndices = ListWrapper.create();
    }
    ListWrapper.push(elBinder.textNodeIndices, indexInParent);
  }

  build():RenderProtoView {
    return new RenderProtoView(this.rootElement, this.elementBinders, this.instantiateInPlace);
  }
}
