import { Modal, Input } from 'antd';

export interface PromptOptions {
  title?: string;
  placeholder?: string;
  defaultValue?: string;
  okText?: string;
  cancelText?: string;
}

export const usePrompt = () => {
  const prompt = (options: PromptOptions): Promise<string | null> => {
    return new Promise(resolve => {
      let inputValue = options.defaultValue || '';

      const modal = Modal.confirm({
        title: options.title || '请输入',
        icon: null,
        content: (
          <Input
            placeholder={options.placeholder}
            defaultValue={inputValue}
            autoFocus
            onChange={e => {
              inputValue = e.target.value;
            }}
            onPressEnter={() => {
              modal.destroy();
              resolve(inputValue || null);
            }}
          />
        ),
        okText: options.okText || '确定',
        cancelText: options.cancelText || '取消',
        onOk: () => resolve(inputValue || null),
        onCancel: () => resolve(null),
      });
    });
  };

  return { prompt };
};

export const showPrompt = (options: PromptOptions): Promise<string | null> => {
  return new Promise(resolve => {
    let inputValue = options.defaultValue || '';

    const modal = Modal.confirm({
      title: options.title || '请输入',
      icon: null,
      content: (
        <Input
          placeholder={options.placeholder}
          defaultValue={inputValue}
          autoFocus
          onChange={e => {
            inputValue = e.target.value;
          }}
          onPressEnter={() => {
            modal.destroy();
            resolve(inputValue || null);
          }}
        />
      ),
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
      onOk: () => resolve(inputValue || null),
      onCancel: () => resolve(null),
    });
  });
};
