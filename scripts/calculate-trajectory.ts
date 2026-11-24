// Calculate trajectory from bounce pad (940, 880) to shelf (800, 600)
// Ball radius = 24.
// Pad surface = 880 - 9 = 871. Ball center on pad = 871 - 24 = 847.
// Shelf top surface = 600 - 12 = 588. Ball center on shelf = 588 - 24 = 564.
// Shelf X span = [800 - 70, 800 + 70] = [730, 870].

console.log('--- Testing Launch Speeds from Bounce Pad to Shelf ---');

for (const speedY of [19.0, 20.0, 21.0, 22.0, 22.5]) {
  // Try different horizontal velocities vx
  for (const vx of [-0.5, -1.0, -1.5, -2.0, -2.5, -3.0]) {
    let x = 940;
    let y = 845;
    let vy = -speedY;
    let curVx = vx;
    let min_y = y;
    let landed = false;
    let landingX = 0;
    let landingFrame = 0;

    for (let f = 0; f < 90; f++) {
      x += curVx;
      y += vy;
      vy += 0.6; // gravity
      if (y < min_y) min_y = y;

      // Check landing on shelf
      if (vy > 0 && Math.abs(y - 564) < 8 && x >= 730 && x <= 870) {
        landed = true;
        landingX = x;
        landingFrame = f;
        break;
      }
    }

    if (landed) {
      console.log(`✅ speedY=${speedY.toFixed(1)}, vx=${vx.toFixed(1)} -> Landed on shelf at frame ${landingFrame}, x=${landingX.toFixed(1)}, apexY=${min_y.toFixed(1)} (clears by ${(564 - min_y).toFixed(1)}px)`);
      break;
    }
  }
}
