const DEFAULT_INPUT_COUNT = 10;
const MIN_INPUT_COUNT = 1;
const MAX_INPUT_COUNT = 30;
const RANDOM_MIN = 1;
const RANDOM_MAX = 99;
const ANIMATION_BASE_DELAY = 550;

const inputsContainer = document.getElementById('inputsContainer');
const numberDisplay = document.getElementById('numberDisplay');
const statusMessage = document.getElementById('statusMessage');
const sortButton = document.getElementById('sortButton');
const resetButton = document.getElementById('resetButton');
const randomButton = document.getElementById('randomButton');
const pauseButton = document.getElementById('pauseButton');
const previousButton = document.getElementById('previousButton');
const nextButton = document.getElementById('nextButton');
const speedControl = document.getElementById('speedControl');
const speedValue = document.getElementById('speedValue');
const comparisonCount = document.getElementById('comparisonCount');
const swapCount = document.getElementById('swapCount');
const recursiveCallCount = document.getElementById('recursiveCallCount');
const maxDepthCount = document.getElementById('maxDepthCount');
const numberCountInput = document.getElementById('numberCount');
const applyCountButton = document.getElementById('applyCountButton');
const recursionTreeContainer = document.getElementById('recursionTree');

const state = {
  inputCount: DEFAULT_INPUT_COUNT,
  numbers: Array.from({ length: DEFAULT_INPUT_COUNT }, () => randomInt()),
  cards: [],
  animationRunning: false,
  animationPaused: false,
  animationSpeed: Number(speedControl.value),
  activeWait: null,
  runningAnimations: new Set(),
  statusBeforePause: '',
  initialNumbers: [],
  steps: [],
  stepFrames: [],
  currentStepIndex: -1,
  runId: 0,
  manualNavigation: false,
  recursionTree: null,
  recursionNodeElements: new Map(),
  pivotIndex: null,
  pointerIndex: null,
};

init();

function init() {
  createInputs();
  renderNumbers(state.numbers);
  attachEvents();
  resetStatistics();
  clearRecursionTree();
  updateStatus('Ingresa los números para comenzar.');
}

function attachEvents() {
  sortButton.addEventListener('click', handleSortClick);
  pauseButton.addEventListener('click', handlePauseClick);
  previousButton.addEventListener('click', () => navigateStep(-1));
  nextButton.addEventListener('click', () => navigateStep(1));
  applyCountButton.addEventListener('click', applyInputCount);
  numberCountInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') applyInputCount();
  });
  numberCountInput.addEventListener('input', () => {
    numberCountInput.setCustomValidity('');
  });
  speedControl.addEventListener('input', () => {
    state.animationSpeed = Number(speedControl.value);
    speedValue.value = `${state.animationSpeed}x`;
  });

  resetButton.addEventListener('click', () => {
    if (state.animationRunning) return;
    const initialValues = Array.from({ length: state.inputCount }, () => 0);
    updateInputs(initialValues);
    renderNumbers(initialValues);
    resetStatistics();
    clearRecursionTree();
    updateStatus('Se reiniciaron los campos. Introduce nuevos valores.');
  });

  randomButton.addEventListener('click', () => {
    if (state.animationRunning) return;
    const randomValues = Array.from({ length: state.inputCount }, () => randomInt());
    updateInputs(randomValues);
    renderNumbers(randomValues);
    resetStatistics();
    clearRecursionTree();
    updateStatus('Se generó una lista de números aleatorios.');
  });
}

function applyInputCount() {
  if (state.animationRunning) return;

  const requestedCount = Number(numberCountInput.value);
  const countIsValid =
    Number.isInteger(requestedCount) &&
    requestedCount >= MIN_INPUT_COUNT &&
    requestedCount <= MAX_INPUT_COUNT;

  if (!countIsValid) {
    numberCountInput.setCustomValidity(
      `Ingresa una cantidad entera entre ${MIN_INPUT_COUNT} y ${MAX_INPUT_COUNT}.`
    );
    numberCountInput.reportValidity();
    updateStatus(`La cantidad debe estar entre ${MIN_INPUT_COUNT} y ${MAX_INPUT_COUNT}.`);
    return;
  }

  numberCountInput.setCustomValidity('');
  const currentValues = collectNumbers() || state.numbers;
  const nextValues = Array.from({ length: requestedCount }, (_, index) =>
    index < currentValues.length ? currentValues[index] : randomInt()
  );

  state.inputCount = requestedCount;
  state.numbers = nextValues;
  state.initialNumbers = [];
  state.steps = [];
  state.stepFrames = [];
  state.currentStepIndex = -1;

  createInputs();
  renderNumbers(nextValues);
  resetStatistics();
  clearRecursionTree();
  updateStepControls();
  updateStatus(`La lista ahora contiene ${requestedCount} ${requestedCount === 1 ? 'número' : 'números'}.`);
}

function createInputs() {
  inputsContainer.innerHTML = '';
  for (let i = 0; i < state.inputCount; i++) {
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

  resetStatistics();
  clearRecursionTree();

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
    setTimeout(() => state.cards[highlightIndex].classList.remove('updated'), 700);
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

function handleSortClick() {
  if (state.animationRunning) {
    return;
  }
  const numbers = collectNumbers();
  if (!numbers) {
    updateStatus('Completa todos los campos con números válidos antes de ordenar.');
    return;
  }
  state.animationRunning = true;
  state.animationPaused = false;
  state.manualNavigation = false;
  state.initialNumbers = numbers.slice();
  const execution = buildQuickSortExecution(numbers);
  state.steps = execution.steps;
  state.recursionTree = execution.recursionTree;
  state.stepFrames = buildQuickSortFrames(numbers, state.steps);
  state.currentStepIndex = -1;
  resetPauseControl();
  toggleControls(true);
  updateStepControls();
  renderNumbers(numbers);
  renderRecursionTree(state.recursionTree);
  updateRecursionTree(-1);
  void startAutomaticAnimation(0);
}

async function startAutomaticAnimation(startIndex) {
  try {
    const completed = await animateQuickSort(startIndex);
    if (completed) finishAnimationSession();
  } catch (error) {
    console.error(error);
    finishAnimationSession();
    updateStatus('No se pudo completar la animación. Revisa la consola para obtener más detalles.');
  }
}

function handlePauseClick() {
  if (!state.animationRunning) return;

  state.animationPaused = !state.animationPaused;
  numberDisplay.classList.toggle('paused', state.animationPaused);
  pauseButton.classList.toggle('is-paused', state.animationPaused);
  pauseButton.setAttribute('aria-pressed', String(state.animationPaused));

  if (state.animationPaused) {
    state.statusBeforePause = statusMessage.textContent;
    state.activeWait?.pause();
    state.runningAnimations.forEach((animation) => animation.pause());
    pauseButton.textContent = 'Reanudar';
    statusMessage.textContent = 'Animación pausada. Presiona “Reanudar” para continuar.';
  } else {
    pauseButton.textContent = 'Pausar';
    if (state.manualNavigation) {
      state.manualNavigation = false;
      void startAutomaticAnimation(state.currentStepIndex + 1);
    } else {
      state.runningAnimations.forEach((animation) => animation.play());
      state.activeWait?.resume();
      statusMessage.textContent = state.statusBeforePause;
    }
  }

  updateStepControls();
}

function navigateStep(offset) {
  if (!state.animationRunning || !state.animationPaused) return;

  const targetIndex = Math.min(
    state.steps.length - 1,
    Math.max(-1, state.currentStepIndex + offset)
  );
  if (targetIndex === state.currentStepIndex) return;

  if (!state.manualNavigation) {
    state.manualNavigation = true;
    state.runId++;
    state.activeWait?.cancel();
    cancelRunningAnimations();
  }

  state.currentStepIndex = targetIndex;
  renderStepFrame(targetIndex);
  updateStepControls();
}

function cancelRunningAnimations() {
  [...state.runningAnimations].forEach((animation) => animation.cancel());
  state.runningAnimations.clear();
}

function finishAnimationSession() {
  state.animationRunning = false;
  state.animationPaused = false;
  state.manualNavigation = false;
  state.activeWait = null;
  cancelRunningAnimations();
  numberDisplay.classList.remove('paused');
  resetPauseControl();
  toggleControls(false);
  updateStepControls();
}

function resetPauseControl() {
  pauseButton.textContent = 'Pausar';
  pauseButton.classList.remove('is-paused');
  pauseButton.setAttribute('aria-pressed', 'false');
}

function toggleControls(disabled) {
  sortButton.disabled = disabled;
  resetButton.disabled = disabled;
  randomButton.disabled = disabled;
  pauseButton.disabled = !disabled;
  numberCountInput.disabled = disabled;
  applyCountButton.disabled = disabled;
  const inputs = inputsContainer.querySelectorAll('input');
  inputs.forEach((input) => {
    input.disabled = disabled;
  });
}

function updateStepControls() {
  const navigationEnabled = state.animationRunning && state.animationPaused;
  previousButton.disabled = !navigationEnabled || state.currentStepIndex <= -1;
  nextButton.disabled =
    !navigationEnabled || state.currentStepIndex >= state.steps.length - 1;
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
      const animation = card.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration: getAnimationDuration(),
          easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        }
      );
      state.runningAnimations.add(animation);
      if (state.animationPaused) animation.pause();

      const removeAnimation = () => state.runningAnimations.delete(animation);
      animation.addEventListener('finish', removeAnimation, { once: true });
      animation.addEventListener('cancel', removeAnimation, { once: true });
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

function updateStatistics(statistics) {
  comparisonCount.textContent = statistics.comparisons;
  swapCount.textContent = statistics.swaps;
  recursiveCallCount.textContent = statistics.recursiveCalls;
  maxDepthCount.textContent = statistics.maxDepth;
}

function resetStatistics() {
  updateStatistics({
    comparisons: 0,
    swaps: 0,
    recursiveCalls: 0,
    maxDepth: 0,
  });
}

function clearRecursionTree() {
  state.recursionTree = null;
  state.recursionNodeElements.clear();
  recursionTreeContainer.innerHTML = '';

  const placeholder = document.createElement('p');
  placeholder.className = 'tree-placeholder';
  placeholder.textContent = 'Inicia la animación para generar el árbol.';
  recursionTreeContainer.appendChild(placeholder);
}

function renderRecursionTree(root) {
  recursionTreeContainer.innerHTML = '';
  state.recursionNodeElements.clear();

  if (!root) {
    clearRecursionTree();
    return;
  }

  const rootList = document.createElement('ul');
  rootList.appendChild(createRecursionTreeItem(root));
  recursionTreeContainer.appendChild(rootList);
}

function createRecursionTreeItem(node) {
  const item = document.createElement('li');
  const nodeElement = document.createElement('div');
  nodeElement.className = 'tree-node pending';
  nodeElement.dataset.nodeId = node.id;

  const range = document.createElement('span');
  range.textContent =
    node.left === node.right
      ? `Nivel ${node.depth} · Posición ${node.left + 1}`
      : `Nivel ${node.depth} · Posiciones ${node.left + 1}–${node.right + 1}`;

  const values = document.createElement('strong');
  values.textContent = `[${node.values.join(', ')}]`;

  const pivot = document.createElement('small');
  pivot.textContent =
    node.pivotValue === null ? 'Caso base' : `Pivote: ${node.pivotValue}`;

  nodeElement.appendChild(range);
  nodeElement.appendChild(values);
  nodeElement.appendChild(pivot);
  item.appendChild(nodeElement);
  state.recursionNodeElements.set(node.id, { element: nodeElement, node });

  if (node.children.length > 0) {
    const children = document.createElement('ul');
    node.children.forEach((child) => {
      children.appendChild(createRecursionTreeItem(child));
    });
    item.appendChild(children);
  }

  return item;
}

function updateRecursionTree(stepIndex) {
  const activeNodeId = stepIndex >= 0 ? state.steps[stepIndex]?.treeNodeId : null;

  state.recursionNodeElements.forEach(({ element, node }) => {
    element.classList.remove('pending', 'visited', 'active', 'complete');

    if (stepIndex < node.firstStepIndex) {
      element.classList.add('pending');
    } else if (node.id === activeNodeId) {
      element.classList.add('active');
    } else if (stepIndex >= node.completeStepIndex) {
      element.classList.add('complete');
    } else {
      element.classList.add('visited');
    }
  });
}

function buildQuickSortExecution(values) {
  const arr = values.slice();
  const steps = [];
  let nextNodeId = 0;
  const statistics = {
    comparisons: 0,
    swaps: 0,
    recursiveCalls: 0,
    maxDepth: 0,
  };

  function addStep(step, treeNodeId = null) {
    steps.push({
      ...step,
      treeNodeId,
      statistics: { ...statistics },
    });
  }

  function quickSort(left, right, depth = 1, parentNode = null) {
    statistics.recursiveCalls++;
    statistics.maxDepth = Math.max(statistics.maxDepth, depth);

    if (left > right) return null;

    const node = {
      id: nextNodeId++,
      left,
      right,
      depth,
      values: arr.slice(left, right + 1),
      pivotValue: null,
      pivotIndex: null,
      firstStepIndex: steps.length,
      completeStepIndex: null,
      children: [],
    };
    if (parentNode) parentNode.children.push(node);

    if (left === right) {
      addStep({ type: 'range', left, right }, node.id);
      addStep({ type: 'single', index: left }, node.id);
      addStep({ type: 'range-clear', left, right }, node.id);
      node.completeStepIndex = steps.length - 1;
      return node;
    }

    addStep({ type: 'range', left, right }, node.id);
    const pivotIndex = partition(left, right, node);
    node.pivotIndex = pivotIndex;
    addStep({ type: 'range-clear', left, right }, node.id);
    node.completeStepIndex = steps.length - 1;
    quickSort(left, pivotIndex - 1, depth + 1, node);
    quickSort(pivotIndex + 1, right, depth + 1, node);
    return node;
  }

  function partition(left, right, node) {
    const pivotValue = arr[right];
    node.pivotValue = pivotValue;
    addStep({ type: 'pivot', index: right, pivotValue, left, right }, node.id);
    let i = left;
    addStep({ type: 'pointer', index: i }, node.id);

    for (let j = left; j < right; j++) {
      const currentValue = arr[j];
      const isLessOrEqual = currentValue <= pivotValue;
      statistics.comparisons++;
      addStep({
        type: 'compare',
        index: j,
        pivot: right,
        i,
        value: currentValue,
        pivotValue,
        result: isLessOrEqual,
      }, node.id);
      if (isLessOrEqual) {
        if (i !== j) statistics.swaps++;
        addStep({
          type: 'swap-or-accept',
          from: j,
          to: i,
          value: currentValue,
        }, node.id);
        if (i !== j) {
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
        }
        i++;
        addStep({ type: 'pointer', index: i }, node.id);
      } else {
        addStep({
          type: 'greater',
          index: j,
          value: currentValue,
        }, node.id);
      }
    }
    if (right !== i) statistics.swaps++;
    addStep({ type: 'pivot-swap', from: right, to: i, pivotValue }, node.id);
    const temp = arr[i];
    arr[i] = arr[right];
    arr[right] = temp;
    addStep({ type: 'pivot-placed', index: i, pivotValue }, node.id);
    return i;
  }

  const recursionTree = quickSort(0, arr.length - 1);
  addStep({ type: 'sorted-all' });
  return { steps, recursionTree };
}

function buildQuickSortSteps(values) {
  return buildQuickSortExecution(values).steps;
}

function buildQuickSortFrames(values, steps) {
  const model = {
    numbers: values.slice(),
    range: null,
    pivot: null,
    pointer: null,
    sorted: new Set(),
  };

  return steps.map((step, index) => {
    const status = describeQuickSortStep(step, index + 1, model.numbers);
    const highlights = [];

    switch (step.type) {
      case 'range':
        model.range = [step.left, step.right];
        break;
      case 'range-clear':
        model.range = null;
        break;
      case 'pivot':
        model.pivot = step.index;
        model.range = [step.left, step.right];
        break;
      case 'pointer':
        model.pointer = step.index < model.numbers.length ? step.index : null;
        break;
      case 'compare':
        model.pointer = step.i < model.numbers.length ? step.i : null;
        model.pivot = step.pivot;
        highlights.push({ index: step.index, className: 'comparing' });
        break;
      case 'swap-or-accept':
        if (step.from === step.to) {
          highlights.push({ index: step.from, className: 'accepted' });
        } else {
          [model.numbers[step.from], model.numbers[step.to]] = [
            model.numbers[step.to],
            model.numbers[step.from],
          ];
          highlights.push({ index: step.from, className: 'swapping' });
          highlights.push({ index: step.to, className: 'swapping' });
        }
        break;
      case 'greater':
        highlights.push({ index: step.index, className: 'rejected' });
        break;
      case 'pivot-swap':
        [model.numbers[step.from], model.numbers[step.to]] = [
          model.numbers[step.to],
          model.numbers[step.from],
        ];
        model.pivot = step.to;
        highlights.push({ index: step.from, className: 'swapping' });
        highlights.push({ index: step.to, className: 'swapping' });
        break;
      case 'pivot-placed':
        model.pivot = null;
        if (model.pointer === step.index) model.pointer = null;
        model.sorted.add(step.index);
        break;
      case 'single':
        if (model.pointer === step.index) model.pointer = null;
        model.sorted.add(step.index);
        break;
      case 'sorted-all':
        model.range = null;
        model.pivot = null;
        model.pointer = null;
        model.sorted = new Set(model.numbers.map((_, itemIndex) => itemIndex));
        break;
      default:
        break;
    }

    return {
      numbers: model.numbers.slice(),
      range: model.range ? model.range.slice() : null,
      pivot: model.pivot,
      pointer: model.pointer,
      sorted: [...model.sorted],
      highlights,
      status,
      statistics: { ...step.statistics },
    };
  });
}

function describeQuickSortStep(step, stepNumber, numbers) {
  switch (step.type) {
    case 'range':
      return `Paso ${stepNumber}: Trabajando en el segmento entre las posiciones ${step.left + 1} y ${step.right + 1}.`;
    case 'range-clear':
      return `Paso ${stepNumber}: Finaliza el análisis del segmento ${step.left + 1} - ${step.right + 1}.`;
    case 'pivot':
      return `Paso ${stepNumber}: Se elige el pivote ${step.pivotValue} en la posición ${step.index + 1}.`;
    case 'pointer':
      return step.index < numbers.length
        ? `Paso ${stepNumber}: El puntero i delimita ahora la posición ${step.index + 1}.`
        : `Paso ${stepNumber}: El puntero i queda fuera del rango preparado para colocar el pivote.`;
    case 'compare':
      return `Paso ${stepNumber}: Comparando ${step.value} con el pivote ${step.pivotValue}. ${step.result ? 'Es menor o igual, se mueve a la izquierda.' : 'Permanece a la derecha.'}`;
    case 'swap-or-accept':
      return step.from === step.to
        ? `Paso ${stepNumber}: ${step.value} ya está del lado correcto, solo se avanza el límite.`
        : `Paso ${stepNumber}: Intercambiamos ${numbers[step.from]} con ${numbers[step.to]} para llevarlo al sub-arreglo izquierdo.`;
    case 'greater':
      return `Paso ${stepNumber}: ${step.value} es mayor que el pivote, queda temporalmente a la derecha.`;
    case 'pivot-swap':
      return `Paso ${stepNumber}: Colocamos el pivote ${step.pivotValue} en su lugar definitivo.`;
    case 'pivot-placed':
      return `Paso ${stepNumber}: El pivote ${step.pivotValue} queda fijo en la posición ${step.index + 1}.`;
    case 'single':
      return `Paso ${stepNumber}: La posición ${step.index + 1} ya estaba ordenada.`;
    case 'sorted-all':
      return 'Finalizado: todos los elementos se han ordenado con QuickSort.';
    default:
      return '';
  }
}

function renderStepFrame(index) {
  if (index < 0) {
    renderNumbers(state.initialNumbers);
    resetStatistics();
    updateRecursionTree(-1);
    updateStatus('Antes del primer paso: el arreglo conserva su orden original.');
    return;
  }

  const frame = state.stepFrames[index];
  if (!frame) return;

  renderNumbers(frame.numbers);
  frame.sorted.forEach((sortedIndex) => markSorted(sortedIndex));
  if (frame.range) highlightRange(frame.range[0], frame.range[1]);
  if (frame.pivot !== null) setPivot(frame.pivot);
  if (frame.pointer !== null) setPointer(frame.pointer);
  frame.highlights.forEach(({ index: cardIndex, className }) => {
    state.cards[cardIndex]?.classList.add(className);
  });
  updateStatistics(frame.statistics);
  updateRecursionTree(index);
  updateStatus(frame.status);
}

async function animateQuickSort(startIndex = 0) {
  const steps = state.steps;
  const runId = ++state.runId;

  for (let index = startIndex; index < steps.length; index++) {
    if (runId !== state.runId) return false;
    const step = steps[index];
    const stepNumber = index + 1;
    state.currentStepIndex = index;
    updateStepControls();
    updateStatistics(step.statistics);
    updateRecursionTree(index);
    switch (step.type) {
      case 'range':
        highlightRange(step.left, step.right);
        updateStatus(`Paso ${stepNumber}: Trabajando en el segmento entre las posiciones ${step.left + 1} y ${step.right + 1}.`);
        if (!(await waitForStep(0.8, runId))) return false;
        break;
      case 'range-clear':
        clearRangeHighlight();
        if (typeof step.left === 'number' && typeof step.right === 'number') {
          updateStatus(
            `Paso ${stepNumber}: Finaliza el análisis del segmento ${step.left + 1} - ${step.right + 1}.`
          );
        }
        if (!(await waitForStep(0.4, runId))) return false;
        break;
      case 'pivot':
        setPivot(step.index);
        highlightRange(step.left, step.right);
        updateStatus(`Paso ${stepNumber}: Se elige el pivote ${step.pivotValue} en la posición ${step.index + 1}.`);
        if (!(await waitForStep(0.9, runId))) return false;
        break;
      case 'pointer': {
        const pointerIndex = step.index < state.cards.length ? step.index : null;
        setPointer(pointerIndex);
        updateStatus(
          pointerIndex === null
            ? `Paso ${stepNumber}: El puntero i queda fuera del rango preparado para colocar el pivote.`
            : `Paso ${stepNumber}: El puntero i delimita ahora la posición ${pointerIndex + 1}.`
        );
        if (!(await waitForStep(0.35, runId))) return false;
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
        if (!(await waitForStep(1, runId))) return false;
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
          if (!(await waitForStep(0.8, runId))) return false;
          fromCard.classList.remove('accepted');
        } else {
          fromCard.classList.add('swapping');
          toCard.classList.add('swapping');
          updateStatus(`Paso ${stepNumber}: Intercambiamos ${state.numbers[from]} con ${state.numbers[to]} para llevarlo al sub-arreglo izquierdo.`);
          if (!(await waitForStep(0.45, runId))) return false;
          swapState(from, to);
          if (!(await waitForStep(0.9, runId))) return false;
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
        if (!(await waitForStep(0.7, runId))) return false;
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
        if (!(await waitForStep(0.45, runId))) return false;
        swapState(from, to);
        setPivot(to);
        if (!(await waitForStep(0.9, runId))) return false;
        pivotCard.classList.remove('swapping');
        targetCard.classList.remove('swapping');
        break;
      }
      case 'pivot-placed':
        setPivot(step.index);
        markSorted(step.index);
        updateStatus(`Paso ${stepNumber}: El pivote ${step.pivotValue} queda fijo en la posición ${step.index + 1}.`);
        if (!(await waitForStep(0.7, runId))) return false;
        break;
      case 'single':
        markSorted(step.index);
        updateStatus(`Paso ${stepNumber}: La posición ${step.index + 1} ya estaba ordenada.`);
        if (!(await waitForStep(0.7, runId))) return false;
        break;
      case 'sorted-all':
        clearRangeHighlight();
        setPointer(null);
        setPivot(null);
        updateStatus('Finalizado: todos los elementos se han ordenado con QuickSort.');
        if (!(await waitForStep(1, runId))) return false;
        break;
      default:
        break;
    }
  }

  return runId === state.runId;
}

function getAnimationDuration(multiplier = 1) {
  return (ANIMATION_BASE_DELAY * multiplier) / state.animationSpeed;
}

function waitForAnimation(multiplier = 1) {
  return wait(getAnimationDuration(multiplier));
}

async function waitForStep(multiplier, runId) {
  const completed = await waitForAnimation(multiplier);
  return completed && runId === state.runId;
}

function wait(duration) {
  return new Promise((resolve) => {
    let remaining = duration;
    let startedAt = 0;
    let timeoutId = null;
    let completed = false;

    const timer = {
      pause() {
        if (completed || timeoutId === null) return;
        clearTimeout(timeoutId);
        timeoutId = null;
        remaining = Math.max(0, remaining - (performance.now() - startedAt));
      },
      resume() {
        if (completed || timeoutId !== null) return;
        startedAt = performance.now();
        timeoutId = setTimeout(finish, remaining);
      },
      cancel() {
        finish(false);
      },
    };

    function finish(completedNaturally = true) {
      if (completed) return;
      completed = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      timeoutId = null;
      if (state.activeWait === timer) state.activeWait = null;
      resolve(completedNaturally);
    }

    state.activeWait = timer;
    if (!state.animationPaused) timer.resume();
  });
}
