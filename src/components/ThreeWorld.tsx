import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HiddenItem, RivalOperative, RARITY_CONFIGS } from '../types/game';

interface ThreeWorldProps {
  playerMeters: { x: number; z: number };
  playerHeading: number;
  items: HiddenItem[];
  rivals: RivalOperative[];
  radarScanActive: boolean;
  onSelectItem: (item: HiddenItem) => void;
  onSelectRival: (rival: RivalOperative) => void;
  isPaused: boolean;
  cameraMode: 'follow' | 'tactical_overhead' | 'first_person';
}

// Pre-allocated math helpers to eliminate GC inside render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

export const ThreeWorld: React.FC<ThreeWorldProps> = ({
  playerMeters,
  playerHeading,
  items,
  rivals,
  radarScanActive,
  onSelectItem,
  onSelectRival,
  isPaused,
  cameraMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // References to dynamic 3D objects
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const radarWaveMeshRef = useRef<THREE.Mesh | null>(null);
  const itemMeshesMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const rivalMeshesMapRef = useRef<Map<string, THREE.Group>>(new Map());

  // Store latest props in refs to avoid re-initializing scene on every React tick
  const propsRef = useRef({
    playerMeters,
    playerHeading,
    items,
    rivals,
    radarScanActive,
    isPaused,
    cameraMode,
    onSelectItem,
    onSelectRival,
  });

  useEffect(() => {
    propsRef.current = {
      playerMeters,
      playerHeading,
      items,
      rivals,
      radarScanActive,
      isPaused,
      cameraMode,
      onSelectItem,
      onSelectRival,
    };
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL safely
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Deep cyber navy
    scene.fog = new THREE.FogExp2(0x060913, 0.0075);
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 1000);
    camera.position.set(0, 18, 24);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (PMREM RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const hemisphereLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(40, 65, 30);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 10;
      keyLight.shadow.camera.far = 180;
      keyLight.shadow.camera.left = -40;
      keyLight.shadow.camera.right = 40;
      keyLight.shadow.camera.top = 40;
      keyLight.shadow.camera.bottom = -40;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.9);
    rimLight.position.set(-35, 25, -40);
    scene.add(rimLight);

    // 5. Holographic Ground Grid & Terrain
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);

    // Main base dark ground
    const groundGeo = new THREE.PlaneGeometry(800, 800, 40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.85,
      metalness: 0.2,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = !isSoftwareGl;
    terrainGroup.add(groundMesh);

    // Holographic Cyber Grid Overlay
    const gridHelper = new THREE.GridHelper(600, 120, 0x0284c7, 0x1e293b);
    gridHelper.position.y = 0.02;
    terrainGroup.add(gridHelper);

    // Concentric Tactical Distance Rings (50m, 100m, 150m, 200m)
    [50, 100, 150, 200].forEach((radius) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.25, radius + 0.25, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.05;
      terrainGroup.add(ringMesh);
    });

    // Radar pulse wave mesh (expands when player scans)
    const waveGeo = new THREE.RingGeometry(0.1, 2.5, 64);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const radarWaveMesh = new THREE.Mesh(waveGeo, waveMat);
    radarWaveMesh.rotation.x = -Math.PI / 2;
    radarWaveMesh.position.y = 0.08;
    radarWaveMesh.visible = false;
    scene.add(radarWaveMesh);
    radarWaveMeshRef.current = radarWaveMesh;

    // Distant perimeter cyber holographic monolithic spires
    const spireGroup = new THREE.Group();
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x0d1f38,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: false,
    });
    const spireGlowMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
    });

    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const dist = 240 + (i % 5) * 20;
      const h = 40 + (i % 7) * 25;
      const w = 12 + (i % 3) * 6;

      const spireGeo = new THREE.BoxGeometry(w, h, w);
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
      spireGroup.add(spire);

      // Wireframe cap
      const wire = new THREE.Mesh(spireGeo, spireGlowMat);
      wire.position.copy(spire.position);
      wire.scale.set(1.01, 1.01, 1.01);
      spireGroup.add(wire);
    }
    scene.add(spireGroup);

    // 6. Player 3D Drone Avatar (Multi-part procedural model)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 2.0, 0);

    // Part 1: Central Pod Core (faceted prism)
    const podGeo = new THREE.OctahedronGeometry(1.0, 1);
    const podMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.6,
    });
    const podMesh = new THREE.Mesh(podGeo, podMat);
    podMesh.scale.set(1.1, 0.7, 1.3);
    podMesh.castShadow = !isSoftwareGl;
    playerGroup.add(podMesh);

    // Part 2: Optical Sensor Eye
    const eyeGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.set(0, 0.1, 0.8);
    playerGroup.add(eyeMesh);

    // Part 3 & 4: Dual Rotating Gyro Rings
    const ring1Geo = new THREE.TorusGeometry(1.35, 0.05, 12, 32);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });
    const gyroRing1 = new THREE.Mesh(ring1Geo, ring1Mat);
    gyroRing1.rotation.x = Math.PI / 2;
    playerGroup.add(gyroRing1);

    const ring2Geo = new THREE.TorusGeometry(1.65, 0.04, 12, 32);
    const gyroRing2 = new THREE.Mesh(ring2Geo, ring1Mat);
    gyroRing2.rotation.y = Math.PI / 2;
    playerGroup.add(gyroRing2);

    // Part 5 & 6: Left and Right Thruster Nacelles
    const nacelleGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 12);
    const nacelleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });

    const leftNacelle = new THREE.Mesh(nacelleGeo, nacelleMat);
    leftNacelle.rotation.x = Math.PI / 2;
    leftNacelle.position.set(-1.2, 0, -0.2);
    playerGroup.add(leftNacelle);

    const rightNacelle = leftNacelle.clone();
    rightNacelle.position.x = 1.2;
    playerGroup.add(rightNacelle);

    // Part 7: Ion Thruster Glow Plumes
    const plumeGeo = new THREE.ConeGeometry(0.22, 0.8, 12);
    const plumeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
    const leftPlume = new THREE.Mesh(plumeGeo, plumeMat);
    leftPlume.rotation.x = -Math.PI / 2;
    leftPlume.position.set(-1.2, 0, -0.9);
    playerGroup.add(leftPlume);

    const rightPlume = leftPlume.clone();
    rightPlume.position.x = 1.2;
    playerGroup.add(rightPlume);

    // Part 8: Contact Shadow beneath player
    const shadowGeo = new THREE.CircleGeometry(1.4, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
    playerShadow.rotation.x = -Math.PI / 2;
    playerShadow.position.set(0, -1.95, 0);
    playerGroup.add(playerShadow);

    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    // 7. Interactive Pointer Click Raycasting
    const handlePointerDown = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_pointer, camera);

      // Check items
      const itemIntersects: Array<{ distance: number; object: THREE.Object3D }> = [];
      itemMeshesMapRef.current.forEach((grp, id) => {
        const hits = _raycaster.intersectObjects(grp.children, true);
        if (hits.length > 0) {
          const item = propsRef.current.items.find((it) => it.id === id);
          if (item) {
            propsRef.current.onSelectItem(item);
          }
        }
      });

      // Check rivals
      rivalMeshesMapRef.current.forEach((grp, id) => {
        const hits = _raycaster.intersectObjects(grp.children, true);
        if (hits.length > 0) {
          const rival = propsRef.current.rivals.find((r) => r.id === id);
          if (rival && rival.status !== 'defeated') {
            propsRef.current.onSelectRival(rival);
          }
        }
      });
    };

    container.addEventListener('pointerdown', handlePointerDown);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Main Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    let waveRadius = 0;
    let waveExpanding = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsedTime = clock.getElapsedTime();

      const { playerMeters: pMeters, playerHeading: pHeading, cameraMode: cMode, radarScanActive: isScan } = propsRef.current;

      // Update Player Drone Position & Orientation
      if (playerGroupRef.current) {
        // Smoothly interpolate player 3D position
        playerGroupRef.current.position.x = THREE.MathUtils.damp(
          playerGroupRef.current.position.x,
          pMeters.x,
          8,
          dt
        );
        playerGroupRef.current.position.z = THREE.MathUtils.damp(
          playerGroupRef.current.position.z,
          pMeters.z,
          8,
          dt
        );

        // Hover bobbing
        playerGroupRef.current.position.y = 2.0 + Math.sin(elapsedTime * 2.5) * 0.25;

        // Heading rotation
        const targetRotY = (-pHeading * Math.PI) / 180;
        playerGroupRef.current.rotation.y = THREE.MathUtils.damp(
          playerGroupRef.current.rotation.y,
          targetRotY,
          9,
          dt
        );

        // Gyro ring rotations
        gyroRing1.rotation.z += dt * 1.5;
        gyroRing2.rotation.x += dt * 2.2;
      }

      // Camera Follow Behavior
      if (cameraRef.current && playerGroupRef.current) {
        const pPos = playerGroupRef.current.position;

        if (cMode === 'follow') {
          const targetCamX = pPos.x + Math.sin(targetCamAngle(pHeading)) * 18;
          const targetCamZ = pPos.z + Math.cos(targetCamAngle(pHeading)) * 18;
          const targetCamY = pPos.y + 12;

          cameraRef.current.position.x = THREE.MathUtils.damp(cameraRef.current.position.x, targetCamX, 4, dt);
          cameraRef.current.position.y = THREE.MathUtils.damp(cameraRef.current.position.y, targetCamY, 4, dt);
          cameraRef.current.position.z = THREE.MathUtils.damp(cameraRef.current.position.z, targetCamZ, 4, dt);

          _vec3A.set(pPos.x, pPos.y + 1.2, pPos.z);
          cameraRef.current.lookAt(_vec3A);
        } else if (cMode === 'tactical_overhead') {
          cameraRef.current.position.x = THREE.MathUtils.damp(cameraRef.current.position.x, pPos.x, 5, dt);
          cameraRef.current.position.y = THREE.MathUtils.damp(cameraRef.current.position.y, pPos.y + 45, 5, dt);
          cameraRef.current.position.z = THREE.MathUtils.damp(cameraRef.current.position.z, pPos.z + 10, 5, dt);
          _vec3A.set(pPos.x, pPos.y, pPos.z);
          cameraRef.current.lookAt(_vec3A);
        }
      }

      // Radar Wave Animation
      if (radarWaveMeshRef.current && playerGroupRef.current) {
        if (isScan && !waveExpanding) {
          waveExpanding = true;
          waveRadius = 1;
          radarWaveMeshRef.current.visible = true;
          radarWaveMeshRef.current.position.x = playerGroupRef.current.position.x;
          radarWaveMeshRef.current.position.z = playerGroupRef.current.position.z;
        }

        if (waveExpanding) {
          waveRadius += dt * 75; // 75 meters per second
          radarWaveMeshRef.current.scale.set(waveRadius, waveRadius, 1);
          const mat = radarWaveMeshRef.current.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.8 - waveRadius / 180);

          if (waveRadius > 180) {
            waveExpanding = false;
            radarWaveMeshRef.current.visible = false;
          }
        }
      }

      // Animate Item nodes (floating crystals, glowing pillars)
      itemMeshesMapRef.current.forEach((grp) => {
        const core = grp.getObjectByName('itemCore');
        const ring = grp.getObjectByName('itemRing');
        if (core) {
          core.rotation.y += dt * 1.2;
          core.rotation.x = Math.sin(elapsedTime * 1.5) * 0.2;
          core.position.y = 1.8 + Math.sin(elapsedTime * 3 + core.id) * 0.35;
        }
        if (ring) {
          ring.rotation.z += dt * 2.0;
        }
      });

      // Animate Rivals (hovering, patrol tilt)
      rivalMeshesMapRef.current.forEach((grp, id) => {
        grp.position.y = 2.2 + Math.cos(elapsedTime * 2.0 + grp.id) * 0.3;
        const visor = grp.getObjectByName('rivalVisor');
        if (visor) {
          visor.rotation.y = Math.sin(elapsedTime * 3.5) * 0.4;
        }
      });

      // Render
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    function targetCamAngle(headingDeg: number) {
      return ((headingDeg + 180) * Math.PI) / 180;
    }

    // Start loop
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Items in 3D Scene when items prop updates
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = itemMeshesMapRef.current;
    const activeItemIds = new Set(items.filter((it) => !it.isCollected).map((it) => it.id));

    // Remove obsolete items
    currentMap.forEach((grp, id) => {
      if (!activeItemIds.has(id)) {
        scene.remove(grp);
        currentMap.delete(id);
      }
    });

    // Add or update active items
    items.forEach((item) => {
      if (item.isCollected) return;

      let itemGrp = currentMap.get(item.id);
      const rarityCfg = RARITY_CONFIGS[item.rarity];

      if (!itemGrp) {
        itemGrp = new THREE.Group();
        itemGrp.name = `item-${item.id}`;

        // 1. Core Gem / Relic Geometry based on modelType
        let coreGeo: THREE.BufferGeometry;
        switch (item.modelType) {
          case 'crystal':
            coreGeo = new THREE.OctahedronGeometry(1.2, 0);
            break;
          case 'cube':
            coreGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            break;
          case 'orb':
            coreGeo = new THREE.SphereGeometry(0.9, 16, 16);
            break;
          case 'prism':
            coreGeo = new THREE.ConeGeometry(0.9, 1.8, 5);
            break;
          case 'sigil':
          default:
            coreGeo = new THREE.TorusKnotGeometry(0.65, 0.2, 32, 8);
            break;
        }

        const coreMat = new THREE.MeshPhysicalMaterial({
          color: rarityCfg.hexNumber,
          emissive: rarityCfg.hexNumber,
          emissiveIntensity: 0.65,
          metalness: 0.6,
          roughness: 0.15,
          clearcoat: 1.0,
        });

        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.name = 'itemCore';
        coreMesh.position.y = 1.8;
        itemGrp.add(coreMesh);

        // 2. Orbital Rarity Halo Ring
        const haloGeo = new THREE.TorusGeometry(1.6, 0.04, 8, 24);
        const haloMat = new THREE.MeshBasicMaterial({ color: rarityCfg.hexNumber });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.name = 'itemRing';
        haloMesh.rotation.x = Math.PI / 2;
        haloMesh.position.y = 1.8;
        itemGrp.add(haloMesh);

        // 3. Vertical Sky Beacon Light Pillar
        const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 45, 12, 1, true);
        const pillarMat = new THREE.MeshBasicMaterial({
          color: rarityCfg.hexNumber,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
        pillarMesh.position.y = 22.5;
        itemGrp.add(pillarMesh);

        // 4. Ground Holographic Glyph
        const glyphGeo = new THREE.RingGeometry(0.8, 1.8, 24);
        const glyphMat = new THREE.MeshBasicMaterial({
          color: rarityCfg.hexNumber,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const glyphMesh = new THREE.Mesh(glyphGeo, glyphMat);
        glyphMesh.rotation.x = -Math.PI / 2;
        glyphMesh.position.y = 0.04;
        itemGrp.add(glyphMesh);

        scene.add(itemGrp);
        currentMap.set(item.id, itemGrp);
      }

      // Position in world coordinates
      itemGrp.position.set(item.relativeMeters.x, 0, item.relativeMeters.z);
    });
  }, [items]);

  // Sync Rivals in 3D Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = rivalMeshesMapRef.current;
    const activeRivals = rivals.filter((r) => r.status !== 'defeated');
    const activeIds = new Set(activeRivals.map((r) => r.id));

    currentMap.forEach((grp, id) => {
      if (!activeIds.has(id)) {
        scene.remove(grp);
        currentMap.delete(id);
      }
    });

    activeRivals.forEach((rival) => {
      let grp = currentMap.get(rival.id);
      const tierCfg = RARITY_CONFIGS[rival.rarityTier];

      if (!grp) {
        grp = new THREE.Group();
        grp.name = `rival-${rival.id}`;

        // Rival drone hull (aggressive angular shape)
        const hullGeo = new THREE.ConeGeometry(1.2, 2.0, 4);
        const hullMat = new THREE.MeshStandardMaterial({
          color: 0x1e1b4b,
          roughness: 0.35,
          metalness: 0.85,
        });
        const hullMesh = new THREE.Mesh(hullGeo, hullMat);
        hullMesh.rotation.x = Math.PI / 2;
        hullMesh.scale.set(1.1, 0.6, 1.3);
        grp.add(hullMesh);

        // Hostile Red/Purple Visor
        const visorGeo = new THREE.BoxGeometry(1.2, 0.2, 0.4);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const visorMesh = new THREE.Mesh(visorGeo, visorMat);
        visorMesh.name = 'rivalVisor';
        visorMesh.position.set(0, 0.1, 0.85);
        grp.add(visorMesh);

        // Overhead Rarity Emblem
        const badgeGeo = new THREE.OctahedronGeometry(0.5, 0);
        const badgeMat = new THREE.MeshBasicMaterial({ color: tierCfg.hexNumber });
        const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
        badgeMesh.position.set(0, 1.8, 0);
        grp.add(badgeMesh);

        // Shadow disk
        const rShadowGeo = new THREE.CircleGeometry(1.3, 16);
        const rShadowMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        });
        const rShadow = new THREE.Mesh(rShadowGeo, rShadowMat);
        rShadow.rotation.x = -Math.PI / 2;
        rShadow.position.y = -2.15;
        grp.add(rShadow);

        scene.add(grp);
        currentMap.set(rival.id, grp);
      }

      grp.position.set(rival.relativeMeters.x, 0, rival.relativeMeters.z);
    });
  }, [rivals]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
