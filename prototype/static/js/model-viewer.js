/* ============================================
   3D Model Viewer — МЭМ
   Three.js + OrbitControls + Raycasting
   Class-based, supports multiple instances
   ============================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ── Module data (interactive zones) ── */
const MODULES = [
  {
    id: 'generator', name: 'Генератор', icon: '⚡',
    description: `<p><strong>Дизельный/бензиновый генератор</strong> — сердце МЭМ. Обеспечивает выходную мощность до 15 кВт.</p>
<ul><li>Автоматический запуск при падении напряжения</li><li>Встроенная система охлаждения</li><li>Вибропоглощающая рама</li><li>Ресурс до 10 000 моточасов</li></ul>
<p>Поддерживает <strong>параллельное подключение</strong> нагрузок: сварка + освещение + насос одновременно.</p>`
  },
  {
    id: 'fire-cabinet', name: 'Пожарный ящик', icon: '🧯',
    description: `<p><strong>Пожарный шкаф</strong> со стеклянной крышкой содержит:</p>
<ul><li>Пожарный рукав длиной 20 м</li><li>Ствол пожарный комбинированный</li><li>Быстросъёмные соединения Storz</li></ul>
<p>Интегрирован с <strong>насосной станцией</strong> для мгновенного развёртывания системы пожаротушения.</p>`
  },
  {
    id: 'door', name: 'Дверь доступа', icon: '🚪',
    description: `<p><strong>Центральная дверь</strong> обеспечивает доступ к основному отсеку модуля.</p>
<ul><li>Утеплённая (сэндвич-панель 50 мм)</li><li>Врезной замок с ручкой-рычагом</li><li>Уплотнитель по периметру</li><li>Фиксатор в открытом положении</li></ul>
<p>Через дверь выполняется обслуживание <strong>всех внутренних систем</strong>.</p>`
  },
  {
    id: 'control-panel', name: 'Панель управления', icon: '🎛️',
    description: `<p><strong>Единая панель управления</strong> с влагозащищённой электрикой (IP54).</p>
<ul><li>Автоматы защиты на каждую линию</li><li>Вольтметр и амперметр</li><li>Розетки 220В / 380В</li><li>Разъёмы для сварочных кабелей</li><li>Аварийная кнопка «СТОП»</li></ul>
<p>Все элементы <strong>подписаны и промаркированы</strong> для безопасной работы.</p>`
  },
  {
    id: 'pump', name: 'Насосная станция', icon: '💧',
    description: `<p><strong>Центробежный насос</strong> с приводом от генератора.</p>
<ul><li>Производительность до 800 л/мин</li><li>Напор до 60 м водяного столба</li><li>Всасывающий и напорный патрубки DN80</li><li>Режимы: пожаротушение / водоснабжение / ирригация</li></ul>
<p>Запускается <strong>одной кнопкой</strong> с панели управления.</p>`
  },
  {
    id: 'fuel-tank', name: 'Топливный бак', icon: '⛽',
    description: `<p><strong>Встроенный топливный бак</strong> объёмом 200 литров.</p>
<ul><li>Дизель или бензин (зависит от комплектации)</li><li>Указатель уровня топлива на панели</li><li>Быстрозаправочная горловина</li><li>Автономность: до 48 часов непрерывной работы</li></ul>
<p>Бак установлен в <strong>защитном кожухе</strong> с поддоном для сбора утечек.</p>`
  },
  {
    id: 'battery', name: 'Аккумуляторный отсек', icon: '🔋',
    description: `<p><strong>Аккумуляторный блок</strong> для бесперебойного питания.</p>
<ul><li>2× АКБ 12В / 200 А·ч</li><li>Инвертор 12В → 220В (3 кВт)</li><li>Автоматическая подзарядка от генератора</li><li>Тихий режим: питание от АКБ без генератора</li></ul>
<p>Обеспечивает <strong>мгновенный пуск</strong> генератора и питание в тихом режиме.</p>`
  },
  {
    id: 'ventilation', name: 'Вентиляция', icon: '🌀',
    description: `<p><strong>Приточно-вытяжная вентиляция</strong> с рекуперацией тепла.</p>
<ul><li>Принудительный отвод выхлопных газов</li><li>Приток свежего воздуха для генератора</li><li>Фильтры грубой очистки</li><li>Защитные жалюзи от осадков</li></ul>
<p>Работает <strong>автоматически</strong> при запуске генератора.</p>`
  },
  {
    id: 'chassis', name: 'Шасси и рама', icon: '🛞',
    description: `<p><strong>Усиленная рама</strong> на 5-осном шасси.</p>
<ul><li>Габариты: 1.8 × 4.5 × 1.5 м</li><li>Вес пустой: 700 кг / полный: 3 000 кг</li><li>5 колёс с пневмошинами</li><li>Буксировочное устройство</li><li>Откидные стабилизаторы</li></ul>
<p>Транспортировка: <strong>буксировка любым автомобилем</strong> категории C.</p>`
  },
  {
    id: 'heater', name: 'Обогреватель', icon: '🌡️',
    description: `<p><strong>Встроенный обогреватель 700 Вт</strong> для работы в зимних условиях.</p>
<ul><li>Поддержание +5°C при −40°C снаружи</li><li>Термостат с автоматическим управлением</li><li>Защита оборудования от промерзания</li><li>Теплоизоляция: сэндвич-панели 50 мм</li></ul>
<p>Обеспечивает <strong>всесезонную эксплуатацию</strong> модуля.</p>`
  }
];

/* ── Color palette ── */
const C = {
  body: 0xE8E2DA, bodyDark: 0xC4BAB0, roof: 0xF0EDE8,
  red: 0xD72638, accent: 0xE93C35, door: 0xD5CFC7,
  panel: 0x3A4A5C, tire: 0x2A2A2A, hub: 0xEEEEEE,
  chrome: 0xCCCCCC, tank: 0x6B7B5A, battery: 0x3A5C3A,
  vent: 0x8E9EA8, fire: 0xC0392B, glass: 0x88AACC,
  highlight: 0xE93C35,
};

/* ── Geometry helpers ── */
function makeBox(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function makeCylinder(r, h, mat) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), mat); }
function makeTorus(r, tube, mat) { return new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 32), mat); }
function makeWheel() {
  const g = new THREE.Group();
  g.add((() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 24), new THREE.MeshStandardMaterial({ color: C.tire, roughness: 0.9 })); m.rotation.x = Math.PI / 2; return m; })());
  g.add((() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.065, 24), new THREE.MeshStandardMaterial({ color: C.hub, roughness: 0.3, metalness: 0.2 })); m.rotation.x = Math.PI / 2; return m; })());
  g.add((() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.4, metalness: 0.4 })); m.rotation.x = Math.PI / 2; return m; })());
  return g;
}

/* ══════════════════════════════════════
   MEMViewer class — supports instances
   ══════════════════════════════════════ */
class MEMViewer {
  constructor(container, opts) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) throw new Error('Container not found');

    this.opts = Object.assign({
      embedded: false,     // true = no ground, no fog, transparent bg
      shadows: true,
      infoPanel: null,     // selector or element for info panel
      onSelect: null,      // callback(moduleId)
      onDeselect: null,    // callback()
    }, opts);

    this.interactiveObjects = [];
    this.hoveredObject = null;
    this.selectedModule = null;
    this.typewriterTimer = null;
    this.animationId = null;
    this.mouse = new THREE.Vector2(-999, -999);
    this.raycaster = new THREE.Raycaster();

    this._setup();
  }

  _setup() {
    const { container, opts } = this;

    /* Scene */
    this.scene = new THREE.Scene();
    if (!opts.embedded) {
      this.scene.fog = new THREE.FogExp2(0x627C8C, 0.015);
    }

    /* Camera */
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(6, 4, 8);

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: opts.embedded,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (opts.embedded) {
      this.renderer.setClearColor(0x000000, 0);
    }
    if (opts.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    /* Controls */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minPolarAngle = Math.PI * 0.1;
    this.controls.target.set(0, 0.8, 0);
    if (opts.embedded) {
      this.controls.enablePan = false;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.8;
    }
    this.controls.update();

    /* Lights */
    this._setupLights();

    /* Ground (full page only) */
    if (!opts.embedded) {
      this._setupGround();
    }

    /* Build model */
    this._buildModel();

    /* Events */
    this._onMouseMove = (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this._onClick = () => {
      if (this.hoveredObject) {
        const id = this.hoveredObject.userData.moduleId;
        if (this.selectedModule === id) this.deselectModule();
        else this.selectModule(id);
      }
    };
    this._onResize = () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    };

    container.addEventListener('mousemove', this._onMouseMove);
    container.addEventListener('click', this._onClick);
    window.addEventListener('resize', this._onResize);

    /* Animate */
    this._animate();

    /* Hide loader */
    setTimeout(() => {
      const loader = document.querySelector('.model-loader');
      if (loader) loader.classList.add('model-loader--hidden');
    }, 800);
  }

  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0xB9C7D2, 0.6));
    const main = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    main.position.set(5, 8, 6);
    if (this.opts.shadows) {
      main.castShadow = true;
      main.shadow.mapSize.set(2048, 2048);
      main.shadow.camera.near = 0.5; main.shadow.camera.far = 30;
      main.shadow.camera.left = -8; main.shadow.camera.right = 8;
      main.shadow.camera.top = 8; main.shadow.camera.bottom = -8;
      main.shadow.bias = -0.001;
    }
    this.scene.add(main);
    const fill = new THREE.DirectionalLight(0x8CA9BD, 0.4);
    fill.position.set(-4, 3, -2);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xFFEEDD, 0.3);
    rim.position.set(-2, 5, -6);
    this.scene.add(rim);
  }

  _setupGround() {
    const geo = new THREE.CircleGeometry(15, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0x627C8C, roughness: 0.95, metalness: 0 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = true;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(20, 40, 0x4A6070, 0x4A6070);
    grid.material.opacity = 0.15; grid.material.transparent = true;
    this.scene.add(grid);
  }

  _createModule(moduleId, buildFn) {
    const group = buildFn();
    group.userData.moduleId = moduleId;
    group.traverse(child => {
      if (child.isMesh) {
        child.userData.moduleId = moduleId;
        child.castShadow = true; child.receiveShadow = true;
        child.userData.originalMaterial = child.material.clone();
        this.interactiveObjects.push(child);
      }
    });
    return group;
  }

  _buildModel() {
    const mem = new THREE.Group();
    const W = 2.25, D = 0.9, H = 0.75;

    const bodyMat = new THREE.MeshStandardMaterial({ color: C.body, roughness: 0.6, metalness: 0.1 });
    const bodyDarkMat = new THREE.MeshStandardMaterial({ color: C.bodyDark, roughness: 0.7, metalness: 0.05 });

    const frame = makeBox(W + 0.1, 0.06, D + 0.1, bodyDarkMat); frame.position.set(0, 0.03, 0); frame.castShadow = true; mem.add(frame);
    const body = makeBox(W, H, D, bodyMat); body.position.set(0, 0.06 + H / 2, 0); body.castShadow = true; body.receiveShadow = true; mem.add(body);
    const roofMat = new THREE.MeshStandardMaterial({ color: C.roof, roughness: 0.4, metalness: 0.15 });
    const roof = makeBox(W + 0.06, 0.05, D + 0.06, roofMat); roof.position.set(0, 0.06 + H + 0.025, 0); roof.castShadow = true; mem.add(roof);
    const stripe = makeBox(W + 0.005, 0.08, D + 0.01, new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.5, metalness: 0.1 }));
    stripe.position.set(0, 0.06 + H * 0.35, 0); mem.add(stripe);

    // Generator
    const gen = this._createModule('generator', () => {
      const g = new THREE.Group();
      g.add(makeBox(0.5, 0.35, 0.5, new THREE.MeshStandardMaterial({ color: 0x5A6A7A, roughness: 0.4, metalness: 0.3 })));
      const pipe = makeCylinder(0.03, 0.25, new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.3, metalness: 0.6 }));
      pipe.position.set(0.15, 0.25, 0); g.add(pipe);
      const grill = makeCylinder(0.12, 0.02, new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }));
      grill.rotation.z = Math.PI / 2; grill.position.set(-0.26, 0, 0); g.add(grill);
      return g;
    }); gen.position.set(-0.7, 0.06 + 0.175, 0); mem.add(gen);

    // Fire cabinet
    const fire = this._createModule('fire-cabinet', () => {
      const g = new THREE.Group();
      g.add(makeBox(0.3, 0.28, 0.06, new THREE.MeshStandardMaterial({ color: C.fire, roughness: 0.5 })));
      const glass = makeBox(0.25, 0.23, 0.01, new THREE.MeshStandardMaterial({ color: C.glass, roughness: 0.1, transparent: true, opacity: 0.4 }));
      glass.position.z = 0.035; g.add(glass);
      const hose = makeTorus(0.08, 0.015, new THREE.MeshStandardMaterial({ color: 0xF0EDE8, roughness: 0.7 }));
      hose.position.set(0, -0.02, 0.02); g.add(hose);
      return g;
    }); fire.position.set(0.5, 0.06 + H * 0.55, D / 2 + 0.035); mem.add(fire);

    // Door
    const door = this._createModule('door', () => {
      const g = new THREE.Group();
      g.add(makeBox(0.4, 0.5, 0.05, new THREE.MeshStandardMaterial({ color: C.door, roughness: 0.6 })));
      const handle = makeBox(0.08, 0.025, 0.03, new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.3, metalness: 0.7 }));
      handle.position.set(0.12, 0, 0.04); g.add(handle);
      const lock = makeCylinder(0.015, 0.03, new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 }));
      lock.rotation.x = Math.PI / 2; lock.position.set(0.12, -0.06, 0.04); g.add(lock);
      return g;
    }); door.position.set(0, 0.06 + H * 0.4, D / 2 + 0.03); mem.add(door);

    // Control panel
    const panel = this._createModule('control-panel', () => {
      const g = new THREE.Group();
      g.add(makeBox(0.5, 0.35, 0.05, new THREE.MeshStandardMaterial({ color: C.panel, roughness: 0.4, metalness: 0.2 })));
      for (let i = 0; i < 4; i++) {
        const btn = makeCylinder(0.015, 0.02, new THREE.MeshStandardMaterial({ color: i === 3 ? 0xCC0000 : [0x44AA44, 0x4488CC, 0xCCAA00][i] }));
        btn.rotation.x = Math.PI / 2; btn.position.set(-0.12 + i * 0.08, -0.08, 0.035); g.add(btn);
      }
      const display = makeBox(0.15, 0.08, 0.01, new THREE.MeshStandardMaterial({ color: 0x112233, emissive: 0x001122, emissiveIntensity: 0.5 }));
      display.position.set(0, 0.08, 0.03); g.add(display);
      return g;
    }); panel.position.set(-0.5, 0.06 + H * 0.55, D / 2 + 0.03); mem.add(panel);

    // Pump
    const pump = this._createModule('pump', () => {
      const g = new THREE.Group();
      const pb = makeCylinder(0.15, 0.35, new THREE.MeshStandardMaterial({ color: 0x4A7A9A, roughness: 0.4, metalness: 0.3 }));
      pb.rotation.z = Math.PI / 2; g.add(pb);
      const intake = makeCylinder(0.04, 0.2, new THREE.MeshStandardMaterial({ color: C.chrome, metalness: 0.5 }));
      intake.position.set(0, -0.1, 0.15); g.add(intake);
      const output = makeCylinder(0.04, 0.2, new THREE.MeshStandardMaterial({ color: C.chrome, metalness: 0.5 }));
      output.position.set(0, 0.1, -0.15); g.add(output);
      return g;
    }); pump.position.set(0.7, 0.06 + 0.175, 0); mem.add(pump);

    // Fuel tank
    const tank = this._createModule('fuel-tank', () => {
      const g = new THREE.Group();
      g.add(makeBox(0.6, 0.2, 0.35, new THREE.MeshStandardMaterial({ color: C.tank, roughness: 0.5 })));
      const cap = makeCylinder(0.035, 0.04, new THREE.MeshStandardMaterial({ color: C.chrome, metalness: 0.6 }));
      cap.position.set(0.2, 0.12, 0); g.add(cap);
      for (let i = -1; i <= 1; i += 2) { const s = makeBox(0.03, 0.22, 0.37, new THREE.MeshStandardMaterial({ color: 0x555555 })); s.position.set(i * 0.2, 0, 0); g.add(s); }
      return g;
    }); tank.position.set(-0.5, 0.16, -D / 2 - 0.22); mem.add(tank);

    // Battery
    const batt = this._createModule('battery', () => {
      const g = new THREE.Group();
      g.add(makeBox(0.35, 0.2, 0.25, new THREE.MeshStandardMaterial({ color: C.battery, roughness: 0.5 })));
      for (const i of [-0.06, 0.06]) { const t = makeCylinder(0.015, 0.04, new THREE.MeshStandardMaterial({ color: i < 0 ? 0xCC0000 : 0x333333, metalness: 0.6 })); t.position.set(i, 0.12, 0); g.add(t); }
      return g;
    }); batt.position.set(0.5, 0.16, -D / 2 - 0.18); mem.add(batt);

    // Ventilation
    const vent = this._createModule('ventilation', () => {
      const g = new THREE.Group();
      g.add(makeBox(0.3, 0.1, 0.25, new THREE.MeshStandardMaterial({ color: C.vent, roughness: 0.5, metalness: 0.2 })));
      for (let i = 0; i < 5; i++) { const s = makeBox(0.28, 0.008, 0.01, new THREE.MeshStandardMaterial({ color: 0x6A7A84 })); s.position.set(0, -0.03 + i * 0.018, 0.13); g.add(s); }
      return g;
    }); vent.position.set(0.6, 0.06 + H + 0.075, 0); mem.add(vent);

    // Chassis
    const chassis = this._createModule('chassis', () => {
      const g = new THREE.Group();
      [[-0.8, 0, 0.5], [-0.4, 0, 0.5], [0.5, 0, 0.5], [0.8, 0, 0.5], [1.1, 0, 0.5]].forEach(([x, y, z]) => {
        for (const side of [1, -1]) { const w = makeWheel(); w.position.set(x, y, z * side); w.rotation.x = side === 1 ? 0 : Math.PI; g.add(w); }
      });
      const towbar = makeBox(0.4, 0.04, 0.06, new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.3 })); towbar.position.set(-W / 2 - 0.25, 0.15, 0); g.add(towbar);
      const coupling = makeCylinder(0.04, 0.06, new THREE.MeshStandardMaterial({ color: C.chrome, metalness: 0.6 })); coupling.rotation.z = Math.PI / 2; coupling.position.set(-W / 2 - 0.45, 0.15, 0); g.add(coupling);
      return g;
    }); chassis.position.set(0, 0, 0); mem.add(chassis);

    // Heater
    const heater = this._createModule('heater', () => {
      const g = new THREE.Group();
      g.add(makeBox(0.2, 0.2, 0.15, new THREE.MeshStandardMaterial({ color: 0xAA5533, roughness: 0.5, metalness: 0.2 })));
      const hp = makeCylinder(0.025, 0.2, new THREE.MeshStandardMaterial({ color: C.chrome, metalness: 0.5 })); hp.position.set(0, 0.15, 0); g.add(hp);
      return g;
    }); heater.position.set(-0.2, 0.06 + H + 0.12, -D / 2 - 0.1); mem.add(heater);

    this.scene.add(mem);
  }

  /* ── Highlight ── */
  _highlightModule(moduleId) {
    this.interactiveObjects.forEach(obj => {
      if (obj.userData.moduleId === moduleId && !obj.userData.highlighted) {
        obj.userData.highlighted = true;
        obj.material = obj.userData.originalMaterial.clone();
        obj.material.emissive = new THREE.Color(C.highlight);
        obj.material.emissiveIntensity = 0.35;
      }
    });
  }
  _unhighlightModule(moduleId) {
    this.interactiveObjects.forEach(obj => {
      if (obj.userData.moduleId === moduleId && obj.userData.highlighted) {
        obj.userData.highlighted = false;
        obj.material = obj.userData.originalMaterial.clone();
      }
    });
  }

  /* ── Public API ── */
  selectModule(moduleId) {
    const mod = MODULES.find(m => m.id === moduleId);
    if (!mod) return;
    if (this.selectedModule && this.selectedModule !== moduleId) this._unhighlightModule(this.selectedModule);
    this.selectedModule = moduleId;
    this._highlightModule(moduleId);

    // Stop auto-rotate when module selected
    if (this.controls.autoRotate) this.controls.autoRotate = false;

    // Update buttons
    document.querySelectorAll(`[data-viewer="${this.container.id}"] .model-module-btn, .model-module-btn`).forEach(btn => {
      if (btn.closest('[data-viewer]')?.dataset.viewer === this.container.id || !btn.closest('[data-viewer]'))
        btn.classList.toggle('model-module-btn--active', btn.dataset.module === moduleId);
    });

    this._showInfo(mod);
    if (this.opts.onSelect) this.opts.onSelect(moduleId);
  }

  deselectModule() {
    if (this.selectedModule) this._unhighlightModule(this.selectedModule);
    this.selectedModule = null;

    // Resume auto-rotate in embedded mode
    if (this.opts.embedded) this.controls.autoRotate = true;

    document.querySelectorAll('.model-module-btn--active').forEach(btn => btn.classList.remove('model-module-btn--active'));
    this._hideInfo();
    if (this.opts.onDeselect) this.opts.onDeselect();
  }

  getModules() { return MODULES; }

  /* ── Info panel ── */
  _getInfoPanel() {
    if (!this.opts.infoPanel) return document.querySelector('.model-info');
    return typeof this.opts.infoPanel === 'string' ? document.querySelector(this.opts.infoPanel) : this.opts.infoPanel;
  }

  _showInfo(mod) {
    const panel = this._getInfoPanel();
    if (!panel) return;
    panel.querySelector('.model-info__icon').textContent = mod.icon;
    panel.querySelector('.model-info__title').textContent = mod.name;
    const body = panel.querySelector('.model-info__body');
    body.innerHTML = '';
    panel.classList.add('model-info--open');
    clearTimeout(this.typewriterTimer);
    this._typewriterHTML(body, mod.description, 8);
  }

  _hideInfo() {
    const panel = this._getInfoPanel();
    if (!panel) return;
    panel.classList.remove('model-info--open');
    clearTimeout(this.typewriterTimer);
  }

  _typewriterHTML(container, html, speed) {
    const tempDiv = document.createElement('div'); tempDiv.innerHTML = html;
    container.innerHTML = '';
    const cursor = document.createElement('span'); cursor.className = 'model-info__cursor'; container.appendChild(cursor);
    const nodes = []; this._flattenNodes(tempDiv, nodes);
    let nodeIdx = 0, charIdx = 0, elStack = [container], currentEl = container;
    const tick = () => {
      if (nodeIdx >= nodes.length) { cursor.classList.add('model-info__cursor--hidden'); return; }
      const node = nodes[nodeIdx];
      if (node.type === 'open') {
        const el = document.createElement(node.tag); if (node.attrs) for (const a of node.attrs) el.setAttribute(a.name, a.value);
        currentEl.insertBefore(el, cursor); elStack.push(el); currentEl = el; currentEl.appendChild(cursor); nodeIdx++;
      } else if (node.type === 'close') {
        elStack.pop(); currentEl = elStack[elStack.length - 1] || container; currentEl.appendChild(cursor); nodeIdx++;
      } else {
        if (charIdx < node.content.length) { currentEl.insertBefore(document.createTextNode(node.content[charIdx]), cursor); charIdx++; }
        else { charIdx = 0; nodeIdx++; }
      }
      this.typewriterTimer = setTimeout(tick, speed);
    };
    this.typewriterTimer = setTimeout(tick, 200);
  }

  _flattenNodes(parent, list) {
    parent.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) list.push({ type: 'text', content: node.textContent });
      else if (node.nodeType === Node.ELEMENT_NODE) {
        list.push({ type: 'open', tag: node.tagName.toLowerCase(), attrs: node.attributes });
        this._flattenNodes(node, list);
        list.push({ type: 'close' });
      }
    });
  }

  /* ── Animate ── */
  _animate() {
    this.animationId = requestAnimationFrame(() => this._animate());
    this.controls.update();

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, false);
    const newHovered = intersects.length > 0 ? intersects[0].object : null;
    const newId = newHovered?.userData.moduleId;
    const oldId = this.hoveredObject?.userData.moduleId;

    if (newId !== oldId) {
      if (oldId && oldId !== this.selectedModule) this._unhighlightModule(oldId);
      if (newId) { this._highlightModule(newId); this.renderer.domElement.style.cursor = 'pointer'; }
      else this.renderer.domElement.style.cursor = this.opts.embedded ? 'grab' : 'grab';
    }
    this.hoveredObject = newHovered;
    this.renderer.render(this.scene, this.camera);
  }

  /* ── Cleanup ── */
  destroy() {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose(); this.controls.dispose();
    clearTimeout(this.typewriterTimer);
    this.container.removeEventListener('mousemove', this._onMouseMove);
    this.container.removeEventListener('click', this._onClick);
    window.removeEventListener('resize', this._onResize);
  }
}

/* ── Factory export (backwards compatible) ── */
export function init(canvasContainer, opts = {}) {
  try {
    return new MEMViewer(canvasContainer, opts);
  } catch (e) {
    console.error('MEMViewer init failed:', e);
    return null;
  }
}
