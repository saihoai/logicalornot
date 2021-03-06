export default class ViewClass {
  constructor (proxy, stream) {
    this.$proxy    = typeof proxy === 'string' ? document.querySelector(proxy) : proxy;
    this.stream    = stream;
    this.$elements = {};
    this.$buttons  = {};

    this.bind();
  }

  bind () {
    let self   = this;
    let $proxy = self.$proxy;
    let keys   = { 37: 'left', 38: 'up', 39: 'right', 32: 'spacebar' };

    // map data-bind buttons
    let buttons = document.querySelectorAll('[data-bind]');

    for (let i = 0, len = buttons.length, button; i < len; i++) {
      button = buttons[i];

      let keyShortcut = ViewClass.getAttribute(button, 'data-bind');

      self.$buttons[keyShortcut] = {
        element:   button,
        eventName: ViewClass.getAttribute(button, 'data-event'),
        eventData: ViewClass.getAttribute(button, 'data-event-data')
      };
    }

    $proxy.addEventListener('keydown', event => {
      let keyName = keys[event.which];
      if (!keyName) return;

      let button = self.$buttons[keyName];
      ViewClass.addClass(button.element, 'active');

      event.preventDefault();
    });

    $proxy.addEventListener('keyup', event => {
      let keyName = keys[event.which];
      if (!keyName) return;

      let button = self.$buttons[keyName];
      ViewClass.removeClass(button.element, 'active');
      self.publishButtonData(button);

      event.preventDefault();
    });

    $proxy.addEventListener('click', event => {
      for (let key in self.$buttons) {
        if (!self.$buttons.hasOwnProperty(key)) continue;

        if (self.$buttons[key].element.contains(event.target)) {
          event.preventDefault();
          return self.publishButtonData(self.$buttons[key]);
        }
      }
    });

    this.on('normal-mode', 'click', function () {
      if (!this.render('normal-mode', 'hasClass', 'active')) {
        this.render('normal-mode', 'addClass', 'active');
        this.render('hardcore-mode', 'removeClass', 'active');
        this.stream.publish('view:normal-mode');
      }
    }, this);

    this.on('hardcore-mode', 'click', function () {
      if (!this.render('hardcore-mode', 'hasClass', 'active')) {
        this.render('hardcore-mode', 'addClass', 'active');
        this.render('normal-mode', 'removeClass', 'active');
        this.stream.publish('view:hardcore-mode');
      }
    }, this);
  }

  publishButtonData (button) {
    this.stream.publish(button.eventName, button.eventData);
  }

  $get (selector) {
    selector = 'bind-' + selector;

    if (!this.$elements[selector]) {
      this.$elements[selector] = document.getElementById(selector);
    }

    return this.$elements[selector];
  }

  render (selector, method, ...args) {
    args.unshift(this.$get(selector));
    return ViewClass[method].apply(this, args);
  }

  on (selector, eventName, handler, context = this) {
    let cb = handler.bind(context);
    this.$proxy.addEventListener(eventName, function (event) {
      let target = event.target;
      let matcher = target.matches || target.matchesSelector || target.webkitMatchesSelector || target.msMatchesSelector;

      if (matcher.call(target, '#bind-' + selector)) {
        cb(event);
        event.preventDefault();
      }
    });
  }



  /*-------------------------------------------*\
    statics (DOM manipulators)
  \*-------------------------------------------*/

  static html (element, html) {
    element.innerHTML = html;
  }

  static css (element, styles) {
    for (let prop in styles) {
      if (styles.hasOwnProperty(prop)) {
        element.style[prop] = styles[prop];
      }
    }

    return element;
  }

  static hasClass (element, className) {
    return element.classList.contains(className);
  }

  static addClass (element, className) {
    return element.classList.add(className);
  }

  static removeClass (element, className) {
    return element.classList.remove(className);
  }

  static attr (element, attrs) {
    for (let prop in attrs) {
      if (attrs.hasOwnProperty(prop)) {
        element.setAttribute(prop, attrs[prop]);
      }
    }

    return element;
  }

  static getAttribute (element, attrName) {
    return element.getAttribute(attrName);
  }
}
