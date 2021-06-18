const Dev = false;

import 'lazysizes';
import {gsap} from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
gsap.registerPlugin(ScrollToPlugin);
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
const $overlay = document.querySelector('.overlay');


document.addEventListener('DOMContentLoaded', function() {
  scroll();
  TouchHoverEvents.init();
  Magic.init();
  Nav.init();
  Header.init();
})

window.onload = function() {
  Preloader.init();
}

window.addEventListener('beforeEnter', function(event) {
  ActiveInstances.add(HeadAnimation, '.page-head', event.detail.container);
  ActiveInstances.add(ScrollSlider, '.scroll-slider', event.detail.container);
  ActiveInstances.add(RelevanceCards, '.relevance-cards', event.detail.container);
  ActiveInstances.add(DevelopmentSlider, '.development-slider', event.detail.container);
  ActiveInstances.add(TeamCard, '.team-card', event.detail.container);
  ActiveInstances.add(WhatIsIncludedSlider, '.what-is-included__slider', event.detail.container);
  
  ActiveInstances.init();

  ActiveLinks.check(event.detail.namespace);

  if(!Dev) {
    window.scrollTo(0, 0);
  }
})

window.addEventListener('afterExit', function() {
  ActiveInstances.destroy();
  ActiveLinks.reset();
})


//check device
function mobile() {
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    return true;
  } else {
    return false;
  }
}

function scroll() {
  document.addEventListener('click', (event) => {
    let $target = event.target!==document?event.target.closest('[data-scroll]'):null;
    if($target) {
      event.preventDefault();
      let id = $target.getAttribute('href');
      gsap.to(window, {duration:1, scrollTo:id});
    }
  })
}

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
  $element: document.querySelector('.header'),

  init: function () {
    this.old_scroll = 0;
    window.addEventListener('scroll', () => {
      this.check();
    })
    this.check();
  },

  check: function () {
    let y = window.pageYOffset,
        h = window.innerHeight,
        fixed = this.$element.classList.contains('header_fixed'),
        hidden = this.$element.classList.contains('header_hidden');

    if (y > 0 && !fixed) {
      this.$element.classList.add('header_fixed');
      Nav.$element.classList.add('mobile-nav_header-fixed');
    } else if (y<=0 && fixed) {
      this.$element.classList.remove('header_fixed');
      Nav.$element.classList.remove('mobile-nav_header-fixed');
    }

    //листаем вниз
    if(this.old_scroll<y) {
      this.old_flag = y;
      if(y>h && !hidden) {
        this.$element.classList.add('header_hidden');
      }
    }
    //листаем вверх
    else if(this.old_scroll>y) {
      if(hidden && (y<h || y+200<this.old_flag)) {
        this.$element.classList.remove('header_hidden');
      }
    } 

    this.old_scroll = y;
  }
}

const Nav = {
  $element: document.querySelector('.mobile-nav'),

  init: function() {
    
    this.$container = document.querySelector('.mobile-nav__container');
    this.$toggle = document.querySelector('.nav-toggle');
    this.$toggle_items = this.$toggle.querySelectorAll('span');
    this.$animate = document.querySelectorAll('.mobile-nav__animate-item');

    this.animation = gsap.timeline({paused:true})
      .set(this.$element, {autoAlpha:1})
      .fromTo(this.$container, {yPercent:-100}, {yPercent:0, duration:0.5, ease:'power2.out'}) //0.5
      .fromTo(this.$animate, {autoAlpha:0, y:-40}, {autoAlpha:1, y:0, duration:0.6, ease:'power2.out', stagger:{amount:0.2, from:'end'}}, '-=0.3') //1
      .to(this.$toggle_items[0], {y:11, duration:0.5, ease:'power2.in'}, '-=1')
      .to(this.$toggle_items[2], {y:-11, duration:0.5, ease:'power2.in'}, '-=1')
      .set(this.$toggle_items[1], {autoAlpha:0}, '-=0.5')
      .to(this.$toggle_items[0], {rotate:45, duration:0.5, ease:'power2.out'}, '-=0.5')
      .to(this.$toggle_items[2], {rotate:135, duration:0.5, ease:'power2.out'}, '-=0.5')

    window.addEventListener('beforeExit', () => {
      if(this.state) {
        this.close();
      }
    })
    
    this.$toggle.addEventListener('click', () => {
      if(!this.state) {
        this.open();
      } else {
        this.close();
      }
    })
    
  },
  open: function() {
    this.state = true;
    Header.$element.classList.add('header_nav-opened');
    this.$element.classList.add('mobile-nav_opened');
    this.$toggle.classList.add('nav-toggle_active');
    this.animation.timeScale(1).play();
    disablePageScroll();
  },
  close: function() {
    this.animation.timeScale(1.5).reverse();
    this.animation.eventCallback('onReverseComplete', () => {
      this.state = false;
      enablePageScroll();
      Header.$element.classList.remove('header_nav-opened');
      this.$element.classList.remove('mobile-nav_opened');
      this.$toggle.classList.remove('nav-toggle_active');
    })
  }
}

const Magic = {
  init: function() {
    this.$trigger = document.querySelector('.button-magic');

    this.$trigger.addEventListener('click', () => {
      let independent_elements = 'h1, h2, h3, h4, h5, h6, li, p, button, .button, .image, .logo, .input',
          $independent_elements = document.querySelectorAll(independent_elements),
          $else_elements = document.querySelectorAll('strong, a, span, .icon');

      let $suitable_items = [],
          $animate_group_1 = [],
          $animate_group_2 = [];

      $else_elements.forEach(($this) => {
        if($this.tagName=='A' || $this.tagName=='SPAN' || $this.tagName=='STRONG' || $this.classList.contains('icon')) {
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
          if(Math.round(Math.random())) {
            $animate_group_1.push($this);
          } else {
            $animate_group_2.push($this);
          }
        }
      })

      this.animation = gsap.timeline()
        .to($animate_group_1, {scale:2, autoAlpha:0, duration:0.5, ease:'power2.in', stagger:{from:'random', amount:1}})
        .to($animate_group_2, {scale:0.5, autoAlpha:0, duration:0.5, ease:'power2.in', stagger:{from:'random', amount:1}}, '-=1.5')
        .fromTo($animate_group_1, {scale:0.5}, {immediateRender:false, scale:1, autoAlpha:1, duration:1, ease:'power2.out', stagger:{from:'random', amount:0.5}})
        .fromTo($animate_group_2, {scale:2, rotation:180}, {immediateRender:false, scale:1, autoAlpha:1, duration:1, ease:'power2.out', stagger:{from:'random', amount:0.5}}, '-=1.5')
        .to($animate_group_2, {rotation:0, duration:1, stagger:{amount:0.5}})

        
        .eventCallback('onStart', () => {
          disablePageScroll();
          $wrapper.classList.add('disabled');
        })
        
        .eventCallback('onComplete', () => {
          enablePageScroll();
          this.animation.kill();
          gsap.set([$animate_group_1, $animate_group_2], {clearProps: "all"});
          $wrapper.classList.remove('disabled');
        })
    
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
    this.$images = this.$parent.querySelectorAll('.home-screen__image');

    let $home_image = this.$parent.querySelector('.home__image .image'),
        $technology_image = this.$parent.querySelector('.technology-screen__image');

    this.createDots = () => {
      if(this.$dot && window.innerWidth >= brakepoints.lg) {
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

        let from_vars = ['start', 'center', 'end', 'edges', 'random'],
            from_index = Math.floor(Math.random() * from_vars.length),
            from = from_vars[from_index];

        let axis_vars = [null, 'x', 'y'],
            axis_index = Math.floor(Math.random() * axis_vars.length),
            axis = axis_vars[axis_index];

        this.dots_animation = gsap.timeline()
          .fromTo(this.$dots, {autoAlpha:0}, {autoAlpha:1, duration:0.25, ease:'none', stagger:{grid:[row_count, column_count], from:from, axis:axis, amount:1.25}})
          .eventCallback('onComplete', () => {
            this.dots_animation.kill();
            delete this.dots_animation;
            gsap.set(this.$dots, {clearProps:'all'});
          })
      
      }
    }

    window.addEventListener('afterEnter', this.createDots);

    this.animate = [...this.$items];
    if(window.innerWidth < brakepoints.lg && this.$images.length) {
      this.$images.forEach($this => {
        this.animate.push($this);
      })
    }

    this.animation = gsap.timeline()
      .fromTo(this.animate, {y:40, autoAlpha:0}, {autoAlpha:1, y:0, duration:0.85, ease:'power2.out', stagger:{each:0.10}})
      .eventCallback('onComplete', () => {
        this.animation.kill();
        delete this.animation;
        gsap.set(this.animate, {clearProps:'all'});
      })

    //images
    
    if($home_image && window.innerWidth >= brakepoints.lg) {
      gsap.fromTo($home_image, {autoAlpha:0, xPercent:-7, yPercent:9}, {autoAlpha:1, xPercent:0, yPercent:0, duration:1, ease:'power2.out'})
    } else if($technology_image && window.innerWidth >= brakepoints.lg) {
      gsap.fromTo($technology_image, {autoAlpha:0, scale:0.8}, {autoAlpha:1, scale:1, duration:1, ease:'power2.out'})
    }
    

  }
  destroy() {
    window.removeEventListener('afterEnter', this.createDots);
    if(this.dots_animation) this.dots_animation.kill();
    if(this.animation) this.animation.kill();
    for(let child in this) delete this[child];
  }
}

class ScrollSlider {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
    this.check = ()=> {
      if(window.innerWidth >= brakepoints.lg && (!this.initialized || !this.flag)) {
        if(this.initialized) {
          this.destroyMobile();
        }
        this.initDesktop();
        this.flag = true;
      } 
      else if(window.innerWidth<brakepoints.lg && (!this.initialized || this.flag)) {
        if(this.initialized) {
          this.destroyDesktop();
        }
        this.initMobile();
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
      speed: 300,
      autoHeight: true,
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

  initMobile() {
    this.$slider = this.$parent.querySelector('.swiper-container');
    this.$pagination = this.$parent.querySelector('.swiper-pagination');

    this.slider = new Swiper(this.$slider, {
      loop: true,
      speed: 300,
      autoHeight: true,
      pagination: {
        el: this.$pagination,
        clickable: true,
        bulletElement: 'button'
      },
      lazy: {
        loadOnTransitionStart: true,
        loadPrevNext: true
      }
    });
  }

  destroyDesktop() {
    this.slider.destroy();
    this.$nav_elements[this.index].classList.remove('is-active');
    delete this.index;
    this.$nav_elements.forEach(($this, index) => {
      $this.removeEventListener('click', this.clickEvents[index])
    })
  }

  destroyMobile() {
    this.slider.destroy();
  }

  destroy() {
    if(this.flag) this.destroyDesktop();
    else this.destroyMobile();
    window.removeEventListener('resize', this.check);
    for(let child in this) delete this[child];
  }
}

class RelevanceCards {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
    this.check = ()=> {
      if(window.innerWidth >= brakepoints.lg && (!this.initialized || !this.flag)) {
        if(this.initialized) {
          this.destroyMobile();
        }
        this.initDesktop();
        this.flag = true;
      } 
      else if(window.innerWidth<brakepoints.lg && (!this.initialized || this.flag)) {
        if(this.initialized) {
          this.destroyDesktop();
        }
        this.initMobile();
        this.flag = false;
      }
    }
    this.check();
    window.addEventListener('resize', this.check);
    this.initialized = true;
  }

  initDesktop() {
    this.$cards = this.$parent.querySelectorAll('.relevance-card');

    this.checkSize = () => {
      let h = [], max;

      this.$cards.forEach($this => {
        h.push($this.getBoundingClientRect().height);
      })

      max = Math.max(...h);

      this.$parent.style.height = `${max}px`;

      this.$cards.forEach($this => {
        $this.style.height = `${max}px`;
      })
    }

    this.getPosition = () => {
      let w = this.$parent.getBoundingClientRect().width,
          w2 = this.$cards[0].getBoundingClientRect().width,
          w3 = (w - w2) / (this.$cards.length - 1),
          w4 = w2 - w3 - 5;
          
      this.x = [];

      for (let index = 0; index < this.$cards.length; index++) {
        if (index <= this.index || this.index==undefined) {
          this.x[index] = 0;
        } else {
          this.x[index] = w4;
        }
      }
    }

    this.setPosition = () => {
      this.$cards.forEach(($card, index) => {
        gsap.set($card, {x:this.x[index]})
      })
    }

    this.checkSize();
    this.getPosition();

    this.changeState = (index) => {
      if(this.index!==undefined) {
        this.$cards[this.index].classList.remove('disabled');
      }
      this.$cards[index].classList.add('disabled');

      this.index = index;

      this.getPosition();

      this.$cards.forEach(($card, index) => {
        gsap.to($card, {x:this.x[index], duration:0.5})
      })
    }

    this.changeState(this.$cards.length - 1);

    this.clickEvents = []
    this.$cards.forEach(($card, index) => {
      this.clickEvents[index] = () => {
        this.changeState(index);
      }
      $card.addEventListener('click', this.clickEvents[index])
    })

    window.addEventListener('resize', this.checkSize);
    window.addEventListener('resize', this.getPosition);
    window.addEventListener('resize', this.setPosition);
  }

  initMobile() {
    this.$cards = this.$parent.querySelectorAll('.relevance-card');
    this.$triggers = this.$parent.querySelectorAll('.relevance-card__head');
    this.$content = this.$parent.querySelectorAll('.relevance-card__content');
    this.$inner = this.$parent.querySelectorAll('.relevance-card__content-inner');

    this.animations = [];

    this.change = (index) => {
      let state = this.$cards[index].classList.contains('is-active');

      if(!state && (!this.animations[index] || !this.animations[index].isActive())) {
        this.$cards[index].classList.add('is-active');

        let h = this.$inner[index].getBoundingClientRect().height;
        this.animations[index] = gsap.timeline()
          .to(this.$content[index], {css:{height:h}, duration:0.5})
      } else if(state && !this.animations[index].isActive()) {
        this.$cards[index].classList.remove('is-active');
        this.animations[index].reverse();
      }
    }

    this.checkSize = () => {
      this.$cards.forEach(($card, index) => {
        let state = $card.classList.contains('is-active'),
            h = this.$inner[index].getBoundingClientRect().height;
        if(state) {
          this.$content[index].style.height = `${h}px`;
        } else {
          this.$content[index].style.height = `0px`;
        }
      })
    }

    window.addEventListener('resize', this.checkSize);

    this.clickEvents = [];
    this.$triggers.forEach(($trigger, index) => {
      this.clickEvents[index] = () => {
        this.change(index);
      }
      $trigger.addEventListener('click', this.clickEvents[index])
    })
  }

  destroyDesktop() {
    window.removeEventListener('resize', this.checkSize);
    window.removeEventListener('resize', this.getPosition);
    window.removeEventListener('resize', this.setPosition);
    this.$parent.removeAttribute('style');
    this.$cards.forEach(($card, index) => {
      gsap.set($card, {clearProps:'all'});
      $card.removeEventListener('click', this.clickEvents[index])
    })
  }

  destroyMobile() {
    window.removeEventListener('resize', this.checkSize)
    this.$triggers.forEach(($trigger, index) => {
      this.$cards[index].classList.remove('is-active');
      this.$content[index].removeAttribute('style');
      $trigger.removeEventListener('click', this.clickEvents[index])
    })
  }

  destroy() {
    if(this.flag) this.destroyDesktop();
    else this.destroyMobile();
    window.removeEventListener('resize', this.check);
    for(let child in this) delete this[child];
  }
}

class DevelopmentSlider {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
    this.$slider = this.$parent.querySelector('.swiper-container');
    this.$prev = this.$parent.querySelector('.swiper-button-prev');
    this.$next = this.$parent.querySelector('.swiper-button-next');
    this.$pagination = this.$parent.querySelector('.swiper-pagination');

    this.slider = new Swiper(this.$slider, {
      loop: true,
      speed: 300,
      lazy: {
        loadOnTransitionStart: true,
        loadPrevNext: true
      },
      pagination: {
        el: this.$pagination,
        clickable: true,
        bulletElement: 'button'
      },
      navigation: {
        prevEl: this.$prev,
        nextEl: this.$next
      }
    });


  }

  destroy() {
    this.slider.destroy();
    for(let child in this) delete this[child];
  }
}

class TeamCard {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
    this.$container = this.$parent.querySelector('.team-card__container')

    this.clickEvent = () => {
      if(mobile() && !this.$container.classList.contains('is-active')) {
        this.$container.classList.add('is-active');
      } else if(mobile() && this.$container.classList.contains('is-active')) {
        this.$container.classList.remove('is-active');
      }
    }

    this.$container.addEventListener('click', this.clickEvent)
  }

  destroy() {
    this.$container.removeEventListener('click', this.clickEvent)
  }
}

class WhatIsIncludedSlider {
  constructor($parent) {
    this.$parent = $parent;
  }
  init() {
    this.check = ()=> {
      if(window.innerWidth >= brakepoints.lg && (!this.initialized || !this.flag)) {
        if(this.initialized) {
          this.destroyMobile();
        }
        this.flag = true;
      } 
      else if(window.innerWidth<brakepoints.lg && (!this.initialized || this.flag)) {
        this.initMobile();
        this.flag = false;
      }
    }
    this.check();
    window.addEventListener('resize', this.check);
    this.initialized = true;
  }

  initMobile() {
    this.$slider = this.$parent.querySelector('.swiper-container');
    this.$prev = this.$parent.querySelector('.swiper-button-prev');
    this.$next = this.$parent.querySelector('.swiper-button-next');

    this.slider = new Swiper(this.$slider, {
      speed: 300,
      slidesPerView: 1,
      navigation: {
        prevEl: this.$prev,
        nextEl: this.$next
      },
      breakpoints: {
        [brakepoints.sm]: {
          slidesPerView: "auto"
        }
      }
    });
  }

  destroyMobile() {
    this.slider.destroy();
  }

  destroy() {
    if(!this.flag) this.destroyMobile();
    window.removeEventListener('resize', this.check);
    for(let child in this) delete this[child];
  }
}