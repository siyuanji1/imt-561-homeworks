registerSketch('sk15', function(p) {
  // FAO Global Forest Resources Assessment — FRA 2020 / 2015 / 2010
  const YRS = [1990, 1995, 2000, 2005, 2010, 2015, 2020];

  const COUNTRIES = [
    { name: 'China',
      area:  [157, 163, 177, 197, 208, 208, 220],   // total forest Mha
      plant: [1.5, 1.8, 2.2, 2.5, 2.5, 2.5, 2.5],  // annual planting Mha/yr
      cut:   [0.5, 0.5, 0.4, 0.35, 0.3, 0.25, 0.25],// annual deforestation Mha/yr
      dk: [35, 105, 48], md: [52, 145, 68], lt: [88, 188, 98] },
    { name: 'Brazil',
      area:  [589, 566, 544, 520, 497, 494, 497],
      plant: [0.1, 0.1, 0.15, 0.2, 0.2, 0.25, 0.3],
      cut:   [3.0, 3.2, 3.5, 4.0, 2.5, 0.8, 1.3],
      dk: [18, 80, 30], md: [30, 115, 48], lt: [52, 158, 70] },
    { name: 'USA',
      area:  [296, 298, 303, 307, 310, 310, 310],
      plant: [0.25, 0.28, 0.3, 0.3, 0.3, 0.3, 0.3],
      cut:   [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
      dk: [48, 112, 52], md: [70, 152, 76], lt: [108, 192, 112] },
    { name: 'India',
      area:  [64, 64, 66, 68, 69, 70, 72],
      plant: [0.4, 0.4, 0.45, 0.5, 0.5, 0.5, 0.5],
      cut:   [0.2, 0.2, 0.2, 0.25, 0.25, 0.25, 0.25],
      dk: [75, 125, 25], md: [105, 165, 40], lt: [148, 205, 70] },
    { name: 'Australia',
      area:  [128, 126, 125, 125, 124, 125, 134],
      plant: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.1],
      cut:   [0.3, 0.28, 0.25, 0.25, 0.25, 0.2, 0.4],
      dk: [90, 125, 40], md: [122, 162, 56], lt: [162, 200, 88] },
  ];

  const W = 920, H = 620;
  const GY  = 345;   // ground Y
  const SY  = 572;   // scrubber Y
  const SX1 = 105, SX2 = W - 55;
  const YEAR_MIN = 1990, YEAR_MAX = 2025;
  const XS = [100, 255, 460, 665, 820];

  let year = 2005;
  let drag = false;

  function iv(arr, yr) {  // linear interpolation across YRS
    if (yr <= YRS[0]) return arr[0];
    if (yr >= YRS[YRS.length - 1]) return arr[arr.length - 1];
    for (let i = 0; i < YRS.length - 1; i++) {
      if (yr >= YRS[i] && yr <= YRS[i + 1]) {
        const t = (yr - YRS[i]) / (YRS[i + 1] - YRS[i]);
        return arr[i] + t * (arr[i + 1] - arr[i]);
      }
    }
  }

  // Illustrated tree: visible branches + layered foliage blobs
  function drawTree(cx, baseY, r, c) {
    const trunkH = r * 0.88;
    const tw     = Math.max(6, r * 0.16);
    const forkY  = baseY - trunkH * 0.5;
    const bs = r * 0.64;   // branch horizontal spread
    const br = r * 0.56;   // branch rise

    // Branch endpoints
    const lbx = cx - bs * 0.62, lby = forkY - br * 0.82;
    const rbx = cx + bs * 0.62, rby = forkY - br * 0.82;
    const tbx = cx + bs * 0.06, tby = forkY - br;

    // Draw skeleton (will be mostly covered by foliage)
    p.noFill();
    p.strokeCap(p.ROUND);

    p.stroke(45, 28, 8);
    p.strokeWeight(tw);
    p.line(cx, baseY, cx, forkY);

    p.strokeWeight(Math.max(1.5, tw * 0.52));
    p.line(cx, forkY, lbx, lby);
    p.line(cx, forkY, rbx, rby);
    p.line(cx, forkY, tbx, tby);

    p.strokeWeight(Math.max(1, tw * 0.28));
    // left sub-branches
    p.line(lbx, lby, lbx - bs * 0.4,  lby - br * 0.48);
    p.line(lbx, lby, lbx + bs * 0.22, lby - br * 0.42);
    // right sub-branches
    p.line(rbx, rby, rbx + bs * 0.4,  rby - br * 0.48);
    p.line(rbx, rby, rbx - bs * 0.22, rby - br * 0.42);
    // top sub-branches
    p.line(tbx, tby, tbx - bs * 0.28, tby - br * 0.40);
    p.line(tbx, tby, tbx + bs * 0.24, tby - br * 0.36);

    p.noStroke();

    // Foliage center point
    const cy = baseY - trunkH - r * 0.28;

    // Blobs ordered back→front: [dx, dy, rx, ry, layer 0=dark 1=mid 2=light]
    const B = [
      [-0.56,  0.12, 0.52, 0.48, 0],
      [ 0.53,  0.10, 0.50, 0.46, 0],
      [-0.42, -0.50, 0.52, 0.50, 0],
      [ 0.40, -0.48, 0.50, 0.48, 0],
      [ 0.04, -0.72, 0.50, 0.52, 1],
      [-0.22, -0.12, 0.76, 0.70, 1],
      [ 0.20, -0.10, 0.74, 0.68, 1],
      [-0.05, -0.36, 0.70, 0.66, 2],
      [  0,    0.06, 0.84, 0.76, 2],
      [  0,   -0.22, 0.87, 0.82, 2],
    ];
    for (const [dx, dy, rx, ry, layer] of B) {
      const col = layer === 0 ? c.dk : layer === 1 ? c.md : c.lt;
      p.fill(col[0], col[1], col[2]);
      p.ellipse(cx + dx * r, cy + dy * r, r * rx * 2, r * ry * 2);
    }
  }

  // Below-ground: cut bar on left, root branches on right
  function drawUnderground(cx, plantD, cutH) {
    const GAP = 14;   // half-spacing from center
    const BW  = 15;   // bar / root column width

    // ---- CUT bar (left, hatched red) ----
    const bx = cx - GAP - BW;
    p.fill(182, 45, 20, 210);
    p.noStroke();
    p.rect(bx, GY + 5, BW, cutH, 1);
    p.drawingContext.save();
    p.drawingContext.beginPath();
    p.drawingContext.rect(bx, GY + 5, BW, cutH);
    p.drawingContext.clip();
    p.stroke(255, 125, 45, 155);
    p.strokeWeight(1.2);
    for (let hx = bx - cutH; hx < bx + BW + cutH; hx += 6) {
      p.line(hx, GY + 5, hx + cutH, GY + 5 + cutH);
    }
    p.noStroke();
    p.drawingContext.restore();

    // ---- ROOT branches (right, brown) ----
    const rcx = cx + GAP + BW * 0.5;
    p.stroke(85, 52, 16);
    p.strokeWeight(1.6);
    p.noFill();
    p.line(rcx, GY + 5, rcx, GY + 5 + plantD);
    for (let lv = 1; lv <= 3; lv++) {
      const ry = GY + 5 + plantD * lv / 3.2;
      const sp = plantD * 0.36 * lv / 3;
      const rl = plantD * 0.22;
      p.line(rcx, ry, rcx - sp, ry + rl);
      p.line(rcx, ry, rcx + sp, ry + rl);
      // tertiary tips
      p.line(rcx - sp, ry + rl, rcx - sp * 1.35, ry + rl * 1.45);
      p.line(rcx + sp, ry + rl, rcx + sp * 1.35, ry + rl * 1.45);
    }
    p.noStroke();

    // ---- Labels ----
    const labelY = GY + 5 + Math.max(cutH, plantD) + 14;

    p.fill(170, 35, 15);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(9);
    p.text('cut', bx + BW / 2, GY + 3);

    p.fill(78, 48, 14);
    p.text('plant', rcx, GY + 3);

    // value labels
    p.fill(170, 35, 15);
    p.textSize(8.5);
    p.text(Math.round(p.map(cutH, 4, 62, 0, 5) * 10) / 10 + 'M', bx + BW / 2, labelY);

    p.fill(78, 48, 14);
    p.text(Math.round(p.map(plantD, 5, 60, 0, 4) * 10) / 10 + 'M', rcx, labelY);
  }

  function scrubX() {
    return p.map(year, YEAR_MIN, YEAR_MAX, SX1, SX2);
  }

  function drawScrubber() {
    p.stroke(175);
    p.strokeWeight(3);
    p.line(SX1, SY, SX2, SY);
    p.stroke(72, 135, 80);
    p.line(SX1, SY, scrubX(), SY);

    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    for (let y = YEAR_MIN; y <= YEAR_MAX; y += 5) {
      const tx = p.map(y, YEAR_MIN, YEAR_MAX, SX1, SX2);
      p.stroke(y <= year ? 75 : 165);
      p.strokeWeight(1);
      p.line(tx, SY - 5, tx, SY + 5);
      p.noStroke();
      p.fill(y <= year ? 50 : 130);
      p.text(y, tx, SY + 8);
    }

    const hx = scrubX();
    p.noStroke();
    p.fill(48, 128, 58);
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
    p.background(188, 218, 248);

    // Title
    p.noStroke();
    p.fill(22);
    p.textAlign(p.CENTER);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text("The Forest We're Losing: Country by Country", W / 2, 24);
    p.textStyle(p.NORMAL);
    p.fill(80);
    p.textSize(10);
    p.text("FAO Global Forest Resources Assessment  ·  Drag the timeline to explore 1990–2025", W / 2, 42);

    // Ground layers
    p.noStroke();
    p.fill(105, 72, 35);
    p.rect(0, GY + 8, W, H - GY - 8);
    p.fill(75, 138, 42);   // grass
    p.rect(0, GY - 3, W, 14);
    p.fill(128, 90, 48);   // topsoil
    p.rect(0, GY + 8, W, 7);

    // Trees + underground sections
    for (let i = 0; i < COUNTRIES.length; i++) {
      const c    = COUNTRIES[i];
      const cx   = XS[i];
      const area  = iv(c.area,  year);
      const plant = iv(c.plant, year);
      const cut   = iv(c.cut,   year);
      const net   = plant - cut;

      const r      = p.map(area,  0, 600, 14, 90);
      const plantD = p.map(plant, 0, 4.0, 5, 60);
      const cutH   = p.map(cut,   0, 5.0, 4, 62);

      // Underground first (behind ground)
      drawUnderground(cx, plantD, cutH);

      // Tree
      drawTree(cx, GY, r, c);

      // Country name (above canopy)
      const canopyTopY = GY - r * 0.88 - r * 0.28 - r - 6;
      p.noStroke();
      p.fill(22);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.text(c.name, cx, canopyTopY - 4);
      p.textStyle(p.NORMAL);

      // Forest area
      p.textSize(10);
      p.fill(50);
      p.text(Math.round(area) + ' Mha', cx, canopyTopY - 18);

      // Net change
      p.textSize(9);
      p.fill(net >= 0 ? p.color(18, 132, 32) : p.color(182, 28, 18));
      p.text((net >= 0 ? '▲ +' : '▼ ') + Math.abs(net).toFixed(2) + ' Mha/yr', cx, canopyTopY - 30);
    }

    // Legend
    const lx = W - 192, ly = 56;
    p.fill(240, 246, 236, 222);
    p.stroke(182);
    p.strokeWeight(1);
    p.rect(lx - 6, ly - 4, 185, 70, 5);
    p.noStroke();
    p.textAlign(p.LEFT);
    p.textSize(9);
    p.fill(52, 145, 68);
    p.text('● Canopy size  = total forest (Mha)', lx, ly + 12);
    p.fill(85, 52, 16);
    p.text('↓ Root depth   = annual planting rate', lx, ly + 26);
    p.fill(182, 45, 20);
    p.text('▪ Red bar       = annual deforestation', lx, ly + 40);
    p.fill(18, 132, 32);
    p.text('▲ Net gain', lx, ly + 56);
    p.fill(182, 28, 18);
    p.text('▼ Net loss  (Mha/yr)', lx + 65, ly + 56);

    // Scrubber
    p.noStroke();
    p.fill(60);
    p.textAlign(p.LEFT);
    p.textSize(10);
    p.text('Year', SX1 - 46, SY + 4);
    drawScrubber();
  };

  p.mousePressed = function() {
    const hx = scrubX();
    if (p.dist(p.mouseX, p.mouseY, hx, SY) < 14 ||
        (p.abs(p.mouseY - SY) < 14 && p.mouseX >= SX1 && p.mouseX <= SX2)) {
      drag = true;
    }
  };
  p.mouseReleased = function() { drag = false; };
  p.mouseDragged = function() {
    if (drag) {
      year = p.constrain(
        p.map(p.mouseX, SX1, SX2, YEAR_MIN, YEAR_MAX),
        YEAR_MIN, YEAR_MAX
      );
    }
  };

  p.windowResized = function() { p.resizeCanvas(W, H); };
});
