import { BatchUpdateResultByTrackID } from '@/store/annotation/actionCreators';
import { LabelBeeContext, useDispatch } from '@/store/ctx';
import { Form, InputNumber, message, Modal, Popover, Radio, Select } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { IPointCloudBox, IPointCloudConfig, PointCloudUtils } from '@labelbee/lb-utils';
import { connect } from 'react-redux';
import { AppState } from '@/store';
import { AnnotationFileList } from '@/types/data';
import { useSingleBox } from '../../hooks/useSingleBox';
import { MathUtils } from '@labelbee/lb-annotation';

interface IProps {
  id?: number;
  visible: boolean;
  onCancel: () => void;
  config: IPointCloudConfig;
  imgList: AnnotationFileList;
  imgIndex: number;
}

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const defaultNumberRules = [{ required: true, message: '请填写一个数字' }];
const defaultSelectedAttribute = [{ required: true, message: '请选择主属性' }];
const DECIMAL_PLACES = 2;

const PrefixTag: React.FC<{ text: string }> = ({ text }) => {
  return (
    <span
      style={{
        borderRadius: '4px 0px 0px 4px',
        padding: '0px 12px',
        background: '#FAFAFA',
        border: '1px solid rgb(217 217 217)',
        borderRight: '0',
        display: 'flex',
        alignItems: 'center',
        height: 32,
      }}
    >
      {text}
    </span>
  );
};

interface ISizeShowProps {
  size?: {
    width: number;
    height: number;
    depth: number;
  };
  isMax: boolean;
  selectedBox?: IPointCloudBox;
}

const SizeShow = (props: ISizeShowProps) => {
  const { t } = useTranslation();

  const { size, isMax, selectedBox } = props;

  if (!size || !selectedBox) {
    return null;
  }
  const style = { marginRight: 16 };

  const params = {
    ...selectedBox,
    ...(isMax && size),
  };

  const { length, width, height } = PointCloudUtils.transferBox2Kitti(params);

  return (
    <div>
      <span style={style}>
        {t('Length')}: {length.toFixed(DECIMAL_PLACES)}
      </span>
      <span style={style}>
        {t('Width')}: {width.toFixed(DECIMAL_PLACES)}
      </span>
      <span style={style}>
        {t('Height')}: {height.toFixed(DECIMAL_PLACES)}
      </span>
      <Popover
        placement='rightBottom'
        content={`统一尺寸为该ID的所有标注框${isMax ? '中最大的尺寸' : '以当前帧框尺寸为标准'}`}
      >
        <QuestionCircleOutlined />
      </Popover>
    </div>
  );
};

const sizeOptions = [
  {
    value: 'current',
    label: '当前帧尺寸',
  },
  {
    value: 'max',
    label: '最大尺寸',
  },
];

const UnifyParamsModal = ({ id, visible, onCancel, config, imgList, imgIndex }: IProps) => {
  const dispatch = useDispatch();
  const { selectedBox } = useSingleBox();
  const [size, setSize] = useState<{ width: number; height: number; depth: number }>();

  const [form] = Form.useForm();
  const { t } = useTranslation();

  useEffect(() => {
    if (visible === false) {
      // Clear All Data
      form.resetFields();
      setSize(undefined);
    } else {
      // Init
      recalculateSize();
    }
  }, [visible]);

  const onFinish = (values: any) => {
    if (!id) {
      return;
    }

    if (!size) {
      message.info('该范围不存在更改数据, 请更改统一范围');
      return;
    }
    /**
     * Previously, imgList was retrieved from the state in dispatch(ToSubmitFileData(ESubmitType.SyncImgList)), but it was not the most up-to-date imgList.
     * To fix this, the dispatch method was removed, and imgList is now passed through props to BatchUpdateResultByTrackID to ensure the latest data is used.
     */
    const newData = {
      attribute: values.attribute,
    };

    if (config.secondaryAttributeConfigurable) {
      const newSubAttribute = {};
      config.inputList?.forEach((data) => {
        const subData = values[data.value];
        if (subData !== undefined) {
          // Compatible with multiple selections
          const mapData = Array.isArray(subData) ? subData.join(';') : subData;
          Object.assign(newSubAttribute, { [data.value]: mapData });
        }
      });

      if (Object.keys(newSubAttribute).length > 0) {
        Object.assign(newData, { subAttribute: newSubAttribute });
      }
    }

    const { UnifySize } = values;

    Object.assign(
      newData,
      size && UnifySize === 'max'
        ? size
        : {
            width: selectedBox?.info?.width,
            height: selectedBox?.info?.height,
            depth: selectedBox?.info?.depth,
          },
    );

    dispatch(
      BatchUpdateResultByTrackID(id, newData, [values.prevPage - 1, values.nextPage - 1], imgList),
    );
    onCancel();
  };

  const recalculateSize = useCallback(() => {
    const { prevPage, nextPage } = form.getFieldsValue(['prevPage', 'nextPage']);

    // 1. Filter the imgInfo in range.
    const newImgList = imgList.filter((_, i) =>
      MathUtils.isInRange(i, [prevPage - 1, nextPage - 1]),
    );

    if (
      !(newImgList?.length > 0) ||
      !selectedBox?.info ||
      selectedBox?.info?.trackID === undefined
    ) {
      setSize(undefined);
      return;
    }

    // 2. Get the Max Size of imgList
    const newMaxSize = PointCloudUtils.getMaxSizeFromBox({
      trackID: selectedBox.info.trackID,
      imgList: newImgList as Array<{ result: string }>,
    });

    setSize(newMaxSize);
  }, [imgList, selectedBox, imgIndex]);

  const onOk = () => form.submit();

  const selectStyle = {
    width: '200px',
  };

  const attributeStyle = {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <Modal
      title={t('UnifyParams')}
      visible={visible}
      onCancel={onCancel}
      onOk={onOk}
      wrapClassName='labelbee-custom-modal'
    >
      <>
        <div style={{ marginBottom: '20px', color: '#f00' }}>{t('UnifyParamsTips')}</div>
        <Form {...layout} form={form} onFinish={onFinish}>
          <Form.Item name='id' label={t('UnifyTrackID')}>
            {id}
          </Form.Item>

          <Form.Item label={t('UnifyAttributeRange')} required={true}>
            <Form.Item
              style={{ display: 'inline-block' }}
              rules={defaultNumberRules}
              name='prevPage'
              noStyle={true}
              initialValue={1} // First Page
            >
              <InputNumber
                precision={0}
                min={1}
                style={{ width: '80px' }}
                onChange={() => recalculateSize()}
              />
            </Form.Item>
            <span
              style={{
                display: 'inline-block',
                width: '24px',
                textAlign: 'center',
              }}
            >
              -
            </span>
            <Form.Item
              style={{ display: 'inline-block' }}
              rules={defaultNumberRules}
              name='nextPage'
              noStyle={true}
              initialValue={imgList.length} // Last Page
            >
              <InputNumber
                precision={0}
                min={1}
                style={{ width: '80px' }}
                onChange={() => recalculateSize()}
              />
            </Form.Item>
            <span
              style={{
                display: 'inline-block',
                width: '40x',
                marginLeft: '10px',
                textAlign: 'center',
              }}
            >
              {t('Page')}
            </span>
          </Form.Item>

          <Form.Item
            name='UnifySize'
            label={t('UnifySize')}
            required={true}
            initialValue={'current'}
          >
            <Radio.Group
              onChange={(e) => {
                form.setFieldValue('UnifySize', e.target.value);
              }}
            >
              {sizeOptions.map((item) => {
                const { value, label } = item;
                return (
                  <Radio value={value} key={value}>
                    <div>{label}</div>
                    <SizeShow selectedBox={selectedBox?.info} size={size} isMax={value === 'max'} />
                  </Radio>
                );
              })}
            </Radio.Group>
          </Form.Item>

          <Form.Item label={t('UnifyTag')} required={true}>
            <div style={attributeStyle}>
              <PrefixTag text={t('Attribute')} />
              <Form.Item name='attribute' noStyle={true} rules={defaultSelectedAttribute}>
                <Select style={selectStyle}>
                  {config.attributeList.map((v) => (
                    <Select.Option key={v.value} value={v.value}>
                      {v.key}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            {config.secondaryAttributeConfigurable &&
              config.inputList.map((v) => (
                <div key={v.value} style={attributeStyle}>
                  <PrefixTag text={v.key} />
                  <Form.Item name={v.value} noStyle={true} required={false}>
                    <Select style={selectStyle} mode={v.isMulti ? 'multiple' : undefined}>
                      {v.subSelected?.map((subData) => (
                        <Select.Option key={subData.value} value={subData.value}>
                          {subData.key}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
              ))}
          </Form.Item>
        </Form>
      </>
    </Modal>
  );
};

const mapStateToProps = (state: AppState) => {
  return {
    imgIndex: state.annotation.imgIndex,
  };
};

export default connect(mapStateToProps, null, null, { context: LabelBeeContext })(UnifyParamsModal);
