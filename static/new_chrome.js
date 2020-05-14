const scrubber = document.querySelector('.bookreader [type=range]');
const buttons = document.querySelectorAll('.bookreader nav button');
const playButton = document.querySelector('.bookreader [name=play]');
const readAloudButton = document.querySelector('.bookreader [name="read-aloud"]');

scrubber.addEventListener('input', () => {
  scrubber.nextElementSibling.innerText = `${scrubber.value}/${scrubber.max}`;
});

document.querySelector('.bookreader .controls').addEventListener('click', (e) => {
  const parent = e.target.parentElement;
  if (!/button/i.test(parent.nodeName)) {
    return;
  }

  buttons.forEach((button) => {
    if (button === parent) { return; }
    button.classList.remove('active')
  });

  parent.classList.toggle('active');
});

playButton.addEventListener('click', () => {
  const icon = playButton.firstElementChild;
  icon.classList.toggle('icon-play');
  icon.classList.toggle('icon-pause');
});

readAloudButton.addEventListener('click', () => {
  document.querySelector('.read-aloud').classList.toggle('visible');
});
