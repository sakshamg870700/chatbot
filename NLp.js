const STOPWORDS = new Set(("a an the and or but if of to in on at by for with about as into from up down out over under " +
  "is are was were be been being am do does did doing have has had having i me my mine we our you your yours " +
  "he she it its they them their this that these those what which who whom when where why how will would can could " +
  "should shall may might must please pls tell want need get so than too very just also there here some any").split(" "));
 
// Maps different words people use to one canonical word, e.g. "parcel" -> "order".
const SYNONYMS = {
  parcel: "order", package: "order", shipment: "order", purchase: "order",
  arrive: "delivery", deliver: "delivery", delivered: "delivery", dispatch: "delivery",
  shipping: "delivery", ship: "delivery", shipped: "delivery", internationally: "international",
  guarantee: "warranty", covered: "warranty", repair: "warranty",
  installment: "emi", installments: "emi", instalment: "emi", monthly: "emi",
  pay: "payment", paying: "payment", paid: "payment", upi: "payment",
  money: "refund", reimburse: "refund", reimbursement: "refund",
  back: "return", exchange: "return", replace: "return",
  human: "support", agent: "support", person: "support", help: "support",
  talk: "contact", call: "contact", phone: "contact", reach: "contact",
  login: "account", signin: "account", register: "account", signup: "account",
  discount: "coupon", promo: "coupon", voucher: "coupon", offer: "coupon",
  abroad: "international", overseas: "international", worldwide: "international",
  broken: "damaged", defective: "damaged", faulty: "damaged",
  safe: "secure", safety: "secure", privacy: "secure",
  forgot: "reset", forgotten: "reset", lost: "reset"
};
 
const GREETINGS = new Set(["hi", "hello", "hey", "hola", "namaste"]);
const THANKS = new Set(["thanks", "thank", "thx", "bye", "goodbye"]);
 
// Very small suffix-stripping stemmer (consistent on both questions and user input).
function stem(w) {
  if (w.length > 4 && w.endsWith("sses")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}
 
// lowercase -> remove punctuation -> tokenize -> synonyms -> drop stopwords -> stem
function preprocess(text) {
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = [];
  for (const raw of tokens) {
    if (STOPWORDS.has(raw)) continue;
    let t = SYNONYMS[raw] || raw;
    t = stem(t);
    out.push(SYNONYMS[t] || t);
  }
  return out;
}
 
// unigrams + bigrams
function features(tokens) {
  const f = tokens.slice();
  for (let i = 0; i < tokens.length - 1; i++) f.push(tokens[i] + " " + tokens[i + 1]);
  return f;
}
 
class FAQEngine {
  constructor(faqs, threshold = 0.2) {
    this.faqs = faqs;
    this.threshold = threshold;
    // Question counted twice + answer, so keywords in either help.
    const docs = faqs.map(f => features(preprocess(f.question + " " + f.question + " " + f.answer)));
    const df = new Map();
    docs.forEach(d => new Set(d).forEach(t => df.set(t, (df.get(t) || 0) + 1)));
    const n = docs.length;
    this.idf = new Map();
    df.forEach((c, t) => this.idf.set(t, Math.log((1 + n) / (1 + c)) + 1));
    this.vectors = docs.map(d => this.vectorize(d));
  }
 
  // L2-normalised TF-IDF vector as a Map. Unknown terms are ignored.
  vectorize(feats) {
    const tf = new Map();
    feats.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Map();
    let norm = 0;
    tf.forEach((c, t) => {
      if (!this.idf.has(t)) return;
      const w = c * this.idf.get(t);
      vec.set(t, w);
      norm += w * w;
    });
    norm = Math.sqrt(norm) || 1;
    vec.forEach((w, t) => vec.set(t, w / norm));
    return vec;
  }
 
  cosine(a, b) {   // both already normalised, so cosine = dot product
    let s = 0;
    const [small, big] = a.size < b.size ? [a, b] : [b, a];
    small.forEach((w, t) => { if (big.has(t)) s += w * big.get(t); });
    return s;
  }
 
  ask(text) {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    if (words.length && words.every(w => GREETINGS.has(w)))
      return { answer: "Hi! Ask me about shipping, returns, payments, warranty or your account.", matched: null, score: 1, suggestions: [] };
    if (words.length && words.length <= 3 && words.some(w => THANKS.has(w)))
      return { answer: "You're welcome! Anything else I can help with?", matched: null, score: 1, suggestions: [] };
 
    const q = this.vectorize(features(preprocess(text)));
    const scores = this.vectors.map(v => this.cosine(q, v));
    const ranked = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
    const [bestScore, bestIdx] = ranked[0];
    if (bestScore < this.threshold) {
      return {
        answer: "I couldn't find a confident answer to that. You can rephrase, or email support@example.com.",
        matched: null, score: 0,
        suggestions: ranked.filter(r => r[0] > 0).map(r => this.faqs[r[1]].question)
      };
    }
    return { answer: this.faqs[bestIdx].answer, matched: this.faqs[bestIdx].question, score: +bestScore.toFixed(3), suggestions: [] };
  }
}
 
if (typeof module !== "undefined") module.exports = { FAQEngine, preprocess };
 