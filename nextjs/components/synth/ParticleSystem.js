import React, { useEffect, useRef } from 'react';

const ParticleSystem = ({ color, position, active }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const prevColorRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Find the How It Works section by ID
    sectionRef.current = document.getElementById('how-it-works');
    
    const resizeCanvas = () => {
      if (sectionRef.current) {
        // Get the dimensions of the how-it-works section
        const sectionRect = sectionRef.current.getBoundingClientRect();
        
        // Set canvas dimensions to match the section size
        canvas.width = sectionRect.width;
        canvas.height = sectionRect.height;
      }
    };
    
    // Initial setup
    resizeCanvas();
    
    // Add event listener for window resize
    window.addEventListener('resize', resizeCanvas);

    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Set up the animation and particle effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true }); // Ensure alpha channel is enabled
    if (!ctx) return;

    // Helper function to convert hex to rgba
    const getRGBA = (hex, alpha) => {
      if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
        return `rgba(108, 99, 255, ${alpha})`; // Default purple if invalid hex
      }
      
      try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } catch (error) {
        console.error("Error parsing color:", error);
        return `rgba(108, 99, 255, ${alpha})`; // Default purple on error
      }
    };

    // Function to create new particles
    const createParticles = () => {
      const particles = [];
      // Create particles that cover the section
      const numParticles = 500; // More particles to ensure full coverage
      
      if (!sectionRef.current) return particles;
      
      // Use canvas dimensions for particle distribution
      const bounds = {
        left: 0,
        top: 0,
        width: canvas.width,
        height: canvas.height
      };
      
      // Create particles distributed throughout the full width and height
      for (let i = 0; i < numParticles; i++) {
        // Position across full section width and height
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        
        // Very slow, random movement
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.4 + 0.1; // Slow speed
        
        // Varied sizes for depth effect
        const size = Math.random() * 5 + 1; // Slightly smaller particles
        
        // If we have a previous color, create a smooth color transition
        const particleColor = prevColorRef.current || color;
        
        particles.push({
          x: x,
          y: y,
          originX: x, // Save origin for boundary behavior
          originY: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: size,
          alpha: 0, // Start invisible and fade in
          targetAlpha: 0.15 + Math.random() * 0.25, // Increased opacity for better visibility
          life: 1,
          fadeSpeed: 0.003 + Math.random() * 0.005, // Slow fade-in speed
          angle: angle,
          color: particleColor,
          targetColor: color, // Color to transition to
          colorTransitionSpeed: 0.02, // How quickly to change color
          colorProgress: 0, // Progress of color transition (0-1)
          // Add gentle wave motion
          wave: {
            amplitude: Math.random() * 2 + 0.5,
            frequency: Math.random() * 0.02 + 0.005,
            offset: Math.random() * Math.PI * 2
          },
          // Add subtle turbulence
          turbulence: {
            x: Math.random() * 0.1 - 0.05,
            y: Math.random() * 0.1 - 0.05,
            changeRate: 0.01 + Math.random() * 0.02
          },
          // Use canvas bounds with soft restriction
          bounds: bounds
        });
      }
      
      return particles;
    };

    // Color interpolation function for smooth transitions
    const interpolateColor = (startColor, endColor, progress) => {
      // Handle invalid colors
      if (!startColor || !endColor || 
          typeof startColor !== 'string' || 
          typeof endColor !== 'string' ||
          !startColor.startsWith('#') ||
          !endColor.startsWith('#')) {
        return endColor || startColor || '#6C63FF'; // Default if invalid
      }
      
      try {
        // Extract RGB components
        const r1 = parseInt(startColor.slice(1, 3), 16);
        const g1 = parseInt(startColor.slice(3, 5), 16);
        const b1 = parseInt(startColor.slice(5, 7), 16);
        
        const r2 = parseInt(endColor.slice(1, 3), 16);
        const g2 = parseInt(endColor.slice(3, 5), 16);
        const b2 = parseInt(endColor.slice(5, 7), 16);
        
        // Calculate interpolated values
        const r = Math.round(r1 + (r2 - r1) * progress);
        const g = Math.round(g1 + (g2 - g1) * progress);
        const b = Math.round(b1 + (b2 - b1) * progress);
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      } catch (error) {
        console.error("Error interpolating color:", error);
        return endColor; // Fallback to end color on error
      }
    };

    // Animation function
    const animate = () => {
      // Check if the section is still available
      if (!sectionRef.current) {
        // If section is gone, stop the animation
        isAnimatingRef.current = false;
        return;
      }
      
      // Check if section is in viewport, if not - no need to animate particles
      const sectionRect = sectionRef.current.getBoundingClientRect();
      const extendedVisibilityCheck = 400; // Check with extra margin
      const isVisible = (
        sectionRect.top - extendedVisibilityCheck < window.innerHeight &&
        sectionRect.bottom + extendedVisibilityCheck > 0
      );
      
      if (!isVisible) {
        // Request another frame but don't draw anything
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Clear the canvas completely to maintain transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Check if we have any particles to animate
      if (particlesRef.current.length === 0) {
        isAnimatingRef.current = false;
        return;
      }
      
      // Update and draw each particle
      particlesRef.current.forEach(particle => {
        // Gradually fade in particles
        if (particle.alpha < particle.targetAlpha) {
          particle.alpha += particle.fadeSpeed;
          if (particle.alpha > particle.targetAlpha) {
            particle.alpha = particle.targetAlpha;
          }
        }
        
        // Smoothly update color if target color is different
        if (particle.color !== particle.targetColor) {
          particle.colorProgress += particle.colorTransitionSpeed;
          if (particle.colorProgress >= 1) {
            particle.colorProgress = 1;
            particle.color = particle.targetColor;
          } else {
            particle.displayColor = interpolateColor(
              particle.color, 
              particle.targetColor, 
              particle.colorProgress
            );
          }
        } else {
          particle.displayColor = particle.color;
        }
        
        // Update position with gentle floating movement
        const time = performance.now() * 0.001; // Convert to seconds
        
        // Add wave motion
        const waveX = Math.sin(time * particle.wave.frequency + particle.wave.offset) * particle.wave.amplitude;
        const waveY = Math.cos(time * particle.wave.frequency + particle.wave.offset) * particle.wave.amplitude;
        
        // Add turbulence
        particle.turbulence.x += (Math.random() * 2 - 1) * particle.turbulence.changeRate;
        particle.turbulence.y += (Math.random() * 2 - 1) * particle.turbulence.changeRate;
        
        // Dampen turbulence to prevent excessive drift
        particle.turbulence.x *= 0.99;
        particle.turbulence.y *= 0.99;
        
        // Apply movement
        particle.x += particle.vx + waveX + particle.turbulence.x;
        particle.y += particle.vy + waveY + particle.turbulence.y;
        
        // Soft boundary handling - gently push particles back toward center
        if (particle.x < 0 || particle.x > particle.bounds.width) {
          // Reverse direction and push back from edge
          particle.vx *= -0.5;
          // Push toward center
          particle.x += (particle.bounds.width / 2 - particle.x) * 0.001;
        }
        
        if (particle.y < 0 || particle.y > particle.bounds.height) {
          // Reverse direction and push back from edge
          particle.vy *= -0.5;
          // Push toward center
          particle.y += (particle.bounds.height / 2 - particle.y) * 0.001;
        }
        
        // Draw particle
        // Use the current active color for new particles or the transition color for existing ones
        const particleColor = particle.displayColor || color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = getRGBA(particleColor, particle.alpha);
        ctx.fill();
        
        // Add subtle glow with reduced opacity
        const glowRadius = particle.radius * 2;
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, glowRadius
        );
        gradient.addColorStop(0, getRGBA(particleColor, particle.alpha * 0.4));
        gradient.addColorStop(1, getRGBA(particleColor, 0));
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      
      // Request next animation frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Respond to changes in active state or color
    if (active) {
      // Save previous color for transitions if we're already active
      if (particlesRef.current.length > 0 && color !== prevColorRef.current) {
        // Update existing particles to transition to new color
        particlesRef.current.forEach(particle => {
          particle.targetColor = color;
          particle.colorProgress = 0; // Reset progress for new transition
        });
      }
      
      // Store current color for next update
      prevColorRef.current = color;
      
      // Only create new particles if none exist
      if (particlesRef.current.length === 0) {
        particlesRef.current = createParticles();
      }
      
      // Start animation if not already running
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    } else {
      // If not active, gradually fade out existing particles
      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach(particle => {
          particle.targetAlpha = 0;
          particle.fadeSpeed = 0.02; // Faster fade-out than fade-in
        });
      }
    }

    // No cleanup needed here as the main cleanup is in the first useEffect
  }, [active, color, position]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        background: 'transparent'
      }}
    />
  );
};

export default ParticleSystem; 