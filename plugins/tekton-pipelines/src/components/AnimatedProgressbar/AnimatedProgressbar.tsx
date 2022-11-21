import { Content, Progress, ContentHeader } from '@backstage/core-components';
import React, { useEffect, useState } from 'react';
import { ANIMATED_STEP } from './Sign';
import { AnimatedText } from './AnimatedText';

type AnimatedProgressbarProps = {
  refreshIntervalMs?: number;
};

export function AnimatedProgressbar(props: AnimatedProgressbarProps) {
  
  const [text, setText] = useState(new AnimatedText("Pipelines"))
  const [title, setTitle] = useState('');

  
  useEffect(() => {
    const interval = setInterval(() => {
      if (text.isTicking()) {
        text.tick();
      }
      setTitle(text.getText());
    }, ANIMATED_STEP);
    return () => {
      clearInterval(interval);
    };
  });
  return (
    <Content>
      <Progress />
      <ContentHeader title={title} />
    </Content>
  );
}
