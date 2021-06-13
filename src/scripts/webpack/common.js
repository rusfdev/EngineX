const Dev = false;

import 'lazysizes';
import {gsap} from "gsap";
gsap.defaults({
  duration: 1,
  ease: 'power2.inOut'
});
import scrollLock from 'scroll-lock';
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
})

window.onload = function() {
  Preloader.init();
}

window.addEventListener('beforeEnter', function(event) {
  ActiveInstances.add(HeadAnimation, '.page-head', event.detail.container);
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
        this.dots_animations[0] = gsap.timeline()
          .fromTo(this.$dots, {autoAlpha:0}, {autoAlpha:1, duration:0.35, ease:'none', stagger:{grid:[row_count, column_count], from:"random", amount:2}})

        if(!Dev) {
          this.dots_animations[1] = gsap.timeline({repeat:-1, yoyo:true})
          .to(this.$dots, {autoAlpha:0, duration:0.35, ease:'none', stagger:{grid:[row_count, column_count], from:"random", amount:4}})
        
          this.dots_animations[2] = gsap.timeline({repeat:-1, yoyo:true})
            .to(this.$dots, {autoAlpha:1, duration:0.35, ease:'none', stagger:{grid:[row_count, column_count], from:"random", amount:4}})
        }
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