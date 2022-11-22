import { Content, ContentHeader, Progress } from '@backstage/core-components';
import React, { useEffect, useState } from 'react';
import { ANIMATED_STEP } from './AnimatedConstants';
import AnimatedText from './AnimatedText';

type AnimatedProgressbarProps = {
  refreshIntervalMs?: number;
};

export function AnimatedProgressbar(props: AnimatedProgressbarProps) {
  const [animatedTexts] = useState([
    new AnimatedText('Tekton Pipelines', 1000, 500),
    new AnimatedText('A Backstage Plugin by JQuad', 500, 500),
    new AnimatedText('Visit JQuad.de :) ', 500, 1e10),
  ]);

  const [titles, setTitles] = useState(['', '', '']);

  useEffect(() => {
    const interval = setInterval(() => {
      for (const animatedText of animatedTexts) {
        if (animatedText.isTicking()) {
          animatedText.tick();
          break;
        }
      }
      setTitles(animatedTexts.map(animatedText => animatedText.getText()));
    }, ANIMATED_STEP);
    return () => {
      clearInterval(interval);
    };
  });
  return (
    <Content>
      <Progress />
      <br/>
      {titles.map((title, i) => (
        <ContentHeader title={title} key={i} />
      ))}
    </Content>
  );
}
