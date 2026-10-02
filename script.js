// Locked visual settings; no experiment controls or saved overrides in production.
const MOSAIC = Object.freeze({
  extraDensity: 13,
  mobileExtraDensityScale: 0.5,
  size: 0.81,
  centerReach: 0.9,
  centerSize: 0.89,
  rotationPerThousand: 10,
  drift: 0.1,
  maxDrift: 360,
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const random = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = matchMedia('(max-width: 760px)');

// Avoid writing unchanged styles once the demo has docked or the rail has appeared.
function setStyle(element, property, value) {
  if (element.style[property] !== value) element.style[property] = value;
}

function setupDemo() {
  const journey = document.getElementById('journey');
  const launch = document.getElementById('launch-slot');
  const dock = document.getElementById('dock-slot');
  const flight = document.getElementById('demo-flight');
  const intro = document.getElementById('hero-copy');
  const rail = document.getElementById('feature-rail');
  const home = document.getElementById('rail-home');
  const video = flight.querySelector('video');
  let layout;

  function measure() {
    document.documentElement.classList.toggle('motion-reduced', reducedMotion.matches);
    const scroll = window.scrollY;
    const start = launch.getBoundingClientRect();
    const end = dock.getBoundingClientRect();
    layout = {
      origin: journey.getBoundingClientRect().top + scroll,
      start: mobileLayout.matches
        ? document.querySelector('.hero').getBoundingClientRect().bottom + scroll
        : start.top + scroll,
      end: end.top + scroll,
      small: mobileLayout.matches ? intro.getBoundingClientRect().width : start.width,
      large: end.width,
      railHeight: rail.getBoundingClientRect().height,
    };
  }

  function update(scroll) {
    if (!layout) return;
    const { origin, start, end, small, large, railHeight } = layout;
    const reduced = reducedMotion.matches;
    const grow = reduced ? 0 : ease(scroll / Math.max(160, start - 24));
    const reveal = reduced ? 1 : ease((scroll - (start - 24)) / 180);
    const offset = 24 + (railHeight + 16) * (reduced ? 0 : reveal);
    const top = reduced ? start : clamp(scroll + offset, start, end);

    if (mobileLayout.matches) {
      // The mobile demo occupies normal document flow in the purple section.
      setStyle(flight, 'width', '');
      setStyle(flight, 'top', '');
    } else {
      setStyle(flight, 'width', `${small + (large - small) * grow}px`);
      setStyle(flight, 'top', `${top - origin}px`);
    }
    const phase = mobileLayout.matches || reduced ? 'still' : top >= end - 1 ? 'landed' : top > start + 1 ? 'pinned' : 'growing';
    if (flight.dataset.phase !== phase) flight.dataset.phase = phase;
    setStyle(intro, 'opacity', String(mobileLayout.matches || reduced ? 1 : 1 - ease(scroll / Math.max(160, start * 0.85))));
    if (mobileLayout.matches) {
      // The mobile feature links remain visible below the video, in page flow.
      setStyle(rail, 'width', '');
      setStyle(rail, 'top', '');
      setStyle(rail, 'opacity', '1');
      setStyle(rail, 'pointerEvents', 'auto');
      rail.inert = false;
    } else {
      setStyle(rail, 'width', `${small}px`);
      setStyle(rail, 'top', `${24 - (railHeight + 40) * (1 - reveal)}px`);
      setStyle(rail, 'opacity', String(reveal));
      setStyle(rail, 'pointerEvents', reveal > 0.8 ? 'auto' : 'none');
      rail.inert = reveal <= 0.8;
    }
  }

  video.muted = true;
  video.play().catch(() => {}); // Native controls remain available when autoplay is restricted.
  return { measure, update, observed: [launch, home, rail] };
}

function setupMosaic() {
  const stage = document.querySelector('.feature-stage');
  const hero = document.querySelector('.hero');
  const atmosphere = document.querySelector('.feature-atmosphere');
  const scene = document.querySelector('.scene-mosaic');
  const svg = scene.querySelector('svg');
  const outer = svg.querySelector('g');
  const namespace = 'http://www.w3.org/2000/svg';
  const extra = document.createElementNS(namespace, 'g');
  extra.setAttribute('filter', 'url(#sharp-mosaic)');
  extra.setAttribute('opacity', '0.4');
  outer.setAttribute('opacity', '0.85');
  svg.append(extra);

  const templates = [...outer.querySelectorAll('path')].map((path) => {
    const bounds = path.getBBox();
    const shape = path.cloneNode(true);
    return { shape, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  });
  const extraColors = ['hsl(303.5 12.4% 46.9%)', 'hsl(303.8 12.3% 48.5%)', 'hsl(304.3 8.1% 49.7%)', 'hsl(28.0 44.0% 50.3%)'];
  let records = [];
  let layout;
  let previousHeight = 0;
  let previousMobileLayout;

  function addShape(parent, shape, geometry, seed) {
    const node = document.createElementNS(namespace, 'g');
    node.append(shape);
    parent.append(node);
    const record = {
      ...geometry,
      node,
      direction: random(seed + 101) > 0.5 ? 1 : -1,
      speed: 0.65 + random(seed + 205) * 0.7,
    };
    record.transform = `translate(${record.dx} ${record.dy}) translate(${record.x} ${record.y})`;
    record.tail = `scale(${record.scale}) translate(${-record.x} ${-record.y})`;
    node.setAttribute('transform', `${record.transform} ${record.tail}`);
    records.push(record);
  }

  // Geometry is regenerated only when the backdrop's dimensions change.
  // Match the viewBox's aspect ratio to avoid stretching polygons on tall pages.
  function render(height) {
    records = [];
    outer.replaceChildren();
    extra.replaceChildren();
    svg.setAttribute('viewBox', `0 0 1600 ${height}`);
    for (let tile = 0; tile < Math.ceil(height / 2400); tile++) {
      templates.forEach((template, index) => {
        addShape(outer, template.shape.cloneNode(true), {
          x: template.x,
          y: template.y,
          dx: tile ? (random(tile * 20 + index + 90) - 0.5) * 65 : 0,
          dy: tile * 2400,
          scale: MOSAIC.size,
        }, tile * 40 + index);
      });
    }

    const densityScale = mobileLayout.matches ? MOSAIC.mobileExtraDensityScale : 1;
    const count = Math.max(1, Math.round(MOSAIC.extraDensity * densityScale * height / 2400));
    for (let index = 0; index < count; index++) {
      const inward = (0.24 + random(index + 4) * 0.76) * MOSAIC.centerReach * 700;
      const x = index % 2 ? 1480 - inward : 120 + inward;
      const y = 160 + (index + 0.5) * (height - 300) / count + (random(index + 17) - 0.5) * 100;
      const central = Math.max(0, 1 - Math.abs(x - 800) / 550);
      const radius = (70 + random(index + 11) * 65) * MOSAIC.size * (1 - central * (1 - MOSAIC.centerSize));
      const vertices = index % 3 === 0 ? 4 : 3;
      const angle = random(index + 22) * Math.PI * 2;
      const points = Array.from({ length: vertices }, (_, vertex) => {
        const a = angle + vertex * Math.PI * 2 / vertices;
        const r = radius * (0.7 + random(index * 11 + vertex + 40) * 0.5);
        return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r * 1.2).toFixed(1)}`;
      }).join(' ');
      const polygon = document.createElementNS(namespace, 'polygon');
      polygon.setAttribute('points', points);
      polygon.setAttribute('fill', extraColors[index % extraColors.length]);
      addShape(extra, polygon, { x, y, dx: 0, dy: 0, scale: 1 }, 2000 + index);
    }
  }

  function measure() {
    stage.style.setProperty('--mosaic-start', `${hero.getBoundingClientRect().height}px`);
    const area = atmosphere.getBoundingClientRect();
    const bounds = scene.getBoundingClientRect();
    layout = {
      start: area.top + window.scrollY - innerHeight,
      planeTop: area.top + window.scrollY,
      scale: bounds.width / 1600,
      end: area.bottom + window.scrollY,
    };
    const height = 1600 * bounds.height / Math.max(1, bounds.width);
    if (Math.abs(height - previousHeight) > 0.5 || previousMobileLayout !== mobileLayout.matches) {
      previousHeight = height;
      previousMobileLayout = mobileLayout.matches;
      render(height);
    }
  }

  function update(scroll) {
    if (!layout) return;
    const travel = Math.max(0, scroll - layout.start);
    const reduced = reducedMotion.matches;
    const distance = reduced ? 0 : Math.min(MOSAIC.maxDrift, travel * MOSAIC.drift);
    setStyle(scene, 'transform', `translateY(${-distance}px)`);
    // No polygon rotation writes while the entire decorative plane is offscreen.
    if (scroll > layout.end || scroll + innerHeight < layout.start) return;
    const degrees = reduced ? 0 : travel / 1000 * MOSAIC.rotationPerThousand;
    const visibleTop = (scroll - layout.planeTop + distance) / layout.scale;
    const visibleBottom = visibleTop + innerHeight / layout.scale;
    records.forEach((record) => {
      const center = record.y + record.dy;
      if (!reduced && (center < visibleTop - 700 || center > visibleBottom + 700)) return;
      const angle = (degrees * record.direction * record.speed).toFixed(3);
      record.node.setAttribute('transform', `${record.transform} rotate(${angle}) ${record.tail}`);
    });
  }

  return { measure, update, observed: [stage, hero] };
}

// One animation frame batches both effects. Scroll updates use cached measurements.
document.documentElement.classList.add('motion-ready');
const demo = setupDemo();
const mosaic = setupMosaic();
let scheduled = false;
let needsMeasure = true;

function update() {
  scheduled = false;
  if (needsMeasure) {
    needsMeasure = false;
    demo.measure();
    mosaic.measure();
  }
  const scroll = window.scrollY;
  demo.update(scroll);
  mosaic.update(scroll);
}

function requestUpdate() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(update);
  }
}

function requestMeasure() {
  needsMeasure = true;
  requestUpdate();
}

addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', requestMeasure);
addEventListener('pageshow', requestMeasure);
reducedMotion.addEventListener('change', requestMeasure);
mobileLayout.addEventListener('change', requestMeasure);
const observer = new ResizeObserver(requestMeasure);
[...demo.observed, ...mosaic.observed].forEach((element) => observer.observe(element));
update();
