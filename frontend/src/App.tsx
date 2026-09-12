import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { CurtainWizard } from './pages/CurtainWizard';
import { OrdersWorkshop } from './pages/OrdersWorkshop';
import { FormulaPricing } from './pages/FormulaPricing';
import { BuyboxRadar } from './pages/BuyboxRadar';
import { PriceLogs } from './pages/PriceLogs';
import { Settings } from './pages/Settings';
import { Product, BuyboxItem, PriceLog, SellerSettings } from './types';
import { api } from './api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('curtain_wizard');
  const [products, setProducts] = useState<Product[]>([]);
  const [buyboxItems, setBuyboxItems] = useState<BuyboxItem[]>([]);
  const [logs, setLogs] = useState<PriceLog[]>([]);
  const [settings, setSettings] = useState<SellerSettings>({
    supplier_id: 'DEMO_SUPPLIER_123',
    api_key: 'demo_api_key',
    api_secret: 'demo_api_secret',
    is_mock_mode: true,
    telegram_enabled: false
  });
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAllData = async () => {
    try {
      const [prods, bItems, pLogs, sett] = await Promise.all([
        api.getProducts(),
        api.getBuyboxItems(),
        api.getPriceLogs(),
        api.getSettings()
      ]);
      setProducts(prods);
      setBuyboxItems(bItems);
      setLogs(pLogs);
      setSettings(sett);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.syncProducts();
      await loadAllData();
    } catch (err: any) {
      alert('Eşitleme hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMockMode={settings.is_mock_mode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onSync={handleSync}
          syncing={syncing}
          telegramEnabled={settings.telegram_enabled}
        />

        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Veriler yükleniyor...</p>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <Dashboard
                  products={products}
                  buyboxItems={buyboxItems}
                  logs={logs}
                  onNavigate={setCurrentTab}
                />
              )}
              {currentTab === 'curtain_wizard' && (
                <CurtainWizard
                  onProductCreated={loadAllData}
                />
              )}
              {currentTab === 'orders_workshop' && (
                <OrdersWorkshop />
              )}
              {currentTab === 'formula' && (
                <FormulaPricing
                  products={products}
                  onPricesUpdated={loadAllData}
                />
              )}
              {currentTab === 'buybox' && (
                <BuyboxRadar
                  buyboxItems={buyboxItems}
                  onRefresh={loadAllData}
                />
              )}
              {currentTab === 'logs' && <PriceLogs logs={logs} />}
              {currentTab === 'settings' && (
                <Settings
                  settings={settings}
                  onUpdate={(newSett) => setSettings(newSett)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
export default App;
