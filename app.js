const INPUT_COUNT = 10;
const RANDOM_MIN = 1;
const RANDOM_MAX = 99;
const ANIMATION_BASE_DELAY = 260;
const SPEED_OPTIONS = {
  fast: 0.6,
  normal: 1,
  slow: 1.6,
};

const inputsContainer = document.getElementById('inputsContainer');
const numberDisplay = document.getElementById('numberDisplay');
const statusMessage = document.getElementById('statusMessage');
const sortButton = document.getElementById('sortButton');
const resetButton = document.getElementById('resetButton');
const randomButton = document.getElementById('randomButton');
const speedSelect = document.getElementById('speedSelect');

const state = {
  numbers: Array.from({ length: INPUT_COUNT }, () => randomInt()),
  cards: [],
  animationRunning: false,
  pivotIndex: null,
  pointerIndex: null,
  speedKey: 'normal',
  speedMultiplier: SPEED_OPTIONS.normal,
};

init();

function init() {
  createInputs();
  renderNumbers(state.numbers);
  attachEvents();
  if (speedSelect) {
    speedSelect.value = state.speedKey;
  }
  updateStatus('Ingresa los 10 números para comenzar.');
}

function attachEvents() {
  sortButton.addEventListener('click', handleSortClick);
  resetButton.addEventListener('click', () => {
    if (state.animationRunning) return;
    const initialValues = Array.from({ length: INPUT_COUNT }, () => 0);
    updateInputs(initialValues);
    renderNumbers(initialValues);
    updateStatus('Se reiniciaron los campos. Introduce nuevos valores.');
  });

  randomButton.addEventListener('click', () => {
    if (state.animationRunning) return;
    const randomValues = Array.from({ length: INPUT_COUNT }, () => randomInt());
    updateInputs(randomValues);
    renderNumbers(randomValues);
    updateStatus('Se generó una lista de números aleatorios.');
  });

  if (speedSelect) {
    speedSelect.addEventListener('change', (event) => {
      const { value } = event.target;
      if (!Object.prototype.hasOwnProperty.call(SPEED_OPTIONS, value)) {
        return;
      }
      state.speedKey = value;
      state.speedMultiplier = SPEED_OPTIONS[value];
    });
  }
}

function createInputs() {
  inputsContainer.innerHTML = '';
  for (let i = 0; i < INPUT_COUNT; i++) {
    const wrapper = document.createElement('label');
    wrapper.className = 'input-wrapper';
    wrapper.dataset.index = i;

    const title = document.createElement('span');
    title.textContent = `Posición ${i + 1}`;

    const input = document.createElement('input');
    input.type = 'number';
    input.step = '1';
    input.value = state.numbers[i];
    input.addEventListener('input', (event) => handleInputChange(i, event));

    wrapper.appendChild(title);
    wrapper.appendChild(input);
    inputsContainer.appendChild(wrapper);
  }
}

function handleInputChange(index, event) {
  if (state.animationRunning) {
    event.target.value = state.numbers[index];
    return;
  }

  const value = event.target.value;
  const numericValue = Number(value);
  if (value === '' || Number.isNaN(numericValue)) {
    inputsContainer.children[index].classList.add('invalid');
    return;
  }

  inputsContainer.children[index].classList.remove('invalid');
  state.numbers[index] = numericValue;
  renderNumbers(state.numbers, index);
  updateStatus(`Actualizada la posición ${index + 1} con el valor ${numericValue}.`);
}

function updateInputs(values) {
  const wrappers = Array.from(inputsContainer.children);
  wrappers.forEach((wrapper, idx) => {
    const input = wrapper.querySelector('input');
    input.value = values[idx];
    wrapper.classList.remove('invalid');
  });
  state.numbers = values.slice();
}

function renderNumbers(values, highlightIndex = null) {
  state.numbers = values.slice();
  clearHighlights();
  numberDisplay.innerHTML = '';
  state.cards = values.map((value, idx) => {
    const card = document.createElement('div');
    card.className = 'number-card';
    card.dataset.index = idx + 1;
    card.textContent = value;
    numberDisplay.appendChild(card);
    return card;
  });

  if (highlightIndex !== null && state.cards[highlightIndex]) {
    state.cards[highlightIndex].classList.add('updated');
    setTimeout(() => state.cards[highlightIndex].classList.remove('updated'), getDelay(1.2));
  }
}

function randomInt() {
  return Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN;
}

function collectNumbers() {
  const values = [];
  let valid = true;
  const wrappers = Array.from(inputsContainer.children);
  wrappers.forEach((wrapper, idx) => {
    const input = wrapper.querySelector('input');
    const value = input.value.trim();
    const numericValue = Number(value);
    if (value === '' || Number.isNaN(numericValue)) {
      wrapper.classList.add('invalid');
      valid = false;
    } else {
      wrapper.classList.remove('invalid');
      values[idx] = numericValue;
    }
  });
  return valid ? values : null;
}

async function handleSortClick() {
  if (state.animationRunning) {
    return;
  }
  const numbers = collectNumbers();
  if (!numbers) {
    updateStatus('Completa todos los campos con números válidos antes de ordenar.');
    return;
  }
  state.animationRunning = true;
  toggleControls(true);
  renderNumbers(numbers);
  await animateQuickSort(numbers);
  toggleControls(false);
  state.animationRunning = false;
}

function toggleControls(disabled) {
  sortButton.disabled = disabled;
  resetButton.disabled = disabled;
  randomButton.disabled = disabled;
  const inputs = inputsContainer.querySelectorAll('input');
  inputs.forEach((input) => {
    input.disabled = disabled;
  });
}

function clearHighlights() {
  state.pivotIndex = null;
  state.pointerIndex = null;
}

function setPivot(index) {
  if (state.pivotIndex !== null && state.cards[state.pivotIndex]) {
    state.cards[state.pivotIndex].classList.remove('pivot');
  }
  state.pivotIndex = index;
  if (index !== null && state.cards[index]) {
    state.cards[index].classList.add('pivot');
  }
}

function setPointer(index) {
  state.cards.forEach((card) => card.classList.remove('left-pointer'));
  state.pointerIndex = index;
  if (index !== null && state.cards[index]) {
    state.cards[index].classList.add('left-pointer');
  }
}

function highlightRange(left, right) {
  state.cards.forEach((card, idx) => {
    if (idx >= left && idx <= right) {
      card.classList.add('focus-range');
    } else {
      card.classList.remove('focus-range');
    }
  });
}

function clearRangeHighlight() {
  state.cards.forEach((card) => card.classList.remove('focus-range'));
}

function markSorted(index) {
  if (state.cards[index]) {
    state.cards[index].classList.add('sorted');
    state.cards[index].classList.remove('pivot', 'left-pointer');
  }
}

function capturePositions() {
  return state.cards.map((card) => ({ card, rect: card.getBoundingClientRect() }));
}

function animateFromPositions(beforePositions) {
  beforePositions.forEach(({ card, rect }) => {
    const after = card.getBoundingClientRect();
    const deltaX = rect.left - after.left;
    const deltaY = rect.top - after.top;
    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      card.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration: getDelay(),
          easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        }
      );
    }
  });
}

function swapState(i, j) {
  const before = capturePositions();
  const tempValue = state.numbers[i];
  state.numbers[i] = state.numbers[j];
  state.numbers[j] = tempValue;

  const tempCard = state.cards[i];
  state.cards[i] = state.cards[j];
  state.cards[j] = tempCard;

  state.cards[i].textContent = state.numbers[i];
  state.cards[j].textContent = state.numbers[j];

  state.cards.forEach((card, index) => {
    card.dataset.index = index + 1;
    numberDisplay.appendChild(card);
  });
  animateFromPositions(before);
}

function updateStatus(message) {
  statusMessage.textContent = message;
}

function buildQuickSortSteps(values) {
  const arr = values.slice();
  const steps = [];

  function quickSort(left, right) {
    if (left >= right) {
      if (left === right) {
        steps.push({ type: 'range', left, right });
        steps.push({ type: 'single', index: left });
        steps.push({ type: 'range-clear', left, right });
      }
      return;
    }
    steps.push({ type: 'range', left, right });
    const pivotIndex = partition(left, right);
    steps.push({ type: 'range-clear', left, right });
    quickSort(left, pivotIndex - 1);
    quickSort(pivotIndex + 1, right);
  }

  function partition(left, right) {
    const pivotValue = arr[right];
    steps.push({ type: 'pivot', index: right, pivotValue, left, right });
    let i = left;
    steps.push({ type: 'pointer', index: i });

    for (let j = left; j < right; j++) {
      const currentValue = arr[j];
      const isLessOrEqual = currentValue <= pivotValue;
      steps.push({
        type: 'compare',
        index: j,
        pivot: right,
        i,
        value: currentValue,
        pivotValue,
        result: isLessOrEqual,
      });
      if (isLessOrEqual) {
        steps.push({
          type: 'swap-or-accept',
          from: j,
          to: i,
          value: currentValue,
        });
        if (i !== j) {
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
        }
        i++;
        steps.push({ type: 'pointer', index: i });
      } else {
        steps.push({
          type: 'greater',
          index: j,
          value: currentValue,
        });
      }
    }
    steps.push({ type: 'pivot-swap', from: right, to: i, pivotValue });
    const temp = arr[i];
    arr[i] = arr[right];
    arr[right] = temp;
    steps.push({ type: 'pivot-placed', index: i, pivotValue });
    return i;
  }

  quickSort(0, arr.length - 1);
  steps.push({ type: 'sorted-all' });
  return steps;
}

async function animateQuickSort(values) {
  const steps = buildQuickSortSteps(values);
  let stepNumber = 1;

  for (const step of steps) {
    switch (step.type) {
      case 'range':
        highlightRange(step.left, step.right);
        updateStatus(`Paso ${stepNumber}: Trabajando en el segmento entre las posiciones ${step.left + 1} y ${step.right + 1}.`);
        await pause(0.8);
        break;
      case 'range-clear':
        clearRangeHighlight();
        if (typeof step.left === 'number' && typeof step.right === 'number') {
          updateStatus(
            `Paso ${stepNumber}: Finaliza el análisis del segmento ${step.left + 1} - ${step.right + 1}.`
          );
        }
        await pause(0.4);
        break;
      case 'pivot':
        setPivot(step.index);
        highlightRange(step.left, step.right);
        updateStatus(`Paso ${stepNumber}: Se elige el pivote ${step.pivotValue} en la posición ${step.index + 1}.`);
        await pause(0.9);
        break;
      case 'pointer': {
        const pointerIndex = step.index < state.cards.length ? step.index : null;
        setPointer(pointerIndex);
        updateStatus(
          pointerIndex === null
            ? `Paso ${stepNumber}: El puntero i queda fuera del rango preparado para colocar el pivote.`
            : `Paso ${stepNumber}: El puntero i delimita ahora la posición ${pointerIndex + 1}.`
        );
        await pause(0.35);
        break;
      }
      case 'compare': {
        setPointer(step.i < state.cards.length ? step.i : null);
        setPivot(step.pivot);
        const card = state.cards[step.index];
        if (!card) break;
        card.classList.add('comparing');
        updateStatus(
          `Paso ${stepNumber}: Comparando ${step.value} con el pivote ${step.pivotValue}. ${step.result ? 'Es menor o igual, se mueve a la izquierda.' : 'Permanece a la derecha.'}`
        );
        await pause(1);
        card.classList.remove('comparing');
        break;
      }
      case 'swap-or-accept': {
        const { from, to } = step;
        const fromCard = state.cards[from];
        const toCard = state.cards[to];
        if (!fromCard || !toCard) break;
        if (from === to) {
          fromCard.classList.add('accepted');
          updateStatus(`Paso ${stepNumber}: ${step.value} ya está del lado correcto, solo se avanza el límite.`);
          await pause(0.8);
          fromCard.classList.remove('accepted');
        } else {
          fromCard.classList.add('swapping');
          toCard.classList.add('swapping');
          updateStatus(`Paso ${stepNumber}: Intercambiamos ${state.numbers[from]} con ${state.numbers[to]} para llevarlo al sub-arreglo izquierdo.`);
          await pause(0.45);
          swapState(from, to);
          await pause(0.9);
          fromCard.classList.remove('swapping');
          toCard.classList.remove('swapping');
        }
        break;
      }
      case 'greater': {
        const card = state.cards[step.index];
        if (!card) break;
        card.classList.add('rejected');
        updateStatus(`Paso ${stepNumber}: ${step.value} es mayor que el pivote, queda temporalmente a la derecha.`);
        await pause(0.7);
        card.classList.remove('rejected');
        break;
      }
      case 'pivot-swap': {
        const { from, to, pivotValue } = step;
        const pivotCard = state.cards[from];
        const targetCard = state.cards[to];
        if (!pivotCard || !targetCard) break;
        pivotCard.classList.add('swapping');
        targetCard.classList.add('swapping');
        updateStatus(`Paso ${stepNumber}: Colocamos el pivote ${pivotValue} en su lugar definitivo.`);
        await pause(0.45);
        swapState(from, to);
        setPivot(to);
        await pause(0.9);
        pivotCard.classList.remove('swapping');
        targetCard.classList.remove('swapping');
        break;
      }
      case 'pivot-placed':
        setPivot(step.index);
        markSorted(step.index);
        updateStatus(`Paso ${stepNumber}: El pivote ${step.pivotValue} queda fijo en la posición ${step.index + 1}.`);
        await pause(0.7);
        break;
      case 'single':
        markSorted(step.index);
        updateStatus(`Paso ${stepNumber}: La posición ${step.index + 1} ya estaba ordenada.`);
        await pause(0.7);
        break;
      case 'sorted-all':
        clearRangeHighlight();
        setPointer(null);
        setPivot(null);
        updateStatus('Finalizado: todos los elementos se han ordenado con QuickSort.');
        await pause(1);
        break;
      default:
        break;
    }
    stepNumber++;
  }
}

function getDelay(multiplier = 1) {
  const baseMultiplier = state.speedMultiplier || SPEED_OPTIONS.normal;
  const duration = ANIMATION_BASE_DELAY * baseMultiplier * multiplier;
  return Math.max(140, duration);
}

function pause(multiplier = 1) {
  return wait(getDelay(multiplier));
}

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
