import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 粒子画廊组件 - 将图片转换为动态粒子效果
 * 支持鼠标交互和左右切换
 */

class Particle {
  constructor(x, y, color, originalX, originalY, size = 1.5) {
    this.x = x;
    this.y = y;
    this.originalX = originalX;
    this.originalY = originalY;
    this.color = color;
    this.size = size; // 固定小尺寸，保持图像清晰
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.92; // 更高摩擦力，粒子更快停止
    this.springFactor = 0.08 + Math.random() * 0.04; // 更强的回复力
  }

  draw(ctx) {
    // 使用方形绘制，更密集更清晰
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
  }

  update(mouse, isExploding) {
    // 持续轻微抖动 - 产生记忆般的动态感
    this.vx += (Math.random() - 0.5) * 0.8;
    this.vy += (Math.random() - 0.5) * 0.8;

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
        const pushX = Math.cos(angle) * force * 6;
        const pushY = Math.sin(angle) * force * 6;
        this.vx += pushX;
        this.vy += pushY;
      }
    }

    // 爆炸效果
    if (isExploding) {
      this.vx += (Math.random() - 0.5) * 100;
      this.vy += (Math.random() - 0.5) * 100;
    }

    // 回到原位的弹簧效果
    const dx = this.originalX - this.x;
    const dy = this.originalY - this.y;
    this.vx += dx * this.springFactor;
    this.vy += dy * this.springFactor;

    // 应用摩擦力
    this.vx *= this.friction;
    this.vy *= this.friction;

    // 更新位置
    this.x += this.vx;
    this.y += this.vy;
  }
}

function ParticleCanvas({ imageSrc, width, height, onReady }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null, radius: 60 });
  const animationRef = useRef(null);
  const isExplodingRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
    
    // 粒子采样间隔 - 更密集以保持图像清晰度
    const gap = 1.5;
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
        if (a > 30) {
          const color = `rgba(${r}, ${g}, ${b}, ${Math.min(1, a / 255 + 0.1)})`;
          const particleX = x + offsetX;
          const particleY = y + offsetY;
          
          // 初始位置：从原位置稍微偏移，产生聚合效果
          const startX = particleX + (Math.random() - 0.5) * 0;
          const startY = particleY + (Math.random() - 0.5) * 0;
          
          particles.push(new Particle(startX, startY, color, particleX, particleY, particleSize));
        }
      }
    }
    
    return particles;
  }, [width, height]);

  // 加载图片并创建粒子
  useEffect(() => {
    if (!imageSrc) return;
    
    setIsLoaded(false);
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

  // 动画循环
  useEffect(() => {
    if (!isLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particlesRef.current.forEach((particle) => {
        particle.update(mouseRef.current, isExplodingRef.current);
        particle.draw(ctx);
      });
      
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
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  const handleMouseLeave = () => {
    mouseRef.current.x = null;
    mouseRef.current.y = null;
  };

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
    mouseRef.current.radius = 60;
    isExplodingRef.current = true;
    
    // 恢复正常半径
    setTimeout(() => {
      mouseRef.current.radius = 30;
    }, 100);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
}

export default function ParticleGallery({ images, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const handlePrev = () => {
    if (isTransitioning || images.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    if (isTransitioning || images.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleReady = () => {
    setTimeout(() => setIsTransitioning(false), 500);
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
              onReady={handleReady}
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
                      setIsTransitioning(true);
                      setCurrentIndex(index);
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
            Move mouse to interact • Click to explode • Use ← → keys to navigate
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
