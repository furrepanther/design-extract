export function extractAnimations(computedStyles, keyframes) {
  const transitionSet = new Set();
  const easingSet = new Set();
  const durationSet = new Set();
  const animationNames = new Set();
  const transitionProperties = {};

  for (const el of computedStyles) {
    if (el.transition && el.transition !== 'all 0s ease 0s' && el.transition !== 'none') {
      transitionSet.add(el.transition);

      // Extract easing and duration
      const dMatch = el.transition.match(/([\d.]+m?s)/g);
      if (dMatch) dMatch.forEach(d => durationSet.add(d));

      const eMatch = el.transition.match(/(ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier\([^)]+\))/g);
      if (eMatch) eMatch.forEach(e => easingSet.add(e));

      // Extract which properties are animated
      const parts = el.transition.split(',').map(s => s.trim());
      for (const part of parts) {
        const prop = part.split(/\s+/)[0];
        if (prop && prop !== 'all') {
          transitionProperties[prop] = (transitionProperties[prop] || 0) + 1;
        }
      }
    }

    // Capture animation usage
    if (el.animation && el.animation !== 'none 0s ease 0s 1 normal none running' && el.animation !== 'none') {
      const nameMatch = el.animation.match(/^([\w-]+)/);
      if (nameMatch && nameMatch[1] !== 'none') animationNames.add(nameMatch[1]);
    }
  }

  // Enhanced keyframes with timing and properties changed
  const enhancedKeyframes = keyframes.map(kf => {
    const propertiesAnimated = new Set();
    for (const step of kf.steps) {
      const props = step.style.split(';').map(s => s.split(':')[0].trim()).filter(Boolean);
      props.forEach(p => propertiesAnimated.add(p));
    }
    return {
      name: kf.name,
      steps: kf.steps,
      propertiesAnimated: [...propertiesAnimated],
      isUsed: animationNames.has(kf.name),
    };
  });

  // Sort transition properties by usage
  const sortedProps = Object.entries(transitionProperties)
    .sort((a, b) => b[1] - a[1])
    .map(([prop, count]) => ({ property: prop, count }));

  return {
    transitions: [...transitionSet],
    easings: [...easingSet],
    durations: [...durationSet],
    keyframes: enhancedKeyframes,
    transitionProperties: sortedProps,
    animationNames: [...animationNames],
  };
}
