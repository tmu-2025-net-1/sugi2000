import { GoogleGenAI } from "@google/genai";
import { json } from "@sveltejs/kit";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

// Cache to store results by last character
const cache = new Map();

export async function GET({ params}) {
  const str = params.str;
  const lastChar = str.at(-1);
  
  // Check cache first
  if (cache.has(lastChar)) {
    console.log("Cache hit for:", lastChar);
    return json({ results: cache.get(lastChar) });
  }
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `つぎの条件に合致する日本語の名詞を重複せずに10個挙げ、半角コンマで区切ったプレーンテキスト1行を出力しなさい。
    疑問があっても指定の1行の文字列以外は一切出力しないこと。

    条件:
    1. 最初の文字は、「${lastChar}」とする。
    2. 最後の文字に、「ん」または「ン」を入れてはいけない。
    3. 条件1の最初の文字がひらがなまたはカタカナの場合、結果はひらがなまたはカタカナだけで表記する。
    4. 条件1の最初の文字が漢字の場合、結果は漢字の熟語とする。`,
    config: {
      thinkingConfig: {
        thinkingBudget: 0, // Disables thinking
      }
    }
  });
  console.log("Response:", response);
  
  if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
    return json({ error: "No valid response generated" });
  }
  
  console.log("parts:", response.candidates[0].content.parts[0].text);
  const text = response.candidates[0].content.parts[0].text;
  const results = text?.split(',');
  
  // Cache the results
  cache.set(lastChar, results);
  console.log("Cached results for:", lastChar);
  
  return json({ results });
}
