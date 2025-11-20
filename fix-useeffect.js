const fs = require('fs');

// Read the file
let content = fs.readFileSync('app/index.tsx', 'utf8');

// Fix the useEffect block around line 1378-1395
const oldUseEffect = `    useEffect(() => {
      if (appId && appId > 0) {
        const loadAnalysis = async () => {

            setLoading(true)
            const priceService = SteamPriceHistoryService.getInstance()
            const result = await priceService.getPriceAnalysis(appId, title, currentPrice)
            setAnalysis(result)

            console.error('Erro ao carregar anÃ¡lise de preÃ§o:', error)
           finally {
            setLoading(false)



        loadAnalysis()

    , [appId, currentPrice, title])`;

const newUseEffect = `    useEffect(() => {
      if (appId && appId > 0) {
        const loadAnalysis = async () => {
          try {
            setLoading(true)
            const priceService = SteamPriceHistoryService.getInstance()
            const result = await priceService.getPriceAnalysis(appId, title, currentPrice)
            setAnalysis(result)
          } catch (error) {
            console.error('Erro ao carregar anÃ¡lise de preÃ§o:', error)
          } finally {
            setLoading(false)
          }
        }

        loadAnalysis()
      }
    }, [appId, currentPrice, title])`;

content = content.replace(oldUseEffect, newUseEffect);

// Fix the getStatusColor function around line 1399-1407
const oldGetStatusColor = `    const getStatusColor = () => {
      switch (analysis.priceStatus) {
        case 'lowest': return '#10B981'
        case 'good': return '#F59E0B'
        case 'average': return '#6B7280'
        case 'high': return '#EF4444'
        default: return '#6B7280'

    `;

const newGetStatusColor = `    const getStatusColor = () => {
      switch (analysis.priceStatus) {
        case 'lowest': return '#10B981'
        case 'good': return '#F59E0B'
        case 'average': return '#6B7280'
        case 'high': return '#EF4444'
        default: return '#6B7280'
      }
    }`;

content = content.replace(oldGetStatusColor, newGetStatusColor);

// Write back
fs.writeFileSync('app/index.tsx', content, 'utf8');
console.log('Fixed useEffect and getStatusColor');
