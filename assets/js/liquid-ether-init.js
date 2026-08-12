// LiquidEther Background Initialization
// This script initializes the LiquidEther effect to replace the silk background

document.addEventListener('DOMContentLoaded', function() {
  // Find the silk background element
  const silkBackground = document.getElementById('silk-background');
  
  if (silkBackground) {
    // Clear any existing content
    silkBackground.innerHTML = '';
    
    // Apply LiquidEther styles
    silkBackground.style.position = 'fixed';
    silkBackground.style.top = '0';
    silkBackground.style.left = '0';
    silkBackground.style.width = '100%';
    silkBackground.style.height = '100%';
    silkBackground.style.zIndex = '-2';
    silkBackground.style.overflow = 'hidden';
    silkBackground.style.pointerEvents = 'none';
    
    // Load Three.js and initialize LiquidEther
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import * as THREE from 'https://esm.sh/three@0.160.0';
      
      // Enhanced liquid ether implementation with dark blue theme
      class LiquidEtherBackground {
        constructor(container) {
          this.container = container;
          this.width = window.innerWidth;
          this.height = window.innerHeight;
          this.mouseX = 0;
          this.mouseY = 0;
          this.targetMouseX = 0;
          this.targetMouseY = 0;
          this.init();
        }
        
        init() {
          // Create scene
          this.scene = new THREE.Scene();
          this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
          this.camera.position.z = 5;
          
          // Create renderer
          this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          this.renderer.setSize(this.width, this.height);
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          this.container.appendChild(this.renderer.domElement);
          
          // Create enhanced particle system for liquid effect
          this.createParticles();
          this.createGlowEffect();
          
          // Handle mouse movement
          window.addEventListener('mousemove', (e) => this.onMouseMove(e));
          
          // Handle resize
          window.addEventListener('resize', () => this.onResize());
          
          // Start animation
          this.animate();
        }
        
        createParticles() {
          const particleCount = 3000;
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(particleCount * 3);
          const colors = new Float32Array(particleCount * 3);
          const sizes = new Float32Array(particleCount);
          
          // Dark purple color palette to match new gradient
          const colorPalette = [
            new THREE.Color('#0a0a1a'), // Deep dark blue-purple
            new THREE.Color('#1a0a3a'), // Purple-tinted dark blue
            new THREE.Color('#0d1a4a'), // Dark blue-purple
            new THREE.Color('#3a0a6a'), // Vibrant purple
            new THREE.Color('#6a0a9a'), // Deep purple
            new THREE.Color('#8a0aba'), // Electric purple
            new THREE.Color('#9a0aca'), // Bright purple
            new THREE.Color('#5a0a7a'), // Medium purple
            new THREE.Color('#050510')  // Very dark blue
          ];
          
          for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
            
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = Math.random() * 2 + 0.5;
          }
          
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
          
          // Custom shader material for better glow effect
          const vertexShader = \`
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float pixelRatio;
            
            void main() {
              vColor = color;
              vec3 pos = position;
              
              // Add wave motion
              float wave = sin(pos.x * 0.5 + time) * cos(pos.y * 0.5 + time * 0.8) * 0.5;
              pos.z += wave;
              
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          \`;
          
          const fragmentShader = \`
            varying vec3 vColor;
            
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              
              float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
              alpha *= 0.8;
              
              gl_FragColor = vec4(vColor, alpha);
            }
          \`;
          
          const material = new THREE.ShaderMaterial({
            uniforms: {
              time: { value: 0 },
              pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          
          this.particles = new THREE.Points(geometry, material);
          this.scene.add(this.particles);
          
          // Store original positions for animation
          this.originalPositions = positions.slice();
          this.time = 0;
        }
        
        createGlowEffect() {
          // Create a background glow plane
          const geometry = new THREE.PlaneGeometry(30, 30);
          
          const vertexShader = \`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          \`;
          
          const fragmentShader = \`
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            varying vec2 vUv;
            
            void main() {
              vec2 center = vUv - 0.5;
              float dist = length(center);
              
              float wave = sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5;
              vec3 color = mix(color1, color2, wave * (1.0 - dist));
              
              float alpha = 0.1 * (1.0 - dist);
              gl_FragColor = vec4(color, alpha);
            }
          \`;
          
          const material = new THREE.ShaderMaterial({
            uniforms: {
              time: { value: 0 },
              color1: { value: new THREE.Color('#0a0a1a') },
              color2: { value: new THREE.Color('#1a0a3a') }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          
          this.glowPlane = new THREE.Mesh(geometry, material);
          this.glowPlane.position.z = -5;
          this.scene.add(this.glowPlane);
        }
        
        onMouseMove(event) {
          this.targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
          this.targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        }
        
        onResize() {
          this.width = window.innerWidth;
          this.height = window.innerHeight;
          this.camera.aspect = this.width / this.height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(this.width, this.height);
        }
        
        animate() {
          requestAnimationFrame(() => this.animate());
          
          this.time += 0.01;
          
          // Smooth mouse movement
          this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
          this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;
          
          // Update shader uniforms
          if (this.particles.material.uniforms) {
            this.particles.material.uniforms.time.value = this.time;
          }
          
          if (this.glowPlane.material.uniforms) {
            this.glowPlane.material.uniforms.time.value = this.time;
          }
          
          // Rotate particles based on mouse position
          this.particles.rotation.x = this.mouseY * 0.3;
          this.particles.rotation.y = this.mouseX * 0.3;
          this.particles.rotation.z += 0.001;
          
          // Move glow plane slightly
          this.glowPlane.rotation.x = this.mouseY * 0.1;
          this.glowPlane.rotation.y = this.mouseX * 0.1;
          
          this.renderer.render(this.scene, this.camera);
        }
      }
      
      // Initialize the effect
      const container = document.getElementById('silk-background');
      if (container) {
        new LiquidEtherBackground(container);
      }
    `;
    
    document.head.appendChild(script);
  }
});
