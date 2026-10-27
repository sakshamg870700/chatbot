# FAQ Chatbot

A chatbot that answers questions about an online electronics store. It matches the user's question to the most similar FAQ using text preprocessing and TF-IDF cosine similarity. It runs entirely in the browser: no Python, no server, no installation.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Page layout for the chat window |
| `style.css` | Styling (responsive, light and dark mode) |
| `faqs.js` | FAQ data: questions and answers |
| `nlp.js` | Preprocessing, TF-IDF vectors, cosine similarity, matching |
| `app.js` | Chat UI logic (messages, starter buttons, suggestions) |

## How to run

Keep all five files in the same folder, then use either option:

1. **VS Code Live Server:** right-click `index.html` and choose "Open with Live Server".
2. **Directly:** double-click `index.html` to open it in a browser.

## How it works

1. **Collect FAQs:** `faqs.js` holds 20 question and answer pairs.
2. **Preprocess:** `preprocess()` in `nlp.js` runs these steps on every text:
   - lowercase and remove punctuation
   - tokenize into words
   - replace synonyms with one canonical word (for example "parcel" becomes "order", "guarantee" becomes "warranty")
   - remove stopwords
   - stem words with simple suffix stripping (for example "payments" becomes "payment")
3. **Vectorize:** each FAQ (question counted twice, plus answer) becomes a TF-IDF vector of single words and word pairs.
4. **Match:** the user's question is converted the same way. Cosine similarity against every FAQ vector picks the best match.
5. **Respond:** the best answer is shown with the matched FAQ underneath. If the best score is below the threshold (0.2), the bot says it could not find a confident answer and offers up to 3 related questions as buttons.
6. **Small talk:** greetings ("hello") and thanks ("thanks", "bye") get a short reply without matching.

## Customizing

- **Change the topic:** replace the entries in `faqs.js`. Keep the `{ question, answer }` format.
- **Improve matching:** add words to the `SYNONYMS` list in `nlp.js`. For example, `cheque: "payment"` makes "cheque" count as "payment".
- **Make the bot stricter or looser:** change the `threshold` value (default `0.2`) in the `FAQEngine` constructor in `nlp.js`. A higher value gives fewer wrong answers but more "I couldn't find an answer" replies.
- **Starter buttons:** `app.js` shows the first 5 FAQs as clickable questions. Change `slice(0, 5)` to show more or fewer.

## Example questions to try

- "when will my parcel arrive"
- "I forgot my password"
- "can I pay in installments"
- "is the item covered under guarantee"
- "do you deliver abroad"
- "how do I talk to a human"

## Limitations

- Matching depends on shared words plus the synonym list, so very different phrasing can be missed.
- The stemmer is a simple one, not a full linguistic stemmer or lemmatizer.
- A possible upgrade is sentence embeddings, which understand meaning better than word overlap.

## Tech used

HTML, CSS and vanilla JavaScript. No external libraries.
