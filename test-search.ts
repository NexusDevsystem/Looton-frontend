import { SmartHardwareSearch } from './src/services/SmartHardwareSearch';

// Teste para verificar se as buscas por GPU e CPU estão funcionando corretamente
function runSearchTests() {
  console.log('🔍 Testando sistema de busca inteligente de hardware...\n');

  // Dados de teste simulando ofertas reais
  const mockItems = [
    { title: 'Placa de Vídeo RTX 4060 8GB GDDR6 - ASUS' },
    { title: 'Placa de Vídeo AMD RX 7600 8GB GDDR6' },
    { title: 'Processador Intel Core i5-12400F 2.5GHz (4.4GHz Max) LGA1700' },
    { title: 'Processador AMD Ryzen 5 5600X 3.7GHz (4.6GHz Max) AM4' },
    { title: 'Placa de Vídeo NVIDIA GeForce RTX 3070 8GB GDDR6' },
    { title: 'CPU Intel Core i7-11700 2.5GHz (4.9GHz Max) LGA1200' },
    { title: 'GPU Radeon RX 6700 XT 12GB GDDR6' },
    { title: 'Kit Processador + Placa Mãe Intel i5 + B660M' },
    { title: 'SSD M.2 1TB NVMe PCIe Leitura 7000 MB/s' },
    { title: 'Monitor 27" Gamer 144Hz Full HD 1ms' }
  ];

  // Teste 1: Busca por "GPU"
  console.log('Teste 1: Busca por "GPU"');
  const gpuResults = SmartHardwareSearch.searchAndScore(mockItems, 'GPU');
  console.log(`  Resultados encontrados: ${gpuResults.length}`);
  gpuResults.forEach((result, index) => {
    console.log(`  ${index + 1}. [${result.searchScore.toFixed(1)}] ${result.title}`);
  });
  console.log('');

  // Teste 2: Busca por "CPU"
  console.log('Teste 2: Busca por "CPU"');
  const cpuResults = SmartHardwareSearch.searchAndScore(mockItems, 'CPU');
  console.log(`  Resultados encontrados: ${cpuResults.length}`);
  cpuResults.forEach((result, index) => {
    console.log(`  ${index + 1}. [${result.searchScore.toFixed(1)}] ${result.title}`);
  });
  console.log('');

  // Teste 3: Busca por "processador"
  console.log('Teste 3: Busca por "processador"');
  const processorResults = SmartHardwareSearch.searchAndScore(mockItems, 'processador');
  console.log(`  Resultados encontrados: ${processorResults.length}`);
  processorResults.forEach((result, index) => {
    console.log(`  ${index + 1}. [${result.searchScore.toFixed(1)}] ${result.title}`);
  });
  console.log('');

  // Teste 4: Busca por "placa de video"
  console.log('Teste 4: Busca por "placa de video"');
  const videoCardResults = SmartHardwareSearch.searchAndScore(mockItems, 'placa de video');
  console.log(`  Resultados encontrados: ${videoCardResults.length}`);
  videoCardResults.forEach((result, index) => {
    console.log(`  ${index + 1}. [${result.searchScore.toFixed(1)}] ${result.title}`);
  });
  console.log('');

  console.log('✅ Testes de busca concluídos!');
  
  // Verificação de funcionalidade
  const hasGpuResults = gpuResults.length > 0;
  const hasCpuResults = cpuResults.length > 0;
  const hasProcessorResults = processorResults.length > 0;
  const hasVideoCardResults = videoCardResults.length > 0;
  
  console.log('\n📊 Resumo:');
  console.log(`- Busca por "GPU" funcionando: ${hasGpuResults ? '✅' : '❌'}`);
  console.log(`- Busca por "CPU" funcionando: ${hasCpuResults ? '✅' : '❌'}`);
  console.log(`- Busca por "processador" funcionando: ${hasProcessorResults ? '✅' : '❌'}`);
  console.log(`- Busca por "placa de video" funcionando: ${hasVideoCardResults ? '✅' : '❌'}`);
  
  if (hasGpuResults && hasCpuResults && hasProcessorResults && hasVideoCardResults) {
    console.log('\n🎉 Sistema de busca inteligente está funcionando corretamente!');
  } else {
    console.log('\n⚠️  Ajustes adicionais podem ser necessários.');
  }
}

// Executar os testes
runSearchTests();