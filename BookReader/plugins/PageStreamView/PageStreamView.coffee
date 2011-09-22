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

		@refresh()
		
	buildImage: (index) ->
		imageElement = $("<img />")
		imageContainer = $("<div class='image'></div>")
		imageContainer.append imageElement

		imageElement.bind 'mousedown', (e) => false
		
		imageElement.attr
			height: @reader.getPageHeight index
			width: @reader.getPageWidth index
			src: @reader.getPageURI index

		imageContainer
		
	refresh: () ->
		@container.empty()
		
		@viewContainer = $("<div class='page-stream-view'></div>")

		for i in [ @firstDisplayableIndex() .. @lastDisplayableIndex() ]
			@viewContainer.append @buildImage(i)
		
		#@viewContainer.append @imageContainer
		@container.append @viewContainer

		# the purpose of this is to disable selection of the image (makes it turn blue)
		# but this also interferes with right-click.  See https://bugs.edge.launchpad.net/gnubook/+bug/362626
		#@imageElement.bind 'mousedown', (e) => false
		
		#@showCurrentIndex()



		###
* We may need to bind to events that handle advancing and retreating pages
* since the presentation/view plugin knows how many pages are being shown
		###
#		@showCurrentIndex()
	
	###
* showCurrentIndex()
*
* showCurrentIndex() will update the height, width, and href attributes of the <img/>
* tag that is displaying the current page
	###
	showCurrentIndex: () ->

#		@imageElement.attr 
#			height: @reader.getPageHeight @currentIndex
#			width: @reader.getPageWidth @currentIndex
#			src: @reader.getPageURI @currentIndex
#		@viewContainer.width @reader.getPageWidth @currentIndex
#		@imageContainer.width @reader.getPageWidth @currentIndex

	###
* eventIndexUpdated()
*
* eventIndexUpdated() will update the current index and the DOM. This is where
* page turning animations can be tied in.
	###
	eventIndexUpdated: () ->
		@currentIndex = @reader.getCurrentIndex()
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

this.PageStreamViewPlugin = PageStreamViewPlugin

PageStreamViewPlugin.params =
	autofit: 'height'

BookReader.registerPlugin PageStreamViewPlugin