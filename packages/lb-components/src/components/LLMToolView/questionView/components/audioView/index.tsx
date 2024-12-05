/*
 * @file LLM tool audio view
 * @Author: lixinghua lixinghua@sensetime.com
 * @Date: 2023-11-13
 */
import React from 'react';
import { Tag } from 'antd';
import { prefix } from '@/constant';
import classNames from 'classnames';
import { IAnswerList } from '@/components/LLMToolView/types';

interface IProps {
  hoverKey?: number;
  answerList: IAnswerList[];
}

const LLMViewCls = `${prefix}-LLMView`;

const AudioPlayer = React.memo(({ url }: { url?: string }) => (
  <audio controls>
    <source src={url} type='audio/mpeg' />
  </audio>
));

const AudioView = (props: IProps) => {
  const { answerList, hoverKey } = props;

  return (
    <div>
      {answerList?.length > 0 &&
        answerList.map((i: IAnswerList, index: number) => {
          return (
            <div
              key={index}
              className={classNames({
                [`${LLMViewCls}__content`]: true,
                [`${LLMViewCls}__contentActive`]: hoverKey === i?.order,
              })}
            >
              <Tag className={`${LLMViewCls}-tag`}>{i?.order}</Tag>
              <div>
                <AudioPlayer key={i?.url} url={i?.url} />
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default AudioView;
