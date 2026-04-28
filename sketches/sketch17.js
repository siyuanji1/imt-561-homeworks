// Example 11 placeholder
registerSketch('sk17', function (p) {
  const canvasSize = 800;
  const duration = 4000;
  const totalPhases = 4;
  const labels = ["Breathe in", "Hold", "Breathe out", "Hold"];
  const colors = {
    text: p.color(255, 255, 255),
    lines: [
      p.color(56, 127, 117),
      p.color(123, 188, 182),
      p.color(152, 228, 217),
      p.color(168, 189, 191),
    ],
  };

  let phase = 0; // Current phase (0-3)
  let startTime = 0; // Start time of the current phase
  let progress = 0; // Progress of the current phase (0-1)
  const stars = []; // Array to store star positions and brightness
  const numStars = 100; // Number of stars

  p.setup = function () {
    p.createCanvas(p.min(p.windowWidth, canvasSize), p.min(p.windowHeight, canvasSize));
    p.textFont('Arial');
    p.textAlign(p.CENTER, p.CENTER);
    p.noFill();
    startTime = p.millis();

    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: p.random(p.width),
        y: p.random(p.height),
        brightness: p.random(100, 255),
        speed: p.random(0.5, 2),
      });
    }
  };

  p.draw = function () {
    // Draw dynamic starry background
    drawStarryBackground();

    // Calculate progress and handle phase transitions
    const elapsed = p.millis() - startTime;
    progress = p.min(elapsed / duration, 1); // Progress of the current phase
    if (progress >= 1) {
      phase = (phase + 1) % totalPhases;
      startTime = p.millis();
    }

    // Draw the square with one shrinking line
    drawSquareWithShrinkingLine(progress, phase);

    // Draw labels and countdown
    drawTextOverlay(labels[phase], Math.ceil(4 - progress * 4));
  };

  function drawStarryBackground() {
    p.background(0); // Black background
    for (let star of stars) {
      p.noStroke();
      p.fill(255, star.brightness);
      p.circle(star.x, star.y, 2);

      // Update star position and brightness
      star.y += star.speed;
      if (star.y > p.height) {
        star.y = 0;
        star.x = p.random(p.width);
      }
      star.brightness = p.map(p.sin(p.millis() * 0.001 + star.x), -1, 1, 100, 255);
    }
  }

  function drawSquareWithShrinkingLine(progress, phase) {
    const halfSize = p.width / 2;
    const margin = 100;
    const startX = -halfSize + margin;
    const startY = -halfSize + margin;
    const endX = halfSize - margin;
    const endY = halfSize - margin;

    p.push();
    p.translate(halfSize, halfSize); // Center the square
    p.strokeWeight(8);
    p.strokeJoin(p.ROUND);

    // Apply neon glow effect
    p.drawingContext.shadowBlur = 20;
    p.drawingContext.shadowColor = p.color(255, 255, 255);

    for (let i = 0; i < totalPhases; i++) {
      p.stroke(colors.lines[i]);

      // Calculate the shrinking line for the current phase
      const shrinkProgress = i === phase ? progress : (i < phase ? 1 : 0);

      switch (i) {
        case 0: // Top edge (left to right)
          p.line(
            p.lerp(startX, endX, shrinkProgress),
            startY,
            endX,
            startY
          );
          break;
        case 1: // Right edge (top to bottom)
          p.line(
            endX,
            p.lerp(startY, endY, shrinkProgress),
            endX,
            endY
          );
          break;
        case 2: // Bottom edge (right to left)
          p.line(
            startX,
            endY,
            p.lerp(endX, startX, shrinkProgress),
            endY
          );
          break;
        case 3: // Left edge (bottom to top)
          p.line(
            startX,
            startY,
            startX,
            p.lerp(endY, startY, shrinkProgress)
          );
          break;
      }
    }

    p.pop();
  }

  function drawTextOverlay(label, countdown) {
    p.fill(colors.text);
    p.textSize(32);
    p.text(label, p.width / 2, p.height / 2 - 40);
    p.textSize(48);
    p.text(countdown, p.width / 2, p.height / 2 + 40);
  }

  p.windowResized = function () {
    p.resizeCanvas(p.min(p.windowWidth, canvasSize), p.min(p.windowHeight, canvasSize));
  };

  // Add mousePressed function to reset the timer
  p.mousePressed = function () {
    phase = 0; // Reset to the first phase
    startTime = p.millis(); // Reset the start time
  };
});