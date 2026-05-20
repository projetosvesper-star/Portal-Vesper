import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowStatus, callGateway, WorkflowStatus } from '../api';

export const WarRoomPage = () => {
  const [testMessage, setTestMessage] = useState('');
  const [gatewayResponse, setGatewayResponse] = useState<any>(null);
  const [isCalling, setIsCalling] = useState(false);

  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['workflows_status'],
    queryFn: getWorkflowStatus,
    refetchInterval: 30000 // auto refresh every 30s
  });

  const handleTestGateway = async () => {
    if (!testMessage) return;
    setIsCalling(true);
    setGatewayResponse(null);
    try {
      const result = await callGateway(testMessage, 'knowledge');
      setGatewayResponse(result);
      if (result.success) {
        alert('Gateway chamado com sucesso');
      } else {
        alert('Erro no gateway');
      }
    } catch (error: any) {
      alert('Falha de conexão com Gateway');
      setGatewayResponse(error.response?.data || { error: error.message });
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">War Room / Observabilidade</h1>
        <button
          onClick={() => refetch()}
          className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
        >
          Atualizar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workflows Status */}
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-bold mb-4">Status dos Workflows IA</h2>
          {isLoading ? (
            <div>Carregando...</div>
          ) : (
            <div className="space-y-3">
              {workflows?.map((wf: WorkflowStatus) => (
                <div key={wf.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{wf.workflow_name}</p>
                    <p className="text-xs text-gray-500">Agent: {wf.agent || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${wf.status === 'success' ? 'bg-green-100 text-green-800' : wf.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {wf.status.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Erros 24h: {wf.errors_last_24h}</p>
                  </div>
                </div>
              ))}
              {workflows?.length === 0 && <p className="text-gray-500 text-sm">Nenhum status sincronizado.</p>}
            </div>
          )}
        </div>

        {/* Teste Gateway */}
        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-4 flex flex-col">
          <h2 className="text-lg font-bold">Teste Rápido do Gateway IA</h2>
          <p className="text-sm text-gray-500">
            Envie uma mensagem simulando uma requisição do Portal para o n8n Gateway Supervisor.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              placeholder="Digite a intenção/mensagem..."
              className="border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleTestGateway()}
            />
            <button
              onClick={handleTestGateway}
              disabled={!testMessage || isCalling}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isCalling ? 'Enviando...' : 'Enviar'}
            </button>
          </div>

          <div className="flex-1 bg-gray-50 rounded border p-4 overflow-auto text-xs font-mono max-h-64">
            {gatewayResponse ? (
              <pre>{JSON.stringify(gatewayResponse, null, 2)}</pre>
            ) : (
              <span className="text-gray-400">Resposta aparecerá aqui...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
