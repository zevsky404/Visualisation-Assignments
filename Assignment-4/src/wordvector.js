import { stopwords } from "./stopwords";
import * as d3 from "d3";

export function documentToWords(text) {
  return (
    text
      .replace(/\W/g, " ")
      .split(" ")
      // transform to lower case
      .map((word) => word.toLowerCase())
      // filter stopwords
      .filter((word) => !stopwords.includes(word) && word.length > 0)
  );
}
//TODO: Task 1: implement the inverse document frequency
// wordsPerDocument: array of documents, which are arrays of single words => [[word, word, ...], [word, word, ...], ...]
// RETURN: Map of words matching their idf score
export function inverseDocumentFrequency(wordsPerDocument) {
  const idf = new Map();
  // count documents per word
  wordsPerDocument.forEach((doc) =>
    Array.from(new Set(doc)).forEach((word) =>
      idf.has(word) ? idf.set(word, idf.get(word) + 1) : idf.set(word, 1)
    )
  );
  // normalize to get frequency [0, 1]
  idf.forEach((value, key) => {
    idf.set(key, Math.log(wordsPerDocument.length / value));
  });
  return idf;
}

//TODO: Task 1: transform document to word vector using the tf-idf score
// words: array of single words => [word, word, word,...]
// idf: Map of words and their idf scores
// RETURN: array of form [[word, score], [word, score], ...]
//        -> sorted in descending order of score (best score first)
export function tfidf(words, idf) {
  //Tip: d3.rollups might help your here
  return d3
    .rollups(
      words,
      (v) => v.length / words.length * idf.get(v[0]),
      (word) => word
    )
    .sort((a, b) => d3.descending(a[1], b[1]));

}