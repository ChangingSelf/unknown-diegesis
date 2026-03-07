import { Modal } from 'antd';
import type { ModalFuncProps } from 'antd';

export interface ConfirmOptions {
  title?: string;
  content: string;
  okText?: string;
  cancelText?: string;
  okType?: ModalFuncProps['okType'];
}

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      Modal.confirm({
        title: options.title || '确认',
        content: options.content,
        okText: options.okText || '确定',
        cancelText: options.cancelText || '取消',
        okType: options.okType || 'danger',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  return { confirm };
};

export const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise(resolve => {
    Modal.confirm({
      title: options.title || '确认',
      content: options.content,
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
      okType: options.okType || 'danger',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};
