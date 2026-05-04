registerSketch('sk3', function (p) {

  const TRAIL = [
    { t: 0,    label: 'Start',  feet: 0,    desc: 'Trailhead — gear up and begin your ascent.' },
    { t: 0.15, label: '15 min', feet: 420,  desc: 'Early forest path. Steady incline begins.' },
    { t: 0.30, label: '30 min', feet: 980,  desc: 'Dense tree cover. Good rest spot ahead.' },
    { t: 0.50, label: '1 hr',   feet: 1820, desc: 'Halfway up. Views open to the valley below.' },
    { t: 0.70, label: '2 hr',   feet: 2640, desc: 'Above tree line. Rocky terrain — watch footing.' },
    { t: 0.85, label: '3 hr',   feet: 3100, desc: 'Near snow line. Temperature drops sharply.' },
    { t: 1.0,  label: 'Summit', feet: 3567, desc: 'You made it! 360° panoramic views await.' },
  ];

  // descent waypoints — same trail reversed, timed from summit back to trailhead
  const DESCENT = [
    { t: 0.85, label: '3 hr',   feet: 3100 },
    { t: 0.70, label: '2 hr',   feet: 2640 },
    { t: 0.50, label: '1 hr',   feet: 1820 },
    { t: 0.30, label: '30 min', feet: 980  },
    { t: 0.15, label: '15 min', feet: 420  },
    { t: 0,    label: 'Finish', feet: 0    },
  ];

  const WEATHER = [
    { hour: 6,  type: 'sunrise', desc: 'Sunrise — cool and clear. Best time to start.' },
    { hour: 11, type: 'sun',     desc: 'Late morning — warm and sunny. Peak conditions.' },
    { hour: 15, type: 'cloud',   desc: 'Afternoon clouds rolling in. Watch the sky.' },
    { hour: 17, type: 'sun',     desc: 'Brief clearing. Golden hour light.' },
    { hour: 19, type: 'cloud',   desc: 'Evening overcast. Head back soon.' },
    { hour: 21, type: 'rain',    desc: 'Night rain expected. Seek shelter.' },
  ];

  let W, H;
  let trailPts = [];

  // interaction state
  let manualT       = null;   // clicked waypoint override
  let speedMult     = 1;      // 1 / 10 / 100
  let simSeconds    = 0;      // simulated clock seconds
  let lastMs        = 0;      // for delta-time sim
  let expandedWeather = null; // index into WEATHER
  let hoveredTrailIdx = -1;   // closest trail point to mouse
  let hoveredWP     = null;   // hovered waypoint

  p.setup = function () {
    W = 800; H = 500;
    p.createCanvas(W, H);
    p.textFont('Georgia');
    buildTrail();
    const now = p.hour() * 3600 + p.minute() * 60 + p.second();
    simSeconds = now;
    lastMs = p.millis();
  };

  // ── trail geometry ───────────────────────────────────────────────
  function mountainSurfaceY(bx) {
    // sample the mountain bezier to find y at a given x
    const p0x = 0,       p0y = H;
    const p1x = W*0.15,  p1y = H - 90;
    const p2x = W*0.5,   p2y = 90;
    const p3x = W*0.75,  p3y = 108;
    let best = H, bestT = 0;
    for (let i = 0; i <= 200; i++) {
      const t  = i / 200;
      const mt = 1 - t;
      const cx = mt*mt*mt*p0x + 3*mt*mt*t*p1x + 3*mt*t*t*p2x + t*t*t*p3x;
      const cy = mt*mt*mt*p0y + 3*mt*mt*t*p1y + 3*mt*t*t*p2y + t*t*t*p3y;
      if (Math.abs(cx - bx) < 8 && cy < best) { best = cy; bestT = t; }
    }
    return best;
  }

  function findMountainPeak() {
    // find the x,y where the mountain bezier reaches its minimum y
    const p0x = 0,       p0y = H;
    const p1x = W*0.15,  p1y = H - 90;
    const p2x = W*0.5,   p2y = 90;
    const p3x = W*0.75,  p3y = 108;
    let minY = H, peakX = 0;
    for (let i = 0; i <= 400; i++) {
      const t  = i / 400;
      const mt = 1 - t;
      const cx = mt*mt*mt*p0x + 3*mt*mt*t*p1x + 3*mt*t*t*p2x + t*t*t*p3x;
      const cy = mt*mt*mt*p0y + 3*mt*mt*t*p1y + 3*mt*t*t*p2y + t*t*t*p3y;
      if (cy < minY) { minY = cy; peakX = cx; }
    }
    return { x: peakX, y: minY };
  }

  function buildTrail() {
    const peak = findMountainPeak();
    trailPts = [];
    for (let i = 0; i <= 300; i++) {
      const t = i / 300;
      const x    = p.map(t, 0, 1, 160, peak.x);
      const baseY = p.map(t, 0, 1, H - 60, peak.y + 12);
      const wave  = p.sin(t * p.PI * 3) * 18 * (1 - t);
      trailPts.push({ x, y: baseY + wave });
    }
  }

  function pointAtT(t) {
    const idx = p.constrain(p.floor(t * (trailPts.length - 1)), 0, trailPts.length - 1);
    return trailPts[idx];
  }

  function timeProgress() {
    return (simSeconds % 86400) / 86400;
  }

  function simHour()   { return p.floor((simSeconds % 86400) / 3600); }
  function simMinute() { return p.floor((simSeconds % 3600) / 60); }
  function simSecond() { return p.floor(simSeconds % 60); }

  // ── mouse ────────────────────────────────────────────────────────
  p.mouseMoved = function () {
    // find closest trail point
    let best = 99999, bestIdx = -1;
    for (let i = 0; i < trailPts.length; i++) {
      const d = p.dist(p.mouseX, p.mouseY, trailPts[i].x, trailPts[i].y);
      if (d < best) { best = d; bestIdx = i; }
    }
    hoveredTrailIdx = best < 28 ? bestIdx : -1;

    // hovered waypoint
    hoveredWP = null;
    for (const wp of TRAIL) {
      const pt = pointAtT(wp.t);
      if (p.dist(p.mouseX, p.mouseY, pt.x, pt.y) < 14) { hoveredWP = wp; break; }
    }
  };

  p.mousePressed = function () {
    // 1. click waypoint → jump hiker
    for (const wp of TRAIL) {
      const pt = pointAtT(wp.t);
      if (p.dist(p.mouseX, p.mouseY, pt.x, pt.y) < 14) {
        manualT = (manualT === wp.t) ? null : wp.t;
        if (manualT !== null) simSeconds = wp.t * 86400;
        return;
      }
    }


    // 4. speed buttons
    const bx = W - 110, by = H - 44;
    if (p.mouseX >= bx && p.mouseX <= bx + 90 && p.mouseY >= by && p.mouseY <= by + 30) {
      const third = 30;
      const rel = p.mouseX - bx;
      if (rel < third)       { speedMult = 1;   manualT = null; }
      else if (rel < third * 2) { speedMult = 10;  manualT = null; }
      else                   { speedMult = 100; manualT = null; }
    }
  };

  // ── main draw ────────────────────────────────────────────────────
  p.draw = function () {
    // advance simulated clock
    const now = p.millis();
    const delta = (now - lastMs) / 1000;
    lastMs = now;
    if (speedMult > 1 || manualT === null) simSeconds += delta * speedMult;

    drawSky();
    drawMountain();
    drawTrail();
    drawWaypointMarkers();
    drawHiker();
    drawTrailHoverElevation();  // 3
    drawHikerTooltip();         // 2
    drawSpeedControls();        // 4
    drawTimeDisplay();
  };

  // ── sky ──────────────────────────────────────────────────────────
  function drawSky() {
    const h = simHour();
    let top, bot;
    if (h >= 5 && h < 8)       { top = p.color(255,160,80);  bot = p.color(255,210,150); }
    else if (h >= 8 && h < 17) { top = p.color(100,160,230); bot = p.color(185,220,255); }
    else if (h >= 17 && h < 20){ top = p.color(200,100,60);  bot = p.color(255,180,100); }
    else                        { top = p.color(15,20,50);    bot = p.color(50,60,110);   }
    for (let y = 0; y < H; y++) {
      p.stroke(p.lerpColor(top, bot, y / H));
      p.line(0, y, W, y);
    }
  }

  // ── mountain ─────────────────────────────────────────────────────
  function drawMountain() {
    const peakY     = 90;
    const snowLineY = p.map(3016, 0, 3567, H, peakY);
    const treeLineY = p.map(2000, 0, 3567, H, peakY);
    const ctx = p.drawingContext;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.bezierCurveTo(W*0.15, H-90, W*0.5, peakY, W*0.75, 108);
    ctx.bezierCurveTo(W*0.88, 118, W*0.94, 165, W, 185);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.clip();

    p.noStroke();
    p.fill(45, 100, 45);
    p.rect(0, treeLineY, W, H - treeLineY);
    p.fill(60, 120, 55, 160);
    p.rect(0, treeLineY - 20, W, 30);
    p.fill(130, 120, 110);
    p.rect(0, snowLineY, W, treeLineY - snowLineY);
    p.fill(100, 90, 80, 120);
    for (let rx = 60; rx < W - 60; rx += 55)
      for (let ry = snowLineY + 10; ry < treeLineY - 10; ry += 30)
        p.ellipse(rx + p.sin(rx*0.3)*20, ry, 28, 12);
    p.fill(235, 242, 255);
    p.rect(0, peakY - 10, W, snowLineY - peakY + 10);
    p.fill(200, 215, 240, 120);
    p.ellipse(W*0.38, snowLineY-15, 60, 20);
    p.ellipse(W*0.58, snowLineY-10, 80, 18);
    p.fill(255, 255, 255, 180);
    p.ellipse(W*0.5, peakY+18, 90, 28);
    ctx.restore();

    p.noStroke(); p.fill(255,255,255,180); p.textSize(9);
    p.textAlign(p.LEFT, p.CENTER);
    p.text('snow line ~3016 ft', W*0.78, snowLineY - 6);
    p.stroke(255,255,255,100); p.strokeWeight(1);
    p.line(W*0.76, snowLineY, W*0.77, snowLineY);
  }

  // ── trail ────────────────────────────────────────────────────────
  function drawTrail() {
    p.noFill(); p.stroke(0,0,0,35); p.strokeWeight(5);
    p.beginShape();
    for (const pt of trailPts) p.curveVertex(pt.x+2, pt.y+2);
    p.endShape();
    p.stroke(210,185,130); p.strokeWeight(3);
    p.beginShape();
    for (const pt of trailPts) p.curveVertex(pt.x, pt.y);
    p.endShape();
    p.stroke(240,215,160,130); p.strokeWeight(1);
    for (let i = 0; i < trailPts.length - 5; i += 7)
      p.line(trailPts[i].x, trailPts[i].y, trailPts[i+4].x, trailPts[i+4].y);
  }

  // ── waypoints with ascent/descent forecast badges ────────────────
  function drawWaypointMarkers() {
    const startSec = simSeconds % 86400;

    // dots for all trail waypoints
    for (const wp of TRAIL) {
      const pt  = pointAtT(wp.t);
      const hov = hoveredWP === wp || manualT === wp.t;
      p.noStroke();
      p.fill(255, 255, 255, hov ? 255 : 200);
      p.ellipse(pt.x, pt.y, hov ? 13 : 9, hov ? 13 : 9);
      p.fill(hov ? p.color(255,140,0) : p.color(190,140,50));
      p.ellipse(pt.x, pt.y, hov ? 8 : 5, hov ? 8 : 5);
    }

    // ── ascent badges: right side, warm amber ─────────────────────
    for (const wp of TRAIL) {
      const pt  = pointAtT(wp.t);
      const hov = hoveredWP === wp || manualT === wp.t;

      const arrivalSec  = startSec + wp.t * HIKE_DURATION_MIN * 60;
      const arrivalHour = (arrivalSec / 3600) % 24;
      const forecast    = forecastWeather(arrivalHour);
      const arrH = p.floor(arrivalHour);
      const arrM = p.floor((arrivalHour - arrH) * 60);
      const timeStr = p.nf(arrH, 2) + ':' + p.nf(arrM, 2);
      const tag = wp.feet > 0
        ? '↑ ' + wp.label + ' · ' + wp.feet + ' ft   ' + timeStr
        : '↑ ' + wp.label + '   ' + timeStr;

      const tw = tag.length * 5.6 + 30;
      const th = 22;
      const bx = pt.x + 14;
      const by = pt.y - th / 2;

      p.stroke(255, 200, 100, 70); p.strokeWeight(1);
      p.line(pt.x + 5, pt.y, bx, pt.y);

      p.noStroke();
      p.fill(60, 30, 0, hov ? 195 : 145);
      p.rect(bx, by, tw, th, 6);

      drawWeatherIcon(forecast.type, bx + 12, by + th / 2, 8);

      p.fill(hov ? p.color(255,220,100) : p.color(255,235,190));
      p.textSize(9.5); p.textAlign(p.LEFT, p.CENTER); p.noStroke();
      p.text(tag, bx + 22, by + th / 2);
    }

    // ── descent badges: left side, cool blue ──────────────────────
    for (const wp of DESCENT) {
      const pt = pointAtT(wp.t);

      // time from summit = how far along descent (1-t) × duration
      const descentElapsed = (1 - wp.t) * HIKE_DURATION_MIN * 60;
      const arrivalSec  = startSec + HIKE_DURATION_MIN * 60 + descentElapsed;
      const arrivalHour = (arrivalSec / 3600) % 24;
      const forecast    = forecastWeather(arrivalHour);
      const arrH = p.floor(arrivalHour);
      const arrM = p.floor((arrivalHour - arrH) * 60);
      const timeStr = p.nf(arrH, 2) + ':' + p.nf(arrM, 2);
      const tag = timeStr + '   ↓ ' + (wp.feet > 0
        ? wp.feet + ' ft · ' + wp.label
        : wp.label);

      const tw = tag.length * 5.6 + 30;
      const th = 22;
      const bx = pt.x - 14 - tw;
      const by = pt.y - th / 2;

      // connector from trail to right edge of badge
      p.stroke(150, 200, 255, 70); p.strokeWeight(1);
      p.line(pt.x - 5, pt.y, bx + tw, pt.y);

      p.noStroke();
      p.fill(0, 20, 50, 145);
      p.rect(bx, by, tw, th, 6);

      // icon on right side of badge (closest to trail)
      drawWeatherIcon(forecast.type, bx + tw - 12, by + th / 2, 8);

      p.fill(190, 220, 255);
      p.textSize(9.5); p.textAlign(p.LEFT, p.CENTER); p.noStroke();
      p.text(tag, bx + 6, by + th / 2);
    }
  }

  // total hike duration in minutes (start → summit)
  const HIKE_DURATION_MIN = 210;

  function forecastWeather(hour24) {
    // return the weather type closest to the given hour
    let best = WEATHER[0], bestDiff = 99;
    for (const w of WEATHER) {
      const diff = Math.abs(w.hour - hour24);
      if (diff < bestDiff) { bestDiff = diff; best = w; }
    }
    return best;
  }


  function drawWeatherIcon(type, x, y, r) {
    p.noStroke();
    if (type === 'sun' || type === 'sunrise') {
      p.fill(255,225,60,230); p.ellipse(x, y, r, r);
      p.stroke(255,225,60,180); p.strokeWeight(1.5);
      for (let a = 0; a < p.TWO_PI; a += p.PI/4)
        p.line(x+p.cos(a)*r*0.72, y+p.sin(a)*r*0.72, x+p.cos(a)*r*1.25, y+p.sin(a)*r*1.25);
    } else if (type === 'cloud') {
      p.noStroke(); p.fill(215,230,245,220);
      p.ellipse(x, y, r*1.5, r*0.9);
      p.ellipse(x-r*0.3, y+r*0.2, r, r*0.75);
      p.ellipse(x+r*0.3, y+r*0.2, r, r*0.75);
    } else if (type === 'rain') {
      p.noStroke(); p.fill(175,200,225,220);
      p.ellipse(x, y-4, r*1.5, r*0.9);
      p.ellipse(x-r*0.3, y-2, r, r*0.75);
      p.stroke(100,160,220,200); p.strokeWeight(1.5);
      for (let i = -1; i <= 1; i++)
        p.line(x+i*6, y+5, x+i*6-2, y+14);
    }
  }

  // ── hiker ────────────────────────────────────────────────────────
  function drawHiker() {
    const t  = manualT !== null ? manualT : timeProgress();
    const pt = pointAtT(t);
    const hx = pt.x, hy = pt.y;
    p.noStroke();
    for (let r = 24; r > 0; r -= 4) {
      p.fill(255,200,100, p.map(r,0,24,55,0));
      p.ellipse(hx, hy-10, r*1.5, r);
    }
    p.noStroke(); p.fill(235,195,140); p.ellipse(hx, hy-18, 10, 10);
    p.fill(80,55,30);
    p.rect(hx-6, hy-24, 12, 5, 2);
    p.rect(hx-4, hy-29, 8, 6, 2);
    p.stroke(50,80,140); p.strokeWeight(2.5);
    p.line(hx, hy-13, hx, hy-3);
    p.line(hx, hy-10, hx-6, hy-4);
    p.line(hx, hy-10, hx+5, hy-5);
    p.stroke(60,50,40);
    p.line(hx, hy-3, hx-4, hy+7);
    p.line(hx, hy-3, hx+4, hy+6);
    p.stroke(160,130,80); p.strokeWeight(1.5);
    p.line(hx+5, hy-5, hx+9, hy+8);
    p.noStroke(); p.fill(60,110,170,210);
    p.rect(hx+1, hy-12, 6, 8, 2);
  }

  // ── interaction 2: hiker tooltip ─────────────────────────────────
  function drawHikerTooltip() {
    const t  = manualT !== null ? manualT : timeProgress();
    const pt = pointAtT(t);
    if (p.dist(p.mouseX, p.mouseY, pt.x, pt.y) > 28) return;
    const elev = p.floor(p.map(t, 0, 1, 0, 3567));
    const tip  = p.nf(simHour(),2)+':'+p.nf(simMinute(),2)+':'+p.nf(simSecond(),2)
               + '  |  ' + elev + ' ft';
    const tw = tip.length * 6.5 + 16;
    const tx = p.constrain(pt.x - tw/2, 4, W - tw - 4);
    const ty = pt.y - 46;
    p.noStroke(); p.fill(0,0,0,160); p.rect(tx, ty, tw, 22, 6);
    p.fill(255,240,180); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
    p.text(tip, tx + 8, ty + 11);
  }

  // ── interaction 3: trail hover elevation ─────────────────────────
  function drawTrailHoverElevation() {
    if (hoveredTrailIdx < 0 || hoveredWP) return;
    const pt   = trailPts[hoveredTrailIdx];
    const t    = hoveredTrailIdx / (trailPts.length - 1);
    const elev = p.floor(p.map(t, 0, 1, 0, 3567));
    const label = elev + ' ft';
    // dot on trail
    p.noStroke(); p.fill(255,220,80,200); p.ellipse(pt.x, pt.y, 8, 8);
    // label
    const tx = p.constrain(pt.x - 22, 4, W - 56);
    const ty = pt.y - 22;
    p.fill(0,0,0,150); p.rect(tx, ty, 48, 18, 5);
    p.fill(255,240,180); p.textSize(10); p.textAlign(p.CENTER, p.CENTER);
    p.text(label, tx + 24, ty + 9);
  }


  // ── interaction 4: speed controls ────────────────────────────────
  function drawSpeedControls() {
    const bx = W - 112, by = H - 44;
    const labels = ['1×', '10×', '100×'];
    const speeds = [1, 10, 100];
    p.noStroke(); p.fill(0,0,0,140); p.rect(bx-2, by-2, 96, 34, 6);
    for (let i = 0; i < 3; i++) {
      const x = bx + i * 32;
      const active = speedMult === speeds[i];
      p.noStroke();
      p.fill(active ? p.color(200,150,30) : p.color(60,60,60,180));
      p.rect(x, by, 30, 30, 5);
      p.fill(active ? p.color(255,240,180) : p.color(180,170,150));
      p.textSize(10); p.textAlign(p.CENTER, p.CENTER);
      p.text(labels[i], x+15, by+15);
    }
    p.noStroke(); p.fill(180,160,120,160); p.textSize(9);
    p.textAlign(p.CENTER, p.TOP);
    p.text('speed', bx + 47, by + 32);
  }

  // ── time display ─────────────────────────────────────────────────
  function drawTimeDisplay() {
    const timeStr = p.nf(simHour(),2)+':'+p.nf(simMinute(),2)+':'+p.nf(simSecond(),2);
    p.noStroke(); p.fill(0,0,0,140); p.rect(12,12,118,34,8);
    p.fill(255,240,200); p.textAlign(p.LEFT,p.CENTER);
    p.textSize(18); p.textFont('monospace');
    p.text(timeStr, 20, 29);
    p.textFont('Georgia');
    if (manualT !== null) {
      p.noStroke(); p.fill(255,160,40,200); p.rect(12,50,118,18,5);
      p.fill(20,10,0); p.textSize(10); p.textAlign(p.CENTER,p.CENTER);
      p.text('click waypoint to resume', 71, 59);
    }

    // legend: ascent / descent badge key
    p.noStroke(); p.fill(0,0,0,110); p.rect(12, H-36, 170, 20, 5);
    p.textSize(9.5); p.textAlign(p.LEFT, p.CENTER); p.noStroke();
    p.fill(255, 235, 190); p.text('↑ ascent forecast', 20, H-26);
    p.fill(190, 220, 255); p.text('↓ descent forecast', 110, H-26);
  }

});
