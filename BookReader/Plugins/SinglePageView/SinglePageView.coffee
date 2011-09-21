class SinglePageViewPlugin
	constructor: () ->
		@bookReaderObject = null
		@parentElement = null
		@imageElement = null
		@currentIndex = null
		@previousIndex = null

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
		@bookReaderObject = bookReaderObject
		@parentElement = parentElement

		@viewContainer = $("<div class='single-page-view'></div>")

		leftPageEl = $("<div class='left-page'></div>")
		rightPageEl = $("<div class='right-page'></div>")
		@imageElement = $("<img />")
		@imageContainer = $("<div class='image'></div>")
		@imageContainer.append @imageElement
		@viewContainer.append leftPageEl
		@viewContainer.append rightPageEl
		@viewContainer.append @imageContainer
		@parentElement.append @viewContainer

		@currentIndex = @bookReaderObject.getCurrentIndex()

		@bookReaderObject.parentElement.bind 'indexUpdated', (data) =>
			@previousIndex = @currentIndex
			@currentIndex = @bookReaderObject.getCurrentIndex()
			@eventIndexUpdated()
			
		@parentElement.bind 'left', () =>
			if @currentIndex > 1
				@bookReaderObject.jumpToIndex @currentIndex-1

		parentElement.bind 'right', () =>
			if @currentIndex < @bookReaderObject.getNumPages()
				@bookReaderObject.jumpToIndex @currentIndex+1
				
		leftPageEl.bind 'click', () =>
			@parentElement.trigger 'left'

		rightPageEl.bind 'click', () =>
			@parentElement.trigger 'right'

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
			height: @bookReaderObject.getPageHeight @currentIndex
			width: @bookReaderObject.getPageWidth @currentIndex
			src: @bookReaderObject.getPageURI @currentIndex
		@viewContainer.width 40 + @bookReaderObject.getPageWidth @currentIndex
		@imageContainer.width @bookReaderObject.getPageWidth @currentIndex

	###
* eventIndexUpdated()
*
* eventIndexUpdated() will update the current index and the DOM. This is where
* page turning animations can be tied in.
	###
	eventIndexUpdated: () ->
		@showCurrentIndex()

this.SinglePageViewPlugin = SinglePageViewPlugin
if br?
	br.registerPluginClass SinglePageViewPlugin