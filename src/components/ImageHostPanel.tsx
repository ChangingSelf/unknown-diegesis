import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Tabs,
  Button,
  Form,
  Input,
  Select,
  Space,
  Table,
  message,
  Popconfirm,
  Progress,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  CloudUploadOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { ImageHostConfig, ImageHostLink } from '@/types/image';
import { ImageHostManager, UploadProgress } from '@/services/ImageHostManager';

const { Text } = Typography;
const { TabPane } = Tabs;

interface ImageHostPanelProps {
  workspacePath: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageHostPanel: React.FC<ImageHostPanelProps> = ({
  workspacePath: _workspacePath,
  isOpen,
  onClose,
}) => {
  const managerRef = useRef<ImageHostManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new ImageHostManager();
  }
  const manager = managerRef.current;

  const [hosts, setHosts] = useState<ImageHostConfig[]>([]);
  const [links, setLinks] = useState<ImageHostLink[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [activeTab, setActiveTab] = useState('config');
  const [isAddingHost, setIsAddingHost] = useState(false);
  const [editingHost, setEditingHost] = useState<ImageHostConfig | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const unsubscribe = manager.subscribe(
      (state: {
        hosts: ImageHostConfig[];
        links: ImageHostLink[];
        uploadProgress: Map<string, UploadProgress>;
      }) => {
        setHosts(state.hosts);
        setLinks(state.links);
        setUploadProgress(new Map(state.uploadProgress));
      }
    );

    setHosts(manager.getAllHosts());
    setLinks(manager.getAllLinks());

    return unsubscribe;
  }, [manager]);

  const handleAddHost = () => {
    setIsAddingHost(true);
    setEditingHost(null);
    form.resetFields();
  };

  const handleEditHost = (host: ImageHostConfig) => {
    setIsAddingHost(true);
    setEditingHost(host);
    form.setFieldsValue({
      name: host.name,
      type: host.type,
      ...host.config,
    });
  };

  const handleDeleteHost = (id: string) => {
    if (manager.removeHost(id)) {
      message.success('图床配置已删除');
    }
  };

  const handleSaveHost = async () => {
    try {
      const values = await form.validateFields();
      const { name, type, ...config } = values;

      if (editingHost) {
        manager.updateHost(editingHost.id, { name, type, config });
        message.success('图床配置已更新');
      } else {
        const newHost: ImageHostConfig = {
          id: ImageHostManager.generateId(),
          name,
          type,
          config,
        };
        manager.addHost(newHost);
        message.success('图床配置已添加');
      }

      setIsAddingHost(false);
      form.resetFields();
    } catch (_error) {
      void _error;
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('链接已复制到剪贴板');
  };

  const handleDeleteLink = (localPath: string) => {
    if (manager.removeLink(localPath)) {
      message.success('链接已删除');
    }
  };

  const hostColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ImageHostConfig) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditHost(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该图床配置吗？"
            onConfirm={() => handleDeleteHost(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const linkColumns = [
    {
      title: '本地路径',
      dataIndex: 'localPath',
      key: 'localPath',
      ellipsis: true,
      render: (path: string) => (
        <Tooltip title={path}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {path}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '远程链接',
      dataIndex: 'remoteUrl',
      key: 'remoteUrl',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <Text ellipsis style={{ maxWidth: 250 }}>
            {url}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ImageHostLink) => (
        <Space>
          <Tooltip title="复制链接">
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyUrl(record.remoteUrl)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除该链接吗？"
            onConfirm={() => handleDeleteLink(record.localPath)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除链接">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderUploadProgress = () => {
    const progressItems = Array.from(uploadProgress.entries());
    if (progressItems.length === 0) return null;

    return (
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <div className="mb-2 font-semibold">上传进度</div>
        {progressItems.map(([path, progress]) => (
          <div key={path} className="mb-2">
            <div className="flex justify-between mb-1">
              <Text ellipsis style={{ maxWidth: 300 }}>
                {path}
              </Text>
              <Tag
                color={
                  progress.status === 'success'
                    ? 'success'
                    : progress.status === 'error'
                      ? 'error'
                      : 'processing'
                }
              >
                {progress.status === 'uploading'
                  ? '上传中'
                  : progress.status === 'success'
                    ? '成功'
                    : progress.status === 'error'
                      ? '失败'
                      : '等待中'}
              </Tag>
            </div>
            <Progress
              percent={progress.progress}
              status={
                progress.status === 'error'
                  ? 'exception'
                  : progress.status === 'success'
                    ? 'success'
                    : 'active'
              }
              size="small"
            />
            {progress.error && (
              <Text type="danger" className="text-xs">
                {progress.error}
              </Text>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CloudUploadOutlined />
          <span>图床管理</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <LinkOutlined />
              图床配置
            </span>
          }
          key="config"
        >
          <div className="mb-4">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddHost}>
              添加图床
            </Button>
          </div>

          {isAddingHost ? (
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <Form form={form} layout="vertical">
                <Form.Item
                  name="name"
                  label="图床名称"
                  rules={[{ required: true, message: '请输入图床名称' }]}
                >
                  <Input placeholder="例如：我的图床" />
                </Form.Item>

                <Form.Item
                  name="type"
                  label="图床类型"
                  rules={[{ required: true, message: '请选择图床类型' }]}
                >
                  <Select placeholder="选择图床类型">
                    <Select.Option value="smms">SM.MS</Select.Option>
                    <Select.Option value="imgur">Imgur</Select.Option>
                    <Select.Option value="github">GitHub</Select.Option>
                    <Select.Option value="custom">自定义</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="apiKey"
                  label="API Key"
                  rules={[{ required: true, message: '请输入 API Key' }]}
                >
                  <Input.Password placeholder="输入 API Key" />
                </Form.Item>

                <Form.Item name="apiUrl" label="API URL（可选）">
                  <Input placeholder="自定义 API 地址" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" onClick={handleSaveHost}>
                      保存
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingHost(false);
                        form.resetFields();
                      }}
                    >
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          ) : null}

          <Table
            dataSource={hosts}
            columns={hostColumns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '暂无图床配置' }}
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <CloudUploadOutlined />
              已上传图片
            </span>
          }
          key="uploaded"
        >
          {renderUploadProgress()}

          <Table
            dataSource={links}
            columns={linkColumns}
            rowKey="localPath"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无已上传图片' }}
          />
        </TabPane>
      </Tabs>
    </Modal>
  );
};
