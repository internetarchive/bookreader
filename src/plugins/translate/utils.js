/**
 *
 * @param {Array<string>} passageArr translated text split into array by punctuation
 * @param {number} chunkSize average sentence length is 15-20 words (?)
 * @return {Array<string>}
 */
export function passageToLines (passageArr, chunkSize = 20) {
  const wordItems = passageArr.filter(word => word.length > 0);
  const output = [];
  for (let i = 0; i < wordItems.length; i += chunkSize) {
    const chunk = wordItems.slice(i, i + chunkSize);
    const sentence = chunk.join(" ");
    output.push(sentence);
  }
  return output;
}
