registerSketch('sk2', function (p) {
  const LAYER_MINUTES = 5;
  const MIN_LAYERS = 1;
  const MAX_LAYERS = 10; // up to 50 minutes
  const LAYER_H = 38;   // pixels per 5-min layer

  const CX = 250;
  const BASE_Y = 470;   // fixed candle base

  let totalLayers = 6;  // default 30 min
  let sessionStart = null;
  let running = false;
  let elapsedMs = 0;
  let flameOffset = 0;
  let savedElapsedMs = 0; // how much of current session is already saved to total

  // drag state
  let isDragging = false;
  let dragStartY = 0;
  let dragStartLayers = 6;

  const STORAGE_KEY = 'sk19_total_ms';

  function getLifetimeMs() {
    try { return parseFloat(localStorage.getItem(STORAGE_KEY)) || 0; }
    catch (_) { return 0; }
  }

  function addToLifetime(ms) {
    if (ms <= 0) return;
    try { localStorage.setItem(STORAGE_KEY, getLifetimeMs() + ms); }
    catch (_) {}
  }

  function saveUnsettledTime() {
    const unsaved = elapsedMs - savedElapsedMs;
    addToLifetime(unsaved);
    savedElapsedMs = elapsedMs;
  }

  function candleTopY() {
    return BASE_Y - totalLayers * LAYER_H;
  }

  function flameCenterY() {
    return candleTopY() - 24;
  }

  function onFlame(mx, my) {
    return p.dist(mx, my, CX, flameCenterY()) < 36;
  }

  function inRect(mx, my, x, y, w, h) {
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
  }

  p.setup = function () {
    p.createCanvas(500, 620);
    p.textFont('Georgia');
  };

  p.mousePressed = function () {
    const by = p.height - 70;
    const btnW = 110, btnH = 36;

    // drag flame only when stopped and at full candle (not mid-session)
    if (!running && onFlame(p.mouseX, p.mouseY)) {
      isDragging = true;
      dragStartY = p.mouseY;
      dragStartLayers = totalLayers;
      return;
    }

    // Light / Pause
    if (inRect(p.mouseX, p.mouseY, CX - 130, by, btnW, btnH)) {
      if (!running) {
        sessionStart = p.millis() - elapsedMs;
        running = true;
      } else {
        elapsedMs = p.millis() - sessionStart;
        saveUnsettledTime();
        running = false;
      }
    }

    // Reset
    if (inRect(p.mouseX, p.mouseY, CX + 20, by, btnW, btnH)) {
      saveUnsettledTime();
      running = false;
      elapsedMs = 0;
      savedElapsedMs = 0;
      sessionStart = null;
    }
  };

  p.mouseDragged = function () {
    if (!isDragging) return;
    const dy = dragStartY - p.mouseY; // positive = dragging up = more time
    const delta = Math.round(dy / LAYER_H);
    totalLayers = p.constrain(dragStartLayers + delta, MIN_LAYERS, MAX_LAYERS);
  };

  p.mouseReleased = function () {
    isDragging = false;
  };

  p.draw = function () {
    p.background(20, 15, 10);

    const totalMinutes = totalLayers * LAYER_MINUTES;
    const totalMs = totalMinutes * 60 * 1000;

    if (running) elapsedMs = p.millis() - sessionStart;
    const clampedMs = p.min(elapsedMs, totalMs);
    const minutesElapsed = clampedMs / 60000;
    const layersBurned = p.min(minutesElapsed / LAYER_MINUTES, totalLayers);
    const done = layersBurned >= totalLayers;

    if (done && running) {
      saveUnsettledTime();
      running = false;
    }

    const fullHeight = totalLayers * LAYER_H;
    const currentHeight = p.map(layersBurned, 0, totalLayers, fullHeight, 0);
    const topY = BASE_Y - currentHeight;

    drawAmbientGlow(topY, done);
    drawCandle(topY, currentHeight, fullHeight, layersBurned);
    drawFlame(topY, done);
    drawLabels(fullHeight, layersBurned);
    drawUI(minutesElapsed, totalMinutes, done, topY);
  };

  function drawAmbientGlow(topY, done) {
    if (done) return;
    for (let r = 110; r > 0; r -= 12) {
      p.noStroke();
      p.fill(255, 160, 60, p.map(r, 0, 110, 35, 0));
      p.ellipse(CX, topY, r * 1.5, r * 0.8);
    }
  }

  function drawCandle(topY, currentHeight, fullHeight, layersBurned) {
    const cw = 110;
    const originalTopY = BASE_Y - fullHeight;
    const burnedLayers = p.floor(layersBurned);

    // burned ghost layers above current candle top
    if (burnedLayers > 0) {
      const burnedHeight = burnedLayers * LAYER_H;
      const burnedTopY = BASE_Y - fullHeight;
      const burnedBottomY = burnedTopY + burnedHeight;

      // charred wax residue background
      p.noStroke();
      p.fill(80, 50, 20, 60);
      p.rect(CX - cw / 2, burnedTopY, cw, burnedHeight, 4, 4, 0, 0);

      // amber glow overlay
      p.fill(200, 120, 30, 25);
      p.rect(CX - cw / 2, burnedTopY, cw, burnedHeight, 4, 4, 0, 0);

      // dividers + minute labels inside each burned layer
      for (let i = 0; i < burnedLayers; i++) {
        const layerTopY = BASE_Y - fullHeight + i * LAYER_H;
        const layerMidY = layerTopY + LAYER_H / 2;
        const minuteLabel = (i + 1) * LAYER_MINUTES + ' min';

        // divider line between burned layers
        if (i > 0) {
          p.stroke(160, 100, 40, 120);
          p.strokeWeight(1);
          p.line(CX - cw / 2 + 6, layerTopY, CX + cw / 2 - 6, layerTopY);
        }

        // minute label centered in each burned layer
        p.noStroke();
        p.fill(220, 160, 60, 200);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(11);
        p.text(minuteLabel, CX, layerMidY);
      }
    }

    if (currentHeight <= 0) {
      // base plate only
      p.noStroke();
      p.fill(160, 120, 60);
      p.rect(CX - cw / 2 - 12, BASE_Y, cw + 24, 36, 3);
      return;
    }

    // candle body
    p.noStroke();
    p.fill(245, 235, 210);
    p.rect(CX - cw / 2, topY, cw, currentHeight, 0, 0, 4, 4);

    // layer dividers on remaining candle
    for (let i = 1; i < totalLayers; i++) {
      const lineY = BASE_Y - i * LAYER_H;
      if (lineY < topY) continue;
      p.stroke(p.color(200, 185, 160));
      p.strokeWeight(1);
      p.line(CX - cw / 2 + 6, lineY, CX + cw / 2 - 6, lineY);
    }

    // wax drip on current top edge
    if (layersBurned % 1 > 0) {
      p.noStroke();
      p.fill(230, 210, 180, 160);
      p.ellipse(CX - 20, topY + 5, 14, 9);
      p.ellipse(CX + 24, topY + 4, 11, 7);
    }

    // side shadow
    p.noStroke();
    p.fill(0, 0, 0, 22);
    p.rect(CX + cw / 2 - 18, topY, 18, currentHeight, 0, 0, 4, 0);

    // base plate
    p.noStroke();
    p.fill(160, 120, 60);
    p.rect(CX - cw / 2 - 12, BASE_Y, cw + 24, 36, 3);
  }

  function drawFlame(topY, done) {
    const hovering = !running && onFlame(p.mouseX, p.mouseY);
    flameOffset = p.sin(p.frameCount * 0.18) * 3;
    const fx = CX + (isDragging ? 0 : flameOffset);
    const fy = topY - 2;

    if (done) {
      // extinguished — show smoke wisp
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        const sy = fy - i * 12;
        p.fill(180, 180, 180, p.map(i, 0, 5, 80, 0));
        p.ellipse(CX + p.sin(i * 1.2) * 5, sy, 8 - i, 10);
      }
      return;
    }

    // outer flame
    p.noStroke();
    p.fill(255, 120, 0, 160);
    p.beginShape();
    p.vertex(fx, fy - 42);
    p.bezierVertex(fx + 15, fy - 22, fx + 18, fy, fx, fy + 2);
    p.bezierVertex(fx - 18, fy, fx - 15, fy - 22, fx, fy - 42);
    p.endShape(p.CLOSE);

    // inner flame
    p.fill(255, 220, 60, 220);
    p.beginShape();
    p.vertex(fx, fy - 30);
    p.bezierVertex(fx + 9, fy - 14, fx + 10, fy - 2, fx, fy);
    p.bezierVertex(fx - 10, fy - 2, fx - 9, fy - 14, fx, fy - 30);
    p.endShape(p.CLOSE);

    // wick
    p.stroke(80, 50, 20);
    p.strokeWeight(2);
    p.line(CX, topY, CX, topY + 8);

    // drag arrows drawn inside the flame when hovering or dragging
    if (hovering || isDragging) {
      const arrowX = CX;
      const arrowMidY = fy - 20;
      p.noStroke();
      p.fill(255, 255, 255, 200);
      // up triangle
      p.triangle(arrowX, arrowMidY - 12, arrowX - 7, arrowMidY - 4, arrowX + 7, arrowMidY - 4);
      // down triangle
      p.triangle(arrowX, arrowMidY + 12, arrowX - 7, arrowMidY + 4, arrowX + 7, arrowMidY + 4);
    }
  }

  function drawLabels(fullHeight, layersBurned) {
    const cw = 110;
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(12);
    p.noStroke();

    for (let i = 1; i <= totalLayers; i++) {
      const labelY = BASE_Y - (i - 0.5) * LAYER_H;
      const burned = layersBurned >= i;
      const active = p.floor(layersBurned) === i - 1;

      p.fill(burned ? p.color(120, 90, 60, 100) : active ? p.color(255, 200, 80) : p.color(160, 140, 110));
      p.text(i * LAYER_MINUTES + ' min', CX - cw / 2 - 8, labelY);
    }
  }

  function drawUI(minutesElapsed, totalMinutes, done, topY) {
    const minLeft = p.max(totalMinutes - minutesElapsed, 0);
    const minsDisplay = p.floor(minLeft);
    const secsDisplay = p.floor((minLeft - minsDisplay) * 60);

    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();

    // time spent — centered inside the base plate
    if (minutesElapsed > 0 || running) {
      const spentMin = p.floor(minutesElapsed);
      const spentSec = p.floor((minutesElapsed - spentMin) * 60);
      const spentLabel = spentMin + ' min ' + p.nf(spentSec, 2) + ' sec spent';
      p.fill(255, 240, 200, 240);
      p.textSize(13);
      p.text(spentLabel, CX, BASE_Y + 18);
    }

    // lifetime total — below the base plate
    const lifetimeMin = p.floor(getLifetimeMs() / 60000);
    if (lifetimeMin > 0) {
      p.fill(160, 130, 90, 180);
      p.textSize(12);
      p.text('Total meditated: ' + lifetimeMin + ' min', CX, BASE_Y + 54);
    }

    if (done) {
      p.fill(255, 180, 60);
      p.textSize(18);
      p.text('Session complete', CX, p.height - 118);
    } else if (!running && elapsedMs === 0) {
      p.fill(180, 160, 120);
      p.textSize(14);
      p.text(totalMinutes + ' min  ·  drag flame to adjust', CX, p.height - 118);
    }

    const by = p.height - 70;
    const btnW = 110, btnH = 36;

    // Light / Pause button
    p.noStroke();
    p.fill(running ? 100 : 180, running ? 60 : 120, 30, 230);
    p.rect(CX - 130, by, btnW, btnH, 8);
    p.fill(255, 240, 200);
    p.textSize(13);
    p.text(running ? 'Pause' : (elapsedMs > 0 ? 'Resume' : 'Light'), CX - 130 + btnW / 2, by + btnH / 2);

    // Reset button
    p.noStroke();
    p.fill(70, 60, 50, 220);
    p.rect(CX + 20, by, btnW, btnH, 8);
    p.fill(200, 170, 130);
    p.textSize(13);
    p.text('Reset', CX + 20 + btnW / 2, by + btnH / 2);
  }

});
