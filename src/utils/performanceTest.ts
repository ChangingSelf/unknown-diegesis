import type { TiptapDocument, TiptapNode } from '@/types/tiptap';

export interface PerformanceTestResult {
  renderTime: number;
  memoryUsed: number | null;
  blockCount: number;
  documentSize: number;
}

export function createTestDocument(blockCount: number, mixed = false): TiptapDocument {
  const content: TiptapNode[] = [];

  for (let i = 0; i < blockCount; i++) {
    if (mixed && i % 10 === 0) {
      content.push({
        type: 'imageBlock',
        attrs: {
          id: `img-${i}`,
          src: 'https://example.com/test.jpg',
          alt: 'Test Image',
        },
      });
    } else if (mixed && i % 15 === 0) {
      content.push({
        type: 'diceBlock',
        attrs: {
          id: `dice-${i}`,
          formula: '1d20',
          result: Math.floor(Math.random() * 20) + 1,
        },
      });
    } else if (mixed && i % 20 === 0) {
      content.push({
        type: 'layoutRow',
        attrs: { id: `row-${i}` },
        content: [
          {
            type: 'layoutColumn',
            attrs: { id: `col-${i}-1`, width: 50 },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: `左侧段落 ${i}` }] }],
          },
          {
            type: 'layoutColumn',
            attrs: { id: `col-${i}-2`, width: 50 },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: `右侧段落 ${i}` }] }],
          },
        ],
      });
    } else {
      content.push({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `这是第 ${i + 1} 个测试段落。这是一些测试文本来模拟真实的文档内容。`,
          },
        ],
      });
    }
  }

  return { type: 'doc', content };
}

export function measureRenderTime(
  setContent: (doc: TiptapDocument) => void,
  doc: TiptapDocument
): number {
  const start = performance.now();
  setContent(doc);
  return performance.now() - start;
}

export function measureMemory(): { used: number; total: number } | null {
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
  };
  if (perf.memory) {
    return {
      used: perf.memory.usedJSHeapSize / 1024 / 1024,
      total: perf.memory.totalJSHeapSize / 1024 / 1024,
    };
  }
  return null;
}

export function calculateDocumentSize(doc: TiptapDocument): number {
  return new Blob([JSON.stringify(doc)]).size;
}

export async function runPerformanceTest(
  setContent: (doc: TiptapDocument) => void,
  blockCounts: number[] = [10, 50, 100, 500]
): Promise<PerformanceTestResult[]> {
  const results: PerformanceTestResult[] = [];

  for (const count of blockCounts) {
    const doc = createTestDocument(count, true);
    const docSize = calculateDocumentSize(doc);

    await new Promise(resolve => setTimeout(resolve, 100));

    const memoryBefore = measureMemory();
    const renderTime = measureRenderTime(setContent, doc);
    const memoryAfter = measureMemory();

    results.push({
      renderTime,
      memoryUsed: memoryAfter && memoryBefore ? memoryAfter.used - memoryBefore.used : null,
      blockCount: count,
      documentSize: docSize,
    });

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

export function logPerformanceResults(results: PerformanceTestResult[]): void {
  console.log('=== Performance Test Results ===');
  console.log('');

  results.forEach(result => {
    console.log(`Block Count: ${result.blockCount}`);
    console.log(`  Render Time: ${result.renderTime.toFixed(2)}ms`);
    console.log(`  Memory Used: ${result.memoryUsed?.toFixed(2) ?? 'N/A'} MB`);
    console.log(`  Document Size: ${(result.documentSize / 1024).toFixed(2)} KB`);
    console.log('');
  });

  const first100 = results.find(r => r.blockCount === 100);
  if (first100) {
    const passed = first100.renderTime < 1000;
    console.log(
      `100-block test: ${passed ? 'PASSED' : 'FAILED'} (${first100.renderTime.toFixed(2)}ms < 1000ms)`
    );
  }
}
