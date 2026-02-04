// Hook para gerenciar tarefas
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

    const addTask = useCallback((taskData: Omit<Task, 'id' | 'companyId' | 'status'>) => {
        const newTask: Task = {
            ...taskData,
            id: Math.random().toString(36),
            companyId: '',
            status: TaskStatus.PENDENTE
        };
        setTasks(prev => [...prev, newTask]);
    }, []);

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
                                responsavel_id: typeof t.responsavel === 'object' ? t.responsavel?._id : t.responsavel,
                                companyId: nCompanyId,
                                data_hora: t.data_vencimento || t.createdAt,
                                status: t.status || 'pendente',
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
