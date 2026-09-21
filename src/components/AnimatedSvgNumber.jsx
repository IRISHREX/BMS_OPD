import React from 'react';
import { useCountUp } from 'react-countup';

const AnimatedSvgNumber = ({
  value,
  duration = 2,
  prefix = '',
  separator = ',',
  x,
  y,
  textAnchor,
  fill,
  fontSize,
  fontWeight,
  transform,
  alignmentBaseline,
}) => {
  const textRef = React.useRef(null);

  useCountUp({
    ref: textRef,
    end: value,
    duration,
    separator,
    prefix,
  });

  return (
    <text
      ref={textRef}
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill={fill}
      fontSize={fontSize}
      fontWeight={fontWeight}
      transform={transform}
      alignmentBaseline={alignmentBaseline}
    />
  );
};

export default AnimatedSvgNumber;
