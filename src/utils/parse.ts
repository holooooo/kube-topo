export const fittingString = (str: string, maxWidth: number) => {
  const width = str.length;
  const ellipsis = "\n";
  if (width > maxWidth) {
    const result =
      str.substring(0, maxWidth) + ellipsis + str.substring(maxWidth, width);
    return result;
  }
  return str;
};

export const intersectionSet = (sets: Set<any>[]): Set<any> => {
  if (sets.length === 2) {
    return new Set([...sets[0]].filter((s) => sets[1].has(s)));
  } else if (sets.length === 1) {
    return sets[0];
  } else if (sets.length === 0) {
    return new Set();
  }
  return intersectionSet([
    intersectionSet([sets[0], sets[1]]),
    ...sets.slice(2),
  ]);
};

export const differenceSet = (sets: Set<any>[]): Set<any> => {
  if (sets.length === 2) {
    return new Set([...sets[0]].filter((s) => !sets[1].has(s)));
  } else if (sets.length === 1) {
    return sets[0];
  } else if (sets.length === 0) {
    return new Set();
  }
  return differenceSet([differenceSet([sets[0], sets[1]]), ...sets.slice(2)]);
};

export const unionSet = (sets: Set<any>[]): Set<any> => {
  if (sets.length === 2) {
    return new Set(...sets[0], ...sets[1]);
  } else if (sets.length === 1) {
    return sets[0];
  } else if (sets.length === 0) {
    return new Set();
  }
  return unionSet([unionSet([sets[0], sets[1]]), ...sets.slice(2)]);
};
