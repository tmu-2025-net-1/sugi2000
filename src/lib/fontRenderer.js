// lib/fontRenderer.js
import opentype from 'opentype.js';

export class FontRenderer {
  constructor() {
    this.font = null;
  }

  async loadFont(fontPath) {
    try {
      this.font = await opentype.load(fontPath);
      return this.font;
    } catch (error) {
      console.error('フォントの読み込みに失敗しました:', error);
      throw error;
    }
  }

  getGlyphPath(char, fontSize = 72) {
    if (!this.font) {
      throw new Error('フォントが読み込まれていません');
    }

    const glyph = this.font.charToGlyph(char);
    const path = glyph.getPath(0, 0, fontSize);
    
    return {
      path: path,
      pathData: path.toPathData(),
      commands: path.commands
    };
  }

  getControlPoints(char, fontSize = 72) {
    const { commands } = this.getGlyphPath(char, fontSize);
    const points = [];
    
    commands.forEach((cmd, index) => {
      switch (cmd.type) {
        case 'M': // Move to
          points.push({
            type: 'move',
            x: cmd.x,
            y: cmd.y,
            index
          });
          break;
        case 'L': // Line to
          points.push({
            type: 'line',
            x: cmd.x,
            y: cmd.y,
            index
          });
          break;
        case 'C': // Cubic Bezier curve
          points.push({
            type: 'cubic_control1',
            x: cmd.x1,
            y: cmd.y1,
            index
          });
          points.push({
            type: 'cubic_control2',
            x: cmd.x2,
            y: cmd.y2,
            index
          });
          points.push({
            type: 'cubic_end',
            x: cmd.x,
            y: cmd.y,
            index
          });
          break;
        case 'Q': // Quadratic Bezier curve
          points.push({
            type: 'quadratic_control',
            x: cmd.x1,
            y: cmd.y1,
            index
          });
          points.push({
            type: 'quadratic_end',
            x: cmd.x,
            y: cmd.y,
            index
          });
          break;
      }
    });
    
    return points;
  }

  getBoundingBox(char, fontSize = 72) {
    const glyph = this.font.charToGlyph(char);
    const path = glyph.getPath(0, 0, fontSize);
    return path.getBoundingBox();
  }
}