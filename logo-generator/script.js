document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('logoCanvas');
  const ctx = canvas.getContext('2d');
  const exportTypeSelect = document.getElementById('exportType');
  const exportSizeSelect = document.getElementById('exportSize');
  const animationFrameSlider = document.getElementById('animationFrame');
  const frameValueDisplay = document.getElementById('frameValue');
  const animateButton = document.getElementById('animateButton');
  const downloadButton = document.getElementById('download');

  // Animation variables
  let isAnimating = false;
  let animationId = null;
  let currentFrame = 0;

  // Colors exactly matching website
  const PRIMARY = '#6c63ff'; // Purple
  const ACCENT = '#4ecdc4';  // Teal/Cyan

  // Draw the exact EnergyBall from the website header
  function drawEnergyBall(x, y, radius, frame) {
    // EXACT match from NextHeader.tsx and EnergyBall.tsx

    // Save initial state
    ctx.save();
    
    // RENDER IN EXACT ORDER AS CSS LAYERS:
    
    // LAYER 1: Ring (positioned at exact top level z-index)
    // <Ring> styled component - rotates 3s linear infinite
    const ringRadius = radius * 1.7; // 70% larger based on top/left/right/bottom: -15%
    const ringThickness = Math.max(2, radius * 0.06);
    const rotation = (frame / 360) * (Math.PI * 2);
    
    // Ring base (border: 2px solid rgba(108, 99, 255, 0.5))
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(108, 99, 255, 0.5)';
    ctx.lineWidth = ringThickness;
    ctx.stroke();
    
    // Ring accent (border-top: 2px solid rgba(78, 205, 196, 0.8))
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, rotation, rotation + Math.PI / 2);
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.8)';
    ctx.lineWidth = ringThickness;
    ctx.stroke();
    
    // LAYER 2: Ball (container)
    
    // 2.1: ::before shimmer effect
    // Shimmer background - matches ball::before
    // Position -5% on all sides = 10% larger
    const shimmerRadius = radius * 1.1;
    ctx.beginPath();
    ctx.arc(x, y, shimmerRadius, 0, Math.PI * 2);
    
    // Linear gradient background - exactly as in CSS
    // background: linear-gradient(45deg, rgba(108, 99, 255, 0.8), rgba(78, 205, 196, 0.8), rgba(108, 99, 255, 0.8));
    const shimmerGradient = ctx.createLinearGradient(
      x - shimmerRadius, y - shimmerRadius,
      x + shimmerRadius, y + shimmerRadius
    );
    shimmerGradient.addColorStop(0, 'rgba(108, 99, 255, 0.8)');
    shimmerGradient.addColorStop(0.5, 'rgba(78, 205, 196, 0.8)');
    shimmerGradient.addColorStop(1, 'rgba(108, 99, 255, 0.8)');
    
    ctx.fillStyle = shimmerGradient;
    ctx.globalAlpha = 0.7; // Exact opacity from CSS
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // 2.2: Apply pulse effect from CSS animation
    // 2s infinite animation from scale 0.95 to 1
    const pulseScale = 0.95 + (Math.sin(frame * 0.1) * 0.05);
    
    // 2.3: Main ball with gradient
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulseScale, pulseScale);
    ctx.translate(-x, -y);
    
    // background: radial-gradient(circle at 30% 30%, #6c63ff, #4ecdc4);
    const ballGradient = ctx.createRadialGradient(
      x - radius * 0.4, // 30% offset
      y - radius * 0.4, // 30% offset
      0,
      x, y, radius
    );
    ballGradient.addColorStop(0, '#6c63ff');
    ballGradient.addColorStop(1, '#4ecdc4');
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = ballGradient;
    ctx.fill();
    
    // 2.4: Add box-shadow from the ball
    ctx.shadowColor = 'rgba(108, 99, 255, 0.7)';
    ctx.shadowBlur = radius * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // LAYER 3: Core (innermost circle)
    // 60% width/height from parent
    const coreRadius = radius * 0.6;
    
    // background: radial-gradient(circle at 30% 30%, #fff, #6c63ff);
    const coreGradient = ctx.createRadialGradient(
      x - coreRadius * 0.4, // 30% offset in core
      y - coreRadius * 0.4, // 30% offset in core
      0,
      x, y, coreRadius
    );
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(1, '#6c63ff');
    
    ctx.beginPath();
    ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.globalAlpha = 0.9; // Exact opacity from CSS
    ctx.fill();
    
    // Core box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.7)
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = coreRadius * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fill();
    
    // Clean up
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.restore();
  }

  // Draw the exact text logo from the website header
  function drawLogoText(x, y, size) {
    ctx.save();
    
    // Exact font settings from CSS
    const fontSize = size * 0.9; // 1.8rem relative to ball size
    ctx.font = `700 ${fontSize}px Montserrat, sans-serif`;
    ctx.textBaseline = 'middle';
    
    // Letter spacing (2.5px from CSS)
    const letterSpacing = size * 0.078; // 2.5px relative to ball size
    
    // CYMA gradient (exactly matches CSS)
    const gradient = ctx.createLinearGradient(x, y, x + fontSize * 4, y);
    gradient.addColorStop(0, PRIMARY);
    gradient.addColorStop(1, ACCENT);
    
    // Draw CYMA with letter spacing
    const cymaLetters = 'CYMA'.split('');
    let currentX = x;
    let cymaWidth = 0;
    
    cymaLetters.forEach(letter => {
      ctx.fillStyle = gradient;
      ctx.fillText(letter, currentX, y);
      const width = ctx.measureText(letter).width;
      currentX += width + letterSpacing;
      cymaWidth += width + letterSpacing;
    });
    
    // Draw SPHERE in white directly after (no gap)
    const sphereLetters = 'SPHERE'.split('');
    ctx.fillStyle = 'white';
    
    sphereLetters.forEach(letter => {
      ctx.fillText(letter, currentX, y);
      const width = ctx.measureText(letter).width;
      currentX += width + letterSpacing;
    });
    
    // Add glow effect (exactly matches CSS ::after)
    ctx.shadowColor = PRIMARY;
    ctx.shadowBlur = size * 0.4; // Matches 15px blur relative to size
    ctx.globalAlpha = 0.5; // Exact opacity from CSS
    
    // Redraw with glow
    currentX = x;
    cymaLetters.forEach(letter => {
      ctx.fillStyle = gradient;
      ctx.fillText(letter, currentX, y);
      const width = ctx.measureText(letter).width;
      currentX += width + letterSpacing;
    });
    
    sphereLetters.forEach(letter => {
      ctx.fillStyle = 'white';
      ctx.fillText(letter, currentX, y);
      const width = ctx.measureText(letter).width;
      currentX += width + letterSpacing;
    });
    
    ctx.restore();
  }

  // Main rendering function
  function renderLogo(frame) {
    const exportType = exportTypeSelect.value;
    const size = parseInt(exportSizeSelect.value);
    const animationFrame = frame !== undefined ? frame : parseInt(animationFrameSlider.value);
    
    if (frame !== undefined) {
      animationFrameSlider.value = animationFrame;
      frameValueDisplay.textContent = `${animationFrame}°`;
    }
    
    // Calculate base sizes based on header exact proportions
    const ballRadius = size / 16; // Base ball size scaled to canvas
    
    // First calculate expected dimensions to ensure everything fits
    let estimatedWidth, estimatedHeight;
    
    if (exportType === 'ball') {
      // Just the ball - make square with enough space for the glow and rings
      estimatedHeight = ballRadius * 4;
      estimatedWidth = estimatedHeight;
    } else if (exportType === 'text') {
      // Text only - measure text width accurately
      const fontSize = ballRadius * 1.8; // Match 1.8rem from CSS
      const letterSpacing = Math.max(1, ballRadius * 0.078); // 2.5px letter spacing scaled
      
      // Measure text dimensions
      ctx.font = `700 ${fontSize}px Montserrat, sans-serif`;
      let textWidth = 0;
      
      // Calculate width with letter spacing
      'CYMASPHERE'.split('').forEach(letter => {
        textWidth += ctx.measureText(letter).width + letterSpacing;
      });
      
      estimatedHeight = fontSize * 2;
      estimatedWidth = textWidth * 1.3; // Add padding
    } else { // Combined logo (ball + text)
      const fontSize = ballRadius * 1.8; // Match 1.8rem from CSS
      const letterSpacing = Math.max(1, ballRadius * 0.078); // 2.5px letter spacing scaled
      const exactMargin = ballRadius * 0.25; // Exact 8px margin from header scaled
      
      // Measure text dimensions
      ctx.font = `700 ${fontSize}px Montserrat, sans-serif`;
      let textWidth = 0;
      
      // Calculate width with letter spacing
      'CYMASPHERE'.split('').forEach(letter => {
        textWidth += ctx.measureText(letter).width + letterSpacing;
      });
      
      // Ball + margin + text + right padding
      estimatedWidth = (ballRadius * 2.8) + exactMargin + textWidth + (ballRadius * 2);
      estimatedHeight = Math.max(ballRadius * 3, fontSize * 2); // Whichever is taller
    }
    
    // Apply minimum dimensions to ensure everything fits
    const canvasWidth = Math.max(size * 0.5, estimatedWidth);
    const canvasHeight = Math.max(size * 0.25, estimatedHeight);
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear canvas
    ctx.fillStyle = '#0f0e17'; // Exact background color from website
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw based on type
    if (exportType === 'ball') {
      // Center the ball
      drawEnergyBall(canvasWidth/2, canvasHeight/2, ballRadius, animationFrame);
    } else if (exportType === 'text') {
      // Left-aligned text with margin
      const margin = canvasWidth * 0.05;
      drawLogoText(margin, canvasHeight/2, ballRadius * 2);
    } else {
      // Position exactly as in header: left-aligned with proper spacing
      const ballX = ballRadius * 1.4; // Position from left with enough space for glow
      const margin = ballRadius * 0.25; // Exact 8px margin from header scaled
      
      // Draw energy ball first
      drawEnergyBall(ballX, canvasHeight/2, ballRadius, animationFrame);
      
      // Draw text right after ball with exact margin as in header
      const textX = ballX + ballRadius + margin;
      drawLogoText(textX, canvasHeight/2, ballRadius * 2);
    }
  }
  
  // Animation handling
  function animate() {
    currentFrame = (currentFrame + 1) % 361;
    renderLogo(currentFrame);
    
    if (isAnimating) {
      animationId = requestAnimationFrame(animate);
    }
  }
  
  // Event listeners
  exportTypeSelect.addEventListener('change', () => renderLogo());
  exportSizeSelect.addEventListener('change', () => renderLogo());
  
  animationFrameSlider.addEventListener('input', () => {
    currentFrame = parseInt(animationFrameSlider.value);
    frameValueDisplay.textContent = `${currentFrame}°`;
    renderLogo();
  });
  
  // Animation toggle
  animateButton.addEventListener('click', () => {
    if (isAnimating) {
      isAnimating = false;
      cancelAnimationFrame(animationId);
      animateButton.textContent = 'Animate Preview';
    } else {
      isAnimating = true;
      animateButton.textContent = 'Stop Animation';
      animate();
    }
  });
  
  // Download functionality
  downloadButton.addEventListener('click', () => {
    const exportType = exportTypeSelect.value;
    const size = parseInt(exportSizeSelect.value);
    const frame = parseInt(animationFrameSlider.value);
    
    // Create export canvas with same dimensions as preview
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // Set canvas size based on export type and content
    let canvasWidth, canvasHeight;
    const ballRadius = size / 16; // Base ball size scaled to canvas
    
    if (exportType === 'ball') {
      // Just the ball - make square with enough space for the glow and rings
      canvasWidth = canvasHeight = ballRadius * 4;
    } else if (exportType === 'text') {
      // Text only - measure text width accurately
      const fontSize = ballRadius * 1.8; // Match 1.8rem from CSS
      const letterSpacing = Math.max(1, ballRadius * 0.078); // 2.5px letter spacing scaled
      
      // Measure text dimensions
      ctx.font = `700 ${fontSize}px Montserrat, sans-serif`;
      let textWidth = 0;
      
      // Calculate width with letter spacing
      'CYMASPHERE'.split('').forEach(letter => {
        textWidth += ctx.measureText(letter).width + letterSpacing;
      });
      
      canvasHeight = fontSize * 2;
      canvasWidth = textWidth * 1.3; // Add padding
    } else { // both - like header
      const fontSize = ballRadius * 1.8; // Match 1.8rem from CSS
      const letterSpacing = Math.max(1, ballRadius * 0.078); // 2.5px letter spacing scaled
      const exactMargin = ballRadius * 0.25; // Exact 8px margin from header scaled
      
      // Measure text dimensions
      ctx.font = `700 ${fontSize}px Montserrat, sans-serif`;
      let textWidth = 0;
      
      // Calculate width with letter spacing
      'CYMASPHERE'.split('').forEach(letter => {
        textWidth += ctx.measureText(letter).width + letterSpacing;
      });
      
      // Ball + margin + text + right padding
      canvasWidth = (ballRadius * 2.8) + exactMargin + textWidth + (ballRadius * 2);
      canvasHeight = Math.max(ballRadius * 3, fontSize * 2); // Whichever is taller
    }
    
    // Set canvas dimensions
    exportCanvas.width = canvasWidth;
    exportCanvas.height = canvasHeight;
    
    // Create identical functions that use exportCtx
    function exportDrawEnergyBall(x, y, radius, frame) {
      // EXACT match from NextHeader.tsx and EnergyBall.tsx

      // Save initial state
      exportCtx.save();
      
      // RENDER IN EXACT ORDER AS CSS LAYERS:
      
      // LAYER 1: Ring (positioned at exact top level z-index)
      // <Ring> styled component - rotates 3s linear infinite
      const ringRadius = radius * 1.7; // 70% larger based on top/left/right/bottom: -15%
      const ringThickness = Math.max(2, radius * 0.06);
      const rotation = (frame / 360) * (Math.PI * 2);
      
      // Ring base (border: 2px solid rgba(108, 99, 255, 0.5))
      exportCtx.beginPath();
      exportCtx.arc(x, y, ringRadius, 0, Math.PI * 2);
      exportCtx.strokeStyle = 'rgba(108, 99, 255, 0.5)';
      exportCtx.lineWidth = ringThickness;
      exportCtx.stroke();
      
      // Ring accent (border-top: 2px solid rgba(78, 205, 196, 0.8))
      exportCtx.beginPath();
      exportCtx.arc(x, y, ringRadius, rotation, rotation + Math.PI / 2);
      exportCtx.strokeStyle = 'rgba(78, 205, 196, 0.8)';
      exportCtx.lineWidth = ringThickness;
      exportCtx.stroke();
      
      // LAYER 2: Ball (container)
      
      // 2.1: ::before shimmer effect
      // Shimmer background - matches ball::before
      // Position -5% on all sides = 10% larger
      const shimmerRadius = radius * 1.1;
      exportCtx.beginPath();
      exportCtx.arc(x, y, shimmerRadius, 0, Math.PI * 2);
      
      // Linear gradient background - exactly as in CSS
      // background: linear-gradient(45deg, rgba(108, 99, 255, 0.8), rgba(78, 205, 196, 0.8), rgba(108, 99, 255, 0.8));
      const shimmerGradient = exportCtx.createLinearGradient(
        x - shimmerRadius, y - shimmerRadius,
        x + shimmerRadius, y + shimmerRadius
      );
      shimmerGradient.addColorStop(0, 'rgba(108, 99, 255, 0.8)');
      shimmerGradient.addColorStop(0.5, 'rgba(78, 205, 196, 0.8)');
      shimmerGradient.addColorStop(1, 'rgba(108, 99, 255, 0.8)');
      
      exportCtx.fillStyle = shimmerGradient;
      exportCtx.globalAlpha = 0.7; // Exact opacity from CSS
      exportCtx.fill();
      exportCtx.globalAlpha = 1.0;
      
      // 2.2: Apply pulse effect from CSS animation
      // 2s infinite animation from scale 0.95 to 1
      const pulseScale = 0.95 + (Math.sin(frame * 0.1) * 0.05);
      
      // 2.3: Main ball with gradient
      exportCtx.save();
      exportCtx.translate(x, y);
      exportCtx.scale(pulseScale, pulseScale);
      exportCtx.translate(-x, -y);
      
      // background: radial-gradient(circle at 30% 30%, #6c63ff, #4ecdc4);
      const ballGradient = exportCtx.createRadialGradient(
        x - radius * 0.4, // 30% offset
        y - radius * 0.4, // 30% offset
        0,
        x, y, radius
      );
      ballGradient.addColorStop(0, '#6c63ff');
      ballGradient.addColorStop(1, '#4ecdc4');
      
      exportCtx.beginPath();
      exportCtx.arc(x, y, radius, 0, Math.PI * 2);
      exportCtx.fillStyle = ballGradient;
      exportCtx.fill();
      
      // 2.4: Add box-shadow from the ball
      exportCtx.shadowColor = 'rgba(108, 99, 255, 0.7)';
      exportCtx.shadowBlur = radius * 0.3;
      exportCtx.beginPath();
      exportCtx.arc(x, y, radius, 0, Math.PI * 2);
      exportCtx.fillStyle = 'rgba(0, 0, 0, 0)';
      exportCtx.fill();
      exportCtx.shadowBlur = 0;
      
      // LAYER 3: Core (innermost circle)
      // 60% width/height from parent
      const coreRadius = radius * 0.6;
      
      // background: radial-gradient(circle at 30% 30%, #fff, #6c63ff);
      const coreGradient = exportCtx.createRadialGradient(
        x - coreRadius * 0.4, // 30% offset in core
        y - coreRadius * 0.4, // 30% offset in core
        0,
        x, y, coreRadius
      );
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(1, '#6c63ff');
      
      exportCtx.beginPath();
      exportCtx.arc(x, y, coreRadius, 0, Math.PI * 2);
      exportCtx.fillStyle = coreGradient;
      exportCtx.globalAlpha = 0.9; // Exact opacity from CSS
      exportCtx.fill();
      
      // Core box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.7)
      exportCtx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      exportCtx.shadowBlur = coreRadius * 0.5;
      exportCtx.beginPath();
      exportCtx.arc(x, y, coreRadius, 0, Math.PI * 2);
      exportCtx.fillStyle = 'rgba(0, 0, 0, 0)';
      exportCtx.fill();
      
      // Clean up
      exportCtx.globalAlpha = 1.0;
      exportCtx.shadowBlur = 0;
      exportCtx.restore();
      exportCtx.restore();
    }
  
    function exportDrawLogoText(x, y, size) {
      exportCtx.save();
      
      // Exact font settings from CSS
      const fontSize = size * 0.9; // 1.8rem relative to ball size
      exportCtx.font = `700 ${fontSize}px Montserrat, sans-serif`;
      exportCtx.textBaseline = 'middle';
      
      // Letter spacing (2.5px from CSS)
      const letterSpacing = size * 0.078; // 2.5px relative to ball size
      
      // CYMA gradient (exactly matches CSS)
      const gradient = exportCtx.createLinearGradient(x, y, x + fontSize * 4, y);
      gradient.addColorStop(0, PRIMARY);
      gradient.addColorStop(1, ACCENT);
      
      // Draw CYMA with letter spacing
      const cymaLetters = 'CYMA'.split('');
      let currentX = x;
      let cymaWidth = 0;
      
      cymaLetters.forEach(letter => {
        exportCtx.fillStyle = gradient;
        exportCtx.fillText(letter, currentX, y);
        const width = exportCtx.measureText(letter).width;
        currentX += width + letterSpacing;
        cymaWidth += width + letterSpacing;
      });
      
      // Draw SPHERE in white directly after (no gap)
      const sphereLetters = 'SPHERE'.split('');
      exportCtx.fillStyle = 'white';
      
      sphereLetters.forEach(letter => {
        exportCtx.fillText(letter, currentX, y);
        const width = exportCtx.measureText(letter).width;
        currentX += width + letterSpacing;
      });
      
      // Add glow effect (exactly matches CSS ::after)
      exportCtx.shadowColor = PRIMARY;
      exportCtx.shadowBlur = size * 0.4; // Matches 15px blur relative to size
      exportCtx.globalAlpha = 0.5; // Exact opacity from CSS
      
      // Redraw with glow
      currentX = x;
      cymaLetters.forEach(letter => {
        exportCtx.fillStyle = gradient;
        exportCtx.fillText(letter, currentX, y);
        const width = exportCtx.measureText(letter).width;
        currentX += width + letterSpacing;
      });
      
      sphereLetters.forEach(letter => {
        exportCtx.fillStyle = 'white';
        exportCtx.fillText(letter, currentX, y);
        const width = exportCtx.measureText(letter).width;
        currentX += width + letterSpacing;
      });
      
      exportCtx.restore();
    }
    
    // Draw based on type
    if (exportType === 'ball') {
      exportDrawEnergyBall(canvasWidth/2, canvasHeight/2, ballRadius, frame);
    } else if (exportType === 'text') {
      const margin = canvasWidth * 0.05;
      exportDrawLogoText(margin, canvasHeight/2, ballRadius * 2);
    } else { // both - like header
      const ballX = ballRadius * 1.4; // Position from left with enough space for glow
      const margin = ballRadius * 0.25; // Exact 8px margin from header scaled
      
      // Draw energy ball first
      exportDrawEnergyBall(ballX, canvasHeight/2, ballRadius, frame);
      
      // Draw text right after ball with exact margin as in header
      const textX = ballX + ballRadius + margin;
      exportDrawLogoText(textX, canvasHeight/2, ballRadius * 2);
    }
    
    // Download
    try {
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `cymasphere-logo-${exportType}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Error exporting:', e);
      alert('Download failed. Please try again.');
    }
  });
  
  // Initial render
  renderLogo();
}); 