// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// --- Custom Cursor Logic ---
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursor-follower');
const hoverTargets = document.querySelectorAll('.hover-target');

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let followerX = 0, followerY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Smooth cursor following using requestAnimationFrame
function animateCursor() {
  // Move main dot instantly
  cursorX += (mouseX - cursorX);
  cursorY += (mouseY - cursorY);
  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;
  
  // Move follower ring with delay
  followerX += (mouseX - followerX) * 0.15;
  followerY += (mouseY - followerY) * 0.15;
  follower.style.left = `${followerX}px`;
  follower.style.top = `${followerY}px`;
  
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Set up hover states
hoverTargets.forEach(target => {
  target.addEventListener('mouseenter', () => {
    document.body.classList.add('hover-active');
  });
  target.addEventListener('mouseleave', () => {
    document.body.classList.remove('hover-active');
  });
});


// --- Three.js WebGL Particle System Background ---
const canvasContainer = document.getElementById('canvas-container');
let scene, camera, renderer, particles, particleSystem;
let particleCount = 750;
let targetParticleColor = new THREE.Color(0xfbbf24); // Start with Gold

function initThree() {
  // Scene & Camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasContainer.appendChild(renderer.domElement);

  // Particles Geometry
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  for (let i = 0; i < particleCount * 3; i += 3) {
    // Random position in a sphere-like shape
    positions[i] = (Math.random() - 0.5) * 80;
    positions[i + 1] = (Math.random() - 0.5) * 80;
    positions[i + 2] = (Math.random() - 0.5) * 80;

    // Velocities
    velocities.push({
      x: (Math.random() - 0.5) * 0.05,
      y: (Math.random() - 0.5) * 0.05,
      z: (Math.random() - 0.5) * 0.05
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Particle Material (Glowing circle texture)
  // Create a canvas-based circular gradient texture for beautiful particles
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 16;
  pCanvas.height = 16;
  const pCtx = pCanvas.getContext('2d');
  const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  pCtx.fillStyle = grad;
  pCtx.fillRect(0, 0, 16, 16);
  const texture = new THREE.CanvasTexture(pCanvas);

  const material = new THREE.PointsMaterial({
    size: 0.6,
    color: 0xfbbf24, // Gold initially
    transparent: true,
    opacity: 0.8,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  // Points system
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  // Window Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation Loop variables
  let rotationSpeedX = 0.001;
  let rotationSpeedY = 0.0015;

  function animate() {
    requestAnimationFrame(animate);

    // Dynamic color transition
    material.color.lerp(targetParticleColor, 0.05);

    // Slow rotation
    particleSystem.rotation.x += rotationSpeedX;
    particleSystem.rotation.y += rotationSpeedY;

    // React to mouse movement
    const targetX = (mouseX / window.innerWidth - 0.5) * 10;
    const targetY = -(mouseY / window.innerHeight - 0.5) * 10;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // Update particle positions based on theme and velocity
    const posAttr = particleSystem.geometry.attributes.position;
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const time = Date.now() * 0.001;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      
      if (currentTheme === 'light') {
        // --- 3D Snowfall Behavior (Christmas Theme) ---
        // Fall down
        posAttr.array[idx + 1] -= 0.06 + Math.random() * 0.04;
        
        // Sway gently left & right (sine wind function)
        posAttr.array[idx] += Math.sin(time + i) * 0.015;
        
        // Random drift in depth
        posAttr.array[idx + 2] += (Math.random() - 0.5) * 0.01;

        // Reset to top if it goes off bottom screen boundary
        if (posAttr.array[idx + 1] < -40) {
          posAttr.array[idx + 1] = 40;
          posAttr.array[idx] = (Math.random() - 0.5) * 80;
          posAttr.array[idx + 2] = (Math.random() - 0.5) * 80;
        }
      } else {
        // --- Standard Dark Theme Gravity-Free Floating Nodes ---
        posAttr.array[idx] += velocities[i].x;
        posAttr.array[idx + 1] += velocities[i].y;
        posAttr.array[idx + 2] += velocities[i].z;

        // Bounce off bounds
        if (Math.abs(posAttr.array[idx]) > 40) velocities[i].x *= -1;
        if (Math.abs(posAttr.array[idx + 1]) > 40) velocities[i].y *= -1;
        if (Math.abs(posAttr.array[idx + 2]) > 40) velocities[i].z *= -1;
      }
    }
    posAttr.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();
}

// Initialize ThreeJS particles background
try {
  initThree();
} catch (err) {
  console.error("Three.js failed to initialize:", err);
}


// --- Theme Mappings & Toggle Logic ---
const colorsByTheme = {
  dark: {
    hero: 0xfbbf24,      // Gold
    about: 0x3b82f6,     // Blue
    experience: 0x10b981, // Emerald
    skills: 0x06b6d4,    // Cyan
    projects: 0xfbbf24,
    contact: 0x10b981
  },
  light: {
    hero: 0xb45309,      // Corporate Gold
    about: 0x1d4ed8,     // Corporate Blue
    experience: 0x047857, // Corporate Emerald Green
    skills: 0x0891b2,    // Corporate Cyan
    projects: 0xb45309,
    contact: 0x047857
  }
};

let activeSectionName = 'hero';

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('portfolio-theme', theme);
  
  if (theme === 'light') {
    themeIcon.className = 'fa-solid fa-sun';
  } else {
    themeIcon.className = 'fa-solid fa-moon';
  }

  // Update target particle color dynamically on switch
  if (targetParticleColor) {
    const colorHex = colorsByTheme[theme][activeSectionName];
    targetParticleColor.setHex(colorHex);
  }

  // Optimize particle material for light mode background contrast
  if (particleSystem && particleSystem.material) {
    if (theme === 'light') {
      particleSystem.material.blending = THREE.NormalBlending;
      particleSystem.material.opacity = 0.45;
    } else {
      particleSystem.material.blending = THREE.AdditiveBlending;
      particleSystem.material.opacity = 0.8;
    }
    particleSystem.material.needsUpdate = true;
  }
}

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
});

// Initialize theme from storage on load
const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
setTheme(savedTheme);


// --- Three.js Color Switching via Scroll Trigger ---
// Change background colors dynamically as user scrolls to sections
function setupThreeScrollTriggers() {
  const sections = [
    { id: '#hero', name: 'hero' },
    { id: '#about', name: 'about' },
    { id: '#experience', name: 'experience' },
    { id: '#skills', name: 'skills' },
    { id: '#projects', name: 'projects' },
    { id: '#contact', name: 'contact' }
  ];

  sections.forEach(sec => {
    ScrollTrigger.create({
      trigger: sec.id,
      start: "top center",
      end: "bottom center",
      onEnter: () => {
        activeSectionName = sec.name;
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const colorHex = colorsByTheme[currentTheme][sec.name];
        targetParticleColor.setHex(colorHex);
      },
      onEnterBack: () => {
        activeSectionName = sec.name;
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const colorHex = colorsByTheme[currentTheme][sec.name];
        targetParticleColor.setHex(colorHex);
      }
    });
  });
}
setupThreeScrollTriggers();


// --- GSAP Hero Entry Animations ---
window.addEventListener('load', () => {
  const tl = gsap.timeline();
  
  // Fade in Header logo & Nav links
  tl.from("header", {
    y: -50,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out"
  });

  // Slide up hero subtitle
  tl.to(".hero-subtitle", {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: "back.out(1.7)"
  }, "-=0.6");

  // Animate hero title split text
  tl.from(".hero-title .name", {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: "power3.out"
  }, "-=0.4");

  // Animate tagline typing text
  tl.from(".hero-title .tagline", {
    opacity: 0,
    duration: 1,
    ease: "power3.out"
  }, "-=0.6");

  // Reveal paragraph desc
  tl.to(".hero-desc", {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: "power3.out"
  }, "-=0.4");

  // Reveal hero CTA buttons
  tl.to(".hero-actions", {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: "power3.out"
  }, "-=0.6");
});


// --- Bento Stats Counters Animation ---
const statNumbers = document.querySelectorAll('.stat-number');
statNumbers.forEach(num => {
  const target = parseInt(num.getAttribute('data-target'), 10);
  const suffix = num.getAttribute('data-suffix') || '';
  
  gsap.fromTo(num, {
    textContent: 0
  }, {
    textContent: target,
    duration: 2.5,
    ease: "power3.out",
    snap: { textContent: 1 }, // Snap to whole numbers
    scrollTrigger: {
      trigger: num,
      start: "top 85%",
      toggleActions: "play none none none"
    },
    onUpdate: function() {
      if (num.textContent == target) {
        num.textContent += suffix;
      }
    }
  });
});


// --- Professional Journey Timeline Card Reveals ---
const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach(item => {
  const card = item.querySelector('.timeline-content');
  const badge = item.querySelector('.timeline-badge');
  const isLeft = item.classList.contains('timeline-item-left');
  
  // Badge scale-up & pop
  gsap.from(badge, {
    scale: 0,
    opacity: 0,
    scrollTrigger: {
      trigger: badge,
      start: "top 80%",
      toggleActions: "play none none none"
    }
  });

  // Card slide-in
  gsap.from(card, {
    x: isLeft ? -100 : 100,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: card,
      start: "top 75%",
      toggleActions: "play none none none"
    }
  });
});


// --- Skills Section Progress Bar Animations ---
const skillsCard = document.querySelector('#skills');
const skillBars = document.querySelectorAll('.skill-bar');

ScrollTrigger.create({
  trigger: skillsCard,
  start: "top 60%",
  onEnter: () => {
    skillBars.forEach(bar => {
      const width = bar.getAttribute('data-width');
      bar.style.width = width;
    });
  }
});


// --- Projects SVG Graphic Line Drawing ---
gsap.fromTo("#svg-line-path-1", {
  strokeDashoffset: 1000
}, {
  strokeDashoffset: 0,
  duration: 2,
  ease: "power2.out",
  scrollTrigger: {
    trigger: "#svg-line-path-1",
    start: "top 80%",
    toggleActions: "play none none none"
  }
});

gsap.fromTo("#svg-line-path-2", {
  strokeDashoffset: 1000
}, {
  strokeDashoffset: 0,
  duration: 2,
  ease: "power2.out",
  scrollTrigger: {
    trigger: "#svg-line-path-2",
    start: "top 80%",
    toggleActions: "play none none none"
  }
});


// --- 3D Hover Card Tilt Effect ---
const cardsToTilt = document.querySelectorAll('.glass-card');
cardsToTilt.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // x coordinate inside element
    const y = e.clientY - rect.top;  // y coordinate inside element
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max tilt angle
    const maxTilt = 8; 
    
    // Calculate rotation angle based on cursor position relative to center
    const rotateX = ((centerY - y) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    card.style.transition = 'none'; // smooth out manual tilt
  });
  
  card.addEventListener('mouseleave', () => {
    // Reset position smoothly
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    card.style.transition = 'transform 0.5s ease, border-color 0.4s, box-shadow 0.4s';
  });
});

// --- Radar Scan Animation ---
const radarCanvas = document.getElementById('radar-canvas');
if (radarCanvas) {
  const ctx = radarCanvas.getContext('2d');
  
  // Set dimensions
  radarCanvas.width = 300;
  radarCanvas.height = 180;
  
  const width = radarCanvas.width;
  const height = radarCanvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(cx, cy) - 8;
  
  let angle = 0;
  
  // Fake targets: random angle and distance
  const targets = [];
  for (let i = 0; i < 4; i++) {
    targets.push({
      angle: Math.random() * Math.PI * 2,
      distance: 20 + Math.random() * (maxRadius - 30),
      alpha: 0
    });
  }
  
  function drawRadar() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    
    // Clear with slight transparency to leave tails
    ctx.fillStyle = currentTheme === 'light' ? 'rgba(248, 250, 252, 0.15)' : 'rgba(10, 11, 16, 0.15)';
    ctx.fillRect(0, 0, width, height);
    
    const baseColor = currentTheme === 'light' ? '#047857' : '#10b981'; // Emerald
    ctx.strokeStyle = currentTheme === 'light' ? 'rgba(4, 120, 87, 0.12)' : 'rgba(16, 185, 129, 0.12)';
    ctx.lineWidth = 1;
    
    // Draw concentric circles
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw cross axes
    ctx.beginPath();
    ctx.moveTo(cx - maxRadius, cy);
    ctx.lineTo(cx + maxRadius, cy);
    ctx.moveTo(cx, cy - maxRadius);
    ctx.lineTo(cx, cy + maxRadius);
    ctx.stroke();
    
    // Draw sweeping line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const sx = cx + Math.cos(angle) * maxRadius;
    const sy = cy + Math.sin(angle) * maxRadius;
    ctx.lineTo(sx, sy);
    
    const sweepGrad = ctx.createLinearGradient(cx, cy, sx, sy);
    sweepGrad.addColorStop(0, baseColor);
    sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.strokeStyle = sweepGrad;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Draw targets
    targets.forEach(t => {
      const tx = cx + Math.cos(t.angle) * t.distance;
      const ty = cy + Math.sin(t.angle) * t.distance;
      
      const diff = Math.abs(angle - t.angle) % (Math.PI * 2);
      if (diff < 0.08) {
        t.alpha = 1.0;
      }
      
      if (t.alpha > 0) {
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme === 'light' ? `rgba(186, 24, 27, ${t.alpha})` : `rgba(251, 191, 36, ${t.alpha})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(tx, ty, 8 * (1 - t.alpha + 0.1), 0, Math.PI * 2);
        ctx.strokeStyle = currentTheme === 'light' ? `rgba(186, 24, 27, ${t.alpha * 0.4})` : `rgba(251, 191, 36, ${t.alpha * 0.4})`;
        ctx.stroke();
        
        t.alpha -= 0.008;
      }
    });
    
    angle += 0.015;
    if (angle > Math.PI * 2) angle = 0;
    
    requestAnimationFrame(drawRadar);
  }
  
  drawRadar();
}
