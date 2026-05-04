registerSketch('sk3', function (p) {

  // Trail waypoints mapped to fractions of the trail (0=start, 1=summit)
  const TRAIL = [
    { t: 0,    label: 'Start',  feet: 0    },
    { t: 0.15, label: '15 min', feet: 420  },
    { t: 0.30, label: '30 min', feet: 980  },
    { t: 0.50, label: '1 hr',   feet: 1820 },
    { t: 0.70, label: '2 hr',   feet: 2640 },
    { t: 0.85, label: '3 hr',   feet: 3100 },
    { t: 1.0,  label: 'Summit', feet: 3567 },
  ];

  // Weather icons pinned to hours of the day shown at top
  const WEATHER = [
    { hour: 6,  type: 'sunrise' },
    { hour: 11, type: 'sun'     },
    { hour: 15, type: 'cloud'   },
    { hour: 17, type: 'sun'     },
    { hour: 19, type: 'cloud'   },
    { hour: 21, type: 'rain'    },
  ];

  let W, H;
  let trailPts = [];

  p.setup = function () {
    W = 800; H = 500;
    p.createCanvas(W, H);
    p.textFont('Georgia');
    buildTrail();
  };

  function buildTrail() {
    trailPts = [];
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = p.map(t, 0, 1, 60, W - 60);
      const baseY = p.map(t, 0, 1, H - 80, 120);
      const wave = p.sin(t * p.PI * 3) * 18 * (1 - t);
      trailPts.push({ x, y: baseY + wave });
    }
  }

  function pointAtT(t) {
    const idx = p.constrain(p.floor(t * (trailPts.length - 1)), 0, trailPts.length - 1);
    return trailPts[idx];
  }

  function timeProgress() {
    const h = p.hour(), m = p.minute(), s = p.second();
    return (h * 3600 + m * 60 + s) / 86400;
  }

  p.draw = function () {
    drawSky();
    drawMountain();
    drawTrail();
    drawWaypointMarkers();
    drawWeatherStrip();
    drawHiker();
    drawTimeDisplay();
  };

  function drawSky() {
    const h = p.hour();
    let top, bot;
    if (h >= 5 && h < 8) {
      top = p.color(255, 160, 80);  bot = p.color(255, 210, 150);
    } else if (h >= 8 && h < 17) {
      top = p.color(100, 160, 230); bot = p.color(185, 220, 255);
    } else if (h >= 17 && h < 20) {
      top = p.color(200, 100, 60);  bot = p.color(255, 180, 100);
    } else {
      top = p.color(15, 20, 50);    bot = p.color(50, 60, 110);
    }
    for (let y = 0; y < H; y++) {
      p.stroke(p.lerpColor(top, bot, y / H));
      p.line(0, y, W, y);
    }
  }

  function drawMountain() {
    // Summit at ~y=90, base at y=H=500
    // 3567 ft total. Snow line at 3016 ft = 84.6% up → y ≈ 158
    // Tree line at 2000 ft = 56% up → y ≈ 273
    const peakY     = 90;
    const snowLineY = p.map(3016, 0, 3567, H, peakY); // ~158
    const treeLineY = p.map(2000, 0, 3567, H, peakY); // ~273

    // Define the near-mountain outline as a reusable path function
    function mountainPath() {
      p.vertex(0, H);
      p.bezierVertex(W * 0.15, H - 90, W * 0.5, peakY, W * 0.75, 108);
      p.bezierVertex(W * 0.88, 118, W * 0.94, 165, W, 185);
      p.vertex(W, H);
    }

    // Use canvas clip to paint color zones inside the mountain shape
    const ctx = p.drawingContext;

    function clipMountain() {
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.bezierCurveTo(W * 0.15, H - 90, W * 0.5, peakY, W * 0.75, 108);
      ctx.bezierCurveTo(W * 0.88, 118, W * 0.94, 165, W, 185);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.clip();
    }

    // --- near mountain with three elevation zones ---
    ctx.save();
    clipMountain();

    // Zone 1: Forest green base (ground to tree line)
    p.noStroke();
    p.fill(45, 100, 45);
    p.rect(0, treeLineY, W, H - treeLineY);

    // slightly lighter green mid-forest strip
    p.fill(60, 120, 55, 160);
    p.rect(0, treeLineY - 20, W, 30);

    // Zone 2: Rocky grey (tree line to snow line)
    p.fill(130, 120, 110);
    p.rect(0, snowLineY, W, treeLineY - snowLineY);

    // rocky texture — scattered darker patches
    p.fill(100, 90, 80, 120);
    for (let rx = 60; rx < W - 60; rx += 55) {
      for (let ry = snowLineY + 10; ry < treeLineY - 10; ry += 30) {
        p.ellipse(rx + p.sin(rx * 0.3) * 20, ry, 28, 12);
      }
    }

    // Zone 3: Snow white (snow line to peak)
    p.fill(235, 242, 255);
    p.rect(0, peakY - 10, W, snowLineY - peakY + 10);

    // snow texture — soft blue shadows
    p.fill(200, 215, 240, 120);
    p.ellipse(W * 0.38, snowLineY - 15, 60, 20);
    p.ellipse(W * 0.58, snowLineY - 10, 80, 18);
    p.fill(255, 255, 255, 180);
    p.ellipse(W * 0.5, peakY + 18, 90, 28);

    ctx.restore();

    // snow line label on the right edge
    p.noStroke();
    p.fill(255, 255, 255, 180);
    p.textSize(9);
    p.textAlign(p.LEFT, p.CENTER);
    p.text('snow line ~3016 ft', W * 0.78, snowLineY - 6);
    p.stroke(255, 255, 255, 100);
    p.strokeWeight(1);
    p.line(W * 0.76, snowLineY, W * 0.77, snowLineY);
  }

  function drawTrail() {
    // shadow
    p.noFill();
    p.stroke(0, 0, 0, 35);
    p.strokeWeight(5);
    p.beginShape();
    for (const pt of trailPts) p.curveVertex(pt.x + 2, pt.y + 2);
    p.endShape();
    // main path
    p.stroke(210, 185, 130);
    p.strokeWeight(3);
    p.beginShape();
    for (const pt of trailPts) p.curveVertex(pt.x, pt.y);
    p.endShape();
    // dashes
    p.stroke(240, 215, 160, 130);
    p.strokeWeight(1);
    for (let i = 0; i < trailPts.length - 5; i += 7) {
      p.line(trailPts[i].x, trailPts[i].y, trailPts[i + 4].x, trailPts[i + 4].y);
    }
  }

  function drawWaypointMarkers() {
    for (const wp of TRAIL) {
      const pt = pointAtT(wp.t);
      // pin dot
      p.noStroke();
      p.fill(255, 255, 255, 200);
      p.ellipse(pt.x, pt.y, 9, 9);
      p.fill(190, 140, 50);
      p.ellipse(pt.x, pt.y, 5, 5);
      // label above
      p.fill(255, 255, 255, 210);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(wp.label, pt.x, pt.y - 10);
      // elevation below
      if (wp.feet > 0) {
        p.fill(200, 235, 255, 180);
        p.textSize(9);
        p.textAlign(p.CENTER, p.TOP);
        p.text(wp.feet + ' ft', pt.x, pt.y + 8);
      }
    }
  }

  function drawWeatherStrip() {
    for (const w of WEATHER) {
      const wx = p.map(w.hour, 0, 24, 40, W - 40);
      drawWeatherIcon(w.type, wx, 30, 16);
      p.noStroke();
      p.fill(255, 255, 255, 160);
      p.textSize(9);
      p.textAlign(p.CENTER, p.TOP);
      p.text(w.hour + 'h', wx, 50);
    }
  }

  function drawWeatherIcon(type, x, y, r) {
    p.noStroke();
    if (type === 'sun' || type === 'sunrise') {
      p.fill(255, 225, 60, 230);
      p.ellipse(x, y, r, r);
      p.stroke(255, 225, 60, 180);
      p.strokeWeight(1.5);
      for (let a = 0; a < p.TWO_PI; a += p.PI / 4) {
        p.line(x + p.cos(a) * r * 0.72, y + p.sin(a) * r * 0.72,
               x + p.cos(a) * r * 1.25, y + p.sin(a) * r * 1.25);
      }
    } else if (type === 'cloud') {
      p.noStroke();
      p.fill(215, 230, 245, 220);
      p.ellipse(x,           y,           r * 1.5, r * 0.9);
      p.ellipse(x - r * 0.3, y + r * 0.2, r,       r * 0.75);
      p.ellipse(x + r * 0.3, y + r * 0.2, r,       r * 0.75);
    } else if (type === 'rain') {
      p.noStroke();
      p.fill(175, 200, 225, 220);
      p.ellipse(x,           y - 4,       r * 1.5, r * 0.9);
      p.ellipse(x - r * 0.3, y - 2,       r,       r * 0.75);
      p.stroke(100, 160, 220, 200);
      p.strokeWeight(1.5);
      for (let i = -1; i <= 1; i++) {
        p.line(x + i * 6, y + 5, x + i * 6 - 2, y + 14);
      }
    }
  }

  function drawHiker() {
    const t = timeProgress();
    const pt = pointAtT(t);
    const hx = pt.x, hy = pt.y;

    // glow behind hiker
    p.noStroke();
    for (let r = 24; r > 0; r -= 4) {
      p.fill(255, 200, 100, p.map(r, 0, 24, 55, 0));
      p.ellipse(hx, hy - 10, r * 1.5, r);
    }

    // head
    p.noStroke();
    p.fill(235, 195, 140);
    p.ellipse(hx, hy - 18, 10, 10);

    // hat
    p.fill(80, 55, 30);
    p.rect(hx - 6, hy - 24, 12, 5, 2);
    p.rect(hx - 4, hy - 29, 8, 6, 2);

    // body
    p.stroke(50, 80, 140);
    p.strokeWeight(2.5);
    p.line(hx, hy - 13, hx, hy - 3);

    // arms
    p.line(hx, hy - 10, hx - 6, hy - 4);
    p.line(hx, hy - 10, hx + 5, hy - 5);

    // legs
    p.stroke(60, 50, 40);
    p.line(hx, hy - 3, hx - 4, hy + 7);
    p.line(hx, hy - 3, hx + 4, hy + 6);

    // hiking pole
    p.stroke(160, 130, 80);
    p.strokeWeight(1.5);
    p.line(hx + 5, hy - 5, hx + 9, hy + 8);

    // backpack
    p.noStroke();
    p.fill(60, 110, 170, 210);
    p.rect(hx + 1, hy - 12, 6, 8, 2);
  }

  function drawTimeDisplay() {
    const timeStr = p.nf(p.hour(), 2) + ':' + p.nf(p.minute(), 2) + ':' + p.nf(p.second(), 2);
    p.noStroke();
    p.fill(0, 0, 0, 140);
    p.rect(12, 12, 118, 34, 8);
    p.fill(255, 240, 200);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(18);
    p.textFont('monospace');
    p.text(timeStr, 20, 29);
    p.textFont('Georgia');
  }

});
