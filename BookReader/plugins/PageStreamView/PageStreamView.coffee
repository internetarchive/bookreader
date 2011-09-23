class PageStreamViewPlugin
	constructor: () ->
		$.extend this,
			reader: null
			container: null
			viewContainer: null
			imageContainer: null
			currentIndex: 0
			previousIndex: null
			imageElements: []
			reductionFactors: []
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
		
		@prepareView()
		
		@reader.parentElement.bind 'br_indexUpdated.PageStreamViewPlugin', (e, data) =>
			@eventIndexUpdated(data)
			
		@container.bind 'br_left.PageStreamViewPlugin', () =>
			console.log "br_left"
			if @currentIndex > @firstDisplayableIndex()
				@reader.jumpToIndex @currentIndex-1

		@container.bind 'br_right.PageStreamViewPlugin', () =>
			console.log "br_right"
			if @currentIndex < @lastDisplayableIndex()
				@reader.jumpToIndex @currentIndex+1

		@currentIndex = @firstDisplayableIndex()
		@currentIndex = 0 if @currentIndex < 0
		@refresh()
		
	buildImage: (index) ->
		if index < 0 or index == NaN
			return $("<div class='empty-page'></div>")
		console.log index
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
	showCurrentIndex: (options) ->
		@previousIndex ?= 0
		newScrollPosition = @imageElements[@currentIndex].offset().top # - @container.offset().top + @container.scrollTop()
		oldScrollPosition = @imageElements[@previousIndex].offset().top #- @container.offset().top + @container.scrollTop()

		if options? and options.animate == false
			@container.animate
				scrollTop:  newScrollPosition
			, 'fast'
		else
			@container.animate
				scrollTop: newScrollPosition
			, 'slow'

	drawLeafs: () ->
		# this will draw the pages that are visible in the current viewport
		@show() # for now

	zoom: (direction) ->
		# handles zooming 'in' or 'out'
	
	prepareView: () ->
		startLeaf = @reader.currentIndex()

		@container.empty()
		@container.css
			overflowY: 'scroll'
			overflowX: 'auto'

		# Attaches to first child - child must be present
		@container.dragscrollable()
		@reader.bindGestures @container

		@reader.resizePageView()    

		@reader.jumpToIndex startLeaf
		@reader.displayedIndices = []
		
	calculateReductionFactors: () ->
		@reductionFactors = @reductionFactors.concat [
			reduce: @getAutofitWidth()
			autofit: 'width'
		,
			reduce: @getAutofitHeight()
			autofit: 'height'
		]
		@reductionFactors.sort (a,b) -> a.reduce - b.reduce

	getAutofitWidth: () ->
		widthPadding = 20
		(@reader.getMedianPageSize().width + 0.0)/(@container.attr('clientWidth') - widthPadding * 2)
		
	getAutofitHeight: () ->
		(@reader.getMedianPageSize().height + 0.0)/(@container.attr('clientHeight') - @reader.padding * 2)

	###
	* eventIndexUpdated()
	*
	* eventIndexUpdated() will update the current index and the DOM. This is where
	* page turning animations can be tied in.
	###
	eventIndexUpdated: (data) ->
		if @previousIndex != data.newIndex  && @imageElements[data.newIndex]?
			@previousIndex = @currentIndex
			@currentIndex = data.newIndex
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
			return if @reader.getPageSide(0) == 'L' then 0 else -1
		else
			return if @reader.getPageSide(0) == 'R' then 0 else -1

	lastDisplayableIndex: () ->
		lastIndex = @reader.getNumPages() - 1

		if @reader.pageProgression != 'rl'
			return if @reader.getPageSide(lastIndex) == 'R' then lastIndex else lastIndex + 1
		else
			return if @reader.getPageSide(lastIndex) == 'L' then lastIndex else lastIndex + 1

	hide: () ->
		@viewContainer.empty() if @viewContainer?
		@imageElements = []
		
	show: () ->
		@viewContainer ?= $("<div class='page-stream-view'></div>")

		for i in [ @firstDisplayableIndex() .. @lastDisplayableIndex() ]
			@viewContainer.append @buildImage(i) unless @imageElements[i]?
		
		@container.append @viewContainer
		
		@showCurrentIndex
			animate: false
	
	destroy: () ->

this.PageStreamViewPlugin = PageStreamViewPlugin

PageStreamViewPlugin.manifest =
	type: 'view'
	cssClass: 'page-stream-view'

BookReader.registerPlugin "page-stream-view", PageStreamViewPlugin