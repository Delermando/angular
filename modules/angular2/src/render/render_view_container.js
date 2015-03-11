import * as viewModule from './render_view';

// TODO: move uneeded stuff out

export class RenderViewContainer {
  anchorElement;
  defaultViewFactory: RenderViewFactory;
  views: List<viewModule.View>;

  constructor(anchorElement,
              defaultViewFactory: viewModule.ProtoView) {
    this.anchorElement = anchorElement;
    this.defaultViewFactory = defaultViewFactory;

    // The order in this list matches the DOM order.
    this.views = [];
  }

  clear() {
    for (var i = this.views.length - 1; i >= 0; i--) {
      this.remove(i);
    }
  }

  get(index: number): viewModule.View {
    return this.views[index];
  }

  length() {
    return this.views.length;
  }

  _siblingToInsertAfter(index: number) {
    if (index == 0) return this.anchorElement;
    return ListWrapper.last(this.views[index - 1].nodes);
  }

  create(atIndex=-1): viewModule.View {
    var newView = this.defaultViewFactory.instantiate();
    this.insert(newView, atIndex);
    return newView;
  }

  insert(view, atIndex=-1): viewModule.View {
    if (atIndex == -1) atIndex = this.views.length;
    ListWrapper.insert(this.views, atIndex, view);
    ViewContainer.moveViewNodesAfterSibling(this._siblingToInsertAfter(atIndex), view);
    return view;
  }

  remove(atIndex=-1) {
    if (atIndex == -1) atIndex = this.views.length - 1;
    // TODO: This needs to be delayed after any pending animations
    // TODO(tbosch): Need to notify the application view when all animations
    // for the render view are done.
    var view = this.detach(atIndex);
    ListWrapper.forEach(view.componentViews, (componentView) => {
      // don't remove the component view itself as once attached it will never change
      removeViewContainers(componentView.viewContainers);
    });
    removeViewContainers(view.viewContainers);
    view.returnToPool();
  }

  /**
   * The method can be used together with insert to implement a view move, i.e.
   * moving the dom nodes while the directives in the view stay intact.
   */
  detach(atIndex=-1): viewModule.View {
    if (atIndex == -1) atIndex = this.views.length - 1;
    var detachedView = this.get(atIndex);
    ListWrapper.removeAt(this.views, atIndex);
    ViewContainer.removeViewNodesFromParent(this.anchorElement.parentNode, detachedView);
    return detachedView;
  }

  static removeViewContainers(viewContainers) {
    ListWrapper.forEach(viewContainers, (viewContainer) => {
      viewContainer.remove();
    });
  }

  static moveViewNodesAfterSibling(sibling, view) {
    for (var i = view.nodes.length - 1; i >= 0; --i) {
      DOM.insertAfter(sibling, view.nodes[i]);
    }
  }

  static removeViewNodesFromParent(parent, view) {
    for (var i = view.nodes.length - 1; i >= 0; --i) {
      DOM.removeChild(parent, view.nodes[i]);
    }
  }
}
