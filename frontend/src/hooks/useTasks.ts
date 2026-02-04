import { useState, useCallback } from 'react';
import { Task, TaskStatus } from '../types';
import { useAuthFetch } from './useAuthFetch';

interface UseTasksReturn {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    addTask: (taskData: Omit<Task, 'id' | 'companyId' | 'status'>) => void;
    updateTaskStatus: (taskId: string, status: TaskStatus) => void;
    deleteTask: (taskId: string) => void;
    loadTasksForCompany: (empresaId: string) => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const authFetch = useAuthFetch();

    const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'companyId' | 'status'>) => {
        if (!authFetch) return;
        
        try {
            const res = await authFetch('/negociacao/addtarefa', {
                method: 'POST',
                body: JSON.stringify({
                    negociacaoId: taskData.deal_id,
                    tarefa: {
                        titulo: taskData.titulo,
                        tipo: taskData.tipo,
                        data: taskData.data_hora,
                        concluida: false
                    }
                })
            });

            if (res?.ok) {
                const data = await res.json();
                if (data?.data?.tarefas) {
                    // Atualiza com as tarefas retornadas pelo backend (sem responsavel_id)
                    const newTasks: Task[] = [];
                    data.data.tarefas.forEach((t: any) => {
                        newTasks.push({
                            id: t._id || Math.random().toString(36),
                            deal_id: data.data._id,
                            tipo: t.tipo,
                            titulo: t.titulo,
                            companyId: data.data.empresa,
                            data_hora: t.data,
                            status: t.concluida ? TaskStatus.CONCLUIDA : TaskStatus.PENDENTE
                        });
                    });
                    setTasks(prev => {
                        const filtered = prev.filter(t => t.deal_id !== taskData.deal_id);
                        return [...filtered, ...newTasks];
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
        }
    }, [authFetch]);

    const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    }, []);

    const loadTasksForCompany = useCallback(async (empresaId: string) => {
        if (!authFetch) return;
        
        try {
            const resNegociacoes = await authFetch('/negociacao');
            if (resNegociacoes?.ok) {
                const data = await resNegociacoes.json();
                
                // Extrai tarefas apenas da empresa selecionada
                const allTasks: Task[] = [];
                data.data?.forEach((n: any) => {
                    const nCompanyId = typeof n.empresa === 'object' ? n.empresa?._id : n.empresa;
                    if (nCompanyId === empresaId && n.tarefas && Array.isArray(n.tarefas)) {
                        n.tarefas.forEach((t: any) => {
                            allTasks.push({
                                id: t._id,
                                deal_id: n._id,
                                tipo: t.tipo,
                                titulo: t.titulo || t.descricao || `Tarefa de ${t.tipo}`,
                                companyId: nCompanyId,
                                data_hora: t.data_vencimento || t.createdAt,
                                status: t.status || TaskStatus.PENDENTE,
                            });
                        });
                    }
                });
                setTasks(allTasks);
            }
        } catch (error) {
            console.error('Erro ao carregar tarefas da empresa:', error);
        }
    }, []);

    return {
        tasks,
        setTasks,
        addTask,
        updateTaskStatus,
        deleteTask,
        loadTasksForCompany
    };
};
