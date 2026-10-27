import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HiddenItem, RARITY_CONFIGS } from '../types/game';
import { sound } from '../utils/audio';
import { X, Sparkles, Shield, Zap, Radio, Globe } from 'lucide-react';

interface ArtifactInspectorProps {
  item: HiddenItem;
  onClose: () => void;
}

export const ArtifactInspector: React.FC<ArtifactInspectorProps> = ({ item, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rarityCfg = RARITY_CONFIGS[item.rarity];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(rarityCfg.hexNumber, 2.5, 10);
    pointLight1.position.set(2, 3, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 1.8, 10);
    pointLight2.position.set(-2, -2, 2);
    scene.add(pointLight2);

    // Geometry based on modelType
    let geo: THREE.BufferGeometry;
    switch (item.modelType) {
      case 'crystal':
        geo = new THREE.OctahedronGeometry(1.2, 0);
        break;
      case 'cube':
        geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        break;
      case 'orb':
        geo = new THREE.SphereGeometry(1.0, 24, 24);
        break;
      case 'prism':
        geo = new THREE.ConeGeometry(0.9, 1.8, 6);
        break;
      case 'sigil':
      default:
        geo = new THREE.TorusKnotGeometry(0.7, 0.22, 48, 12);
        break;
    }

    const mat = new THREE.MeshPhysicalMaterial({
      color: rarityCfg.hexNumber,
      emissive: rarityCfg.hexNumber,
      emissiveIntensity: 0.35,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Outer wireframe cage
    const wireMat = new THREE.MeshBasicMaterial({
      color: rarityCfg.hexNumber,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireMesh = new THREE.Mesh(geo, wireMat);
    wireMesh.scale.set(1.15, 1.15, 1.15);
    scene.add(wireMesh);

    // Animation
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      mesh.rotation.y += 0.012;
      mesh.rotation.x += 0.007;
      wireMesh.rotation.y -= 0.008;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [item, rarityCfg]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase border"
              style={{
                backgroundColor: `${rarityCfg.color}20`,
                borderColor: `${rarityCfg.color}60`,
                color: rarityCfg.color,
              }}
            >
              {rarityCfg.label}
            </span>
            <span className="text-xs font-mono text-slate-400">INSPEÇÃO HOLOGRÁFICA 3D</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Model Viewport */}
        <div className="relative w-full h-56 my-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden">
          <div ref={mountRef} className="w-full h-full" />
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-500">
            Rotação automática ativada
          </div>
        </div>

        {/* Name and Lore */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-100">{item.name}</h3>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">{item.lore}</p>
        </div>

        {/* Geographic details */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-cyan-400">
            <Globe className="w-4 h-4" />
            <span>Coordenadas Geográficas:</span>
          </div>
          <span className="text-slate-300">
            {item.geoCoords.lat.toFixed(5)}°, {item.geoCoords.lng.toFixed(5)}°
          </span>
        </div>

        {/* Stat bonuses */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400">
              <Zap className="w-3 h-3 text-rose-400" />
              ATAQUE
            </div>
            <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
              +{item.powerStats.attackBonus}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400">
              <Shield className="w-3 h-3 text-sky-400" />
              DEFESA
            </div>
            <div className="text-base font-bold font-mono text-sky-400 mt-0.5">
              +{item.powerStats.defenseBonus}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400">
              <Radio className="w-3 h-3 text-emerald-400" />
              RADAR
            </div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              +{item.powerStats.radarBonus}m
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
          >
            Fechar Inspeção
          </button>
        </div>
      </div>
    </div>
  );
};
