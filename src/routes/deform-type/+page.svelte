<!-- +page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { SVGPathAnalyzer } from '$lib/svgPathAnalyzer.js';

  let svgContent = $state('');
  let analyzer = new SVGPathAnalyzer();
  let pathPoints = $state([]);
  let selectedSvgFile = $state(null);
  let showPoints = $state(true);
  let showLabels = $state(true);
  let pointSize = $state(3);
  let maxDisplayPoints = $state(1000); // 表示する最大ポイント数
  let svgElement = $state();
  let fileInput = $state();
  
  // フィルタリングオプション
  let pointFilters = $state({
    move: true,
    line: true,
    horizontal: true,
    vertical: true,
    cubic_control1: true,
    cubic_control2: true,
    cubic_end: true,
    smooth_cubic_control: true,
    smooth_cubic_end: true,
    quadratic_control: true,
    quadratic_end: true,
    smooth_quadratic_end: true,
    arc: true,
    close: true
  });

  let stats = $state({
    totalPoints: 0,
    pathCount: 0,
    boundingBox: null
  });

  onMount(() => {
    // デフォルトでstatic/sample.svgを読み込む
    loadTestSvg();
  });

  function loadTestSvg() {
    // 提供されたSVGを直接読み込み
    svgContent = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_1_3)">
<rect width="100" height="100" fill="white"/>
<path d="M5.7 30V28.7C5.7 26.9 5.9 25 6.2 22.45C6.75 17.9 7 15.85 7 14.6C7 13.3 7 11.85 6.15 10.45C6.1 10.35 6.1 10.3 6.1 10.2C6.1 10.05 6.2 9.95 6.4 9.95C6.5 9.95 6.55 9.95 6.7 10.05C9.2 12.2 11 14.85 11 17.1C11 18.35 10.95 18.55 10.7 19.9C10.25 22.15 10.1 24.6 10.1 25.4C10.1 25.95 10.25 26.2 10.5 26.2C10.85 26.2 11.4 25.7 12.25 24.75C14.35 22.45 16.35 20.4 18.3 18.75C18.85 15.2 19.65 12.3 20.9 10C22.5 6.95 24.15 5.2 26.45 5.2C27.75 5.2 29.8 6.1 31.15 8.2C31.7 9.05 32.2 10.15 32.65 11.55C32.75 11.55 32.9 11.55 33.05 11.55C39.9 11.55 45.05 16.45 45.05 23.85C45 26.1 44.75 28.3 43.9 30.4C42.9 32.8 41.15 34.75 38.95 36.1C37.05 37.2 34.6 38.05 30.55 38.2C29.55 39.85 28.3 41.2 26.95 42.3C24.3 44.45 21.2 46.05 18.7 46.65C18.5 46.7 18.45 46.7 18.3 46.7C18.1 46.7 18 46.6 18 46.45C18 46.35 18.05 46.25 18.25 46.15C21.2 44.55 23.95 41.8 25.9 37.6C20.05 35.45 18.45 29 18.05 23.3C15.9 25.7 14.15 28.6 13 30.65C12.55 31.45 12.35 32.35 12.35 33.05C12.45 34.1 12.45 34.85 12.45 35.25C12.45 36.7 11.55 37.55 10.45 37.55C9.05 37.55 8.25 36.95 7.45 35.65C6.8 34.6 6.1 32.75 5.7 30ZM20.3 21.15C20.6 26.45 21.55 32.5 27.35 33.75C28.2 30.75 28.7 27.25 28.7 23.2C28.7 19.45 28.6 16.7 28.45 14.65C25.3 16.1 22.65 18.65 20.3 21.15ZM20.55 16.85C22.9 15.05 25.45 13.45 28.25 12.4C28.1 10.9 27.9 9.9 27.75 9.15C27.35 7.25 26.65 6.5 26 6.5C25.05 6.5 23.95 7.05 22.65 9.15C21.6 10.9 20.95 13.9 20.55 16.85ZM32.5 33.85C37 32.9 40.3 28.5 40.3 22.45C40.3 16.95 37.85 13.4 33.75 13.4C33.55 13.4 33.45 13.4 33.1 13.4C33.6 15.8 33.9 18.95 33.9 23.2C33.9 27.5 33.4 31 32.5 33.85Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_1_3">
<rect width="100" height="100" fill="white"/>
</clipPath>
</defs>
</svg>`;
    selectedSvgFile = 'test.svg';
    analyzeSvgContent();
  }

  async function loadSvgFile(url) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      svgContent = text;
      analyzeSvgContent();
    } catch (error) {
      console.error('SVGファイルの読み込みに失敗しました:', error);
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        svgContent = e.target.result;
        selectedSvgFile = file.name;
        analyzeSvgContent();
      };
      reader.readAsText(file);
    }
  }

  function analyzeSvgContent() {
    if (!svgContent) return;

    // SVGからパス要素を抽出
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const paths = doc.querySelectorAll('path');
    
    let allPoints = [];
    let pathCount = 0;

    paths.forEach((path, index) => {
      const pathData = path.getAttribute('d');
      if (pathData) {
        const points = analyzer.parsePathData(pathData);
        // パスインデックスを追加
        points.forEach(point => {
          point.pathIndex = index;
        });
        allPoints = allPoints.concat(points);
        pathCount++;
      }
    });

    pathPoints = allPoints;
    
    // 統計情報を更新
    stats = {
      totalPoints: pathPoints.length,
      pathCount: pathCount,
      boundingBox: analyzer.getBoundingBox()
    };
    
    console.log('解析結果:', {
      totalPoints: pathPoints.length,
      pathCount,
      firstFewPoints: pathPoints.slice(0, 5),
      boundingBox: stats.boundingBox
    });
  }

  function getViewBox() {
    if (!stats.boundingBox) {
      return "0 0 400 400";
    }
    
    const { minX, maxX, minY, maxY } = stats.boundingBox;
    const width = maxX - minX;
    const height = maxY - minY;
    const padding = Math.max(width, height) * 0.1;
    
    return `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;
  }

  function getFilteredPoints() {
    const activeTypes = Object.keys(pointFilters).filter(type => pointFilters[type]);
    const filtered = pathPoints.filter(point => activeTypes.includes(point.type));
    console.log('フィルタリング結果:', {
      activeTypes,
      totalPathPoints: pathPoints.length,
      filteredCount: filtered.length,
      samplePoints: filtered.slice(0, 3)
    });
    return filtered;
  }

  function resetFilters() {
    Object.keys(pointFilters).forEach(key => {
      pointFilters[key] = true;
    });
    console.log('フィルターリセット完了');
  }

  function clearFilters() {
    Object.keys(pointFilters).forEach(key => {
      pointFilters[key] = false;
    });
    console.log('フィルタークリア完了');
  }

  function exportPoints() {
    const filteredPoints = getFilteredPoints();
    const exportData = {
      fileName: selectedSvgFile || 'sample.svg',
      timestamp: new Date().toISOString(),
      stats: stats,
      points: filteredPoints
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'svg-path-points.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // リアクティブな計算を$derived で行う
  let filteredPoints = $derived(() => {
    const activeTypes = Object.keys(pointFilters).filter(type => pointFilters[type]);
    const filtered = pathPoints.filter(point => activeTypes.includes(point.type));
    
    // 最大表示数で制限
    const limited = maxDisplayPoints > 0 ? filtered.slice(0, maxDisplayPoints) : filtered;
    
    console.log('Derived更新:', {
      activeTypes: activeTypes.length,
      pathPointsLength: pathPoints.length,
      filteredLength: filtered.length,
      displayedLength: limited.length
    });
    return limited;
  });

  let visiblePointCount = $derived(filteredPoints.length);
</script>

<svelte:head>
  <title>SVGパスポイント表示</title>
</svelte:head>

<div class="container">
  <div class="controls">
    <h1>SVGパスポイント表示</h1>
    
    <div class="file-controls">
      <input 
        type="file" 
        accept=".svg" 
        on:change={handleFileUpload}
        bind:this={fileInput}
      />
      <button on:click={() => loadSvgFile('/sample.svg')}>
        サンプルSVGを読み込み
      </button>
      <button on:click={loadTestSvg}>
        テスト用SVGを読み込み
      </button>
    </div>

    <div class="display-controls">
      <label>
        <input type="checkbox" bind:checked={showPoints} />
        ポイントを表示
      </label>
      
      <label>
        <input type="checkbox" bind:checked={showLabels} />
        ラベルを表示
      </label>
      
      <label>
        ポイントサイズ:
        <input type="range" min="1" max="10" bind:value={pointSize} />
        {pointSize}px
      </label>
      
      <label>
        最大表示ポイント数:
        <input type="number" min="0" max="10000" bind:value={maxDisplayPoints} />
        (0 = 無制限)
      </label>
    </div>

    <div class="filter-controls">
      <h3>ポイント種類フィルタ</h3>
      <div class="filter-buttons">
        <button on:click={resetFilters}>すべて選択</button>
        <button on:click={clearFilters}>すべて解除</button>
      </div>
      
      <div class="filter-grid">
        {#each Object.entries(pointFilters) as [type, enabled]}
          <label class="filter-item">
            <input 
              type="checkbox" 
              bind:checked={pointFilters[type]}
            />
            <span 
              class="color-indicator" 
              style="background-color: {analyzer.getPointColor(type)}"
            ></span>
            {analyzer.getPointLabel(type)} ({type})
          </label>
        {/each}
      </div>
    </div>

    <div class="stats">
      <h3>統計情報</h3>
      <p>総ポイント数: {stats.totalPoints}</p>
      <p>フィルタ後ポイント数: {Object.keys(pointFilters).filter(type => pointFilters[type]).length > 0 ? pathPoints.filter(point => Object.keys(pointFilters).filter(type => pointFilters[type]).includes(point.type)).length : 0}</p>
      <p>表示ポイント数: {visiblePointCount}</p>
      <p>パス数: {stats.pathCount}</p>
      {#if selectedSvgFile}
        <p>ファイル名: {selectedSvgFile}</p>
      {/if}
    </div>

    <div class="export-controls">
      <button on:click={exportPoints}>
        ポイントデータをエクスポート
      </button>
    </div>
  </div>

  <div class="svg-display">
    {#if svgContent}
      <div class="svg-container">
        <div class="svg-wrapper">
          <!-- 元のSVGコンテンツ -->
          <div class="original-svg">
            {@html svgContent}
          </div>
          
          <!-- ポイントオーバーレイ用の独立したSVG - すべてのポイントを表示 -->
          {#if showPoints && filteredPoints && filteredPoints.length > 0}
            <svg class="points-overlay-svg" viewBox="{getViewBox()}">
              <g class="points-overlay">
                {#each filteredPoints as point, index}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={pointSize}
                    fill={analyzer.getPointColor(point.type)}
                    stroke="#000"
                    stroke-width="0.3"
                    opacity="0.8"
                    class="point-dot"
                  />
                  
                  {#if showLabels && index < 50}
                    <text
                      x={point.x + pointSize + 2}
                      y={point.y - pointSize - 2}
                      font-family="Arial, sans-serif"
                      font-size="6"
                      fill="#000"
                      opacity="0.7"
                      class="point-label"
                    >
                      {analyzer.getPointLabel(point.type)}
                    </text>
                  {/if}
                {/each}
              </g>
            </svg>
          {/if}
          
          <!-- 代替案: 単純なポイント表示 -->
          {#if showPoints && filteredPoints && filteredPoints.length > 0}
            <div class="simple-points-overlay">
              {#each filteredPoints as point, index}
                <div 
                  class="simple-point"
                  style="
                    left: {point.x}px; 
                    top: {point.y}px; 
                    background-color: {analyzer.getPointColor(point.type)};
                    width: {pointSize * 2}px;
                    height: {pointSize * 2}px;
                  "
                  title="{analyzer.getPointLabel(point.type)} ({point.x.toFixed(2)}, {point.y.toFixed(2)})"
                ></div>
              {/each}
            </div>
          {/if}
          
          <!-- さらなる代替案: インラインSVG - すべてのポイントを表示 -->
          {#if showPoints && filteredPoints && filteredPoints.length > 0}
            <svg class="inline-points-svg" width="100" height="100" viewBox="0 0 100 100">
              {#each filteredPoints as point, index}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={pointSize}
                  fill={analyzer.getPointColor(point.type)}
                  stroke="#000"
                  stroke-width="0.3"
                  opacity="0.8"
                />
                {#if showLabels && index < 20}
                  <text
                    x={point.x + pointSize + 1}
                    y={point.y - pointSize - 1}
                    font-size="6"
                    fill="#000"
                    opacity="0.7"
                  >
                    {analyzer.getPointLabel(point.type)}
                  </text>
                {/if}
              {/each}
            </svg>
          {/if}
          
          <!-- 強制的なテスト表示 - テスト用の固定ポイントを削除 -->
          <svg class="test-points-svg" width="100" height="100" viewBox="0 0 100 100">            
            <!-- 実際のポイントから最初の3つを強制表示 -->
            {#if pathPoints.length > 0}
              <circle cx={pathPoints[0].x} cy={pathPoints[0].y} r="4" fill="orange" opacity="0.8" />
              {#if pathPoints.length > 1}
                <circle cx={pathPoints[1].x} cy={pathPoints[1].y} r="4" fill="purple" opacity="0.8" />
              {/if}
              {#if pathPoints.length > 2}
                <circle cx={pathPoints[2].x} cy={pathPoints[2].y} r="4" fill="cyan" opacity="0.8" />
              {/if}
            {/if}
          </svg>
        </div>
        
        <!-- デバッグ情報 -->
        {#if filteredPoints && filteredPoints.length > 0}
          <div class="debug-info">
            <p>表示中のポイント数: {filteredPoints.length}</p>
            <p>最初のポイント: ({filteredPoints[0]?.x.toFixed(2)}, {filteredPoints[0]?.y.toFixed(2)}) - {filteredPoints[0]?.type}</p>
            {#if stats.boundingBox}
              <p>範囲: X({stats.boundingBox.minX.toFixed(2)} - {stats.boundingBox.maxX.toFixed(2)}) Y({stats.boundingBox.minY.toFixed(2)} - {stats.boundingBox.maxY.toFixed(2)})</p>
            {/if}
            <p>ViewBox: {getViewBox()}</p>
            <details>
              <summary>最初の10ポイント詳細</summary>
              <pre>{JSON.stringify(filteredPoints.slice(0, 10), null, 2)}</pre>
            </details>
          </div>
        {:else}
          <div class="debug-info">
            <p style="color: red;">ポイントが表示されていません</p>
            <p>総ポイント数: {pathPoints.length}</p>
            <p>アクティブフィルター: {Object.keys(pointFilters).filter(k => pointFilters[k]).join(', ')}</p>
            {#if pathPoints.length > 0}
              <details>
                <summary>最初の5ポイントの詳細</summary>
                <pre>{JSON.stringify(pathPoints.slice(0, 5), null, 2)}</pre>
              </details>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <div class="placeholder">
        <p>SVGファイルを選択してください</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 20px;
  }

  .controls {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    height: fit-content;
  }

  .file-controls {
    margin-bottom: 20px;
  }

  .file-controls input[type="file"] {
    margin-bottom: 10px;
    width: 100%;
  }

  .file-controls button {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .file-controls button:hover {
    background: #0056b3;
  }

  .display-controls {
    margin-bottom: 20px;
  }

  .display-controls label {
    display: block;
    margin-bottom: 10px;
    font-weight: bold;
  }

  .display-controls input[type="range"] {
    width: 100px;
    margin: 0 10px;
  }

  .filter-controls h3 {
    margin-bottom: 10px;
  }

  .filter-buttons {
    margin-bottom: 15px;
  }

  .filter-buttons button {
    margin-right: 10px;
    padding: 5px 10px;
    border: 1px solid #ccc;
    background: white;
    border-radius: 4px;
    cursor: pointer;
  }

  .filter-buttons button:hover {
    background: #f0f0f0;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 5px;
    max-height: 300px;
    overflow-y: auto;
  }

  .filter-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    padding: 2px 0;
  }

  .filter-item input[type="checkbox"] {
    margin-right: 8px;
  }

  .color-indicator {
    width: 12px;
    height: 12px;
    border: 1px solid #000;
    margin-right: 5px;
    border-radius: 2px;
  }

  .stats {
    margin: 20px 0;
    padding: 10px;
    background: #e9ecef;
    border-radius: 4px;
  }

  .stats h3 {
    margin-bottom: 10px;
  }

  .stats p {
    margin: 5px 0;
    font-size: 14px;
  }

  .export-controls button {
    background: #28a745;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
  }

  .export-controls button:hover {
    background: #218838;
  }

  .svg-display {
    border: 1px solid #ccc;
    border-radius: 8px;
    background: white;
    overflow: auto;
    min-height: 500px;
  }

  .svg-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 500px;
    padding: 20px;
  }

  .svg-wrapper {
    position: relative;
    display: inline-block;
  }

  .original-svg {
    position: relative;
  }

  .original-svg :global(svg) {
    max-width: 100%;
    max-height: 70vh;
    border: 1px solid #ddd;
  }

  .points-overlay-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    border: 2px solid #ff0000;
    background: rgba(255, 255, 255, 0.1);
    z-index: 10;
  }

  .simple-points-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 20;
  }

  .simple-point {
    position: absolute;
    border-radius: 50%;
    border: 1px solid #000;
    transform: translate(-50%, -50%);
    opacity: 0.8;
  }

  .inline-points-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 30;
    border: 2px solid #00ff00;
  }

  .test-points-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 40;
    border: 2px solid #0000ff;
  }

  .debug-info {
    margin-top: 15px;
    padding: 10px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 12px;
    max-width: 600px;
  }

  .debug-info p {
    margin: 3px 0;
  }

  .point-dot {
    cursor: pointer;
  }

  .point-dot:hover {
    opacity: 1;
    stroke-width: 1;
  }

  .point-label {
    pointer-events: none;
    user-select: none;
  }

  .placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #666;
    font-style: italic;
  }

  h1 {
    color: #333;
    margin-bottom: 20px;
    font-size: 24px;
  }

  h3 {
    color: #555;
    margin-bottom: 10px;
  }
</style>