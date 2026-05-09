registerSketch('sk15', function(p) {
  // FAO Global Forest Resources Assessment — FRA 2020 / 2015 / 2010
  const YRS = [1990, 1995, 2000, 2005, 2010, 2015, 2020];

  const COUNTRIES = [
    { name: 'China',
      area:  [157, 163, 177, 197, 208, 208, 220],
      plant: [1.5, 1.8, 2.2, 2.5, 2.5, 2.5, 2.5],
      cut:   [0.5, 0.5, 0.4, 0.35, 0.3, 0.25, 0.25],
      dk: [88, 138, 62], md: [148, 192, 108], lt: [196, 228, 158] },
    { name: 'Brazil',
      area:  [589, 566, 544, 520, 497, 494, 497],
      plant: [0.1, 0.1, 0.15, 0.2, 0.2, 0.25, 0.3],
      cut:   [3.0, 3.2, 3.5, 4.0, 2.5, 0.8, 1.3],
      dk: [62, 120, 48], md: [118, 172, 88], lt: [172, 215, 138] },
    { name: 'USA',
      area:  [296, 298, 303, 307, 310, 310, 310],
      plant: [0.25, 0.28, 0.3, 0.3, 0.3, 0.3, 0.3],
      cut:   [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
      dk: [98, 148, 72], md: [158, 200, 122], lt: [202, 232, 168] },
    { name: 'India',
      area:  [64, 64, 66, 68, 69, 70, 72],
      plant: [0.4, 0.4, 0.45, 0.5, 0.5, 0.5, 0.5],
      cut:   [0.2, 0.2, 0.2, 0.25, 0.25, 0.25, 0.25],
      dk: [108, 152, 52], md: [165, 205, 102], lt: [208, 235, 155] },
    { name: 'Australia',
      area:  [128, 126, 125, 125, 124, 125, 134],
      plant: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.1],
      cut:   [0.3, 0.28, 0.25, 0.25, 0.25, 0.2, 0.4],
      dk: [112, 148, 68], md: [168, 198, 118], lt: [210, 232, 165] },
  ];

  const W = 920, H = 640;
  const GY  = 390;
  const SY  = 582;
  const SX1 = 105, SX2 = W - 55;
  const YEAR_MIN = 1990, YEAR_MAX = 2025;
  const XS = [100, 255, 460, 665, 820];

  // Organic crown shape — 14 control points, fixed bumps give natural silhouette
  const CROWN_N  = [
    [ 0.00,-1.00],[ 0.44,-0.89],[ 0.80,-0.52],[ 0.98,-0.04],
    [ 0.84, 0.46],[ 0.50, 0.82],[ 0.06, 0.98],[-0.44, 0.88],
    [-0.82, 0.52],[-0.98, 0.02],[-0.86,-0.46],[-0.50,-0.84],
    [-0.18,-0.96],[ 0.20,-0.98],
  ];
  const CROWN_B  = [0.05,-0.07, 0.09, 0.03,-0.06, 0.10, 0.02,-0.08, 0.07,-0.05, 0.08,-0.04, 0.05,-0.06];

  function drawCrown(cx, cy, rx, ry) {
    const N = CROWN_N.length;
    p.beginShape();
    for (let k = -1; k <= N + 1; k++) {
      const i = ((k % N) + N) % N;
      const b = 1 + CROWN_B[i];
      p.curveVertex(cx + CROWN_N[i][0] * rx * b, cy + CROWN_N[i][1] * ry * b);
    }
    p.endShape(p.CLOSE);
  }

  function drawTree(cx, baseY, treeH, c) {
    const trunkH  = treeH * 0.35;
    const trunkBW = Math.max(7, treeH * 0.062);
    const trunkTW = Math.max(3, treeH * 0.030);
    const crownRX = treeH * 0.48;
    const crownRY = treeH * 0.38;
    const crownCX = cx;
    const crownCY = baseY - trunkH - crownRY * 0.72;
    const forkY   = baseY - trunkH * 0.52;

    // ── Branch skeleton (drawn before crown so tips poke through) ──
    p.noFill();
    p.strokeCap(p.ROUND);
    p.stroke(32, 28, 22);

    const bSpread = crownRX * 0.55, bRise = crownRY * 1.05;
    // Main branches
    p.strokeWeight(Math.max(1.8, trunkBW * 0.45));
    p.line(cx, forkY, cx - bSpread * 0.70, forkY - bRise * 0.78);
    p.line(cx, forkY, cx + bSpread * 0.65, forkY - bRise * 0.80);
    p.line(cx, forkY, cx + bSpread * 0.08, forkY - bRise * 1.05);
    // Sub-branches (extend beyond crown edge)
    const lbx = cx - bSpread * 0.70, lby = forkY - bRise * 0.78;
    const rbx = cx + bSpread * 0.65, rby = forkY - bRise * 0.80;
    const tbx = cx + bSpread * 0.08, tby = forkY - bRise * 1.05;
    p.strokeWeight(Math.max(1, trunkBW * 0.22));
    p.line(lbx, lby, lbx - bSpread * 0.48, lby - bRise * 0.44);
    p.line(lbx, lby, lbx + bSpread * 0.26, lby - bRise * 0.40);
    p.line(rbx, rby, rbx + bSpread * 0.46, rby - bRise * 0.44);
    p.line(rbx, rby, rbx - bSpread * 0.24, rby - bRise * 0.40);
    p.line(tbx, tby, tbx - bSpread * 0.32, tby - bRise * 0.38);
    p.line(tbx, tby, tbx + bSpread * 0.28, tby - bRise * 0.34);
    p.noStroke();

    // ── Crown (3 layers: shadow, main, highlight) ──
    // Shadow drop
    p.fill(c.dk[0], c.dk[1], c.dk[2]);
    drawCrown(crownCX + 3, crownCY + 5, crownRX, crownRY);
    // Main crown
    p.fill(c.md[0], c.md[1], c.md[2]);
    drawCrown(crownCX, crownCY, crownRX, crownRY);
    // Highlight (upper-left, smaller)
    p.fill(c.lt[0], c.lt[1], c.lt[2], 210);
    drawCrown(crownCX - crownRX * 0.14, crownCY - crownRY * 0.16, crownRX * 0.55, crownRY * 0.52);

    // ── Trunk on top of crown base ──
    p.noStroke();
    p.fill(42, 30, 12);
    p.beginShape();
    p.vertex(cx - trunkBW / 2, baseY);
    p.vertex(cx - trunkTW / 2, baseY - trunkH);
    p.vertex(cx + trunkTW / 2, baseY - trunkH);
    p.vertex(cx + trunkBW / 2, baseY);
    p.endShape(p.CLOSE);
    // Bark highlight strip
    p.fill(88, 62, 28, 90);
    p.rect(cx - trunkTW * 0.1, baseY - trunkH + 4, trunkTW * 0.35, trunkH - 8, 1);
  }

  // Hatched cut box AT the trunk base (above ground)
  function drawCutBox(cx, baseY, cutBoxH, trunkBW) {
    if (cutBoxH < 3) return;
    const bw = trunkBW * 1.5 + 10;
    const bx = cx - bw / 2;
    const by = baseY - cutBoxH;
    p.fill(200, 55, 22, 215);
    p.noStroke();
    p.rect(bx, by, bw, cutBoxH);
    p.drawingContext.save();
    p.drawingContext.beginPath();
    p.drawingContext.rect(bx, by, bw, cutBoxH);
    p.drawingContext.clip();
    p.stroke(255, 140, 50, 165);
    p.strokeWeight(1.3);
    for (let hx = bx - cutBoxH; hx < bx + bw + cutBoxH; hx += 5) {
      p.line(hx, by, hx + cutBoxH, by + cutBoxH);
    }
    p.noStroke();
    p.drawingContext.restore();
  }

  // Bezier organic roots below ground
  function drawRoots(cx, baseY, depth, spread) {
    if (depth < 6) return;
    p.strokeCap(p.ROUND);
    // 5 main roots with bezier curves
    const roots = [
      { ex: -0.85, ey: 0.65, cp1x: -0.25, cp1y: 0.35 },
      { ex: -0.45, ey: 0.90, cp1x: -0.12, cp1y: 0.40 },
      { ex:  0.02, ey: 1.00, cp1x:  0.02, cp1y: 0.45 },
      { ex:  0.46, ey: 0.90, cp1x:  0.12, cp1y: 0.40 },
      { ex:  0.82, ey: 0.65, cp1x:  0.24, cp1y: 0.35 },
    ];
    for (const r of roots) {
      const ex = cx + r.ex * spread, ey = baseY + r.ey * depth;
      const c1x = cx + r.cp1x * spread, c1y = baseY + r.cp1y * depth;
      const c2x = ex + (cx - ex) * 0.18, c2y = ey - depth * 0.18;
      const sw = Math.max(0.8, depth * 0.022 * (1.2 - Math.abs(r.ex)));
      p.stroke(188, 140, 72);
      p.strokeWeight(sw + 0.8);
      p.noFill();
      p.bezier(cx, baseY, c1x, c1y, c2x, c2y, ex, ey);
      // Two sub-roots from end
      const subDepth = depth * 0.30;
      const subSpread = spread * 0.22;
      p.stroke(165, 118, 55);
      p.strokeWeight(Math.max(0.5, sw * 0.45));
      p.bezier(ex, ey, ex - subSpread * 0.4, ey + subDepth * 0.4,
               ex - subSpread, ey + subDepth * 0.7, ex - subSpread * 1.1, ey + subDepth);
      p.bezier(ex, ey, ex + subSpread * 0.3, ey + subDepth * 0.4,
               ex + subSpread * 0.9, ey + subDepth * 0.7, ex + subSpread, ey + subDepth);
    }
    p.noStroke();
  }

  // mx/feetY are the exact position; side: -1=face right(axe right), 1=face left(axe left)
  function drawLumberjack(mx, feetY, side) {
    const s  = 14;
    const my = feetY;

    // Head
    p.noStroke();
    p.fill(218, 172, 128);
    p.circle(mx, my - s * 1.62, s * 0.46);
    // Hard hat
    p.fill(255, 210, 0);
    p.rect(mx - s * 0.32, my - s * 1.82, s * 0.64, s * 0.22, 1);
    p.rect(mx - s * 0.38, my - s * 1.76, s * 0.76, s * 0.10);
    // Body
    p.fill(180, 35, 35);
    p.rect(mx - s * 0.22, my - s * 1.35, s * 0.44, s * 0.65, 1);
    // Legs
    p.fill(55, 72, 145);
    p.rect(mx - s * 0.22, my - s * 0.70, s * 0.18, s * 0.72, 1);
    p.rect(mx + s * 0.04, my - s * 0.70, s * 0.18, s * 0.72, 1);
    // Axe arm (pointing toward trunk)
    const axDir = side;  // -1 = axe swings right, 1 = axe swings left
    p.stroke(218, 172, 128);
    p.strokeWeight(2);
    const armEndX = mx + axDir * s * 0.70;
    const armEndY = my - s * 0.95;
    p.line(mx + axDir * s * 0.10, my - s * 1.15, armEndX, armEndY);
    p.noStroke();
    // Axe handle
    p.fill(128, 92, 42);
    const handleLen = s * 0.45;
    p.push();
    p.translate(armEndX, armEndY);
    p.rotate(axDir * -0.9);
    p.rect(-2, -handleLen, 4, handleLen, 1);
    // Axe head
    p.fill(175, 178, 185);
    p.triangle(-s * 0.18, -handleLen, s * 0.05, -handleLen - s * 0.22, s * 0.05, -handleLen + s * 0.08);
    p.pop();
  }

  function iv(arr, yr) {
    if (yr <= YRS[0]) return arr[0];
    if (yr >= YRS[YRS.length - 1]) return arr[arr.length - 1];
    for (let i = 0; i < YRS.length - 1; i++) {
      if (yr >= YRS[i] && yr <= YRS[i + 1]) {
        const t = (yr - YRS[i]) / (YRS[i + 1] - YRS[i]);
        return arr[i] + t * (arr[i + 1] - arr[i]);
      }
    }
  }

  function scrubX() {
    return p.map(year, YEAR_MIN, YEAR_MAX, SX1, SX2);
  }

  function drawScrubber() {
    p.stroke(175);
    p.strokeWeight(3);
    p.line(SX1, SY, SX2, SY);
    p.stroke(72, 138, 80);
    p.line(SX1, SY, scrubX(), SY);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    for (let y = YEAR_MIN; y <= YEAR_MAX; y += 5) {
      const tx = p.map(y, YEAR_MIN, YEAR_MAX, SX1, SX2);
      p.stroke(y <= year ? 72 : 165);
      p.strokeWeight(1);
      p.line(tx, SY - 5, tx, SY + 5);
      p.noStroke();
      p.fill(y <= year ? 45 : 128);
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

  let year = 2005;
  let drag  = false;

  p.setup = function() { p.createCanvas(W, H); };

  p.draw = function() {
    p.background(185, 215, 245);

    // Title
    p.noStroke();
    p.fill(22);
    p.textAlign(p.CENTER);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text("The Forest We're Losing: Country by Country", W / 2, 24);
    p.textStyle(p.NORMAL);
    p.fill(78);
    p.textSize(10);
    p.text("FAO Global Forest Resources Assessment  ·  Drag the timeline to explore 1990–2025", W / 2, 43);

    // Ground layers
    p.noStroke();
    p.fill(102, 70, 32);
    p.rect(0, GY + 8, W, H - GY - 8);
    p.fill(72, 135, 40);
    p.rect(0, GY - 3, W, 13);
    p.fill(125, 88, 45);
    p.rect(0, GY + 8, W, 8);

    // Trees, roots, cut boxes, lumberjacks, labels
    for (let i = 0; i < COUNTRIES.length; i++) {
      const c    = COUNTRIES[i];
      const cx   = XS[i];
      const area  = iv(c.area,  year);
      const plant = iv(c.plant, year);
      const cut   = iv(c.cut,   year);
      const net   = plant - cut;

      const treeH    = p.map(area,  0, 600, 58, 215);
      const rootD    = p.map(plant, 0, 4.0, 12, 72);
      const rootSpd  = p.map(plant, 0, 4.0, 14, 44);
      const cutUnderH = p.map(cut,  0, 5.0,  8, 68); // cut bar underground height
      const cutBoxH  = p.map(cut,   0, 5.0,  3, 38); // small notch at trunk base
      const trunkBW  = Math.max(7, treeH * 0.062);

      // ── Underground: cut bar (LEFT) + roots (RIGHT) side by side ──
      const cutBarCX = cx - 26;   // center of cut bar
      const rootsCX  = cx + 12;   // center of root system

      // Cut bar underground (hatched red, going DOWN)
      const cbw = 14, cbx = cutBarCX - cbw / 2;
      p.fill(200, 55, 22, 220);
      p.noStroke();
      p.rect(cbx, GY + 5, cbw, cutUnderH, 1);
      p.drawingContext.save();
      p.drawingContext.beginPath();
      p.drawingContext.rect(cbx, GY + 5, cbw, cutUnderH);
      p.drawingContext.clip();
      p.stroke(255, 140, 50, 160);
      p.strokeWeight(1.2);
      for (let hx = cbx - cutUnderH; hx < cbx + cbw + cutUnderH; hx += 5) {
        p.line(hx, GY + 5, hx + cutUnderH, GY + 5 + cutUnderH);
      }
      p.noStroke();
      p.drawingContext.restore();

      // Roots (bezier, right side)
      drawRoots(rootsCX, GY + 5, rootD, rootSpd);

      // Underground labels — bright so they read against dark soil
      p.noStroke();
      p.fill(248, 160, 110);           // warm orange for cut
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(9.5);
      p.textStyle(p.BOLD);
      p.text('cut ' + Math.round(cut * 1000) + 'k/yr', cutBarCX, GY + 5 + cutUnderH + 5);
      p.fill(230, 195, 120);           // bright gold for plant
      p.text('plant ' + Math.round(plant * 1000) + 'k/yr', rootsCX, GY + 5 + rootD + 5);
      p.textStyle(p.NORMAL);

      // ── Tree (no above-ground cut box) ──
      drawTree(cx, GY, treeH, c);

      // Lumberjack: exact position — left of cut bar, always underground
      const ljX = cutBarCX - cbw / 2 - 16;
      const ljY = GY + Math.max(24, cutUnderH * 0.6);
      drawLumberjack(ljX, ljY, -1);

      // Labels above canopy
      const crownRY   = treeH * 0.38;
      const crownTopY = GY - treeH * 0.35 - crownRY * 0.72 - crownRY - 5;

      p.noStroke();
      p.fill(20);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.text(c.name, cx, crownTopY - 4);
      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(48);
      p.text(Math.round(area) + ' Mha', cx, crownTopY - 18);
      p.textSize(9);
      p.fill(net >= 0 ? p.color(18, 130, 30) : p.color(185, 28, 18));
      p.text((net >= 0 ? '▲ +' : '▼ ') + Math.round(Math.abs(net) * 1000) + 'k/yr', cx, crownTopY - 30);
    }

    // Legend
    const lx = W - 190, ly = 58;
    p.fill(238, 245, 232, 225);
    p.stroke(182);
    p.strokeWeight(1);
    p.rect(lx - 6, ly - 4, 183, 72, 5);
    p.noStroke();
    p.textAlign(p.LEFT);
    p.textSize(9);
    p.fill(148, 192, 108);
    p.text('● Tree height = total forest area', lx, ly + 12);
    p.fill(85, 52, 16);
    p.text('↓ Roots depth = annual planting (k ha/yr)', lx, ly + 26);
    p.fill(200, 55, 22);
    p.text('▪ Base box    = annual deforestation (k ha/yr)', lx, ly + 40);
    p.fill(18, 130, 30);
    p.text('▲ Net gain', lx, ly + 56);
    p.fill(185, 28, 18);
    p.text('▼ Net loss  (Mha/yr)', lx + 66, ly + 56);

    // Scrubber
    p.noStroke();
    p.fill(55);
    p.textAlign(p.LEFT);
    p.textSize(10);
    p.text('Year', SX1 - 46, SY + 4);
    drawScrubber();
  };

  p.mousePressed = function() {
    const hx = scrubX();
    if (p.dist(p.mouseX, p.mouseY, hx, SY) < 14 ||
        (p.abs(p.mouseY - SY) < 14 && p.mouseX >= SX1 && p.mouseX <= SX2))
      drag = true;
  };
  p.mouseReleased = function() { drag = false; };
  p.mouseDragged = function() {
    if (drag)
      year = p.constrain(p.map(p.mouseX, SX1, SX2, YEAR_MIN, YEAR_MAX), YEAR_MIN, YEAR_MAX);
  };

  p.windowResized = function() { p.resizeCanvas(W, H); };
});
