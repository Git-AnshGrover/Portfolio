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

// Interactive 3D Skills Neural Map global variables (declared at top to prevent TDZ ReferenceError)
let skillsScene, skillsCamera, skillsRenderer;
let skillsBrainGroup;
let skillsNodeMeshes = [];
let skillsLinePhotons = [];
const skillsMouse = new THREE.Vector2();
const skillsRaycaster = new THREE.Raycaster();
let activeHoveredSkillId = null;

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

// Initialize ThreeJS particles background & Skills 3D scene
try {
  initThree();
  initSkills3D();
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

// --- Interactive 3D Skills Neural Map ---

// Details data matching resume profile
const skillsData = {
  '1': {
    title: 'Financial Modeling & Valuation',
    lobe: 'Temporal Lobe (Valuation)',
    percentage: '90%',
    desc: 'Advanced capability in constructing financial projections, discounted cash flow (DCF) models, LBO assessments, and historical analysis. Expert in structuring complex three-statement integrations.',
    tags: ['DCF Modeling', 'Valuation', 'Consolidation', 'Corporate Finance']
  },
  '2': {
    title: 'Tax Optimization',
    lobe: 'Occipital Lobe (Planning)',
    percentage: '85%',
    desc: 'Strategic design of tax mitigation roadmaps utilizing legal frameworks (ELSS, PPF, NPS, corporate deductions) to maximize net yields for individual and corporate asset pools.',
    tags: ['Section 80C', 'ELSS Planning', 'Tax Planning', 'Asset Allocation']
  },
  '3': {
    title: 'Banking & KYC Operations',
    lobe: 'Cerebellum (Operations & Credit)',
    percentage: '85%',
    desc: 'Practical mastery of retail bank control systems, credit assessment matrices, risk underwriting, and strict client KYC compliance audits.',
    tags: ['Credit Audits', 'KYC Compliance', 'Risk Matrices', 'Retail Banking']
  },
  '4': {
    title: 'Python Automation',
    lobe: 'Frontal Lobe (Analytics)',
    percentage: '85%',
    desc: 'Developing clean scripting architectures using openpyxl, pandas, and regex queries to parse, reconcile, and merge thousands of scattered banking transactions.',
    tags: ['openpyxl', 'Pandas', 'Scripting', 'Reconciliation']
  },
  '5': {
    title: 'Agentic AI Systems',
    lobe: 'Frontal Lobe (Cognitive Systems)',
    percentage: '95%',
    desc: 'Pioneering custom workflow nodes and automatic compliance checklist triggers utilizing the Google Antigravity SDK to run autonomous multi-merchant database audits.',
    tags: ['Antigravity SDK', 'LLM Schemas', 'Audit Checklists', 'Workflow Design']
  },
  '6': {
    title: 'Power BI Analytics',
    lobe: 'Parietal Lobe (Visual Controls)',
    percentage: '80%',
    desc: 'Constructing corporate visual intelligence portals by building relational schemas, designing optimized DAX calculators, and modeling data flows.',
    tags: ['Power BI', 'DAX Formulas', 'ETL Modeling', 'Dashboards']
  }
};

function initSkills3D() {
  const container = document.getElementById('skills-3d-canvas-container');
  const canvas = document.getElementById('skills-3d-canvas');
  if (!container || !canvas) return;

  const width = container.clientWidth || 600;
  const height = container.clientHeight || 450;

  // Scene & Camera
  skillsScene = new THREE.Scene();
  skillsCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  skillsCamera.position.z = 8.0;

  // Renderer
  skillsRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  skillsRenderer.setSize(width, height);
  skillsRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Brain Group (holds brain, skull shell, nodes, and lines)
  skillsBrainGroup = new THREE.Group();
  skillsScene.add(skillsBrainGroup);

  // 1. Procedural Brain Particles
  const brainGeom = new THREE.BufferGeometry();
  const brainPoints = [];
  const brainColors = [];

  const colorCyan = new THREE.Color(0x06b6d4);
  const colorGreen = new THREE.Color(0x10b981);
  const colorGold = new THREE.Color(0xfbbf24);

  // Cerebrum (Hemispheres)
  for (let i = 0; i < 2000; i++) {
    const isLeft = Math.random() > 0.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    const rx = 1.0;
    const ry = 0.8;
    const rz = 0.8;
    
    const perturb = 1.0 + 0.12 * Math.sin(theta * 12) * Math.cos(phi * 12) + 0.04 * Math.sin(theta * 30);
    
    let x = rx * Math.sin(phi) * Math.cos(theta) * perturb;
    let y = ry * Math.cos(phi) * perturb;
    let z = rz * Math.sin(phi) * Math.sin(theta) * perturb;
    
    if (isLeft) x -= 0.12;
    else x += 0.12;
    
    y += 0.2;
    
    brainPoints.push(x, y, z);
    
    const lerpColor = colorCyan.clone().lerp(isLeft ? colorGreen : colorGold, (y + 0.8) / 1.6);
    brainColors.push(lerpColor.r, lerpColor.g, lerpColor.b);
  }

  // Cerebellum (Lower back)
  for (let i = 0; i < 400; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = 0.45;
    const perturb = 1.0 + 0.08 * Math.sin(theta * 8) * Math.cos(phi * 8);
    const x = r * Math.sin(phi) * Math.cos(theta) * perturb;
    const y = r * Math.cos(phi) * perturb - 0.4;
    const z = r * Math.sin(phi) * Math.sin(theta) * perturb - 0.35;
    
    brainPoints.push(x, y, z);
    const lerpColor = colorGreen.clone().lerp(colorGold, 0.4);
    brainColors.push(lerpColor.r, lerpColor.g, lerpColor.b);
  }

  // Brain Stem (Bottom center)
  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.15 * (1 - Math.random() * 0.2);
    const y = -0.4 - Math.random() * 0.6;
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle) - 0.08;
    
    brainPoints.push(x, y, z);
    brainColors.push(colorGreen.r, colorGreen.g, colorGreen.b);
  }

  brainGeom.setAttribute('position', new THREE.Float32BufferAttribute(brainPoints, 3));
  brainGeom.setAttribute('color', new THREE.Float32BufferAttribute(brainColors, 3));

  const brainMaterial = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  const brainParticles = new THREE.Points(brainGeom, brainMaterial);
  skillsBrainGroup.add(brainParticles);

  // 2. Procedural Holographic Skull Shell
  const skullGeom = new THREE.BufferGeometry();
  const skullPoints = [];
  
  // Cranium: sphere shell
  for (let i = 0; i < 700; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = 1.65;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi) + 0.15;
    const z = r * Math.sin(phi) * Math.sin(theta);
    skullPoints.push(x, y, z);
  }
  // Jaw
  for (let i = 0; i < 300; i++) {
    const y = -0.4 - Math.random() * 0.9;
    const t = (y + 1.3) / 0.9;
    const width = 0.65 + t * 0.5;
    const x = (Math.random() - 0.5) * width;
    const z = 0.9 + (Math.random() - 0.5) * 0.6 - y * 0.15;
    skullPoints.push(x, y, z);
  }

  skullGeom.setAttribute('position', new THREE.Float32BufferAttribute(skullPoints, 3));
  const skullMaterial = new THREE.PointsMaterial({
    size: 0.055,
    color: 0x06b6d4, // Glowing Cyan
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const skullParticles = new THREE.Points(skullGeom, skullMaterial);
  skillsBrainGroup.add(skullParticles);

  // 3. Define Outer Orbiting Skill Nodes
  const skillNodes = [
    { id: '1', pos: new THREE.Vector3(-2.6, 1.3, 0.4), color: 0xfbbf24 },
    { id: '2', pos: new THREE.Vector3(-2.8, -0.4, 0.5), color: 0xfbbf24 },
    { id: '3', pos: new THREE.Vector3(-2.4, -1.9, 0.4), color: 0xfbbf24 },
    { id: '4', pos: new THREE.Vector3(2.6, 1.3, 0.4), color: 0x06b6d4 },
    { id: '5', pos: new THREE.Vector3(2.8, -0.4, 0.5), color: 0x06b6d4 },
    { id: '6', pos: new THREE.Vector3(2.4, -1.9, 0.4), color: 0x06b6d4 }
  ];

  skillNodes.forEach(node => {
    // Glowing sphere mesh
    const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: node.color,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.copy(node.pos);
    mesh.userData = { id: node.id, baseColor: node.color };
    skillsBrainGroup.add(mesh);
    skillsNodeMeshes.push(mesh);

    // Glowing connection line
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(node.pos.x * 0.25, node.pos.y * 0.25, node.pos.z * 0.25),
      node.pos
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: node.color,
      transparent: true,
      opacity: 0.2
    });
    const line = new THREE.Line(lineGeom, lineMat);
    skillsBrainGroup.add(line);

    // Shooting Photon dot along the line
    const photonGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    });
    const photon = new THREE.Mesh(photonGeo, photonMat);
    skillsBrainGroup.add(photon);
    skillsLinePhotons.push({
      mesh: photon,
      start: new THREE.Vector3(node.pos.x * 0.25, node.pos.y * 0.25, node.pos.z * 0.25),
      end: node.pos,
      speed: 0.007 + Math.random() * 0.007,
      progress: Math.random()
    });
  });

  // 4. Billboard Projection & Render loop
  const tempV = new THREE.Vector3();
  
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate brain horizontally
    skillsBrainGroup.rotation.y += 0.003;
    
    // Animate photon travel along synapses
    skillsLinePhotons.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1.0) p.progress = 0;
      p.mesh.position.copy(p.start).lerp(p.end, p.progress);
    });

    // Update billboard labels in screen coordinates
    skillsNodeMeshes.forEach(mesh => {
      tempV.setFromMatrixPosition(mesh.matrixWorld);
      tempV.project(skillsCamera);
      
      const x = (tempV.x * 0.5 + 0.5) * container.clientWidth;
      const y = (-(tempV.y * 0.5) + 0.5) * container.clientHeight;
      
      const label = document.getElementById(`skill-label-${mesh.userData.id}`);
      if (label) {
        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
      }
    });

    // Handle Raycasting
    skillsRaycaster.setFromCamera(skillsMouse, skillsCamera);
    const intersects = skillsRaycaster.intersectObjects(skillsNodeMeshes);
    
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const skillId = hitMesh.userData.id;
      if (activeHoveredSkillId !== skillId) {
        selectSkillNode(skillId);
      }
    }

    // Adapt blending for theme brightness
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (currentTheme === 'light') {
      brainMaterial.blending = THREE.NormalBlending;
      brainMaterial.opacity = 0.55;
      skullMaterial.opacity = 0.25;
    } else {
      brainMaterial.blending = THREE.AdditiveBlending;
      brainMaterial.opacity = 0.85;
      skullMaterial.opacity = 0.35;
    }

    skillsRenderer.render(skillsScene, skillsCamera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    skillsCamera.aspect = container.clientWidth / container.clientHeight;
    skillsCamera.updateProjectionMatrix();
    skillsRenderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Track mouse coordinates on container
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    skillsMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    skillsMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  // Attach hover/click handlers to HTML labels
  const labels = document.querySelectorAll('.skill-3d-label');
  labels.forEach(lbl => {
    const id = lbl.getAttribute('data-skill');
    lbl.addEventListener('mouseenter', () => selectSkillNode(id));
    lbl.addEventListener('click', () => selectSkillNode(id));
  });
}

function selectSkillNode(skillId) {
  activeHoveredSkillId = skillId;
  
  const labels = document.querySelectorAll('.skill-3d-label');
  labels.forEach(lbl => {
    if (lbl.getAttribute('data-skill') === skillId) {
      lbl.classList.add('active');
    } else {
      lbl.classList.remove('active');
    }
  });

  skillsNodeMeshes.forEach(mesh => {
    if (mesh.userData.id === skillId) {
      mesh.material.color.setHex(0xffffff);
      mesh.scale.set(1.5, 1.5, 1.5);
    } else {
      mesh.material.color.setHex(mesh.userData.baseColor);
      mesh.scale.set(1.0, 1.0, 1.0);
    }
  });

  const data = skillsData[skillId];
  if (data) {
    document.getElementById('skill-detail-default').style.display = 'none';
    const content = document.getElementById('skill-detail-content');
    content.style.display = 'flex';

    document.getElementById('detail-title').textContent = data.title;
    document.getElementById('detail-lobe').textContent = data.lobe;
    document.getElementById('detail-percentage').textContent = data.percentage;
    document.getElementById('detail-progress-bar').style.width = data.percentage;
    document.getElementById('detail-desc').textContent = data.desc;

    const tagsContainer = document.getElementById('detail-tags');
    tagsContainer.innerHTML = '';
    data.tags.forEach(tag => {
      const badge = document.createElement('span');
      badge.className = 'detail-tag';
      badge.textContent = tag;
      tagsContainer.appendChild(badge);
    });
  }
}
