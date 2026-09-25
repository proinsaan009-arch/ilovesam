/*
  PERSONALIZE YOUR SITE HERE
  Replace the sample copy, add image paths/URLs, and set relationshipStartDate
  as YYYY-MM-DD when you want the elapsed-days counter to appear.
*/
const CONFIG = {
  targetDate: '2027-09-19T00:00:00', // countdown target (local device time)
  relationshipStartDate: '', // OPTIONAL: e.g. '2026-03-14'
  playlistUrl: 'https://open.spotify.com/playlist/6IrQFSIJ7t4exFdcTumMnD', // Spotify playlist
  letter: `Well, it's been a long week... and something bad almost happened. I'm sorry; it's partially my fault too, but I'm glad we handled it. I just wanna tell you: whatever happens, we're both in it together. You and I are one, forever.\n\nI just wanna keep you safe from every danger that anyone or anything might pose on you... And I promise I will do that as best as I can. Trust me. I LOVE YOU SO SO SO MUCHHH, MWAAAh.\n\nI have never felt this way before. I hope we always stay in this honeymoon phase. If you ever have any questions, ask me before overthinking. I don't want us to break apart or for the trust to crack. I love you so much that it scares me that I might lose you.\n\nLet's work together to secure our future and grow together <3`,
  letterImage: '', // OPTIONAL image path or URL, e.g. 'images/my-letter.jpg'
  reasons: [
    ['The way you laugh', 'Even on days you dont want to...It makes me melt.'],
    ['Your Soul', 'You notice the little things, and make me feel special.'],
    ['Being completely you', 'There is nobody else in the world quite like you, and I love that.'],
    ['Our Freakiness', 'Lets stay like that forever.'],
    ['How you make me feel', 'Safe, understood, and very, very lucky.'],
    ['A million tiny things', 'The way you smile, The way you look at me, the way you gimme kisses, the way you take accountability.']
  ],
  memories: [
    { image: 'images/img1.PNG', caption: 'A favorite little moment' },
    { image: 'images/img2.jpg', caption: 'One for the memory book' },
    { image: 'images/img3.JPG', caption: 'A day I keep replaying' },
    { image: 'images/img4.JPG', caption: 'More moments, more us' }
  ],
  surprises: [
    { icon: '☕', title: 'A little treat', message: 'Redeem this for snaps.' },
    { icon: '☼', title: 'Your day', message: 'Pick what we do today. I’m all yours.' },
    { icon: '✉', title: 'Open when…', message: 'You need a reminder that someone loves you a whole lot.' }
  ],
  finalMessage: 'I love you, Sam. Thank you for being my favorite person and making my world a little softer, brighter, and more wonderful.I love the way you make me feel its just so awesome. I will always be yours forever and ever. ♡'
};

const $ = (selector) => document.querySelector(selector);
const reasonGrid = $('#reason-grid');
CONFIG.reasons.forEach(([title, message], index) => {
  const card = document.createElement('article');
  card.className = 'reason-card reveal';
  card.tabIndex = 0;
  card.innerHTML = `<span class="reason-number">0${index + 1} / A REASON</span><span class="reason-heart" aria-hidden="true">♡</span><span class="reason-sparks" aria-hidden="true"><i>♡</i><i>♥</i><i>♡</i><i>♥</i></span><h3></h3><p></p>`;
  card.querySelector('h3').textContent = title;
  card.querySelector('p').textContent = message;
  reasonGrid.append(card);
  card.addEventListener('click', () => {
    card.classList.toggle('flipped');
    card.classList.remove('clicked');
    void card.offsetWidth;
    card.classList.add('clicked');
    window.setTimeout(() => card.classList.remove('clicked'), 850);
  });
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); }
  });
});

const memoryGrid = $('#memory-grid');
CONFIG.memories.slice(0, 4).forEach((memory, index) => {
  const figure = document.createElement('figure');
  figure.className = 'memory-card reveal';
  const imageArea = document.createElement('div');
  imageArea.className = 'memory-image';
  imageArea.tabIndex = 0;
  imageArea.setAttribute('role', 'button');
  imageArea.setAttribute('aria-label', `${memory.caption || `Memory ${index + 1}`}. Tap to reveal a note.`);
  if (memory.image) {
    const img = document.createElement('img');
    img.src = memory.image;
    img.alt = memory.caption || `Memory ${index + 1}`;
    imageArea.append(img);
  } else {
    const mark = document.createElement('span');
    mark.className = 'placeholder-mark';
    mark.textContent = '♡';
    imageArea.append(mark);
  }
  const overlay = document.createElement('span');
  overlay.className = 'memory-overlay';
  const overlayText = document.createElement('span');
  overlayText.className = 'memory-overlay-text';
  overlayText.textContent = memory.revealText || 'A little moment I want to keep forever.';
  overlay.append(overlayText);
  overlay.setAttribute('aria-hidden', 'true');
  imageArea.append(overlay);
  const toggleCaption = () => imageArea.classList.toggle('show-caption');
  imageArea.addEventListener('click', toggleCaption);
  imageArea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCaption();
    }
  });
  const caption = document.createElement('figcaption');
  caption.textContent = memory.caption;
  figure.append(imageArea, caption);
  memoryGrid.append(figure);
});

$('#playlist-link').href = CONFIG.playlistUrl || '#songs-placeholder';
$('#playlist-link').addEventListener('click', (event) => {
  if (!CONFIG.playlistUrl) {
    event.preventDefault();
    alert('Add your playlist link in the CONFIG section of script.js.');
  }
});
const revealedLetter = $('#revealed-letter');
revealedLetter.textContent = CONFIG.letter;
if (CONFIG.letterImage) {
  const image = document.createElement('img');
  image.src = CONFIG.letterImage;
  image.alt = 'A letter for Sam';
  revealedLetter.append(document.createElement('br'), image);
}
$('#letter-open').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const reveal = $('#letter-reveal');
  const opening = !reveal.classList.contains('is-open');
  const updateButton = () => {
    reveal.setAttribute('aria-hidden', String(!opening));
    button.setAttribute('aria-expanded', String(opening));
    button.querySelector('.letter-button-icon').textContent = opening ? '♥' : '♡';
    button.querySelector('.letter-button-label').textContent = opening ? 'Hide my letter' : 'Read my letter';
  };
  if (opening) {
    reveal.style.display = 'block';
    reveal.style.height = '0px';
    reveal.classList.add('is-open');
    reveal.offsetHeight;
    requestAnimationFrame(() => { reveal.style.height = `${reveal.scrollHeight}px`; });
    reveal.addEventListener('transitionend', function finishOpen(event) {
      if (event.propertyName !== 'height') return;
      reveal.style.height = 'auto';
      reveal.removeEventListener('transitionend', finishOpen);
    });
  } else {
    reveal.style.height = `${reveal.scrollHeight}px`;
    reveal.offsetHeight;
    reveal.classList.remove('is-open');
    requestAnimationFrame(() => { reveal.style.height = '0px'; });
    reveal.addEventListener('transitionend', function finishClose(event) {
      if (event.propertyName !== 'height') return;
      reveal.style.display = 'none';
      reveal.style.height = '';
      reveal.removeEventListener('transitionend', finishClose);
    });
  }
  updateButton();
});

const surpriseGrid = $('#surprise-grid');
CONFIG.surprises.forEach((surprise) => {
  const card = document.createElement('article');
  card.className = 'surprise-card reveal';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', 'false');
  card.setAttribute('aria-label', `${surprise.title}. Tap to reveal your message.`);
  card.innerHTML = '<div class="surprise-inner"><div class="surprise-face surprise-front"><span class="surprise-icon"></span><h3></h3><span class="surprise-hint">tap to reveal <span>↻</span></span></div><div class="surprise-face surprise-back"><span class="back-heart">♡</span><p></p><span class="surprise-hint">tap to turn back <span>↻</span></span></div></div>';
  card.querySelector('.surprise-icon').textContent = surprise.icon;
  card.querySelector('.surprise-front h3').textContent = surprise.title;
  card.querySelector('.surprise-back p').textContent = surprise.message;
  const flip = () => {
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', String(flipped));
    card.setAttribute('aria-label', flipped ? `${surprise.title}. Message revealed: ${surprise.message}` : `${surprise.title}. Tap to reveal your message.`);
  };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      flip();
    }
  });
  surpriseGrid.append(card);
});
$('#final-button').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const message = $('#final-hidden');
  const opening = message.hidden;
  message.textContent = CONFIG.finalMessage;
  message.hidden = !opening;
  button.textContent = opening ? 'Hide my little secret ×' : 'Tap for a secret ♡';
  button.setAttribute('aria-expanded', String(opening));
});

const target = new Date(CONFIG.targetDate);
const countdown = () => {
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff % 86400000 / 3600000);
  const minutes = Math.floor(diff % 3600000 / 60000);
  const seconds = Math.floor(diff % 60000 / 1000);
  $('#days-left').textContent = days.toLocaleString();
  $('#hours').textContent = String(hours).padStart(2, '0');
  $('#minutes').textContent = String(minutes).padStart(2, '0');
  $('#seconds').textContent = String(seconds).padStart(2, '0');
};
countdown();
setInterval(countdown, 1000);
if (CONFIG.relationshipStartDate) {
  const start = new Date(`${CONFIG.relationshipStartDate}T00:00:00`);
  const elapsedDays = Math.max(0, Math.floor((new Date().setHours(0, 0, 0, 0) - start.getTime()) / 86400000));
  $('#elapsed').textContent = `${elapsedDays.toLocaleString()} days of us so far ♡`;
} else {
  $('#elapsed').textContent = '♡';
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((item, index) => {
  item.style.transitionDelay = `${(index % 4) * 70}ms`;
  observer.observe(item);
});
const menuButton = $('.menu-toggle');
menuButton.addEventListener('click', () => {
  const open = $('.nav').classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
document.querySelectorAll('.nav a').forEach((link) => link.addEventListener('click', () => {
  $('.nav').classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));
