<script>
  let word = 'りんご';
  let results = [];
  let error;

  // Function to get from localStorage
  function getFromCache(key) {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(`shiritori_${key}`);
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  }

  // Function to save to localStorage
  function saveToCache(key, data) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`shiritori_${key}`, JSON.stringify(data));
    }
  }

  async function handleClick() {
    try {
      error = null;
      const lastChar = word.at(-1);
      
      // Check localStorage first
      const cachedResults = getFromCache(lastChar);
      if (cachedResults) {
        console.log("localStorage cache hit for:", lastChar);
        results = cachedResults;
        return;
      }
      
      results = ['生成中...'];
      const response = await fetch(`/api/shiritori/${word}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      results = json.results;
      
      // Save to localStorage
      saveToCache(lastChar, results);
      console.log("Saved to localStorage for:", lastChar);
    } catch (err) {
      error = err.message;
      results = null;
    }
  }
</script>
<h1 class="text-3xl font-bold p-4 mb-4 bg-amber-100">しりとり！</h1>

<div class="my-4">
  Google Gemini APIを使って、しりとりに使える単語を生成します。
  漢字の場合は、最後の漢字で始まる単語を返します。
</div>

<div class="my-4">
  <label for="input">言葉:</label>
  <input id="input" type="text" bind:value={word} class="border border-slate-500 p-2 mx-2 rounded"/>
  <button onclick={handleClick} class="border border-slate-500 p-2 my-2 rounded cursor-pointer hover:bg-amber-400">生成</button>
</div>

<div>
  <div>結果</div>
  <div>クリックして次の言葉をセットできます</div>
  <div class="bg-slate-100 p-4 rounded">
    {#if error}
      <div style="color: red; margin-top: 10px;">
        エラー: {error}
      </div>
    {/if}

  
    {#if results}
      <div class="flex flex-wrap">
        {#each results as result, index (index)}
          <div class="hover:text-amber-600 hover:bg-white rounded p-2 cursor-pointer">
            <span onclick={()=> {
              word = result;
            }}>{result}</span>
          </div>    
        {/each}
      </div>
    {/if}
  </div>

</div>

