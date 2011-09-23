class PageStreamViewPlugin
	constructor: () ->
		$.extend this,
			reader: null
			container: null
			imageElement: null
			viewContainer: null
			imageContainer: null
			currentIndex: null
			previousIndex: null
			imageElements: []
			params:
				autofit: 'height'

	###
* init(bookReaderObject, parentElement)
*
* input: bookReaderObject representing the core book reader manager
*        parentElement representing the HTML DOM element within which the plugin can do what it wants
*
* init(...) will initialize the DOM and display the page associated with the current index
*
	###
	init: (bookReaderObject, parentElement) ->
		@reader = bookReaderObject
		@container = $(parentElement)
		
		@reader.parentElement.bind 'br_indexUpdated.PageStreamViewPlugin', (data) =>
			@previousIndex = @currentIndex
			@eventIndexUpdated()
			
		@container.bind 'br_left.PageStreamViewPlugin', () =>
			if @currentIndex > @firstDisplayableIndex()
				@reader.jumpToIndex @currentIndex-1

		@container.bind 'br_right.PageStreamViewPlugn', () =>
			if @currentIndex < @lastDisplayableIndex()
				@reader.jumpToIndex @currentIndex+1

		@currentIndex = @reader.currentIndex() or @firstDisplayableIndex()
		@refresh()
		
	buildImage: (index) ->
		imageElement = $("<img />")
		imageContainer = $("<div class='image'></div>")
		imageContainer.append imageElement

		imageElement.bind 'mousedown', (e) => false
		
		imageElement.attr
			height: @reader.getPageHeight(index) / @pageScale()
			width: @reader.getPageWidth(index) / @pageScale()
			src: @reader.getPageURI index, @pageScale()
		
		@imageElements[index] = imageElement
		imageContainer
	
	pageScale: () ->
		return @reader.pageScale if @reader.pageScale?
		1
		
	refresh: () ->
		@hide()
		@show()

	###
* showCurrentIndex()
*
* showCurrentIndex() will update the height, width, and href attributes of the <img/>
* tag that is displaying the current page
	###
	showCurrentIndex: () ->
		@container.animate
			scrollTop: @imageElements[@currentIndex].position().top - @container.offset().top + @container.scrollTop()

	###
* eventIndexUpdated()
*
* eventIndexUpdated() will update the current index and the DOM. This is where
* page turning animations can be tied in.
	###
	eventIndexUpdated: () ->
		@currentIndex = @reader.currentIndex()
		@showCurrentIndex()

	eventResize: () ->
		@reader.resizePageView() if @reader.autofit
		@reader.centerPageView()
		# $('#BRpageview').empty()
		@reader.displayedIndices = []
		@reader.updateSearchHilites() # deletes hilights but does not call remove()
		@reader.loadLeafs()

	firstDisplayableIndex: () ->
		if @reader.pageProgression != 'rl'
			return if @reader.getPageSide(0) == 'L' then 1 else 0
		else
			return if @reader.getPageSide(0) == 'R' then 1 else 0

	lastDisplayableIndex: () ->
		lastIndex = @reader.getNumPages() - 1

		if @reader.pageProgression != 'rl'
			return if @reader.getPageSide(lastIndex) == 'R' then lastIndex else lastIndex + 1
		else
			return if @reader.getPageSide(lastIndex) == 'L' then lastIndex else lastIndex + 1

	hide: () ->
		@container.empty()
		
	show: () ->
		@viewContainer = $("<div class='page-stream-view'></div>")

		for i in [ @firstDisplayableIndex() .. @lastDisplayableIndex() ]
			@viewContainer.append @buildImage(i)
		
		@container.append @viewContainer
		
		@showCurrentIndex()
	
	destroy: () ->

this.PageStreamViewPlugin = PageStreamViewPlugin

PageStreamViewPlugin.params =
	type: 'view'
	#cssClass: 'page-stream'
	cssClass: 'page-stream-view'

BookReader.registerPlugin "page-stream-view", PageStreamViewPlugin