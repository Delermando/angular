// TODO(tbosch): make this configurable/smarter.
var VIEW_POOL_CAPACITY = 1;
var VIEW_POOL_PREFILL = 0;

export class RenderViewFactory {
  _viewPool: RenderViewPool;

  constructor() {
    this._viewPool = new RenderViewPool(VIEW_POOL_CAPACITY);
  }

  getView(protoView:RenderProtoView):View {
    if (this._viewPool.length() == 0) this._preFillPool();
    var view = this._viewPool.pop();
    return isPresent(view) ? view : this._instantiate(protoView);
  }

  returnView(view: RenderView) {
    this._viewPool.push(view);
  }

  _preFillPool(protoView:RenderProtoView) {
    for (var i = 0; i < VIEW_POOL_PREFILL; i++) {
      this._viewPool.push(this._instantiate(protoView));
    }
  }

  _instantiate(protoView:RenderProtoView) {
    var rootElementClone = protoView.instantiateInPlace ? protoView.rootElement : DOM.importIntoDoc(protoView.rootElement);
    var elementsWithBindingsDynamic;
    if (protoView.isTemplateElement) {
      elementsWithBindingsDynamic = DOM.querySelectorAll(DOM.content(rootElementClone), NG_BINDING_CLASS_SELECTOR);
    } else {
      elementsWithBindingsDynamic = DOM.getElementsByClassName(rootElementClone, NG_BINDING_CLASS);
    }

    var elementsWithBindings = ListWrapper.createFixedSize(elementsWithBindingsDynamic.length);
    for (var binderIdx = 0; binderIdx < elementsWithBindingsDynamic.length; ++binderIdx) {
      elementsWithBindings[binderIdx] = elementsWithBindingsDynamic[binderIdx];
    }

    var viewRootNodes;
    if (protoView.isTemplateElement) {
      var childNode = DOM.firstChild(DOM.content(rootElementClone));
      viewRootNodes = []; // TODO(perf): Should be fixed size, since we could pre-compute in in ProtoView
      // Note: An explicit loop is the fastest way to convert a DOM array into a JS array!
      while(childNode != null) {
        ListWrapper.push(viewRootNodes, childNode);
        childNode = DOM.nextSibling(childNode);
      }
    } else {
      viewRootNodes = [rootElementClone];
    }

    var binders = protoView.elementBinders;
    var textNodes = [];
    var boundElements = [];

    for (var binderIdx = 0; binderIdx < binders.length; binderIdx++) {
      var binder = binders[binderIdx];
      var element;
      if (binderIdx === 0 && protoView.rootBindingOffset === 1) {
        element = rootElementClone;
      } else {
        element = elementsWithBindings[binderIdx - protoView.rootBindingOffset];
      }
      boundElements.push(element);

      // textNodes
      var textNodeIndices = binder.textNodeIndices;
      if (isPresent(textNodeIndices)) {
        var childNode = DOM.firstChild(DOM.templateAwareRoot(element));
        for (var j = 0, k = 0; j < textNodeIndices.length; j++) {
          for(var index = textNodeIndices[j]; k < index; k++) {
            childNode = DOM.nextSibling(childNode);
          }
          ListWrapper.push(textNodes, childNode);
        }
      }

      // viewContainers
      if (isPresent(binder.nestedProtoView)) {
        viewContainer = new RenderViewContainer(element, binder.nestedProtoView);
        ListWrapper.push(viewContainers, viewContainer);
      }
    }

    return new View(viewRootNodes, boundElements, textNodes, viewContainers);
  }
}