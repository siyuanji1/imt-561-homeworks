registerSketch('sk15', function(p) {
  // FAO Global Forest Resources Assessment — FRA 2020 / FRA 2015 / FRA 2010
  const YRS = [1990, 1995, 2000, 2005, 2010, 2015, 2020];

  const COUNTRIES = [
    {
      name: 'China',
      area:  [157, 163, 177, 197, 208, 208, 220],   // total forest Mha
      plant: [1.5, 1.8, 2.2, 2.5, 2.5, 2.5, 2.5],  // annual planting Mha/yr
      cut:   [0.5, 0.5, 0.4, 0.35, 0.3, 0.25, 0.25],// annual deforestation Mha/yr
      dark:  [38, 110, 52], mid: [55, 148, 72], light: [90, 190, 100],
    },
    {
      name: 'Brazil',
      area:  [589, 566, 544, 520, 497, 494, 497],
      plant: [0.1, 0.1, 0.15, 0.2, 0.2, 0.25, 0.3],
      cut:   [3.0, 3.2, 3.5, 4.0, 2.5, 0.8, 1.3],
      dark:  [20, 85, 35], mid: [32, 120, 52], light: [55, 165, 75],
    },
    {
      name: 'USA',
      area:  [296, 298, 303, 307, 310, 310, 310],
      plant: [0.25, 0.28, 0.3, 0.3, 0.3, 0.3, 0.3],
      cut:   [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
      dark:  [55, 118, 60], mid: [75, 158, 82], light: [115, 200, 120],
    },
    {
      name: 'India',
      area:  [64, 64, 66, 68, 69, 70, 72],
      plant: [0.4, 0.4, 0.45, 0.5, 0.5, 0.5, 0.5],
      cut:   [0.2, 0.2, 0.2, 0.25, 0.25, 0.25, 0.25],
      dark:  [80, 130, 30], mid: [110, 172, 45], light: [155, 210, 75],
    },
    {
      name: 'Australia',
      area:  [128, 126, 125, 125, 124, 125, 134],
      plant: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.1],
      cut:   [0.3, 0.28, 0.25, 0.25, 0.25, 0.2, 0.4],
      dark:  [95, 130, 45], mid: [128, 168, 62], light: [168, 205, 95],
    },
  ];

  // Fixed cluster offsets for the pom-pom canopy [dx%, dy%, size%]
  const CLUSTERS = [
    [0,     0,    1.00],
    [-0.40, -0.20, 0.80],
    [ 0.38, -0.22, 0.78],
    [-0.28,  0.30, 0.72],
    [ 0.30,  0.28, 0.70],
    [ 0.05, -0.52, 0.68],
    [-0.52,  0.05, 0.60],
    [ 0.50,  0.08, 0.62],
  ];

  const W = 920, H = 590;
  const GY = 420;
  const TRUNK_H = 40, TRUNK_W = 18;
  const SY = 556;
  const SX1 = 105, SX2 = W - 55;
  const YEAR_MIN = 1990, YEAR_MAX = 2025;
  const TREE_XS = [100, 255, 460, 665, 820];

  let year = 2005;
  let dragging = false;

  function interp(arr, yr) {
    if (yr <= YRS[0]) return arr[0];
    if (yr >= YRS[YRS.length - 1]) return arr[arr.length - 1];
    for (let i = 0; i < YRS.length - 1; i++) {
      if (yr >= YRS[i] && yr <= YRS[i + 1]) {
        const t = (yr - YRS[i]) / (YRS[i + 1] - YRS[i]);
        return arr[i] * (1 - t) + arr[i + 1] * t;
      }
    }
  }

  function drawCanopy(cx, cy, r, c) {
    // Back clusters (dark)
    p.noStroke();
    for (let i = 3; i < CLUSTERS.length; i++) {
      const [dx, dy, s] = CLUSTERS[i];
      p.fill(c.dark[0], c.dark[1], c.dark[2]);
      p.circle(cx + dx * r, cy + dy * r, r * s * 2);
    }
    // Mid clusters
    for (let i = 1; i <= 2; i++) {
      const [dx, dy, s] = CLUSTERS[i];
      p.fill(c.mid[0], c.mid[1], c.mid[2]);
      p.circle(cx + dx * r, cy + dy * r, r * s * 2);
    }
    // Center (brightest, front)
    p.fill(c.light[0], c.light[1], c.light[2]);
    p.circle(cx + CLUSTERS[0][0] * r, cy + CLUSTERS[0][1] * r, r * CLUSTERS[0][2] * 1.85);
    // Highlight glint
    p.fill(255, 255, 255, 55);
    p.circle(cx - r * 0.18, cy - r * 0.28, r * 0.42);
  }

  function drawTrunk(cx) {
    // Subtle taper: slightly wider at base
    p.noStroke();
    p.fill(78, 50, 18);
    p.beginShape();
    p.vertex(cx - TRUNK_W / 2 - 2, GY);
    p.vertex(cx - TRUNK_W / 2,     GY - TRUNK_H);
    p.vertex(cx + TRUNK_W / 2,     GY - TRUNK_H);
    p.vertex(cx + TRUNK_W / 2 + 2, GY);
    p.endShape(p.CLOSE);
    // Bark highlight
    p.fill(110, 75, 30, 120);
    p.rect(cx - TRUNK_W / 2 + 3, GY - TRUNK_H + 4, 4, TRUNK_H - 8, 2);
  }

  function drawRoots(cx, depth) {
    p.stroke(88, 55, 18);
    p.strokeWeight(1.6);
    p.noFill();
    p.line(cx, GY, cx, GY + depth);
    const levels = [[0.38, 0.25], [0.70, 0.22], [0.95, 0.18]];
    for (const [frac, rlen] of levels) {
      const ry = GY + depth * frac;
      const sp = depth * 0.36 * frac;
      const rl = depth * rlen;
      p.line(cx, ry, cx - sp, ry + rl);
      p.line(cx, ry, cx + sp, ry + rl);
      // Tertiary root tips
      p.line(cx - sp, ry + rl, cx - sp - sp * 0.4, ry + rl + rl * 0.5);
      p.line(cx + sp, ry + rl, cx + sp + sp * 0.4, ry + rl + rl * 0.5);
    }
    p.noStroke();
  }

  function drawCutBox(cx, cutH) {
    const bw = TRUNK_W + 14;
    const bx = cx - bw / 2;
    const by = GY - cutH;
    // Fill
    p.fill(185, 48, 22, 215);
    p.noStroke();
    p.rect(bx, by, bw, cutH);
    // Hatch (clipped)
    p.drawingContext.save();
    p.drawingContext.beginPath();
    p.drawingContext.rect(bx, by, bw, cutH);
    p.drawingContext.clip();
    p.stroke(255, 130, 50, 160);
    p.strokeWeight(1.2);
    for (let hx = bx - cutH; hx < bx + bw + cutH; hx += 7) {
      p.line(hx, by, hx + cutH, by + cutH);
    }
    p.noStroke();
    p.drawingContext.restore();
  }

  function drawTree(cx, c, yr) {
    const area  = interp(c.area,  yr);
    const plant = interp(c.plant, yr);
    const cut   = interp(c.cut,   yr);
    const net   = plant - cut;

    const canopyR = p.map(area,  0, 600, 12, 88);
    const rootD   = p.map(plant, 0, 4.0, 10, 72);
    const cutH    = p.map(cut,   0, 5.0,  4, 62);

    const canopyY = GY - TRUNK_H - canopyR * 0.9;

    drawRoots(cx, rootD);
    drawCutBox(cx, cutH);
    drawTrunk(cx);
    drawCanopy(cx, canopyY, canopyR, c);

    // Country name
    p.noStroke();
    p.fill(22);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.textStyle(p.BOLD);
    p.text(c.name, cx, canopyY - canopyR - 6);

    // Forest area
    p.textStyle(p.NORMAL);
    p.textSize(10);
    p.fill(55);
    p.text(Math.round(area) + ' Mha', cx, canopyY - canopyR - 20);

    // Net change badge
    const isGain = net >= 0;
    p.textSize(9);
    p.fill(isGain ? p.color(20, 135, 35) : p.color(185, 30, 20));
    p.text((isGain ? '▲ +' : '▼ ') + Math.abs(net).toFixed(2) + ' Mha/yr', cx, canopyY - canopyR - 33);

    // Planting label (underground)
    p.fill(100, 64, 20);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(8.5);
    p.text('Plant ' + plant.toFixed(1) + 'M', cx, GY + rootD + 3);

    // Cut label (above box)
    p.fill(175, 38, 18);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(8.5);
    p.text('Cut ' + cut.toFixed(1) + 'M', cx, GY - cutH - 3);
  }

  function scrubX() {
    return p.map(year, YEAR_MIN, YEAR_MAX, SX1, SX2);
  }

  function drawScrubber() {
    // Track
    p.stroke(175);
    p.strokeWeight(3);
    p.line(SX1, SY, SX2, SY);
    // Filled portion
    p.stroke(80, 140, 88);
    p.strokeWeight(3);
    p.line(SX1, SY, scrubX(), SY);

    // Ticks & year labels
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    for (let y = YEAR_MIN; y <= YEAR_MAX; y += 5) {
      const tx = p.map(y, YEAR_MIN, YEAR_MAX, SX1, SX2);
      p.stroke(y <= year ? 80 : 165);
      p.strokeWeight(1);
      p.line(tx, SY - 5, tx, SY + 5);
      p.noStroke();
      p.fill(y <= year ? 55 : 130);
      p.text(y, tx, SY + 8);
    }

    // Handle
    const hx = scrubX();
    p.noStroke();
    p.fill(52, 130, 62);
    p.circle(hx, SY, 22);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.textSize(7.5);
    p.text(Math.round(year), hx, SY);
    p.textStyle(p.NORMAL);
  }

  p.setup = function() {
    p.createCanvas(W, H);
  };

  p.draw = function() {
    // Sky
    p.background(195, 224, 250);

    // Title
    p.noStroke();
    p.fill(22);
    p.textAlign(p.CENTER);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text("The Forest We're Losing: Country by Country", W / 2, 26);
    p.textStyle(p.NORMAL);
    p.fill(80);
    p.textSize(10);
    p.text("FAO Global Forest Resources Assessment  ·  Drag the timeline scrubber to explore 1990–2025", W / 2, 44);

    // Ground layers
    p.noStroke();
    p.fill(108, 75, 38);
    p.rect(0, GY + 8, W, H - GY - 8);
    // Grass strip
    p.fill(78, 140, 45);
    p.rect(0, GY - 2, W, 14);
    // Soil top
    p.fill(130, 95, 52);
    p.rect(0, GY + 8, W, 6);

    // Trees
    for (let i = 0; i < COUNTRIES.length; i++) {
      drawTree(TREE_XS[i], COUNTRIES[i], year);
    }

    // Legend box
    const lx = W - 192, ly = 54;
    p.fill(240, 245, 235, 225);
    p.stroke(185);
    p.strokeWeight(1);
    p.rect(lx - 6, ly - 4, 185, 72, 5);
    p.noStroke();
    p.textAlign(p.LEFT);
    p.textSize(9);
    p.fill(55, 148, 72);
    p.text('●  Canopy size  = total forest (Mha)', lx, ly + 12);
    p.fill(88, 55, 18);
    p.text('↓  Root depth  = annual planting rate', lx, ly + 26);
    p.fill(185, 48, 22);
    p.text('▪  Red box      = annual deforestation', lx, ly + 40);
    p.fill(20, 135, 35);
    p.text('▲ Net gain', lx, ly + 56);
    p.fill(185, 30, 20);
    p.text('▼ Net loss  (Mha / yr)', lx + 65, ly + 56);

    // Scrubber area label
    p.noStroke();
    p.fill(65);
    p.textAlign(p.LEFT);
    p.textSize(10);
    p.text('Year', SX1 - 45, SY + 4);

    drawScrubber();
  };

  p.mousePressed = function() {
    const hx = scrubX();
    if (p.dist(p.mouseX, p.mouseY, hx, SY) < 14 ||
        (p.abs(p.mouseY - SY) < 14 && p.mouseX >= SX1 && p.mouseX <= SX2)) {
      dragging = true;
    }
  };

  p.mouseReleased = function() { dragging = false; };

  p.mouseDragged = function() {
    if (dragging) {
      year = p.constrain(
        p.map(p.mouseX, SX1, SX2, YEAR_MIN, YEAR_MAX),
        YEAR_MIN, YEAR_MAX
      );
    }
  };

  p.windowResized = function() { p.resizeCanvas(W, H); };
});
