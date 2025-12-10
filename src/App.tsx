
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            未知叙事 - 小说块编辑器
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            基于 Markdown + 块编辑 + 双链的桌面端编辑器
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            欢迎使用未知叙事编辑器
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              🚀 项目框架已成功搭建：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>✅ Electron + React + TypeScript</li>
              <li>✅ Vite 构建工具</li>
              <li>✅ Yarn 包管理</li>
              <li>✅ 基础项目结构</li>
            </ul>
            <p className="pt-4">
              下一步将开始实现核心功能：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Slate.js 块编辑器集成</li>
              <li>Markdown 解析和渲染</li>
              <li>本地数据存储</li>
              <li>双链功能</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App