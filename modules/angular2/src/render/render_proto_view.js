export class RenderProtoView {
  // Create a rootView as if the compiler encountered <rootcmp></rootcmp>,
  // and the component template is already compiled into protoView.
  // Used for bootstrapping.
  static createRootProtoView(
    protoView: RenderProtoView,
    insertionElement
  ): RenderProtoView {
    DOM.addClass(insertionElement, NG_BINDING_CLASS);
    var rootProtoView = new RenderProtoView(insertionElement);
    rootProtoView.instantiateInPlace = true;
    rootProtoView.bindElement();
    return rootProtoView;
  }

  @FINAL()
  rootElement;
  @FINAL()
  elementBinders:List<RenderElementBinder>;
  @FINAL()
  instantiateInPlace:boolean;
  @FINAL()
  rootBindingOffset:int;
  @FINAL()
  isTemplateElement:boolean;

  constructor(rootElement, elementBinders:List<RenderElementBinder>, instantiateInPlace:boolean) {
    this.rootElement = rootElement;
    this.elementBinders = [];
    this.instantiateInPlace = false;
    this.rootBindingOffset = (isPresent(this.rootElement) && DOM.hasClass(this.rootElement, NG_BINDING_CLASS))
      ? 1 : 0;
    this.isTemplateElement = DOM.isTemplateElement(this.rootElement);
  }
}
