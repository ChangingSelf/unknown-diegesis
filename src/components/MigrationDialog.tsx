import { Modal, Typography } from 'antd';
import { WORKSPACE_SCHEMA_VERSION } from '@/constants/versions';

export interface MigrationDialogResult {
  confirmed: boolean;
  action: 'upgrade' | 'cancel' | 'close';
}

export const showUpgradeConfirmDialog = (
  currentVersion: number,
  targetVersion: number = WORKSPACE_SCHEMA_VERSION
): Promise<MigrationDialogResult> => {
  return new Promise(resolve => {
    Modal.confirm({
      title: '工作区版本升级',
      content: `检测到旧版本数据（v${currentVersion}），是否升级到 v${targetVersion}？升级前将自动创建备份。`,
      okText: '升级',
      cancelText: '取消',
      okType: 'primary',
      onOk: () => resolve({ confirmed: true, action: 'upgrade' }),
      onCancel: () => resolve({ confirmed: false, action: 'cancel' }),
    });
  });
};

export const showVersionTooNewDialog = (
  currentVersion: number,
  requiredVersion: number = WORKSPACE_SCHEMA_VERSION
): Promise<void> => {
  return new Promise(resolve => {
    Modal.warning({
      title: '工作区版本过新',
      content: `此工作区需要更新版本的应用（需要 v${requiredVersion}，当前 v${currentVersion}）。请更新应用后重试。`,
      okText: '确定',
      onOk: () => resolve(),
    });
  });
};

export const showMigrationResultDialog = (
  success: boolean,
  backupPath?: string,
  error?: string
): Promise<void> => {
  return new Promise(resolve => {
    if (success) {
      Modal.success({
        title: '升级完成',
        content: (
          <div>
            <Typography.Paragraph>工作区已成功升级！</Typography.Paragraph>
            {backupPath && (
              <Typography.Text type="secondary">
                备份已保存到：
                <Typography.Text copyable={{ text: backupPath }} style={{ marginLeft: 8 }}>
                  {backupPath}
                </Typography.Text>
              </Typography.Text>
            )}
          </div>
        ),
        okText: '确定',
        onOk: () => resolve(),
      });
    } else {
      Modal.error({
        title: '升级失败',
        content: `升级过程中发生错误：${error || '未知错误'}`,
        okText: '确定',
        onOk: () => resolve(),
      });
    }
  });
};

export const useMigrationDialog = () => {
  return {
    showUpgradeConfirm: showUpgradeConfirmDialog,
    showVersionTooNew: showVersionTooNewDialog,
    showMigrationResult: showMigrationResultDialog,
  };
};
