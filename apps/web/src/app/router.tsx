import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ProtectedRoute } from "../shared/auth/ProtectedRoute";
import { ProtectedModuleRoute } from "../shared/auth/ProtectedModuleRoute";
import { NotFoundPage } from "../shared/components/NotFoundPage";
import { PlaceholderPage } from "../shared/components/PlaceholderPage";
import { PortalShell } from "../shared/layout/PortalShell";
import { AdminPage } from "../modules/admin/AdminPage";
import { LoginPage } from "../modules/auth/LoginPage";
import { DashboardPage } from "../modules/dashboard/DashboardPage";
import { KanbanProducaoPage } from "../modules/production/KanbanProducaoPage";
import { KanbanHubPage } from "../modules/kanban/KanbanHubPage";
import { KanbanBoardPage } from "../modules/kanban/KanbanBoardPage";
import { KanbanTvPage } from "../modules/kanban/KanbanTvPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PortalShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "admin", element: <ProtectedModuleRoute moduleKey="admin"><AdminPage /></ProtectedModuleRoute> },
          { path: "chat", element: <ProtectedModuleRoute moduleKey="chat"><PlaceholderPage title="Chat Interno" description="Comunicacao interna em tempo real para equipes e setores." /></ProtectedModuleRoute> },
          { path: "kanban", element: <ProtectedModuleRoute moduleKey="kanban"><KanbanHubPage /></ProtectedModuleRoute> },
          { path: "kanban/tv", element: <ProtectedModuleRoute moduleKey="kanban"><KanbanTvPage /></ProtectedModuleRoute> },
          { path: "kanban/producao", element: <ProtectedModuleRoute moduleKey="kanban_producao"><KanbanProducaoPage /></ProtectedModuleRoute> },
          { path: "kanban/boards/:boardId", element: <ProtectedModuleRoute moduleKey="kanban"><KanbanBoardPage /></ProtectedModuleRoute> },
          { path: "kanban/:boardId", element: <ProtectedModuleRoute moduleKey="kanban"><KanbanBoardPage /></ProtectedModuleRoute> },
          { path: "propostas", element: <ProtectedModuleRoute moduleKey="propostas"><PlaceholderPage title="Propostas" description="Base para criacao, aprovacao e gestao de propostas comerciais." /></ProtectedModuleRoute> },
          { path: "compras", element: <ProtectedModuleRoute moduleKey="compras"><PlaceholderPage title="Compras" description="Base para cotacoes, solicitacoes e gestao de compras." /></ProtectedModuleRoute> },
          { path: "helpdesk", element: <ProtectedModuleRoute moduleKey="helpdesk"><PlaceholderPage title="HelpDesk TI" description="Base para tickets de suporte e atendimento interno." /></ProtectedModuleRoute> },
          { path: "controle-ti", element: <ProtectedModuleRoute moduleKey="controle_ti"><PlaceholderPage title="Controle TI" description="Base para inventario e controle de ativos de tecnologia." /></ProtectedModuleRoute> },
          { path: "atalhos", element: <ProtectedModuleRoute moduleKey="atalhos"><PlaceholderPage title="Atalhos" description="Base para acesso rapido aos sistemas e documentos importantes." /></ProtectedModuleRoute> },
          { path: "ia", element: <ProtectedModuleRoute moduleKey="ia"><PlaceholderPage title="IA Interna" description="Base para assistentes internos e automacoes com modelos de linguagem." /></ProtectedModuleRoute> },
          { path: "automacoes", element: <ProtectedModuleRoute moduleKey="automacoes_n8n"><PlaceholderPage title="Automacoes n8n" description="Base para monitoramento e operacao dos workflows n8n." /></ProtectedModuleRoute> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
