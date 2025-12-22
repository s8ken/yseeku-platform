'use client';

import { useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';

export default function DemoHome() {
  useEffect(() => {
    // Quantum background setup (from demo.html)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('quantum-bg')?.appendChild(renderer.domElement);

    // Add simple grid geometry
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    const grid = new THREE.Mesh(geometry, material);
    scene.add(grid);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      grid.rotation.x += 0.001;
      grid.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    // GSAP animations for hero
    gsap.from('.hero-title', { duration: 1, y: 50, opacity: 0, stagger: 0.2 });
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div id="quantum-bg" className="absolute inset-0" />
      <div className="relative z-10 text-center">
        <h1 className="hero-title text-6xl font-bold text-cyan-400 mb-4">SONATE QUANTUM AI</h1>
        <p className="hero-subtitle text-2xl text-slate-300">Enterprise-Grade Constitutional AI Governance with Quantum-Security</p>
        <Button className="mt-8 bg-cyan-600 hover:bg-cyan-500">Start Interactive Demo</Button>
      </div>
    </section>
  );
}
