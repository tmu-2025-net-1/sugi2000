// lib/svgPathAnalyzer.js

export class SVGPathAnalyzer {
  constructor() {
    this.pathPoints = [];
  }

  /**
   * SVGパス文字列を解析してポイントを抽出
   * @param {string} pathData - SVGのd属性の値
   * @returns {Array} パスポイントの配列
   */
  parsePathData(pathData) {
    const points = [];
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    
    // パスデータを正規化（カンマとスペースを統一）
    const normalizedPath = pathData.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    
    // コマンドごとに分割
    const commands = normalizedPath.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    
    commands.forEach((command, commandIndex) => {
      const type = command[0];
      const coords = command.slice(1).trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
      
      switch (type.toUpperCase()) {
        case 'M': // Move to
          for (let i = 0; i < coords.length; i += 2) {
            const x = type === 'M' ? coords[i] : currentX + coords[i];
            const y = type === 'M' ? coords[i + 1] : currentY + coords[i + 1];
            
            if (i === 0) {
              startX = x;
              startY = y;
            }
            
            points.push({
              type: 'move',
              x,
              y,
              commandIndex,
              isAbsolute: type === 'M'
            });
            
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'L': // Line to
          for (let i = 0; i < coords.length; i += 2) {
            const x = type === 'L' ? coords[i] : currentX + coords[i];
            const y = type === 'L' ? coords[i + 1] : currentY + coords[i + 1];
            
            points.push({
              type: 'line',
              x,
              y,
              commandIndex,
              isAbsolute: type === 'L'
            });
            
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'H': // Horizontal line to
          for (let i = 0; i < coords.length; i++) {
            const x = type === 'H' ? coords[i] : currentX + coords[i];
            
            points.push({
              type: 'horizontal',
              x,
              y: currentY,
              commandIndex,
              isAbsolute: type === 'H'
            });
            
            currentX = x;
          }
          break;
          
        case 'V': // Vertical line to
          for (let i = 0; i < coords.length; i++) {
            const y = type === 'V' ? coords[i] : currentY + coords[i];
            
            points.push({
              type: 'vertical',
              x: currentX,
              y,
              commandIndex,
              isAbsolute: type === 'V'
            });
            
            currentY = y;
          }
          break;
          
        case 'C': // Cubic Bezier curve
          for (let i = 0; i < coords.length; i += 6) {
            const x1 = type === 'C' ? coords[i] : currentX + coords[i];
            const y1 = type === 'C' ? coords[i + 1] : currentY + coords[i + 1];
            const x2 = type === 'C' ? coords[i + 2] : currentX + coords[i + 2];
            const y2 = type === 'C' ? coords[i + 3] : currentY + coords[i + 3];
            const x = type === 'C' ? coords[i + 4] : currentX + coords[i + 4];
            const y = type === 'C' ? coords[i + 5] : currentY + coords[i + 5];
            
            points.push({
              type: 'cubic_control1',
              x: x1,
              y: y1,
              commandIndex,
              isAbsolute: type === 'C'
            });
            
            points.push({
              type: 'cubic_control2',
              x: x2,
              y: y2,
              commandIndex,
              isAbsolute: type === 'C'
            });
            
            points.push({
              type: 'cubic_end',
              x,
              y,
              commandIndex,
              isAbsolute: type === 'C'
            });
            
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'S': // Smooth cubic Bezier curve
          for (let i = 0; i < coords.length; i += 4) {
            const x2 = type === 'S' ? coords[i] : currentX + coords[i];
            const y2 = type === 'S' ? coords[i + 1] : currentY + coords[i + 1];
            const x = type === 'S' ? coords[i + 2] : currentX + coords[i + 2];
            const y = type === 'S' ? coords[i + 3] : currentY + coords[i + 3];
            
            points.push({
              type: 'smooth_cubic_control',
              x: x2,
              y: y2,
              commandIndex,
              isAbsolute: type === 'S'
            });
            
            points.push({
              type: 'smooth_cubic_end',
              x,
              y,
              commandIndex,
              isAbsolute: type === 'S'
            });
            
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'Q': // Quadratic Bezier curve
          for (let i = 0; i < coords.length; i += 4) {
            const x1 = type === 'Q' ? coords[i] : currentX + coords[i];
            const y1 = type === 'Q' ? coords[i + 1] : currentY + coords[i + 1];
            const x = type === 'Q' ? coords[i + 2] : currentX + coords[i + 2];
            const y = type === 'Q' ? coords[i + 3] : currentY + coords[i + 3];
            
            points.push({
              type: 'quadratic_control',
              x: x1,
              y: y1,
              commandIndex,
              isAbsolute: type === 'Q'
            });
            
            points.push({
              type: 'quadratic_end',
              x,
              y,
              commandIndex,
              isAbsolute: type === 'Q'
            });
            
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'T': // Smooth quadratic Bezier curve
          for (let i = 0; i < coords.length; i += 2) {
            const x = type === 'T' ? coords[i] : currentX + coords[i];
            const y = type === 'T' ? coords[i + 1] : currentY + coords[i + 1];
            
            points.push({
              type: 'smooth_quadratic_end',
              x,
              y,
              commandIndex,
              isAbsolute: type === 'T'
            });
            
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'A': // Arc
          for (let i = 0; i < coords.length; i += 7) {
            const rx = coords[i];
            const ry = coords[i + 1];
            const rotation = coords[i + 2];
            const largeArcFlag = coords[i + 3];
            const sweepFlag = coords[i + 4];
            const x = type === 'A' ? coords[i + 5] : currentX + coords[i + 5];
            const y = type === 'A' ? coords[i + 6] : currentY + coords[i + 6];
            
            points.push({
              type: 'arc',
              x,
              y,
              rx,
              ry,
              rotation,
              largeArcFlag,
              sweepFlag,
              commandIndex,
              isAbsolute: type === 'A'
            });
            
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'Z': // Close path
          points.push({
            type: 'close',
            x: startX,
            y: startY,
            commandIndex,
            isAbsolute: true
          });
          
          currentX = startX;
          currentY = startY;
          break;
      }
    });
    
    this.pathPoints = points;
    return points;
  }

  /**
   * パスポイントの種類に応じた色を返す
   * @param {string} type - ポイントの種類
   * @returns {string} CSS色値
   */
  getPointColor(type) {
    const colors = {
      'move': '#ff0000',              // 赤
      'line': '#0000ff',              // 青  
      'horizontal': '#00aaff',        // 水色
      'vertical': '#00aaff',          // 水色
      'cubic_control1': '#00ff00',    // 緑
      'cubic_control2': '#00ff00',    // 緑
      'cubic_end': '#ff8800',         // オレンジ
      'smooth_cubic_control': '#88ff00', // 黄緑
      'smooth_cubic_end': '#ff8800',  // オレンジ
      'quadratic_control': '#ff00ff', // マゼンタ
      'quadratic_end': '#ffff00',     // 黄色
      'smooth_quadratic_end': '#ffff00', // 黄色
      'arc': '#8800ff',               // 紫
      'close': '#888888'              // グレー
    };
    
    return colors[type] || '#000000';
  }

  /**
   * パスポイントの表示名を返す
   * @param {string} type - ポイントの種類
   * @returns {string} 表示名
   */
  getPointLabel(type) {
    const labels = {
      'move': 'M',
      'line': 'L',
      'horizontal': 'H',
      'vertical': 'V',
      'cubic_control1': 'C1',
      'cubic_control2': 'C2',
      'cubic_end': 'C',
      'smooth_cubic_control': 'S1',
      'smooth_cubic_end': 'S',
      'quadratic_control': 'Q1',
      'quadratic_end': 'Q',
      'smooth_quadratic_end': 'T',
      'arc': 'A',
      'close': 'Z'
    };
    
    return labels[type] || type;
  }

  /**
   * フィルタリングされたポイントを取得
   * @param {Array} types - 表示したいポイントの種類
   * @returns {Array} フィルタリングされたポイント
   */
  getFilteredPoints(types) {
    return this.pathPoints.filter(point => types.includes(point.type));
  }

  /**
   * バウンディングボックスを計算
   * @returns {Object} バウンディングボックス
   */
  getBoundingBox() {
    if (this.pathPoints.length === 0) return null;
    
    const xs = this.pathPoints.map(p => p.x);
    const ys = this.pathPoints.map(p => p.y);
    
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }
}