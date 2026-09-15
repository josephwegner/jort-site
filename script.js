const menuButton = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-nav]');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navigation.classList.toggle('is-open', !isOpen);
});

navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  }
});

document.querySelectorAll('[data-placeholder-link]').forEach((link) => {
  link.addEventListener('click', (event) => event.preventDefault());
});

const demoTrigger = document.querySelector('[data-demo-trigger]');
const demoPreview = document.querySelector('[data-demo-preview]');
const demoVideo = document.querySelector('#jort-demo');
const demoReplay = document.querySelector('[data-demo-replay]');

const playDemo = () => {
  if (!demoPreview || !demoVideo || !demoReplay) return;

  demoPreview.classList.add('is-playing');
  demoReplay.hidden = true;
  demoVideo.currentTime = 0;
  demoVideo.play().catch(() => {
    demoPreview.classList.remove('is-playing');
  });
};

demoTrigger?.addEventListener('click', playDemo);
demoReplay?.addEventListener('click', playDemo);
demoVideo?.addEventListener('ended', () => {
  if (demoReplay) demoReplay.hidden = false;
});
