class SinglePageViewPlugin
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
		
		@reader.parentElement.bind 'br_indexUpdated.SinglePageViewPlugin', (data) =>
			@previousIndex = @currentIndex
			@eventIndexUpdated()
			
		@container.bind 'br_left.SinglePageViewPlugin', () =>
			if @currentIndex > @firstDisplayableIndex()
				@reader.jumpToIndex @currentIndex-1

		@container.bind 'br_right.SinglePageViewPlugin', () =>
			if @currentIndex < @lastDisplayableIndex()
				@reader.jumpToIndex @currentIndex+1

		@refresh()
		
	refresh: () ->
		@container.empty()
		
		@viewContainer = $("<div class='single-page-view'></div>")

		@imageElement = $("<img />")
		@imageContainer = $("<div class='image'></div>")
		@imageContainer.append @imageElement
		@viewContainer.append @imageContainer
		@container.append @viewContainer

		@showCurrentIndex()



		###
* We may need to bind to events that handle advancing and retreating pages
* since the presentation/view plugin knows how many pages are being shown
		###
		@showCurrentIndex()
	
	###
* showCurrentIndex()
*
* showCurrentIndex() will update the height, width, and href attributes of the <img/>
* tag that is displaying the current page
	###
	showCurrentIndex: () ->
		@imageElement.attr 
			height: @reader.getPageHeight @currentIndex
			width: @reader.getPageWidth @currentIndex
			src: @reader.getPageURI @currentIndex
		@viewContainer.width @reader.getPageWidth @currentIndex
		@imageContainer.width @reader.getPageWidth @currentIndex

	###
* eventIndexUpdated()
*
* eventIndexUpdated() will update the current index and the DOM. This is where
* page turning animations can be tied in.
	###
	eventIndexUpdated: () ->
		@currentIndex = @reader.getCurrentIndex()
		@showCurrentIndex()

	firstDisplayableIndex: () -> 1
#		if @reader.pageProgression != 'rl'
#			return if @reader.getPageSide(0) == 'L' then 0 else -1
#		else
#			return if @reader.getPageSide(0) == 'R' then 0 else -1

	lastDisplayableIndex: () -> @reader.getNumPages() - 1
#		lastIndex = @reader.getNumPages() - 1
#
#		if @reader.pageProgression != 'rl'
#			return @reader.getPageSide(lastIndex) == 'R' then lastIndex else lastIndex + 1
#		else
#			return @reader.getPageSide(lastIndex) == 'L' then lastIndex else lastIndex + 1

this.SinglePageViewPlugin = SinglePageViewPlugin

SinglePageViewPlugin.params =
	autofit: 'height'

BookReader.registerPlugin SinglePageViewPlugin