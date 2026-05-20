import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApprovals, respondApproval, Approval } from '../api';

export const ApprovalsPage = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals', filterStatus],
    queryFn: () => getApprovals(filterStatus !== 'all' ? filterStatus : undefined)
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, decision, reason }: { id: string, decision: 'approved' | 'rejected', reason: string }) =>
      respondApproval(id, decision, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      alert('Decisão registrada com sucesso');
      setSelectedApproval(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      alert('Erro ao registrar decisão');
      console.error(err);
    }
  });

  const handleApprove = (id: string) => {
    respondMutation.mutate({ id, decision: 'approved', reason: 'Aprovado via Portal' });
  };

  const handleReject = (id: string) => {
    if (!rejectReason) {
      alert('Justificativa é obrigatória para rejeição');
      return;
    }
    respondMutation.mutate({ id, decision: 'rejected', reason: rejectReason });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Central de Aprovações</h1>
        <select
          className="border p-2 rounded"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="pending">Pendentes</option>
          <option value="responded">Respondidas</option>
          <option value="all">Todas</option>
        </select>
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvals?.map((appr: Approval) => (
            <div key={appr.id} className="border p-4 rounded-lg shadow-sm flex flex-col justify-between bg-white">
              <div>
                <h3 className="font-semibold text-lg">{appr.summary}</h3>
                <p className="text-sm text-gray-500">ID: {appr.approval_id}</p>
                <div className="mt-2 text-sm">
                  <span className="bg-gray-100 px-2 py-1 rounded mr-2">{appr.risk_level.toUpperCase()}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{appr.status.toUpperCase()}</span>
                </div>
                {appr.amount && (
                  <p className="mt-2 font-medium">Valor: {appr.currency} {appr.amount}</p>
                )}
              </div>

              {appr.status === 'pending' && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <button
                    onClick={() => handleApprove(appr.approval_id)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={respondMutation.isPending}
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => setSelectedApproval(appr)}
                    className="w-full bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
                  >
                    Rejeitar...
                  </button>
                </div>
              )}
            </div>
          ))}
          {approvals?.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              Nenhuma aprovação encontrada.
            </div>
          )}
        </div>
      )}

      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-red-600">Rejeitar Aprovação</h2>
            <p className="text-sm text-gray-600">Justificativa obrigatória para {selectedApproval.summary}</p>
            <textarea
              className="w-full border rounded p-2 focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => { setSelectedApproval(null); setRejectReason(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(selectedApproval.approval_id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={!rejectReason || respondMutation.isPending}
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
