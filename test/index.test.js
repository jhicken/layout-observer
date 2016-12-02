import LayoutObserver from '../src/index';

const EVENT_TYPES = [
  'animationstart',
  'webkitAnimationStart',
  'animationiteration',
  'webkitAnimationIteration',
  'animationend',
  'webkitAnimationEnd',
  'input',
  'mouseup',
  'mousedown',
  'orientationchange',
  'afterprint',
  'beforeprint',
  'readystatechange',
  'touchstart',
  'touchend',
  'touchcancel',
  'transitionstart',
  'webkitTransitionStart',
  'MSTransitionStart',
  'oTransitionStart',
  'otransitionstart',
  'transitioniteration',
  'webkitTransitionIteration',
  'MSTransitionIteration',
  'oTransitionIteration',
  'otransitioniteration',
  'transitionend',
  'webkitTransitionEnd',
  'MSTransitionEnd',
  'oTransitionEnd',
  'otransitionend'
];

const dispatchEvent = (target, eventType) => {
  const event = document.createEvent('CustomEvent');
  event.initEvent(eventType, true, true);
  target.dispatchEvent(event);
};

const delayForThrottle = 15;

describe('Layout Observer', () => {
  let spy;
  let observer;

  beforeEach(() => {
    spy = jasmine.createSpy();
    observer = new LayoutObserver(spy);
    observer.observe();
  });

  afterEach(() => {
    observer.disconnect();
  });

  it('notifies observer on DOMContentLoaded', (done) => {
    expect(spy).not.toHaveBeenCalled();

    document.addEventListener('DOMContentLoaded', () => {
      expect(spy).toHaveBeenCalled();
      done();
    });
  });

  EVENT_TYPES.forEach((eventType)=>{
    it('notifies observer on event ' + eventType, (done) => {
      dispatchEvent(window, eventType);
      setTimeout(() => {
        expect(spy).toHaveBeenCalled();
        spy.calls.reset();
        done();
      }, delayForThrottle);
    });
  });

  it('notifies observer when a DOM element is added', (done) => {
    document.body.appendChild(document.createElement('div'));

    setTimeout(() => {
      expect(spy).toHaveBeenCalled();
      done();
    }, delayForThrottle);
  });

  it('notifies observer when a DOM attribute is set', done => {
    document.body.setAttribute('data-test', 'foo');

    setTimeout(() => {
      expect(spy).toHaveBeenCalled();
      done();
    }, delayForThrottle);
  });

  it('notifies observer when innerHTML is set', done => {
    const contentDiv = document.createElement('div');
    document.body.appendChild(contentDiv);

    setTimeout(() => {
      spy.calls.reset();

      contentDiv.innerHTML = 'foo';

      setTimeout(() => {
        expect(spy).toHaveBeenCalled();
        done();
      }, delayForThrottle);
    });
  });

  it('notifies observer when an image finishes loading', done => {
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
    document.body.appendChild(img);

    document.body.addEventListener('load', () => {
      setTimeout(()=>{
        expect(spy).toHaveBeenCalled();
        done();
      }, delayForThrottle);
    }, true);
  });


  it('notifies only and all connected observers', (done) => {
    const spy1 = jasmine.createSpy();
    const observer1 = new LayoutObserver(spy1);
    const spy2 = jasmine.createSpy();
    const observer2 = new LayoutObserver(spy2);

    dispatchEvent(window, 'mousedown');

    setTimeout(()=>{
      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
      observer1.observe();
      observer2.observe();

      dispatchEvent(window, 'mousedown');

      setTimeout(()=>{
        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();

        spy1.calls.reset();
        spy2.calls.reset();

        observer2.disconnect();

        dispatchEvent(window, 'mousedown');

        setTimeout(()=>{
          expect(spy1).toHaveBeenCalled();
          expect(spy2).not.toHaveBeenCalled();

          spy1.calls.reset();
          spy2.calls.reset();

          observer1.disconnect();

          dispatchEvent(window, 'mousedown');

          setTimeout(()=>{
            expect(spy1).not.toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();
            done();
          }, delayForThrottle);
        }, delayForThrottle);
      }, delayForThrottle);
    }, delayForThrottle);

  });

  it('should be throttled', (done) => {

    for(let i = 0; i < 500; i++) {
      dispatchEvent(window, 'mousedown');
    }

    setTimeout(() => {
      expect(spy.calls.count() > 0 && spy.calls.count() < 10).toBe(true);

      for(let i = 0; i < 500; i++) {
        dispatchEvent(window, 'mousedown');
      }
      setTimeout(() => {
        expect(spy.calls.count() > 2 && spy.calls.count() < 10).toBe(true);
        done();
        spy.calls.reset();
      }, delayForThrottle);
    }, delayForThrottle);
  });
});
