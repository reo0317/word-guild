// data/words.json の読み込みと検証。
const WORDS_URL = new URL('../data/words.json', import.meta.url);

export function validateWords(list) {
  if (!Array.isArray(list)) throw new Error('語彙データの形が違います');
  const words = list.filter(word => word && typeof word.id === 'string'
    && typeof word.w === 'string' && typeof word.ja === 'string'
    && ['n', 'v', 'a', 'o'].includes(word.pos) && Number.isInteger(word.shelf));
  if (words.length < 12) throw new Error('語彙データが足りません');
  return words;
}

export async function loadWords(fetcher = fetch, url = WORDS_URL) {
  const response = await fetcher(url);
  if (!response.ok) throw new Error('語彙データを読み込めません');
  return validateWords(await response.json());
}
