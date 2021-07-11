setTimeout(function () {
  var splitter = document.getElementsByClassName("vue-splitter");
  if (undefined!=splitter) {
    for (var i = 0, len=splitter.length; i < len; i++) {
      splitter[i].remove(); 
    }
  }
}, 2500);
