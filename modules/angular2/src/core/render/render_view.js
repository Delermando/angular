export class RenderElementBinder {
  textNodeIndices:List<int>;
  hasElementPropertyBindings:boolean;
  hasComponentDirective:boolean;
  hasViewportDirective:boolean;
  nestedProtoView: RenderProtoView;
  // TODO(tbosch): add events back
  events:Set;
  constructor() {
    // updated later when text nodes are bound
    this.textNodeIndices = null;
    // updated later when element properties are bound
    this.hasElementPropertyBindings = false;
    // updated later, so we are able to resolve cycles
    this.nestedProtoView = null;
  }
}


export class RenderProtoView {
  element;
  elementBinders:List<RenderElementBinder>;
  textNodesWithBindingCount:int;
  elementsWithBindingCount:int;
  instantiateInPlace:boolean;
  rootBindingOffset:int;
  isTemplateElement:boolean;
  shadowDomStrategy: ShadowDomStrategy;
  _viewPool: RenderViewPool;
  stylePromises: List<Promise>;

  constructor(
      template,
      shadowDomStrategy: ShadowDomStrategy) {
    this.element = template;
    this.elementBinders = [];
    this.textNodesWithBindingCount = 0;
    this.elementsWithBindingCount = 0;
    this.instantiateInPlace = false;
    this.rootBindingOffset = (isPresent(this.element) && DOM.hasClass(this.element, NG_BINDING_CLASS))
      ? 1 : 0;
    this.isTemplateElement = DOM.isTemplateElement(this.element);
    this.shadowDomStrategy = shadowDomStrategy;
    this._viewPool = new RenderViewPool(VIEW_POOL_CAPACITY);
    this.stylePromises = [];
  }

  instantiate(eventManager: EventManager):View {
    if (this._viewPool.length() == 0) this._preFillPool(eventManager);
    var view = this._viewPool.pop();
    return isPresent(view) ? view : this._instantiate(eventManager);
  }

  _preFillPool(eventManager: EventManager) {
    for (var i = 0; i < VIEW_POOL_PREFILL; i++) {
      this._viewPool.push(this._instantiate(eventManager));
    }
  }

  _instantiate(eventManager: EventManager): View {
    var rootElementClone = this.instantiateInPlace ? this.element : DOM.importIntoDoc(this.element);
    var elementsWithBindingsDynamic;
    if (this.isTemplateElement) {
      elementsWithBindingsDynamic = DOM.querySelectorAll(DOM.content(rootElementClone), NG_BINDING_CLASS_SELECTOR);
    } else {
      elementsWithBindingsDynamic= DOM.getElementsByClassName(rootElementClone, NG_BINDING_CLASS);
    }

    var elementsWithBindings = ListWrapper.createFixedSize(elementsWithBindingsDynamic.length);
    for (var binderIdx = 0; binderIdx < elementsWithBindingsDynamic.length; ++binderIdx) {
      elementsWithBindings[binderIdx] = elementsWithBindingsDynamic[binderIdx];
    }

    var viewNodes;
    if (this.isTemplateElement) {
      var childNode = DOM.firstChild(DOM.content(rootElementClone));
      viewNodes = []; // TODO(perf): Should be fixed size, since we could pre-compute in in ProtoView
      // Note: An explicit loop is the fastest way to convert a DOM array into a JS array!
      while(childNode != null) {
        ListWrapper.push(viewNodes, childNode);
        childNode = DOM.nextSibling(childNode);
      }
    } else {
      viewNodes = [rootElementClone];
    }

    var view = new RenderView(this, viewNodes);
    var binders = this.elementBinders;
    var textNodes = [];
    var elementsWithPropertyBindings = [];
    var preBuiltObjects = ListWrapper.createFixedSize(binders.length);
    var viewContainers = [];
    var componentChildViews = [];

    for (var binderIdx = 0; binderIdx < binders.length; binderIdx++) {
      var binder = binders[binderIdx];
      var element;
      if (binderIdx === 0 && this.rootBindingOffset === 1) {
        element = rootElementClone;
      } else {
        element = elementsWithBindings[binderIdx - this.rootBindingOffset];
      }

      if (binder.hasElementPropertyBindings) {
        ListWrapper.push(elementsWithPropertyBindings, element);
      }

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

      var lightDom = null;
      if (isPresent(binder.hasComponentDirective)) {
        var strategy = this.shadowDomStrategy;
        var childView = binder.nestedProtoView.instantiate(eventManager);

        lightDom = strategy.constructLightDom(view, childView, element);
        strategy.attachTemplate(element, childView);

        ListWrapper.push(componentChildViews, childView);
      }

      // viewContainers
      var viewContainer = null;
      if (binder.hasViewportDirective) {
        var destLightDom = this._directParentElementLightDom(preBuiltObjects);
        viewContainer = new RenderViewContainer(view, element, binder.nestedProtoView,
          eventManager, destLightDom);
        ListWrapper.push(viewContainers, viewContainer);
      }

      // preBuiltObjects
      // TODO(tbosch): provide preBuiltObjects to UIDirectives
      // if (isPresent(elementInjector)) {
      //   preBuiltObjects[binderIdx] = new PreBuiltObjects(view, new NgElement(element), viewContainer,
      //     lightDom, bindingPropagationConfig);
      // }

      // events
      // TODO(tbosch): how to handle events?
      // if (isPresent(binder.events)) {
      //   eventHandlers[binderIdx] = StringMapWrapper.create();
      //   StringMapWrapper.forEach(binder.events, (eventMap, eventName) => {
      //     var handler = ProtoView.buildEventHandler(eventMap, binderIdx);
      //     StringMapWrapper.set(eventHandlers[binderIdx], eventName, handler);
      //     if (isBlank(elementInjector) || !elementInjector.hasEventEmitter(eventName)) {
      //       eventManager.addEventListener(element, eventName,
      //         (event) => { handler(event, view); });
      //     }
      //   });
      // }
    }

    this.eventHandlers = eventHandlers;

    view.init(textNodes, elementsWithPropertyBindings,
      viewContainers, preBuiltObjects, componentChildViews);

    return view;
  }

  returnToPool(view: View) {
    this._viewPool.push(view);
  }

  /**
   * Creates an event handler.
   *
   * @param {Map} eventMap Map directiveIndexes to expressions
   * @param {int} injectorIdx
   * @returns {Function}
   */
  static buildEventHandler(eventMap: Map, injectorIdx: int) {
    var locals = MapWrapper.create();
    return (event, view) => {
      // Most of the time the event will be fired only when the view is in the live document.
      // However, in a rare circumstance the view might get dehydrated, in between the event
      // queuing up and firing.
      if (view.hydrated()) {
        MapWrapper.set(locals, '$event', event);
        MapWrapper.forEach(eventMap, (expr, directiveIndex) => {
          var context;
          if (directiveIndex === -1) {
            context = view.context;
          } else {
            context = view.elementInjectors[injectorIdx].getDirectiveAtIndex(directiveIndex);
          }
          expr.eval(new ContextWithVariableBindings(context, locals));
        });
      }
    }
  }

  _directParentElementLightDom(protoElementInjector:ProtoElementInjector, preBuiltObjects:List):LightDom {
    var p = protoElementInjector.directParent();
    return isPresent(p) ? preBuiltObjects[p.index].lightDom : null;
  }

  bindVariable(contextName:string, templateName:string) {
    MapWrapper.set(this.variableBindings, contextName, templateName);
    MapWrapper.set(this.protoContextLocals, templateName, null);
  }

  bindElement(protoElementInjector:ProtoElementInjector,
      componentDirective:DirectiveMetadata = null, viewportDirective:DirectiveMetadata = null):ElementBinder {
    var elBinder = new ElementBinder(protoElementInjector, componentDirective, viewportDirective);
    ListWrapper.push(this.elementBinders, elBinder);
    return elBinder;
  }

  /**
   * Adds a text node binding for the last created ElementBinder via bindElement
   */
  bindTextNode(indexInParent:int, expression:AST) {
    var elBinder = this.elementBinders[this.elementBinders.length-1];
    if (isBlank(elBinder.textNodeIndices)) {
      elBinder.textNodeIndices = ListWrapper.create();
    }
    ListWrapper.push(elBinder.textNodeIndices, indexInParent);
    var memento = this.textNodesWithBindingCount++;
    this.protoChangeDetector.addAst(expression, memento);
  }

  /**
   * Adds an element property binding for the last created ElementBinder via bindElement
   */
  bindElementProperty(expression:AST, setterName:string, setter:SetterFn) {
    var elBinder = this.elementBinders[this.elementBinders.length-1];
    if (!elBinder.hasElementPropertyBindings) {
      elBinder.hasElementPropertyBindings = true;
      this.elementsWithBindingCount++;
    }
    var memento = new ElementBindingMemento(this.elementsWithBindingCount-1, setterName, setter);
    this.protoChangeDetector.addAst(expression, memento);
  }

  /**
   * Adds an event binding for the last created ElementBinder via bindElement.
   *
   * If the directive index is a positive integer, the event is evaluated in the context of
   * the given directive.
   *
   * If the directive index is -1, the event is evaluated in the context of the enclosing view.
   *
   * @param {string} eventName
   * @param {AST} expression
   * @param {int} directiveIndex The directive index in the binder or -1 when the event is not bound
   *                             to a directive
   */
  bindEvent(eventName:string, expression:AST, directiveIndex: int = -1) {
    var elBinder = this.elementBinders[this.elementBinders.length - 1];
    var events = elBinder.events;
    if (isBlank(events)) {
      events = StringMapWrapper.create();
      elBinder.events = events;
    }
    var event = StringMapWrapper.get(events, eventName);
    if (isBlank(event)) {
      event = MapWrapper.create();
      StringMapWrapper.set(events, eventName, event);
    }
    MapWrapper.set(event, directiveIndex, expression);
  }

  /**
   * Adds a directive property binding for the last created ElementBinder via bindElement
   */
  bindDirectiveProperty(
    directiveIndex:number,
    expression:AST,
    setterName:string,
    setter:SetterFn) {

    var bindingMemento = new DirectiveBindingMemento(
      this.elementBinders.length-1,
      directiveIndex,
      setterName,
      setter
    );
    var directiveMemento = DirectiveMemento.get(bindingMemento);
    this.protoChangeDetector.addAst(expression, bindingMemento, directiveMemento);
  }

  // Create a rootView as if the compiler encountered <rootcmp></rootcmp>,
  // and the component template is already compiled into protoView.
  // Used for bootstrapping.
  static createRootProtoView(protoView: ProtoView,
      insertionElement,
      rootComponentAnnotatedType: DirectiveMetadata,
      protoChangeDetector:ProtoChangeDetector,
      shadowDomStrategy: ShadowDomStrategy
  ): ProtoView {

    DOM.addClass(insertionElement, NG_BINDING_CLASS);
    var cmpType = rootComponentAnnotatedType.type;
    var rootProtoView = new ProtoView(insertionElement, protoChangeDetector, shadowDomStrategy);
    rootProtoView.instantiateInPlace = true;
    var binder = rootProtoView.bindElement(
        new ProtoElementInjector(null, 0, [cmpType], true));
    binder.componentDirective = rootComponentAnnotatedType;
    binder.nestedProtoView = protoView;
    shadowDomStrategy.shimAppElement(rootComponentAnnotatedType, insertionElement);
    return rootProtoView;
  }
}