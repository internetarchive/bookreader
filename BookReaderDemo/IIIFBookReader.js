// Bind to the BookReader object providing facilities to set the necessary
// BookReader functions from a IIIF endpoint URL.
// author: @aeschylus

// TODO enable passing in manifest and sequence id directly
// TODO convert this to be a v3 plugin. Use simplified options.data

(function(BR){

    BR.prototype.IIIF = function (config) {
        // config should have the url of a sequence
        // within a passed-in manifest.
        var brInstance = this;
        brInstance.IIIFsequence = {
            title: null,
            imagesList: [],
            numPages: null,
            bookUrl: null
        };
        oldInit = brInstance.init;
        oldMode = brInstance.mode;
        brInstance.init = function() {
            load(config);
        };
        brInstance.mode = 2;

        function bindBRMethods(){
            brInstance.getPageNum = function(index) {
                return index+1;
            };

            brInstance.getSpreadIndices = function(pindex) {
                var spreadIndices = [null, null];
                if ('rl' == brInstance.pageProgression) {
                    // Right to Left
                    if (brInstance.getPageSide(pindex) == 'R') {
                        spreadIndices[1] = pindex;
                        spreadIndices[0] = pindex + 1;
                    } else {
                        // Given index was LHS
                        spreadIndices[0] = pindex;
                        spreadIndices[1] = pindex - 1;
                    }
                } else {
                    // Left to right
                    if (brInstance.getPageSide(pindex) == 'L') {
                        spreadIndices[0] = pindex;
                        spreadIndices[1] = pindex + 1;
                    } else {
                        // Given index was RHS
                        spreadIndices[1] = pindex;
                        spreadIndices[0] = pindex - 1;
                    }
                }

                return spreadIndices;
            };

            brInstance.getPageSide = function(index) {
                if (0 == (index & 0x1)) {
                    return 'R';
                } else {
                    return 'L';
                }
            };

            brInstance.getPageHeight = function(index) {
                // console.log(index);
                var fullWidth = brInstance.IIIFsequence.imagesList[index].width,
                fullHeight = brInstance.IIIFsequence.imagesList[index].height,
                scaleRatio = config.maxWidth/fullWidth;

                return fullHeight*scaleRatio;
            };

            brInstance.getPageWidth = function(index) {
                var fullWidth = brInstance.IIIFsequence.imagesList[index].width,
                scaleRatio = config.maxWidth/fullWidth;

                return fullWidth*scaleRatio;
            };

            brInstance.getPageURI = function(index) {
                // Finds the image info.json url
                // from the loaded sequence and returns the
                // IIIF-formatted url for the page image
                // based on the provided configuration object
                // (adjusting for width, etc.).
                var infoJsonUrl = brInstance.IIIFsequence.imagesList[index].imageUrl;
                var url = infoJsonUrl + "/full/" + config.maxWidth + ",/0/native.jpg";
                return url;
            };

        }

        function load(config) {

            let endpointUrl = config.url,
            sequenceId = config.sequenceId;

            jQuery.ajax({
                url: endpointUrl.replace(/^\s+|\s+$/g, ''),
                dataType: 'json',
                async: true,

                success: function(jsonLd) {
                    brInstance.jsonLd = jsonLd;
                    brInstance.bookTitle = jsonLd.label;
                    brInstance.bookUrl = '#';
                    brInstance.thumbnail = jsonLd.thumbnail['@id'];
                    brInstance.metadata = jsonLd.metadata;
                    parseSequence(sequenceId);
                    bindBRMethods();

                    // Call the old initialisation after
                    // the urls are finished. A better implementation
                    // would be to employ promises (Likely by including
                    // the Q Promises/A+ implementation. See issue #1 at
                    // github.
                    oldInit.call(brInstance);

                    if (config.initCallback) {
                      config.initCallback.apply();
                    }

                    // // The following is an attrocious hack and must not
                    // // be allowed to persist. See issue #2 at github.com
                    // setTimeout(function() { jQuery(window).trigger('resize'); console.log("resize event fired")}, 2500);
                },

                error: function() {
                    console.log('Failed loading ' + brInstance.uri);
                }

            });

        }

        function parseSequence(sequenceId) {

            jQuery.each(brInstance.jsonLd.sequences, function(index, sequence) {
                if (sequence['@id'] === sequenceId) {
                    brInstance.IIIFsequence.title = "here's a sequence";
                    brInstance.IIIFsequence.bookUrl = "http://iiif.io";
                    brInstance.IIIFsequence.imagesList = getImagesList(sequence);
                    brInstance.numLeafs = brInstance.IIIFsequence.imagesList.length;
                }
            });

            delete brInstance.jsonLd;

        }

        function getImagesList(sequence) {
            var imagesList = [];

            jQuery.each(sequence.canvases, function(index, canvas) {
                var imageObj;

                if (canvas['@type'] === 'sc:Canvas') {
                    var images = canvas.resources || canvas.images;

                    jQuery.each(images, function(index, image) {
                        if (image['@type'] === 'oa:Annotation') {
                            imageObj = getImageObject(image);
                            imageObj.canvasWidth = canvas.width;
                            imageObj.canvasHeight = canvas.height;

                            if (!(/#xywh/).test(image.on)) {
                                imagesList.push(imageObj);
                            }
                        }
                    });

                }
            });

            return imagesList;
        }

        function getImageObject (image) {
            var resource = image.resource;

            if (resource.hasOwnProperty('@type') && resource['@type'] === 'oa:Choice') {
                var imageObj = getImageProperties(resource.default);
            } else {
                imageObj = getImageProperties(resource);
            }

            return(imageObj);
        }

        function getImageProperties(image) {
            var imageObj = {
                height:       image.height || 0,
                width:        image.width || 0,
                imageUrl:     image.service['@id'].replace(/\/$/, ''),
            };

            imageObj.aspectRatio  = (imageObj.width / imageObj.height) || 1;

            return imageObj;
        }

    };

})(BookReader);
