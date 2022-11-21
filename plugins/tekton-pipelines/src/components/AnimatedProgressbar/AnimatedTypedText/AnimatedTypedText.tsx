import { ContentHeader } from '@backstage/core-components';
import React, { useEffect, useState } from 'react';

type AnimatedProgressbarProps = {
  text: string;
};

export function AnimatedTypedText(props: AnimatedProgressbarProps) {
  const [text, setText] = useState('');

  const ref = useRef();

  useEffect(() => {
    ref.current = callback;
  });

  useEffect(() => {
    const tick = () => {
      const ret = ref.current();

      const nextDelay = Math.floor(Math.random() * (delay * 2)) + 1;
      if (!ret) {
        setTimeout(tick, nextDelay);
      } else if (ret.constructor === Promise) {
        ret.then(() => setTimeout(tick, nextDelay));
      }
    };

    const timer = setTimeout(tick, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return <ContentHeader title="{text}" />;
}
