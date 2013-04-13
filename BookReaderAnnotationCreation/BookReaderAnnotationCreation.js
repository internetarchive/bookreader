(function($) {
$(function() {

var BookReaderAnnotationCreation = function() {
  this.$ = $('#BookReaderAnnotationCreation');
  this.bind_dom_handlers();

  this.max_img_width = 480;
  this.max_img_height = 640;
  this.img_scale = 1;

  this.data = {};
}

BookReaderAnnotationCreation.prototype.bind_dom_handlers = function() {
  this.$.off('.brac')
    .on('change.brac', '#image-file-button', this.dom_handlers.image_file_change.bind(this))
    .on('mousedown.brac', '#annotation-image', this.dom_handlers.start_drag.bind(this))
    .on('change.brac', '#page-number, #annotation-content', this.update_data.bind(this));

  $(document).off('.brac')
    .on('mousemove.brac', this.dom_handlers.update_drag.bind(this))
    .on('mouseup.brac', this.dom_handlers.end_drag.bind(this));
}

BookReaderAnnotationCreation.prototype.dom_handlers = {
   image_file_change: function(e) {
    if (e.target.files && e.target.files.length) {
      this.load_image_from_file(e.target.files[0]);
      this.clear_inputs();
    }
  }
  ,start_drag: function(e) {
    this.dragging = true;
    $('body').addClass('unselectable');
    $(document).on('mousemove.brac', this.dom_handlers.update_drag.bind(this));
    console.log('start drag');
  }
  ,update_drag: function(e) {
    if (!this.dragging) { return; }
    this.$.find('#annotation-content').val(
      'client: ' + e.clientX + '/' + e.clientY + '\n' +
      'page: ' + e.pageX + '/' + e.pageY + '\n' +
      'screen: ' + e.screenX + '/' + e.screenY + '\n'
    );
  }
  ,end_drag: function(e) {
    this.dragging = false;
    $('body').removeClass('unselectable');
    $(document).off('mousemove.brac');
    console.log('end drag');
  }
}

BookReaderAnnotationCreation.prototype.update_data = function() {
  var page_num = Number($.trim(this.$.find('#page-number').val()));
  if (typeof page_num !== 'number' || page_num !== page_num) { return; }
}

BookReaderAnnotationCreation.prototype.clear_inputs = function() {
  this.$.find('#page-number').removeAttr('disabled').val('');
  this.$.find('#annotation-content').removeAttr('disabled').val('');
}

BookReaderAnnotationCreation.prototype.load_image_from_file = function(file) {
  if (!file.type.match(/image.*/)) { return; }

  var $img = $('<img>');
  $img.get(0).file = file;

  var reader = new FileReader();
  reader.onload = function(e) {
    // put the image on the page
    $img.get(0).src = e.target.result;
    $img.on('mousedown', function() { return false; });
    this.$.find('#annotation-image')
      .html('')
      .append($img)
      .css({
         display: 'inline-block'
        ,position: 'fixed'
        ,top: '-9999px'
      });

    // does the image need to be scaled?
    setTimeout(function() { // hack to make sure the img is in the DOM
      this.img_scale = 1;
      if ($img.height() > this.max_img_height) {
        this.img_scale = this.max_img_height / $img.height();
      }
      if ($img.width() > this.max_img_width) {
        this.img_scale = Math.min(this.img_scale, this.max_img_width / $img.width());
      }

      // scale image to new dimensions
      var new_height = $img.height() * this.img_scale;
      var new_width = $img.width() * this.img_scale;
      $img.height(new_height);
      $img.width(new_width);

      $img.closest('#annotation-image').css({
         position: 'relative'
        ,top: 'auto'
      });
    }.bind(this), 1);
  }.bind(this);

  reader.readAsDataURL(file);
}

new BookReaderAnnotationCreation();

});
})(jQuery);