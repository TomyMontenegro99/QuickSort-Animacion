export function buildQuickSortExecution(values) {
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

export function buildQuickSortSteps(values) {
  return buildQuickSortExecution(values).steps;
}

export function buildQuickSortFrames(values, steps) {
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

export function describeQuickSortStep(step, stepNumber, numbers) {
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
