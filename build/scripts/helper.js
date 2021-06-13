window.addEventListener('load', ()=>{
  Helper.init();
})


const Helper = {
  init: function() {
    let $block = document.querySelector('.helper'),
        $trigger = $block.querySelector('.helper__trigger'),
        state;

    let open = ()=> {
      state = true;
      $block.classList.add('active');
    }
    let close = ()=> {
      state = false;
      $block.classList.remove('active');
    }

    $trigger.addEventListener('click', ()=>{
      if(!state) open()
      else close()
    })
  }
}
