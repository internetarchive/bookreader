(function($) {
$(function() {

var BookReaderAnnotationCreation = function() {
  this.$ = $('#BookReaderAnnotationCreation');
  this.bind_dom_handlers();

  this.max_img_width = 480;
  this.max_img_height = 640;
  this.img_scale = 1;

  this.data = {};
  this.annotation = {};
}

BookReaderAnnotationCreation.prototype.bind_dom_handlers = function() {
  this.$.off('.brac')
    .on('change.brac'   , '#image-file-button', this.dom_handlers.image_file_change.bind(this))
    .on('mousedown.brac', '#annotation-image > img', this.dom_handlers.start_annotation_drawing.bind(this))
    .on('mousedown.brac', '#annotation-image > .annotation', this.dom_handlers.start_annotation_dragging.bind(this))
    .on('change.brac'   , '#page-number, #annotation-content', this.update_data.bind(this));

  $(document).on('mouseup.brac', this.dom_handlers.end_mousedrag.bind(this));
}

BookReaderAnnotationCreation.prototype.dom_handlers = {
   image_file_change: function(e) {
    if (e.target.files && e.target.files.length) {
      this.clean_slate();
      this.load_image_from_file(e.target.files[0]);
    }
  }
  ,end_mousedrag: function(e) {
    if (this.drawing) { // mousedrag might be for drawing or for annotation dragging
      return this.dom_handlers.end_annotation_drawing.call(this, e);
    } else if (this.dragging) {
      return this.dom_handlers.end_annotation_dragging.call(this, e);
    }
  }
  ,start_annotation_drawing: function(e) {
    this.drawing = true;
    $('body').addClass('unselectable');

    this.annotation.$ = $('<div>').addClass('annotation').appendTo('#annotation-image');
    this.annotation.start_coords = this.utils.bound_coordinates(e.clientX, e.clientY, $('#annotation-image > img'));

    $(document).on('mousemove.brac', this.dom_handlers.update_annotation_drawing.bind(this));
    e.stopPropagation();
    return false;
  }
  ,update_annotation_drawing: function(e) {
    if (!this.drawing) { return; }
    this.annotation.end_coords = this.utils.bound_coordinates(e.clientX, e.clientY, $('#annotation-image > img'));
    this.annotation.$.css({
       display: 'block'
      ,left:   Math.min(this.annotation.start_coords.x, this.annotation.end_coords.x) + 'px'
      ,top:    Math.min(this.annotation.start_coords.y, this.annotation.end_coords.y) + 'px'
      ,width:  Math.abs(this.annotation.start_coords.x - this.annotation.end_coords.x) + 'px'
      ,height: Math.abs(this.annotation.start_coords.y - this.annotation.end_coords.y) + 'px'
    });
  }
  ,end_annotation_drawing: function(e) {
    this.drawing = false;
    $('body').removeClass('unselectable');
    $(document).off('mousemove.brac');
  }
  ,start_annotation_dragging: function(e) {
    this.dragging = true;
    $('body').addClass('unselectable');
    e.stopPropagation();
    return false;
  }
  ,udpate_annotation_dragging: function(e) {
    if (!this.dragging) { return; }
  }
  ,end_annotation_dragging: function(e) {
    this.dragging = false;
    $('body').removeClass('unselectable');
    $(document).off('mousemove.brac');
  }
}

BookReaderAnnotationCreation.prototype.update_data = function() {
  var page_num = Number($.trim(this.$.find('#page-number').val()));
  if (typeof page_num !== 'number' || page_num !== page_num) { return; }
}

BookReaderAnnotationCreation.prototype.clean_slate = function() {
  this.$.find('#page-number').removeAttr('disabled').val('');
  this.$.find('#annotation-content').removeAttr('disabled').val('');
  this.annotation = {};
  this.img_scale = 1;
}

BookReaderAnnotationCreation.prototype.load_image_from_file = function(file) {
  if (!file.type.match(/image.*/)) { return; }

  var $img = $('<img>');
  $img.get(0).file = file;

  var reader = new FileReader();
  reader.onload = function(e) {
    // put the image on the page
    $img.get(0).src = e.target.result;
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

BookReaderAnnotationCreation.prototype.utils = {
  // binds viewport coordinates to a given element
  bound_coordinates: function(x, y, $el) {
    return {
       x: Math.min(Math.max(x - $el.offset().left, 0), $el.width())
      ,y: Math.min(Math.max(y - $el.offset().top, 0), $el.height())
    };
  }
}

new BookReaderAnnotationCreation();

});
})(jQuery);