// All variables specific to translation service
var translationService, responseOptions, input = undefined;
// A map of language-pair to TranslationModel object
var translationModels = new Map();

// "https://cors.archive.org/download/mozilla-translate-models/";
const BERGAMOT_TRANSLATOR_MODULE = "/BookReader/translate/bergamot-translator-worker.js";
const MODEL_REGISTRY = "https://cors.archive.org/download/mozilla-translate-models/registry.json"; // "/BookReader/translate/registry.json";
const rootURL = "";
let version = null;
let modelRegistry = null;

const encoder = new TextEncoder(); // string to utf-8 converter
const decoder = new TextDecoder(); // utf-8 to string converter

const start = Date.now();
let moduleLoadStart;
var Module = {
  preRun: [function() {
    log(`Time until Module.preRun: ${(Date.now() - start) / 1000} secs`);
    moduleLoadStart = Date.now();
  }],
  onRuntimeInitialized: async function() {
    log(`Wasm Runtime initialized Successfully (preRun -> onRuntimeInitialized) in ${(Date.now() - moduleLoadStart) / 1000} secs`);
    resp = await fetch(MODEL_REGISTRY);
    modelRegistry = await resp.json();
    postMessage([`import_reply`, modelRegistry, version]);
  }
};

const log = (message) => {
  console.debug(message);
}

const isExprimental = (from, to) => {
  return `${from}${to}` in modelRegistry && modelRegistry[`${from}${to}`]["model"].modelType === "dev"
}

onmessage = async function(e) {
  const command = e.data[0];
  log(`Message '${command}' received from main script`);
  let result = "";
  if (command === 'import') {
      importScripts(BERGAMOT_TRANSLATOR_MODULE);
  } else if (command === 'load_model') {
      let start = Date.now();
      let from = e.data[1];
      let to = e.data[2];
      try {
        await constructTranslationService();
        await constructTranslationModel(from, to);
        log(`Model '${from}${to}' successfully constructed. Time taken: ${(Date.now() - start) / 1000} secs`);
        result = "Model successfully loaded";
        if (isExprimental(from, to) || isExprimental(from, 'en') || isExprimental('en', to)) {
          result +=  ". This model is experimental"
        }
      } catch (error) {
        log(`Model '${from}${to}' construction failed: '${error.message}'`);
        result = "Model loading failed";
      }
      log(`'${command}' command done, Posting message back to main script`);
      postMessage([`${command}_reply`, result, from, to]);
  } else if (command === 'translate') {
      const from = e.data[1];
      const to = e.data[2];
      const inputParagraphs = e.data[3];
      const selector = e.data[4];
      let inputWordCount = 0;
      inputParagraphs.forEach(sentence => {
        inputWordCount += sentence.trim().split(" ").filter(word => word.trim() !== "").length;
      })
      let start = Date.now();
      try {
        result = translate(from, to, inputParagraphs);
        const secs = (Date.now() - start) / 1000;
        log(`Translation '${from}${to}' Successful. Speed: ${Math.round(inputWordCount / secs)} WPS (${inputWordCount} words in ${secs} secs)`);
      } catch (error) {
        log(`Error: ${error.message}`);
      }
      log(`'${command}' command done, Posting message back to main script`);
      postMessage([`${command}_reply`, result, selector]);
  }
}

// This function downloads file from a url and returns the array buffer
const downloadAsArrayBuffer = async(url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw Error(`Downloading ${url} failed: HTTP ${response.status} - ${response.statusText}`);
  }
  return response.arrayBuffer();
}

// This function constructs and initializes the AlignedMemory from the array buffer and alignment size
const prepareAlignedMemoryFromBuffer = async (buffer, alignmentSize) => {
  var byteArray = new Int8Array(buffer);
  log(`Constructing Aligned memory. Size: ${byteArray.byteLength} bytes, Alignment: ${alignmentSize}`);
  var alignedMemory = new Module.AlignedMemory(byteArray.byteLength, alignmentSize);
  log(`Aligned memory construction done`);
  const alignedByteArrayView = alignedMemory.getByteArrayView();
  alignedByteArrayView.set(byteArray);
  log(`Aligned memory initialized`);
  return alignedMemory;
}

// Instantiate the Translation Service
const constructTranslationService = async () => {
  if (!translationService) {
    var translationServiceConfig = {};
    log(`Creating Translation Service with config: ${translationServiceConfig}`);
    translationService = new Module.BlockingService(translationServiceConfig);
    log(`Translation Service created successfully`);
  }
}

const constructTranslationModel = async (from, to) => {
  // Delete all previously constructed translation models and clear the map
  translationModels.forEach((value, key) => {
    log(`Destructing model '${key}'`);
    value.delete();
  });
  translationModels.clear();

  // If none of the languages is English then construct multiple models with
  // English as a pivot language.
  if (from !== 'en' && to !== 'en') {
    log(`Constructing model '${from}${to}' via pivoting: '${from}en' and 'en${to}'`);
    await Promise.all([constructTranslationModelInvolvingEnglish(from, 'en'),
                        constructTranslationModelInvolvingEnglish('en', to)]);
  }
  else {
    log(`Constructing model '${from}${to}'`);
    await constructTranslationModelInvolvingEnglish(from, to);
  }
}

const constructTranslationModelInvolvingEnglish = async (from, to) => {
  const languagePair = `${from}${to}`;

  /*Set the Model Configuration as YAML formatted string.
    For available configuration options, please check: https://marian-nmt.github.io/docs/cmd/marian-decoder/
    Vocab files are re-used in both translation directions for some models
    const vocabLanguagePair = from === "en" ? `${to}${from}` : languagePair;
    const modelConfig = `models:
      - /${languagePair}/model.${languagePair}.intgemm.alphas.bin
      vocabs:
      - /${languagePair}/vocab.${vocabLanguagePair}.spm
      - /${languagePair}/vocab.${vocabLanguagePair}.spm
      beam-size: 1
      normalize: 1.0
      word-penalty: 0
      max-length-break: 128
      mini-batch-words: 1024
      workspace: 128
      max-length-factor: 2.0
      skip-cost: true
      cpu-threads: 0
      quiet: true
      quiet-translation: true
      shortlist:
          - /${languagePair}/lex.${languagePair}.s2t
          - 50
          - 50
      `;
      */

  // TODO: gemm-precision: int8shiftAlphaAll (for the models that support this)
  // DONOT CHANGE THE SPACES BETWEEN EACH ENTRY OF CONFIG
  const modelConfig = `beam-size: 1
normalize: 1.0
word-penalty: 0
max-length-break: 128
mini-batch-words: 1024
workspace: 128
max-length-factor: 2.0
skip-cost: true
cpu-threads: 0
quiet: true
quiet-translation: true
gemm-precision: int8shiftAll
`;

  const commonPath = "https://cors.archive.org/cors/mozilla-translate-models";
  let modelFile = `${commonPath}/${modelRegistry[languagePair]["model"].name}`;
  const modelFileFallback = `https://cors.archive.org/cors/mozilla-translate-models/${modelRegistry[languagePair]["model"].name}`;

  let vocabFiles;
  const shortlistFile = `${commonPath}/${modelRegistry[languagePair]["lex"].name}`;
  if (("srcvocab" in modelRegistry[languagePair]) && ("trgvocab" in modelRegistry[languagePair])) {
        vocabFiles = [`${commonPath}/${modelRegistry[languagePair]["srcvocab"].name}`,
                      `${commonPath}/${modelRegistry[languagePair]["trgvocab"].name}`];
  }
  else {
    vocabFiles = [`${commonPath}/${modelRegistry[languagePair]["vocab"].name}`,
                  `${commonPath}/${modelRegistry[languagePair]["vocab"].name}`];
  }
  const uniqueVocabFiles = new Set(vocabFiles);
  log(`modelFile: ${modelFile}\nshortlistFile: ${shortlistFile}\nNo. of unique vocabs: ${uniqueVocabFiles.size}`);
  uniqueVocabFiles.forEach(item => log(`unique vocabFile: ${item}`));

  // Download the files as buffers from the given urls
  let start = Date.now();

  const downloadedBuffers = await Promise.all([
    downloadAsArrayBuffer(modelFile).catch(() => {
      console.log(`Failed to download from ${modelFile}, using fallback: ${modelFileFallback}`);
      return downloadAsArrayBuffer(modelFileFallback); // Ensure this is returned
    }),
    downloadAsArrayBuffer(shortlistFile)
  ]);

  const modelBuffer = downloadedBuffers[0];
  const shortListBuffer = downloadedBuffers[1];

  const downloadedVocabBuffers = [];
  for (let item of uniqueVocabFiles.values()) {
    downloadedVocabBuffers.push(await downloadAsArrayBuffer(item));
  }
  log(`Total Download time for all files of '${languagePair}': ${(Date.now() - start) / 1000} secs`);

  // Construct AlignedMemory objects with downloaded buffers
  let constructedAlignedMemories = await Promise.all([prepareAlignedMemoryFromBuffer(modelBuffer, 256),
                                                      prepareAlignedMemoryFromBuffer(shortListBuffer, 64)]);
  let alignedModelMemory = constructedAlignedMemories[0];
  let alignedShortlistMemory = constructedAlignedMemories[1];
  let alignedVocabsMemoryList = new Module.AlignedMemoryList;
  for(let item of downloadedVocabBuffers) {
    let alignedMemory = await prepareAlignedMemoryFromBuffer(item, 64);
    alignedVocabsMemoryList.push_back(alignedMemory);
  }
  for (let vocabs=0; vocabs < alignedVocabsMemoryList.size(); vocabs++) {
    log(`Aligned vocab memory${vocabs+1} size: ${alignedVocabsMemoryList.get(vocabs).size()}`);
  }
  log(`Aligned model memory size: ${alignedModelMemory.size()}`);
  log(`Aligned shortlist memory size: ${alignedShortlistMemory.size()}`);

  log(`Translation Model config: ${modelConfig}`);
  var translationModel = new Module.TranslationModel(modelConfig, alignedModelMemory, alignedShortlistMemory, alignedVocabsMemoryList);
  translationModels.set(languagePair, translationModel);
}

const translate = (from, to, paragraphs) => {
  // If none of the languages is English then perform translation with
  // English as a pivot language.
  if (from !== 'en' && to !== 'en') {
    log(`Translating '${from}${to}' via pivoting: '${from}en' -> 'en${to}'`);
    let translatedParagraphsInEnglish = translateInvolvingEnglish(from, 'en', paragraphs);
    return translateInvolvingEnglish('en', to, translatedParagraphsInEnglish);
  }
  else {
    log(`Translating '${from}${to}'`);
    return translateInvolvingEnglish(from, to, paragraphs);
  }
}

const translateInvolvingEnglish = (from, to, paragraphs) => {
  const languagePair = `${from}${to}`;
  if (!translationModels.has(languagePair)) {
    throw Error(`Please load translation model '${languagePair}' before translating`);
  }
  translationModel = translationModels.get(languagePair);

  // Instantiate the arguments of translate() API i.e. ResponseOptions and input (vector<string>)
  var responseOptions = new Module.ResponseOptions();
  let input = new Module.VectorString;

  // Initialize the input
  paragraphs.forEach(paragraph => {
    // prevent empty paragraph - it breaks the translation
    if (paragraph.trim() === "") {
      return;
    }
    input.push_back(paragraph.trim())
  })

  // Access input (just for debugging)
  log(`Input size: ${input.size()}`);

  // Translate the input, which is a vector<String>; the result is a vector<Response>
  let result = translationService.translate(translationModel, input, responseOptions);

  const translatedParagraphs = [];
  const translatedSentencesOfParagraphs = [];
  const sourceSentencesOfParagraphs = [];
  for (let i = 0; i < result.size(); i++) {
    translatedParagraphs.push(result.get(i).getTranslatedText());
    translatedSentencesOfParagraphs.push(getAllTranslatedSentencesOfParagraph(result.get(i)));
    sourceSentencesOfParagraphs.push(getAllSourceSentencesOfParagraph(result.get(i)));
  }

  responseOptions.delete();
  input.delete();
  return translatedParagraphs;
}

// This function extracts all the translated sentences from the Response and returns them.
const getAllTranslatedSentencesOfParagraph = (response) => {
  const sentences = [];
  const text = response.getTranslatedText();
  for (let sentenceIndex = 0; sentenceIndex < response.size(); sentenceIndex++) {
    const utf8SentenceByteRange = response.getTranslatedSentence(sentenceIndex);
    sentences.push(_getSentenceFromByteRange(text, utf8SentenceByteRange));
  }
  return sentences;
}

// This function extracts all the source sentences from the Response and returns them.
const getAllSourceSentencesOfParagraph = (response) => {
  const sentences = [];
  const text = response.getOriginalText();
  for (let sentenceIndex = 0; sentenceIndex < response.size(); sentenceIndex++) {
    const utf8SentenceByteRange = response.getSourceSentence(sentenceIndex);
    sentences.push(_getSentenceFromByteRange(text, utf8SentenceByteRange));
  }
  return sentences;
}

// This function returns a substring of text (a string). The substring is represented by
// byteRange (begin and end endices) within the utf-8 encoded version of the text.
const _getSentenceFromByteRange = (text, byteRange) => {
  const utf8BytesView = encoder.encode(text);
  const utf8SentenceBytes = utf8BytesView.subarray(byteRange.begin, byteRange.end);
  return decoder.decode(utf8SentenceBytes);
}
