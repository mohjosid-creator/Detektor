import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Camera, ChevronDown, ChevronUp, Layers, RotateCcw } from 'lucide-react';
import {
  AquiferPocket,
  DetectionTargetMode,
  MineralDeposit,
  ScanPoint,
  TerrainScenario,
} from '../types/radar';
import { METAL_METADATA } from '../utils/radarPhysics';

export interface SubsurfaceViewportHandle {
  capturePng: () => void;
}

interface SubsurfaceViewport3DProps {
  scenario: TerrainScenario;
  scanPoints: ScanPoint[];
  currentPosition: { x: number; z: number };
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string | null) => void;
  depthSliceM: number;
  onDepthSliceChange: (depth: number) => void;
  strataOpacity: number;
  onStrataOpacityChange: (opacity: number) => void;
  showFlowVectors: boolean;
  detectionMode: DetectionTargetMode;
}

type CameraPreset = 'iso' | 'top' | 'cross' | 'target';

const _vec3 = new THREE.Vector3();
const _targetVec = new THREE.Vector3();

function createStrataTexture(scenario: TerrainScenario): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const totalDepth = 40;
    for (const s of scenario.strata) {
      const y0 = (s.topDepthM / totalDepth) * canvas.height;
      const h = ((s.bottomDepthM - s.topDepthM) / totalDepth) * canvas.height;
      ctx.fillStyle = s.colorHex;
      ctx.fillRect(0, y0, canvas.width, h + 1);

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 48; i++) {
        const rx = (i * 73) % canvas.width;
        const ry = y0 + ((i * 37) % Math.max(4, h));
        ctx.fillRect(rx, ry, 18 + (i % 24), 2);
      }

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(canvas.width, y0);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createSurfaceGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e2c26';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 650; i++) {
      const x = (i * 97) % 512;
      const y = (i * 53) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(148, 163, 184, 0.08)' : 'rgba(16, 185, 129, 0.07)';
      ctx.fillRect(x, y, 3, 3);
    }

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    const step = 512 / 6;
    for (let i = 0; i <= 6; i++) {
      const p = i * step;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(512, p);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildGprCartGroup(): THREE.Group {
  const cart = new THREE.Group();

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x161b22,
    roughness: 0.88,
    metalness: 0.05,
  });
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.28,
    metalness: 0.85,
  });
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.42,
    metalness: 0.25,
  });
  const antennaShieldMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.65,
    metalness: 0.3,
  });
  const piCoilMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.35,
    metalness: 0.75,
  });
  const gpsDomeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.1,
  });

  // 1. Ground-coupled shielded bowtie antenna box
  const antennaBox = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.42, 2.8), antennaShieldMat);
  antennaBox.position.set(0, 0.35, 0);
  antennaBox.castShadow = true;
  cart.add(antennaBox);

  // 2. Front-mounted Pulse Induction (PI) copper search coil frame
  const piFrame = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 10, 24), piCoilMat);
  piFrame.rotation.x = Math.PI / 2;
  piFrame.position.set(0, 0.26, -2.0);
  cart.add(piFrame);

  // 3. Main upper chassis deck
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.36, 2.1), housingMat);
  chassis.position.set(0, 0.78, 0.1);
  chassis.castShadow = true;
  cart.add(chassis);

  // 4. Aluminum electronics / ADS1256 + Geiger enclosure
  const electronicsBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.32, 1.0), aluminumMat);
  electronicsBox.position.set(0, 1.12, -0.15);
  electronicsBox.castShadow = true;
  cart.add(electronicsBox);

  // 5. Four rugged wheels with metallic hubs
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.24, 20);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 14);
  hubGeo.rotateZ(Math.PI / 2);

  const wheelOffsets: Array<[number, number]> = [
    [-1.24, 1.0],
    [1.24, 1.0],
    [-1.24, -1.0],
    [1.24, -1.0],
  ];
  for (const [wx, wz] of wheelOffsets) {
    const tire = new THREE.Mesh(wheelGeo, rubberMat);
    tire.position.set(wx, 0.42, wz);
    tire.castShadow = true;
    cart.add(tire);

    const hub = new THREE.Mesh(hubGeo, aluminumMat);
    hub.position.set(wx, 0.42, wz);
    cart.add(hub);
  }

  // 6. Telescopic non-magnetic mast + Magnetometer sensor pod + GNSS dome
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.85, 12), aluminumMat);
  mast.position.set(0, 2.0, -0.35);
  cart.add(mast);

  const magPod = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.32), piCoilMat);
  magPod.position.set(0, 2.35, -0.35);
  cart.add(magPod);

  const gpsDome = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.18, 20), gpsDomeMat);
  gpsDome.position.set(0, 2.95, -0.35);
  cart.add(gpsDome);

  // 7. Push handlebar
  const leftBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 10), aluminumMat);
  leftBar.rotation.x = -Math.PI / 4;
  leftBar.position.set(-0.65, 1.35, 1.35);
  cart.add(leftBar);

  const rightBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 10), aluminumMat);
  rightBar.rotation.x = -Math.PI / 4;
  rightBar.position.set(0.65, 1.35, 1.35);
  cart.add(rightBar);

  const gripBar = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.42, 12), rubberMat);
  gripBar.rotation.z = Math.PI / 2;
  gripBar.position.set(0, 1.88, 1.88);
  cart.add(gripBar);

  return cart;
}

export const SubsurfaceViewport3D = React.forwardRef<
  SubsurfaceViewportHandle,
  SubsurfaceViewport3DProps
>(function SubsurfaceViewport3D(
  {
    scenario,
    scanPoints,
    currentPosition,
    selectedTargetId,
    onSelectTarget,
    depthSliceM,
    onDepthSliceChange,
    strataOpacity,
    onStrataOpacityChange,
    showFlowVectors,
    detectionMode,
  },
  ref
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const propsRef = useRef({
    scenario,
    scanPoints,
    currentPosition,
    selectedTargetId,
    depthSliceM,
    strataOpacity,
    showFlowVectors,
    detectionMode,
    onSelectTarget,
  });
  propsRef.current = {
    scenario,
    scanPoints,
    currentPosition,
    selectedTargetId,
    depthSliceM,
    strataOpacity,
    showFlowVectors,
    detectionMode,
    onSelectTarget,
  };

  const cameraPresetRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(46, 30, 48),
    target: new THREE.Vector3(0, -10, 0),
  });

  const captureFnRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    capturePng: () => {
      captureFnRef.current?.();
    },
  }));

  const applyCameraPreset = (preset: CameraPreset) => {
    const selectedAq = scenario.aquifers.find((a) => a.id === selectedTargetId);
    const selectedMin = scenario.minerals.find((m) => m.id === selectedTargetId);
    const focusObj = selectedAq ?? selectedMin ?? scenario.aquifers[0] ?? scenario.minerals[0];

    if (preset === 'iso') {
      cameraPresetRef.current = {
        active: true,
        pos: new THREE.Vector3(46, 30, 48),
        target: new THREE.Vector3(0, -10, 0),
      };
    } else if (preset === 'top') {
      cameraPresetRef.current = {
        active: true,
        pos: new THREE.Vector3(0, 68, 0.5),
        target: new THREE.Vector3(0, -8, 0),
      };
    } else if (preset === 'cross') {
      cameraPresetRef.current = {
        active: true,
        pos: new THREE.Vector3(0, 2, 62),
        target: new THREE.Vector3(0, -14, 0),
      };
    } else if (preset === 'target' && focusObj) {
      cameraPresetRef.current = {
        active: true,
        pos: new THREE.Vector3(
          focusObj.centerXM + 20,
          -focusObj.depthM * 0.4 + 14,
          focusObj.centerZM + 22
        ),
        target: new THREE.Vector3(focusObj.centerXM, -focusObj.depthM * 0.65, focusObj.centerZM),
      };
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08101c);
    scene.fog = new THREE.FogExp2(0x08101c, 0.0045);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 400);
    camera.position.set(46, 30, 48);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 135;
    controls.minDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, -10, 0);
    controls.update();

    controls.addEventListener('start', () => {
      cameraPresetRef.current.active = false;
    });

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.78);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.9);
    keyLight.position.set(35, 52, 28);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -40;
      keyLight.shadow.camera.right = 40;
      keyLight.shadow.camera.top = 40;
      keyLight.shadow.camera.bottom = -40;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-40, 12, -36);
    scene.add(rimLight);

    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 30);

    const blockGroup = new THREE.Group();
    scene.add(blockGroup);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const surfaceTex = createSurfaceGridTexture();
    surfaceTex.anisotropy = maxAniso;

    const surfaceMat = new THREE.MeshStandardMaterial({
      map: surfaceTex,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });

    const surfaceMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), surfaceMat);
    surfaceMesh.rotation.x = -Math.PI / 2;
    surfaceMesh.receiveShadow = true;
    blockGroup.add(surfaceMesh);

    const strataTex = createStrataTexture(propsRef.current.scenario);
    strataTex.anisotropy = maxAniso;

    const strataSideMat = new THREE.MeshStandardMaterial({
      map: strataTex,
      roughness: 0.82,
      metalness: 0.04,
      transparent: true,
      opacity: propsRef.current.strataOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      clippingPlanes: [clipPlane],
    });

    const strataBottomMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      transparent: true,
      opacity: propsRef.current.strataOpacity,
      clippingPlanes: [clipPlane],
    });

    const blockGeo = new THREE.BoxGeometry(60, 26, 60);
    const strataBlock = new THREE.Mesh(blockGeo, [
      strataSideMat,
      strataSideMat,
      new THREE.MeshBasicMaterial({ visible: false }),
      strataBottomMat,
      strataSideMat,
      strataSideMat,
    ]);
    strataBlock.position.set(0, -13.02, 0);
    blockGroup.add(strataBlock);

    const cageEdges = new THREE.EdgesGeometry(blockGeo);
    const cageLines = new THREE.LineSegments(
      cageEdges,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28 })
    );
    cageLines.position.copy(strataBlock.position);
    blockGroup.add(cageLines);

    const slicePlaneMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(60.4, 60.4),
      new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    slicePlaneMesh.rotation.x = -Math.PI / 2;
    scene.add(slicePlaneMesh);

    const cartRig = buildGprCartGroup();
    scene.add(cartRig);

    const maxPathPoints = 300;
    const pathPositions = new Float32Array(maxPathPoints * 3);
    const pathGeo = new THREE.BufferGeometry();
    pathGeo.setAttribute('position', new THREE.BufferAttribute(pathPositions, 3));
    pathGeo.setDrawRange(0, 0);
    const pathLine = new THREE.Line(pathGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
    pathLine.position.y = 0.08;
    scene.add(pathLine);

    const pointMarkerGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12);
    const pointMarkerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.2,
    });
    const pointInstances = new THREE.InstancedMesh(pointMarkerGeo, pointMarkerMat, maxPathPoints);
    pointInstances.count = 0;
    pointInstances.frustumCulled = false;
    scene.add(pointInstances);

    const targetsGroup = new THREE.Group();
    scene.add(targetsGroup);

    const clickableMeshes: THREE.Object3D[] = [];
    const aquiferMeshMap = new Map<
      string,
      {
        group: THREE.Group;
        pocketMesh: THREE.Mesh;
        pinRing: THREE.Mesh;
        flowPoints: THREE.Points;
        aquifer: AquiferPocket;
      }
    >();
    const mineralMeshMap = new Map<
      string,
      {
        group: THREE.Group;
        oreMesh: THREE.Mesh;
        pinRing: THREE.Mesh;
        mineral: MineralDeposit;
      }
    >();

    let activeScenarioId = '';

    const rebuildScenarioObjects = (scen: TerrainScenario) => {
      activeScenarioId = scen.id;

      while (targetsGroup.children.length > 0) {
        targetsGroup.remove(targetsGroup.children[0]);
      }
      clickableMeshes.length = 0;
      aquiferMeshMap.clear();
      mineralMeshMap.clear();

      const nextTex = createStrataTexture(scen);
      nextTex.anisotropy = maxAniso;
      strataSideMat.map?.dispose();
      strataSideMat.map = nextTex;
      strataSideMat.needsUpdate = true;

      const scaleY = 0.65;

      // 1. Build Aquifer Water Pockets
      for (const aq of scen.aquifers) {
        const subGroup = new THREE.Group();
        const yCenter = -aq.depthM * scaleY;

        const pocketGeo = new THREE.SphereGeometry(1, 28, 18);
        const pocketMat = new THREE.MeshPhysicalMaterial({
          color: aq.qualityClass.includes('Payau') ? 0xf59e0b : 0x0ea5e9,
          emissive: aq.qualityClass.includes('Payau') ? 0x78350f : 0x0369a1,
          emissiveIntensity: 0.45,
          roughness: 0.18,
          metalness: 0.05,
          transparent: true,
          opacity: 0.72,
          clearcoat: 0.9,
          depthWrite: false,
        });

        const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
        pocketMesh.position.set(aq.centerXM, yCenter, aq.centerZM);
        pocketMesh.scale.set(aq.radiusXM, (aq.thicknessM * scaleY) / 2, aq.radiusZM);
        pocketMesh.userData.targetId = aq.id;
        pocketMesh.layers.enable(1);
        subGroup.add(pocketMesh);
        clickableMeshes.push(pocketMesh);

        const shaftHeight = aq.depthM * scaleY;
        const pinBeam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.16, shaftHeight, 12),
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.6,
            roughness: 0.25,
            metalness: 0.7,
            transparent: true,
            opacity: 0.8,
          })
        );
        pinBeam.position.set(aq.centerXM, -shaftHeight / 2, aq.centerZM);
        pinBeam.userData.targetId = aq.id;
        pinBeam.layers.enable(1);
        subGroup.add(pinBeam);
        clickableMeshes.push(pinBeam);

        const pinRing = new THREE.Mesh(
          new THREE.RingGeometry(0.75, 1.15, 28),
          new THREE.MeshBasicMaterial({
            color: aq.boreholeRecommended ? 0x22d3ee : 0xfbbf24,
            side: THREE.DoubleSide,
          })
        );
        pinRing.rotation.x = -Math.PI / 2;
        pinRing.position.set(aq.centerXM, 0.12, aq.centerZM);
        pinRing.userData.targetId = aq.id;
        pinRing.layers.enable(1);
        subGroup.add(pinRing);
        clickableMeshes.push(pinRing);

        const pCount = 80;
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount; i++) {
          const angle = (i / pCount) * Math.PI * 2 * 3;
          const r = Math.sqrt((i % 20) / 20) * 0.82;
          pPos[i * 3] = aq.centerXM + Math.cos(angle) * aq.radiusXM * r;
          pPos[i * 3 + 1] = yCenter + ((i % 7) - 3) * (aq.thicknessM * scaleY * 0.11);
          pPos[i * 3 + 2] = aq.centerZM + Math.sin(angle) * aq.radiusZM * r;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
          color: 0xbae6fd,
          size: 0.42,
          transparent: true,
          opacity: 0.85,
        });
        const flowPoints = new THREE.Points(pGeo, pMat);
        subGroup.add(flowPoints);

        targetsGroup.add(subGroup);
        aquiferMeshMap.set(aq.id, { group: subGroup, pocketMesh, pinRing, flowPoints, aquifer: aq });
      }

      // 2. Build Faceted Metallic & Radioactive Mineral Deposits
      for (const min of scen.minerals) {
        const subGroup = new THREE.Group();
        const yCenter = -min.depthM * scaleY;
        const meta = METAL_METADATA[min.metalType];

        const oreGeo = new THREE.DodecahedronGeometry(1, 1);
        const oreMat = new THREE.MeshPhysicalMaterial({
          color: meta.threeColor,
          emissive: meta.emissiveColor,
          emissiveIntensity: min.metalType === 'uranium' ? 0.85 : 0.45,
          roughness: min.metalType === 'uranium' ? 0.45 : 0.22,
          metalness: min.metalType === 'uranium' ? 0.35 : 0.88,
          clearcoat: 0.4,
          flatShading: true,
        });

        const oreMesh = new THREE.Mesh(oreGeo, oreMat);
        oreMesh.position.set(min.centerXM, yCenter, min.centerZM);
        oreMesh.scale.set(min.radiusXM * 0.8, (min.thicknessM * scaleY) / 1.8, min.radiusZM * 0.8);
        oreMesh.userData.targetId = min.id;
        oreMesh.layers.enable(1);
        subGroup.add(oreMesh);
        clickableMeshes.push(oreMesh);

        const shaftHeight = min.depthM * scaleY;
        const pinBeam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, shaftHeight, 10),
          new THREE.MeshStandardMaterial({
            color: meta.threeColor,
            emissive: meta.emissiveColor,
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.75,
            transparent: true,
            opacity: 0.78,
          })
        );
        pinBeam.position.set(min.centerXM, -shaftHeight / 2, min.centerZM);
        pinBeam.userData.targetId = min.id;
        pinBeam.layers.enable(1);
        subGroup.add(pinBeam);
        clickableMeshes.push(pinBeam);

        const pinRing = new THREE.Mesh(
          new THREE.RingGeometry(0.65, 1.05, 6), // Hexagonal beacon for minerals vs circular for water
          new THREE.MeshBasicMaterial({
            color: meta.threeColor,
            side: THREE.DoubleSide,
          })
        );
        pinRing.rotation.x = -Math.PI / 2;
        pinRing.position.set(min.centerXM, 0.14, min.centerZM);
        pinRing.userData.targetId = min.id;
        pinRing.layers.enable(1);
        subGroup.add(pinRing);
        clickableMeshes.push(pinRing);

        targetsGroup.add(subGroup);
        mineralMeshMap.set(min.id, { group: subGroup, oreMesh, pinRing, mineral: min });
      }
    };

    rebuildScenarioObjects(propsRef.current.scenario);

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.targetId as string | undefined;
        if (hitId) {
          propsRef.current.onSelectTarget(hitId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    captureFnRef.current = () => {
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `aquaradar_3d_${propsRef.current.scenario.id}_${Date.now()}.png`;
      link.click();
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let lastScanCount = -1;
    const dummyMatrix = new THREE.Matrix4();
    const dummyColor = new THREE.Color();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;

      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const currentProps = propsRef.current;

      if (currentProps.scenario.id !== activeScenarioId) {
        rebuildScenarioObjects(currentProps.scenario);
        lastScanCount = -1;
      }

      strataSideMat.opacity = currentProps.strataOpacity;
      strataBottomMat.opacity = currentProps.strataOpacity;
      surfaceMat.opacity = Math.max(0.22, currentProps.strataOpacity + 0.25);

      const sliceY = -currentProps.depthSliceM * 0.65;
      clipPlane.constant = -sliceY;
      slicePlaneMesh.position.y = sliceY;
      slicePlaneMesh.visible = currentProps.depthSliceM < 39.5;

      cartRig.position.x = THREE.MathUtils.damp(cartRig.position.x, currentProps.currentPosition.x, 9, dt);
      cartRig.position.z = THREE.MathUtils.damp(cartRig.position.z, currentProps.currentPosition.z, 9, dt);

      const pts = currentProps.scanPoints;
      if (pts.length >= 2) {
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const dx = last.xM - prev.xM;
        const dz = last.zM - prev.zM;
        if (Math.abs(dx) + Math.abs(dz) > 0.05) {
          cartRig.rotation.y = Math.atan2(-dx, -dz);
        }
      }

      if (pts.length !== lastScanCount) {
        lastScanCount = pts.length;
        const count = Math.min(pts.length, maxPathPoints);
        const posAttr = pathGeo.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
          const p = pts[i];
          posAttr.setXYZ(i, p.xM, 0, p.zM);
          dummyMatrix.makeTranslation(p.xM, 0.05, p.zM);
          pointInstances.setMatrixAt(i, dummyMatrix);
          if (p.detectedMetalType) {
            dummyColor.setHex(METAL_METADATA[p.detectedMetalType].threeColor);
          } else if (p.detectedDepthM !== null) {
            dummyColor.setHex(0x22d3ee);
          } else {
            dummyColor.setHex(0x64748b);
          }
          pointInstances.setColorAt(i, dummyColor);
        }
        posAttr.needsUpdate = true;
        pathGeo.setDrawRange(0, count);
        pointInstances.count = count;
        pointInstances.instanceMatrix.needsUpdate = true;
        if (pointInstances.instanceColor) pointInstances.instanceColor.needsUpdate = true;
        pointInstances.computeBoundingSphere();
      }

      const showAquifers = currentProps.detectionMode !== 'logam';
      const showMinerals = currentProps.detectionMode !== 'air';

      aquiferMeshMap.forEach((entry, id) => {
        entry.group.visible = showAquifers;
        if (!showAquifers) return;

        const isSelected = id === currentProps.selectedTargetId;
        const mat = entry.pocketMesh.material as THREE.MeshPhysicalMaterial;
        mat.opacity = isSelected ? 0.92 : 0.6;
        mat.emissiveIntensity = isSelected ? 0.85 : 0.35;

        const ringScale = isSelected ? 1.25 + Math.sin(elapsed * 3.5) * 0.08 : 1.0;
        entry.pinRing.scale.set(ringScale, ringScale, 1);

        entry.flowPoints.visible = currentProps.showFlowVectors;
        if (currentProps.showFlowVectors) {
          const attr = entry.flowPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
          for (let i = 0; i < attr.count; i++) {
            let x = attr.getX(i) + dt * 1.4;
            if (x > entry.aquifer.centerXM + entry.aquifer.radiusXM * 0.78) {
              x = entry.aquifer.centerXM - entry.aquifer.radiusXM * 0.78;
            }
            attr.setX(i, x);
          }
          attr.needsUpdate = true;
        }
      });

      mineralMeshMap.forEach((entry, id) => {
        entry.group.visible = showMinerals;
        if (!showMinerals) return;

        const isSelected = id === currentProps.selectedTargetId;
        const mat = entry.oreMesh.material as THREE.MeshPhysicalMaterial;
        mat.emissiveIntensity = isSelected
          ? 1.1
          : entry.mineral.metalType === 'uranium'
          ? 0.7 + Math.sin(elapsed * 4) * 0.2
          : 0.35;

        const ringScale = isSelected ? 1.3 + Math.sin(elapsed * 3.8) * 0.1 : 1.0;
        entry.pinRing.scale.set(ringScale, ringScale, 1);
      });

      if (cameraPresetRef.current.active) {
        _vec3.copy(cameraPresetRef.current.pos);
        _targetVec.copy(cameraPresetRef.current.target);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _vec3.x, 6, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _vec3.y, 6, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _vec3.z, 6, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetVec.x, 6, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetVec.y, 6, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetVec.z, 6, dt);

        if (
          camera.position.distanceTo(_vec3) < 0.25 &&
          controls.target.distanceTo(_targetVec) < 0.25
        ) {
          cameraPresetRef.current.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      surfaceTex.dispose();
      surfaceMat.dispose();
      strataSideMat.map?.dispose();
      strataSideMat.dispose();
      strataBottomMat.dispose();
      blockGeo.dispose();
      cageEdges.dispose();
      pathGeo.dispose();
      pointMarkerGeo.dispose();
      pointMarkerMat.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[540px] bg-[#08101c] rounded-xl overflow-hidden border border-slate-800">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-slate-200 p-6 text-center">
          <div>
            <p className="font-semibold text-base mb-1">Konteks WebGL 3D Terputus</p>
            <p className="text-sm text-slate-400">
              Sistem sedang memulihkan akselerasi grafis perangkat keras Anda.
            </p>
          </div>
        </div>
      )}

      {/* Top-Left Minimal Legend */}
      <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-1.5 text-xs text-slate-200 bg-slate-950/85 border border-slate-800 rounded-lg px-3.5 py-2.5 max-w-[90%]">
        <div className="font-semibold text-slate-100">
          Tomografi 3D Bawah Bumi · {scenario.name}
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400">
          <span>Grid: 60m × 60m</span>
          <span aria-hidden="true">·</span>
          <span>Kedalaman: 0–40m</span>
          <span aria-hidden="true">·</span>
          <span>Klik objek bawah tanah untuk detail</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-1 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
            Air Tawar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" />
            Emas / Pirit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block" />
            Perak
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
            Nikel
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
            Bijih Besi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-lime-400 inline-block" />
            Uranium
          </span>
        </div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
        style={{ maxWidth: 'min(820px, 94%)' }}
      >
        <button
          type="button"
          onClick={() => setHudCollapsed((v) => !v)}
          className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900/95 border border-slate-700 text-[11px] font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {hudCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Tampilkan Kontrol 3D
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Sembunyikan Kontrol
            </>
          )}
        </button>

        {!hudCollapsed && (
          <div className="w-full bg-slate-950/92 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline whitespace-nowrap">
                Sudut Pandang:
              </span>
              {(
                [
                  ['iso', 'Isometrik'],
                  ['top', 'Tampak Atas'],
                  ['cross', 'Potongan'],
                  ['target', 'Fokus Target'],
                ] as Array<[CameraPreset, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyCameraPreset(key)}
                  className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-sky-600/30 border border-slate-700/80 hover:border-sky-500/60 text-[11px] font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 whitespace-nowrap">
                <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-[11px] text-slate-300">Irisan:</span>
                <input
                  type="range"
                  min={4}
                  max={40}
                  step={1}
                  value={depthSliceM}
                  onChange={(e) => onDepthSliceChange(Number(e.target.value))}
                  className="w-20 accent-sky-500 cursor-pointer"
                />
                <span className="font-mono tabular-nums text-[11px] text-sky-300 w-9">
                  {depthSliceM}m
                </span>
              </label>

              <label className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] text-slate-300">Opasitas Tanah:</span>
                <input
                  type="range"
                  min={0.05}
                  max={0.75}
                  step={0.05}
                  value={strataOpacity}
                  onChange={(e) => onStrataOpacityChange(Number(e.target.value))}
                  className="w-16 accent-sky-500 cursor-pointer"
                />
                <span className="font-mono tabular-nums text-[11px] text-slate-300 w-8">
                  {Math.round(strataOpacity * 100)}%
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  onDepthSliceChange(40);
                  onStrataOpacityChange(0.35);
                  applyCameraPreset('iso');
                }}
                title="Reset tampilan 3D"
                className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => captureFnRef.current?.()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Simpan PNG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
