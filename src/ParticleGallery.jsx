import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 粒子画廊组件 - 将图片转换为动态粒子效果
 * 支持鼠标交互和左右切换
 */

const PARTICLE_TUNE = {
  // Base particle behavior (per-particle randomization happens on top of these)
  size: 4, // default particle size in pixels
  friction: 0.5, // velocity damping per frame (lower = more drag)
  spring: { min: 0.05, max: 0.06 }, // return-to-target spring strength
  scatterSpring: { min: 0.012, max: 0.027 }, // diffuse/scatter spring strength
  swirl: {
    strength: 6, // tangential force for swirl-assemble
    falloff: 80, // distance falloff for swirl force
  },
  drift: {
    phaseMax: Math.PI * 4, // initial drift phase range
    speed: { min: 0.015, max: 0.035 }, // drift phase increment per frame
    strength: { min: 0.25, max: 0.6 }, // drift force amplitude
  },
  ambientRatio: 0.28, // % of particles that stay diffuse even during assemble
  explode: { x: 1200, y: 600 }, // click "explode" force (currently unused)
  mousePush: 6, // mouse repulsion strength
  wave: {
    xFreq: 0.018, // horizontal frequency for vertical wave
    timeFreq: 0.0015, // time speed for vertical wave
    amplitude: 4, // vertical wave amplitude
  },
  depth: {
    baseZ: 300, // base z-range for particles (higher = more depth)
    waveAmp: 55, // z wave amplitude
    waveSpeed: 0.02, // z wave speed
    perspective: 1000, // camera perspective distance
  },
  colorBlend: {
    scatterMix: 0.55, // blend towards ambient color during scatter
    assembleMix: 0.25, // blend towards ambient color during assemble
  },
};

const DIFFUSE_TUNE = {
  // Diffuse "fog" distribution
  radiusPower: 0.75, // bias towards center (lower = denser core)
  radiusScale: 0.9, // max radius as % of min screen side
  ySquash: 0.82, // vertical compression for diffuse cloud
  swirlFreq: 2.4, // swirl frequency around center
  swirlStrength: 0.04, // swirl amount as % of min side
  verticalNoiseFreq: 3.1, // vertical noise frequency
  verticalNoiseStrength: 0.03, // vertical noise amount as % of min side
  margin: 0.12, // allow a soft overscan beyond edges
  ambientExtraRatio: 0.22, // additional ambient-only particles (relative to image particles)
  ambientColor: "rgba(190, 210, 255, 0.28)",
  ambientSize: 1.6,
  ambientDepth: 120, // base z-range for ambient-only particles
};

const TRANSITION_TUNE = {
  scatterDuration: 3000,
  assembleDuration: 100,
};

const FOCUS_TUNE = {
  // Hold to expand a clear circular area
  maxRadius: 1000,
  expandSpeed: 280, // px per second
  shrinkSpeed: 660, // px per second
  swirlFreq: 4, // swirl waves around the circle
  swirlAmp: 18, // px of swirl offset
  swirlSpeed: 3.2, // radians per second
};

class Particle {
  constructor(x, y, color, originalX, originalY, size = PARTICLE_TUNE.size) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.baseZ = (Math.random() - 0.5) * PARTICLE_TUNE.depth.baseZ;
    this.originalX = originalX;
    this.originalY = originalY;
    this.targetX = originalX;
    this.targetY = originalY;
    this.diffuseX = x;
    this.diffuseY = y;
    this.isScattering = false;
    this.color = color;
    this.size = size; // 固定小尺寸，保持图像清晰
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.friction = PARTICLE_TUNE.friction; // 更高摩擦力，粒子更快停止
    this.springFactor =
      PARTICLE_TUNE.spring.min +
      Math.random() * (PARTICLE_TUNE.spring.max - PARTICLE_TUNE.spring.min); // 更慢的回复力
    this.scatterSpringFactor =
      PARTICLE_TUNE.scatterSpring.min +
      Math.random() * (PARTICLE_TUNE.scatterSpring.max - PARTICLE_TUNE.scatterSpring.min); // 更慢的散开速度
    this.driftPhase = Math.random() * PARTICLE_TUNE.drift.phaseMax;
    this.driftSpeed =
      PARTICLE_TUNE.drift.speed.min +
      Math.random() * (PARTICLE_TUNE.drift.speed.max - PARTICLE_TUNE.drift.speed.min);
    this.driftStrength =
      PARTICLE_TUNE.drift.strength.min +
      Math.random() * (PARTICLE_TUNE.drift.strength.max - PARTICLE_TUNE.drift.strength.min);
    this.wavePhaseZ = Math.random() * Math.PI * 2;
    this.isAmbient = Math.random() < PARTICLE_TUNE.ambientRatio;
    this.isFocused = false;
  }

  draw(ctx, time = 0, rotation = { x: 0, y: 0 }, center = { x: 0, y: 0 }, phase = "idle") {
    // 使用方形绘制，更密集更清晰
    const wave = this.isFocused
      ? 0
      : Math.sin(this.x * PARTICLE_TUNE.wave.xFreq + time * PARTICLE_TUNE.wave.timeFreq) *
        PARTICLE_TUNE.wave.amplitude;
    const posX = this.x - center.x;
    const posY = this.y + wave - center.y;
    const posZ = this.isFocused ? 0 : this.z;

    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);

    const y1 = posY * cosX - posZ * sinX;
    const z1 = posY * sinX + posZ * cosX;
    const x2 = posX * cosY + z1 * sinY;
    const z2 = -posX * sinY + z1 * cosY;

    const depth = PARTICLE_TUNE.depth.perspective;
    const scale = depth / (depth + z2);
    const drawX = x2 * scale + center.x;
    const drawY = y1 * scale + center.y;
    const drawSize = this.size * scale;

    ctx.fillStyle = this.getColor(phase);
    ctx.fillRect(drawX - drawSize / 2, drawY - drawSize / 2, drawSize, drawSize);
  }

  getColor(phase) {
    if (typeof this.color === "string") return this.color;
    const { r, g, b, a, ambient } = this.color;
    let mix = 0;
    if (phase === "scatter") mix = PARTICLE_TUNE.colorBlend.scatterMix;
    else if (phase === "assemble") mix = PARTICLE_TUNE.colorBlend.assembleMix;
    const mixR = Math.round(r + (ambient.r - r) * mix);
    const mixG = Math.round(g + (ambient.g - g) * mix);
    const mixB = Math.round(b + (ambient.b - b) * mix);
    return `rgba(${mixR}, ${mixG}, ${mixB}, ${a})`;
  }

  setTarget(x, y, isScattering = false) {
    this.targetX = x;
    this.targetY = y;
    this.isScattering = isScattering;
  }

  setDiffuseTarget(x, y) {
    this.diffuseX = x;
    this.diffuseY = y;
    this.setTarget(x, y, true);
  }

  update(mouse, isExploding, dt = 1, rotation = { x: 0, y: 0 }, center = { x: 0, y: 0 }, phase = "idle") {
    if (mouse.focus && mouse.focus.active) {
      const fx = mouse.focus.x - center.x;
      const fy = mouse.focus.y - center.y;
      const invCosY = Math.cos(-rotation.y);
      const invSinY = Math.sin(-rotation.y);
      const invCosX = Math.cos(-rotation.x);
      const invSinX = Math.sin(-rotation.x);
      const x1 = fx * invCosY;
      const z1 = fx * invSinY;
      const y2 = fy * invCosX + z1 * invSinX;
      const focusX = x1 + center.x;
      const focusY = y2 + center.y;

      const dxFocus = this.x - focusX;
      const dyFocus = this.y - focusY;
      const focusDistance = Math.sqrt(dxFocus * dxFocus + dyFocus * dyFocus);
      const angle = Math.atan2(dyFocus, dxFocus);
      const swirlOffset =
        Math.sin(angle * FOCUS_TUNE.swirlFreq + mouse.focus.phase) * FOCUS_TUNE.swirlAmp;
      if (focusDistance < mouse.focus.radius + swirlOffset) {
        // Calm down: lock to original position within focus radius
        this.isFocused = true;
        this.targetX = this.originalX;
        this.targetY = this.originalY;
        this.isScattering = false;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        const snap = 0.6 * dt;
        this.x += (this.originalX - this.x) * snap;
        this.y += (this.originalY - this.y) * snap;
        this.z += (0 - this.z) * snap;
        return;
      }
    }
    this.isFocused = false;

    // 持续轻微漂移 - 避免每帧随机带来的抖动与开销
    this.driftPhase += this.driftSpeed;
    this.vx += Math.cos(this.driftPhase) * this.driftStrength * dt;
    this.vy += Math.sin(this.driftPhase) * this.driftStrength * dt;

    // 鼠标交互 - 减小影响力度
    if (mouse.x !== null && mouse.y !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = mouse.radius;

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const angle = Math.atan2(dy, dx);
        // 减小推力，保持图像可辨认
        const pushX = Math.cos(angle) * force * PARTICLE_TUNE.mousePush;
        const pushY = Math.sin(angle) * force * PARTICLE_TUNE.mousePush;
        this.vx += pushX * dt;
        this.vy += pushY * dt;
      }
    }

    // 爆炸效果
    if (isExploding) {
      this.vx += (Math.random() - 0.5) * PARTICLE_TUNE.explode.x * dt;
      this.vy += (Math.random() - 0.5) * PARTICLE_TUNE.explode.y * dt;
    }

    // 朝向目标位置的弹簧效果
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const spring = this.isScattering ? this.scatterSpringFactor : this.springFactor;
    this.vx += dx * spring * dt;
    this.vy += dy * spring * dt;

    if (phase === "assemble" && !this.isAmbient) {
      const distance = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const swirlForce = PARTICLE_TUNE.swirl.strength / (distance + PARTICLE_TUNE.swirl.falloff);
      const tx = -dy / distance;
      const ty = dx / distance;
      this.vx += tx * swirlForce * dt * 120;
      this.vy += ty * swirlForce * dt * 120;
    }

    this.wavePhaseZ += PARTICLE_TUNE.depth.waveSpeed * dt;
    const targetZ =
      this.baseZ +
      Math.sin(this.wavePhaseZ + this.x * 0.01) * PARTICLE_TUNE.depth.waveAmp;
    this.vz += (targetZ - this.z) * 0.02 * dt;

    // 应用摩擦力
    const friction = Math.pow(this.friction, dt);
    this.vx *= friction;
    this.vy *= friction;
    this.vz *= friction;

    // 更新位置
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;
  }
}

function ParticleCanvas({ imageSrc, width, height, onReady, scatterSignal = 0, phase = "idle" }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({
    x: null,
    y: null,
    radius: 60,
    focus: { active: false, expanding: false, shrinking: false, x: 0, y: 0, radius: 0, phase: 0 },
  });
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const isExplodingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const rotationRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const getDiffusePosition = useCallback(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    const minSide = Math.min(width, height);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), DIFFUSE_TUNE.radiusPower) * minSide * DIFFUSE_TUNE.radiusScale;
    const swirl = Math.sin(angle * DIFFUSE_TUNE.swirlFreq) * minSide * DIFFUSE_TUNE.swirlStrength;
    const verticalNoise =
      Math.cos(angle * DIFFUSE_TUNE.verticalNoiseFreq) * minSide * DIFFUSE_TUNE.verticalNoiseStrength;
    const x = centerX + Math.cos(angle) * (radius + swirl);
    const y = centerY + Math.sin(angle) * (radius * DIFFUSE_TUNE.ySquash) + verticalNoise;
    const margin = minSide * DIFFUSE_TUNE.margin;
    return {
      x: Math.max(-margin, Math.min(width + margin, x)),
      y: Math.max(-margin, Math.min(height + margin, y)),
    };
  }, [width, height]);

  const getEdgePosition = useCallback(() => {
    const margin = Math.min(width, height) * 0.08;
    const band = Math.min(width, height) * 0.12;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) {
      return { x: Math.random() * width, y: -margin - Math.random() * band };
    }
    if (side === 1) {
      return { x: width + margin + Math.random() * band, y: Math.random() * height };
    }
    if (side === 2) {
      return { x: Math.random() * width, y: height + margin + Math.random() * band };
    }
    return { x: -margin - Math.random() * band, y: Math.random() * height };
  }, [width, height]);

  // 从图片创建粒子
  const createParticles = useCallback((img) => {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    
    // 计算适合的尺寸 - 更大的显示区域
    const maxWidth = Math.min(width * 0.85, 800);
    const maxHeight = Math.min(height * 0.7, 600);
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    
    tempCanvas.width = drawWidth;
    tempCanvas.height = drawHeight;
    tempCtx.drawImage(img, 0, 0, drawWidth, drawHeight);
    
    const imageData = tempCtx.getImageData(0, 0, drawWidth, drawHeight);
    const data = imageData.data;
    const particles = [];
    
    // 粒子采样间隔 - 动态控制密度，减少大图的卡顿
    const area = drawWidth * drawHeight;
    let gap = area > 520000 ? 2.4 : area > 360000 ? 2.1 : 1.7;
    const maxParticles = 42000;
    const estimatedCount = (drawWidth / gap) * (drawHeight / gap);
    if (estimatedCount > maxParticles) {
      gap = Math.sqrt(area / maxParticles);
    }
    // 粒子尺寸与间隔匹配
    const particleSize = gap;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2 - 50; // 留出底部文字空间
    
    for (let y = 0; y < drawHeight; y += gap) {
      for (let x = 0; x < drawWidth; x += gap) {
        const index = (Math.floor(y) * Math.floor(drawWidth) + Math.floor(x)) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        // 跳过透明像素，保留暗色像素
        if (a > 40) {
          const alpha = Math.min(1, a / 255 + 0.1);
          const color = {
            r,
            g,
            b,
            a: alpha,
            ambient: { r: 190, g: 210, b: 255 },
          };
          const particleX = x + offsetX;
          const particleY = y + offsetY;
          
          // 初始位置：弥漫态，随后再汇聚成图像
          const diffuse = getDiffusePosition();
          const startX = diffuse.x;
          const startY = diffuse.y;
          const particle = new Particle(startX, startY, color, particleX, particleY, particleSize);
          particle.setDiffuseTarget(diffuse.x, diffuse.y);
          particles.push(particle);
        }
      }
    }

    const ambientCount = Math.floor(particles.length * DIFFUSE_TUNE.ambientExtraRatio);
    for (let i = 0; i < ambientCount; i += 1) {
      const diffuse = getDiffusePosition();
      const ambient = new Particle(
        diffuse.x,
        diffuse.y,
        { r: 190, g: 210, b: 255, a: 0.28, ambient: { r: 190, g: 210, b: 255 } },
        diffuse.x,
        diffuse.y,
        DIFFUSE_TUNE.ambientSize
      );
      ambient.baseZ = (Math.random() - 0.5) * DIFFUSE_TUNE.ambientDepth;
      ambient.isAmbient = true;
      ambient.setDiffuseTarget(diffuse.x, diffuse.y);
      particles.push(ambient);
    }
    
    return particles;
  }, [width, height, getDiffusePosition]);

  // 加载图片并创建粒子
  useEffect(() => {
    if (!imageSrc) return;
    
    setIsLoaded(false);
    lastTimeRef.current = 0;
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      particlesRef.current = createParticles(img);
      setIsLoaded(true);
      onReady?.();
    };
    
    img.onerror = () => {
      console.error("Failed to load image:", imageSrc);
    };
    
    img.src = imageSrc;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc, createParticles, onReady]);

  // 散开触发
  useEffect(() => {
    if (!isLoaded || !scatterSignal || phase !== "scatter") return;
    particlesRef.current.forEach((particle) => {
      const diffuse = getDiffusePosition();
      particle.setDiffuseTarget(diffuse.x, diffuse.y);
    });
  }, [scatterSignal, isLoaded, phase, getDiffusePosition]);

  useEffect(() => {
    if (!isLoaded) return;
    if (phase === "assemble") {
      particlesRef.current.forEach((particle) => {
        if (particle.isAmbient) {
          const diffuse = getDiffusePosition();
          particle.setDiffuseTarget(diffuse.x, diffuse.y);
        } else {
          particle.setTarget(particle.originalX, particle.originalY, false);
        }
      });
    } else if (phase === "idle") {
      particlesRef.current.forEach((particle) => {
        if (particle.isAmbient) {
          const diffuse = getDiffusePosition();
          particle.setDiffuseTarget(diffuse.x, diffuse.y);
        } else {
          particle.setTarget(particle.originalX, particle.originalY, false);
        }
      });
    }
  }, [isLoaded, phase, getDiffusePosition]);

  // 动画循环
  useEffect(() => {
    if (!isLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    
    const animate = () => {
      const now = performance.now();
      const delta = lastTimeRef.current ? now - lastTimeRef.current : 16.67;
      lastTimeRef.current = now;
      const dt = Math.min(2, Math.max(0.5, delta / 16.67));
      const deltaSeconds = delta / 1000;
      const focus = mouseRef.current.focus;
      if (focus.active && focus.expanding) {
        focus.radius = Math.min(
          FOCUS_TUNE.maxRadius,
          focus.radius + FOCUS_TUNE.expandSpeed * deltaSeconds
        );
        focus.phase += FOCUS_TUNE.swirlSpeed * deltaSeconds;
      } else if (focus.active && focus.shrinking) {
        focus.radius = Math.max(0, focus.radius - FOCUS_TUNE.shrinkSpeed * deltaSeconds);
        focus.phase += FOCUS_TUNE.swirlSpeed * deltaSeconds;
        if (focus.radius <= 0.5) {
          focus.active = false;
          focus.shrinking = false;
        }
      }
      ctx.clearRect(0, 0, width, height);
      
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        particle.update(mouseRef.current, isExplodingRef.current, dt, rotationRef.current, {
          x: width / 2,
          y: height / 2,
        });
        particle.draw(ctx, now, rotationRef.current, { x: width / 2, y: height / 2 });
      }
      
      isExplodingRef.current = false;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoaded, width, height]);

  // 鼠标事件处理
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      rotX: rotationRef.current.x,
      rotY: rotationRef.current.y,
    };
    mouseRef.current.focus = {
      active: true,
      expanding: true,
      shrinking: false,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      radius: 0,
      phase: 0,
    };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    mouseRef.current.focus.expanding = false;
    mouseRef.current.focus.shrinking = true;
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current.x = x;
    mouseRef.current.y = y;

    if (isDraggingRef.current) {
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      rotationRef.current.y = dragStartRef.current.rotY + dx * 0.004;
      rotationRef.current.x = dragStartRef.current.rotX + dy * 0.004;
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current.x = null;
    mouseRef.current.y = null;
    isDraggingRef.current = false;
    mouseRef.current.focus.expanding = false;
    mouseRef.current.focus.shrinking = true;
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 cursor-pointer"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

export default function ParticleGallery({ images, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState("idle");
  const [scatterSignal, setScatterSignal] = useState(0);
  const transitionTimersRef = useRef([]);

  // 更新画布尺寸
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  useEffect(() => {
    if (!isOpen) {
      setIsTransitioning(false);
      setTransitionPhase("idle");
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
      transitionTimersRef.current = [];
    };
  }, []);

  const beginTransition = (nextIndex) => {
    if (nextIndex === currentIndex) return;
    const scatterDuration = TRANSITION_TUNE.scatterDuration;
    const assembleDuration = TRANSITION_TUNE.assembleDuration;

    transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
    transitionTimersRef.current = [];

    setIsTransitioning(true);
    setTransitionPhase("scatter");
    setScatterSignal((prev) => prev + 1);

    const toNext = setTimeout(() => {
      setCurrentIndex(nextIndex);
      setTransitionPhase("assemble");
    }, scatterDuration);

    const toIdle = setTimeout(() => {
      setTransitionPhase("idle");
      setIsTransitioning(false);
    }, scatterDuration + assembleDuration);

    transitionTimersRef.current.push(toNext, toIdle);
  };

  const handlePrev = () => {
    if (isTransitioning || images.length <= 1) return;
    const nextIndex = (currentIndex - 1 + images.length) % images.length;
    beginTransition(nextIndex);
  };

  const handleNext = () => {
    if (isTransitioning || images.length <= 1) return;
    const nextIndex = (currentIndex + 1) % images.length;
    beginTransition(nextIndex);
  };

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* 粒子画布 */}
          <div className="relative w-full h-full">
            <ParticleCanvas
              key={currentIndex}
              imageSrc={currentImage.posterUrl || currentImage.url}
              width={dimensions.width}
              height={dimensions.height}
              onReady={undefined}
              scatterSignal={scatterSignal}
              phase={transitionPhase}
            />
          </div>

          {/* 底部信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {currentImage.title || "Untitled"}
            </h2>
            {currentImage.review && (
              <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto">
                {currentImage.review}
              </p>
            )}
          </motion.div>

          {/* 导航按钮 */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={isTransitioning}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-white transition-all disabled:opacity-50"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={handleNext}
                disabled={isTransitioning}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-white transition-all disabled:opacity-50"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* 指示器 */}
          {images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isTransitioning) {
                      beginTransition(index);
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-cyan-400 w-6"
                      : "bg-zinc-600 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>
          )}

          {/* 提示文字 */}
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-zinc-600 text-xs">
            Drag to orbit • Move mouse to interact • Use ← → keys to navigate
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
