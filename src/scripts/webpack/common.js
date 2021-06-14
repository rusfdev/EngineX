const Dev = false;

import 'lazysizes';
import {gsap} from "gsap";
gsap.defaults({
  duration: 1,
  ease: 'power2.inOut'
});
import { disablePageScroll, enablePageScroll } from 'scroll-lock';
import Inputmask from "inputmask";
//barba
import barba from '@barba/core';
barba.init({
  debug: true,
  preventRunning: true,
  transitions: [{
    leave(data) {
      barba.done = this.async();
      Transitions.exit(data.current.container, data.current.namespace);
    },
    enter(data) {
      Transitions.enter(data.next.container, data.next.namespace);
    }
  }]
});

import Swiper, {Navigation, Pagination, Lazy, Autoplay, EffectFade, Mousewheel} from 'swiper/core';
Swiper.use([Navigation, Pagination, Lazy, Autoplay, EffectFade, Mousewheel]);

const brakepoints = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1600
}

const $body = document.body;
const $wrapper = document.querySelector('.wrapper');
const $header = document.querySelector('.header');
const $overlay = document.querySelector('.overlay');


document.addEventListener('DOMContentLoaded', function() {
  TouchHoverEvents.init();
  Magic.init();
  Header.init();
})

window.onload = function() {
  Preloader.init();
}

window.addEventListener('beforeEnter', function(event) {
  ActiveInstances.add(HeadAnimation, '.page-head', event.detail.container);
  ActiveInstances.add(ScrollSlider, '.scroll-slider', event.detail.container);
  
  ActiveInstances.init();
  ActiveLinks.check(event.detail.namespace);
})

window.addEventListener('afterExit', function() {
  ActiveInstances.destroy();
  ActiveLinks.reset();
})




const Transitions = {
  enter: function(container, namespace) {

    this.enterAnimation = gsap.timeline({
      onStart: ()=> {
        window.dispatchEvent(new CustomEvent("beforeEnter", {
          detail:{
            container: container,
            namespace: namespace
          }
        }));
      },
      onComplete: ()=> {
        window.dispatchEvent(new CustomEvent("afterEnter", {
          detail:{
            container: container,
            namespace: namespace
          }
        }));
      }
    }).fromTo($overlay, {yPercent:0}, {yPercent:-100, duration:0.5, ease:'power2.out'}) 

  }, 
  exit: function(container) {

    this.exitAnimation = gsap.timeline({
      onStart: ()=> {
        window.dispatchEvent(new CustomEvent("beforeExit", {detail:{container:container}}));
      },
      onComplete: ()=> {
        window.dispatchEvent(new CustomEvent("afterExit", {detail:{container:container}}));
        barba.done();
      }
    }).fromTo($overlay, {yPercent:100}, {yPercent:0, duration:0.5, ease:'power2.out'})
    
  }
}

const ActiveInstances = {
  functions: [],
  add: function(clss, blocks, $container) {
    let $blocks = $container.querySelectorAll(blocks);
    if($blocks.length) {
      $blocks.forEach($block => {
        this.functions.push(new clss($block));
      });
    }
  },
  init: function() {
    this.functions.forEach(func => {
      func.init();
    })
  },
  destroy: function() {
    this.functions.forEach(func => {
      func.destroy();
    })
    this.functions = [];
  }
}

const TouchHoverEvents = {
  targets: 'a, button, label, tr, [data-touch-hover]',
  touched: false,
  touchEndDelay: 100, //ms
  init: function() {
    document.addEventListener('touchstart',  (event)=>{this.events(event)});
    document.addEventListener('touchend',    (event)=>{this.events(event)});
    document.addEventListener('mouseenter',  (event)=>{this.events(event)},true);
    document.addEventListener('mouseleave',  (event)=>{this.events(event)},true);
    document.addEventListener('mousedown',   (event)=>{this.events(event)});
    document.addEventListener('mouseup',     (event)=>{this.events(event)});
    document.addEventListener('contextmenu', (event)=>{this.events(event)});
  },
  events: function(event) {
    let $targets = [];
    $targets[0] = event.target!==document?event.target.closest(this.targets):null;
    let $element = $targets[0], i = 0;

    while($targets[0]) {
      $element = $element.parentNode;
      if($element!==document) {
        if($element.matches(this.targets)) {
          i++;
          $targets[i] = $element;
        }
      } 
      else {
        break;
      }
    }

    //touchstart
    if(event.type=='touchstart') {
      this.touched = true;
      if(this.timeout) clearTimeout(this.timeout);
      if($targets[0]) {
        for(let $target of $targets) $target.setAttribute('data-touch', '');
      }
    } 
    //touchend
    else if(event.type=='touchend' || (event.type=='contextmenu' && this.touched)) {
      this.timeout = setTimeout(() => {this.touched = false}, 500);
      if($targets[0]) {
        setTimeout(()=>{
          for(let $target of $targets) {
            $target.dispatchEvent(new CustomEvent("customTouchend"));
            $target.removeAttribute('data-touch');
          }
        }, this.touchEndDelay)
      }
    } 
    
    //mouseenter
    if(event.type=='mouseenter' && !this.touched && $targets[0] && $targets[0]==event.target) {
      $targets[0].setAttribute('data-hover', '');
    }
    //mouseleave
    else if(event.type=='mouseleave' && !this.touched && $targets[0] && $targets[0]==event.target) {
      $targets[0].removeAttribute('data-click');
      $targets[0].removeAttribute('data-hover');
    }
    //mousedown
    if(event.type=='mousedown' && !this.touched && $targets[0]) {
      $targets[0].setAttribute('data-click', '');
    } 
    //mouseup
    else if(event.type=='mouseup' && !this.touched  && $targets[0]) {
      $targets[0].removeAttribute('data-click');
    }
  }
}

const ActiveLinks = {
  check: function(namespace) {
    this.$active_links = [];
    document.querySelectorAll('a').forEach($this => {
      if($this.getAttribute('data-namespace')==namespace) {
        $this.classList.add('is-active');
        this.$active_links.push($this);
      }
    })
  },
  reset: function() {
    this.$active_links.forEach($this=>{
      $this.classList.remove('is-active');
    })
  }
}

const Header = {
  init: function () {
    this.old_scroll = 0;
    window.addEventListener('scroll', () => {
      this.check();
    })
    this.check();
  },
  check: function () {
    let y = window.pageYOffset,
        h = window.innerHeight/2,
        fixed = $header.classList.contains('header_fixed'),
        hidden = $header.classList.contains('header_hidden');

    if (y > 0 && !fixed) {
      $header.classList.add('header_fixed');
    } else if (y<=0 && fixed) {
      $header.classList.remove('header_fixed');
    }

    //листаем вниз
    if(this.old_scroll<y && y>h && !hidden) {
      $header.classList.add('header_hidden');
    }
    //листаем вверх
    else if(this.old_scroll>y && hidden) {
      $header.classList.remove('header_hidden');
    } 

    this.old_scroll = y;
  }
}

const Magic = {
  init: function() {
    this.$trigger = document.querySelector('.button-magic');

    this.$trigger.addEventListener('click', () => {
      let independent_elements = 'h1, h2, h3, h4, h5, h6, li, p, button, .button, .image, .logo',
          $independent_elements = document.querySelectorAll(independent_elements),
          $else_elements = document.querySelectorAll('strong, a, span, img, img, .icon');

      let $suitable_items = [],
          $animate_items = [];

      $else_elements.forEach(($this) => {
        if($this.tagName=='A' || $this.tagName=='SPAN' || $this.tagName=='STRONG' || $this.tagName=='IMG' || $this.classList.contains('icon')) {
          if(!$this.closest(independent_elements)) $suitable_items.push($this);
        }
      })

      $independent_elements.forEach(($this) => {
        $suitable_items.push($this);
      })

      $suitable_items.forEach($this => {
        let y = $this.getBoundingClientRect().y,
            h = $this.getBoundingClientRect().height;
        if(y+h>0 && y<window.innerHeight) {
          $animate_items.push($this);
        }
      })

      this.animation = gsap.timeline({
        onStart: () => {
          disablePageScroll();
          $animate_items.forEach($this => {
            $this.classList.add('in-magic-animation');
          })
        },
        onComplete: () => {
          enablePageScroll();
          this.animation.kill();
          gsap.set($animate_items, {clearProps: "all"});
          $animate_items.forEach($this => {
            $this.classList.remove('in-magic-animation');
          })
        }
      })
        .to($animate_items, {scale:2, autoAlpha:0, duration:0.5, ease:'power2.in', stagger:{from:'random', each:0.03}})
        .fromTo($animate_items, {scale:0.5}, {immediateRender:false, scale:1, autoAlpha:1, rotation:0, duration:1, ease:'power2.out', stagger:{from:'random', each:0.015}})
    
    
    })
  }
}

const Preloader = {
  init: function() {
    this.$parent = document.querySelector('.preloader');
    this.$element = this.$parent.querySelector('.preloader__element');
    this.$element_items = this.$element.querySelectorAll('span');

    let $container = document.querySelector('[data-barba="container"]'),
        namespace = $container.getAttribute('data-barba-namespace')

    let endEvent = () => {
      gsap.set([$overlay, $wrapper], {autoAlpha:1})
      this.$parent.remove();
      Transitions.enter($container, namespace);
    }

    if(!Dev) {
      gsap.timeline() 
        .fromTo(this.$parent, {autoAlpha:0}, {autoAlpha:1, duration:0.5, ease:'power2.out'})
        .fromTo(this.$element_items, {autoAlpha:0}, {autoAlpha:1, ease:'power2.out', stagger:{amount:0.2}})
        .to(this.$element, {yPercent:-100, duration:0.5, ease:'power2.out', onComplete: () => {
          endEvent();
        }})
    } else {
      endEvent();
    }
  }
}

class HeadAnimation {
  constructor($parent) {
    this.$parent = $parent;
  }
  init() {
    this.$items = this.$parent.querySelectorAll('.page-head__animate-item');
    this.$dots_container = this.$parent.querySelector('.page-head__dots');
    this.$dot = this.$parent.querySelector('.page-head__dot');

    this.createDots = () => {
      if(this.$dot) {
        let ch = this.$dots_container.getBoundingClientRect().height,
            cw = this.$dots_container.getBoundingClientRect().width,
            dh = this.$dot.getBoundingClientRect().height,
            dw = this.$dot.getBoundingClientRect().width;
  
        let column_count = Math.floor(cw/dw),
            row_count = Math.floor(ch/dh),
            dots_count = column_count * row_count;
        
        for (let index = 0; index < dots_count - 1; index++) {
          this.$dots_container.insertAdjacentHTML('beforeend', '<div class="page-head__dot"></div>');
        }
  
        this.$dots = this.$dots_container.querySelectorAll('.page-head__dot');
        
        this.dots_animations = [];

        let from_vars = ['start', 'center', 'end', 'edges', 'random'],
            from_index = Math.floor(Math.random() * from_vars.length),
            from = from_vars[from_index];

        let axis_vars = [null, 'x', 'y'],
            axis_index = Math.floor(Math.random() * axis_vars.length),
            axis = axis_vars[axis_index];

        this.dots_animations[0] = gsap.timeline()
          .fromTo(this.$dots, {autoAlpha:0}, {autoAlpha:1, duration:0.25, ease:'none', stagger:{grid:[row_count, column_count], from:from, axis:axis, amount:1.25}})
          .eventCallback('onComplete', () => {

            /* if(Dev) {
              this.dots_animations[1] = gsap.timeline({repeat:-1, yoyo:true})
                .to(this.$dots, {autoAlpha:0, duration:0.25, ease:'none', stagger:{grid:[row_count, column_count], from:"random", amount:4}})
            
              this.dots_animations[2] = gsap.timeline({repeat:-1, yoyo:true})
                .to(this.$dots, {autoAlpha:1, duration:0.25, ease:'none', stagger:{grid:[row_count, column_count], from:"random", amount:4}})
            } */

          })
      
      }
    }

    window.addEventListener('afterEnter', this.createDots)

    this.animation = gsap.timeline()
      .fromTo(this.$items, {y:40, autoAlpha:0}, {autoAlpha:1, y:0, duration:0.85, ease:'power2.out', stagger:{each:0.10}})

    //images
    let $home_image = this.$parent.querySelector('.home__image .image'),
        $technology_image = this.$parent.querySelector('.technology-screen__image');
    if($home_image) {
      gsap.fromTo($home_image, {autoAlpha:0, xPercent:-7, yPercent:9}, {autoAlpha:1, xPercent:0, yPercent:0, duration:1, ease:'power2.out'})
    } else if($technology_image) {
      gsap.fromTo($technology_image, {autoAlpha:0, scale:0.8}, {autoAlpha:1, scale:1, duration:1, ease:'power2.out'})
    }
    

  }
  destroy() {
    window.removeEventListener('afterEnter', this.createDots)
    if(this.dots_animations.length) {
      for(let index in this.dots_animations) {
        this.dots_animations[index].kill();
      }
    }
    this.animation.kill();
  }
}

class ScrollSlider {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
    this.check = ()=> {
      if(window.innerWidth >= brakepoints.lg && (!this.initialized || !this.flag)) {
        this.initDesktop();
        this.flag = true;
      } 
      else if(window.innerWidth<brakepoints.lg && (!this.initialized || this.flag)) {
        if(this.initialized) {
          this.destroyDesktop();
        }
        this.flag = false;
      }
    }
    this.check();
    window.addEventListener('resize', this.check);
    this.initialized = true;
  }

  initDesktop() {
    this.$slider = this.$parent.querySelector('.swiper-container')
    this.$nav_elements = this.$parent.querySelectorAll('.scroll-slider__nav-element');
    this.$prev = this.$parent.querySelector('.swiper-button-prev');
    this.$next = this.$parent.querySelector('.swiper-button-next');

    this.change = (index) => {
      if(this.index!==index) {
        if(this.index!==undefined) {
          this.$nav_elements[this.index].classList.remove('is-active');
        }
        this.$nav_elements[index].classList.add('is-active');

        this.index = index;
      }
    }

    this.slider = new Swiper(this.$slider, {
      init: false,
      effect: 'fade',
      loop: true,
      speed: 500,
      mousewheel: {
        releaseOnEdges: true,
      },
      navigation: {
        prevEl: this.$prev,
        nextEl: this.$next
      },
      lazy: {
        loadOnTransitionStart: true,
        loadPrevNext: true
      }
    });

    this.slider.on('slideChange', (swiper) => {
      this.change(swiper.realIndex)
    });

    this.slider.on('init', (swiper) => {
      this.change(swiper.realIndex)
    });

    this.clickEvents = [];
    this.$nav_elements.forEach(($this, index) => {
      this.clickEvents[index] = () => {
        this.slider.slideToLoop(index)
      }
      $this.addEventListener('click', this.clickEvents[index])
    })

    this.slider.init();
  }

  destroyDesktop() {
    this.slider.destroy();
    delete this.index;
    this.$nav_elements.forEach(($this, index) => {
      $this.removeEventListener('click', this.clickEvents[index])
    })
  }

  destroy() {
    if(this.flag) this.destroyDesktop();

    window.removeEventListener('resize', this.check);
    for(let child in this) delete this[child];
  }
}

class ScrollSliderOld {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
    this.check = ()=> {
      if(window.innerWidth >= brakepoints.lg && (!this.initialized || !this.flag)) {
        this.initDesktop();
        this.flag = true;
      } 
      else if(window.innerWidth<brakepoints.lg && (!this.initialized || this.flag)) {
        if(this.initialized) {
          this.destroyDesktop();
        }
        this.flag = false;
      }
    }
    this.check();
    window.addEventListener('resize', this.check);
    this.initialized = true;
  }

  initDesktop() {
    this.$slides = this.$parent.querySelectorAll('.scroll-slider__slide');
    this.$wrapper = this.$parent.querySelector('.scroll-slider__items');
    this.$nav_elements = this.$parent.querySelectorAll('.scroll-slider__nav-element');
    this.$nav_top = this.$parent.querySelector('.scroll-slider__button-top');
    this.$nav_bottom = this.$parent.querySelector('.scroll-slider__button-bottom');

    this.getNext = ()=> {
      return this.index == this.$slides.length-1 ? 0 : this.index+1;
    }
    this.getPrev = ()=> {
      return this.index==0 ? this.$slides.length-1 : this.index-1;
    }

    this.animations = [];

    this.$slides.forEach(($slide, index) => {
      this.animations[index] = gsap.timeline({paused:true})
        .fromTo($slide, {autoAlpha:0}, {autoAlpha:1, duration:0.5, ease:'power2.inOut'})
    })

    this.change = (index) => {
      if(this.index!==index) {
        if(this.index!==undefined) {
          this.animations[this.index].timeScale(3).reverse();
          this.$slides[this.index].classList.remove('is-active');
          this.$nav_elements[this.index].classList.remove('is-active');
        }
        this.animations[index].timeScale(1).play();
        this.$slides[index].classList.add('is-active');
        this.$nav_elements[index].classList.add('is-active');

        this.index = index;
      }
    }

    this.clickEvents = [];
    this.prevClick = () => {
      this.change(this.getPrev());
    }
    this.nextClick = () => {
      this.change(this.getNext());
    }

    this.$nav_elements.forEach(($this, index) => {
      this.clickEvents[index] = () => {
        this.change(index);
      }
      $this.addEventListener('click', this.clickEvents[index])
    })
    this.$nav_top.addEventListener('click', this.prevClick);
    this.$nav_bottom.addEventListener('click', this.nextClick);

    this.change(0);


  }

  destroyDesktop() {
    
  }

  destroy() {
    if(this.flag) this.destroyDesktop();

    window.removeEventListener('resize', this.check);
    for(let child in this) delete this[child];
  }
}