import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export interface ReportedProblem {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  problemDescription: string;
  reportDate: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolutionDate?: string;
}



const mockReportedProblems: ReportedProblem[] = [
  {
    id: '1',
    appointmentId: 'c3',
    clientId: 'client1',
    clientName: 'Carlos M.',
    providerId: 'provider1',
    providerName: 'Ana Cleaning',
    serviceName: 'Limpieza General',
    serviceDate: '2024-01-15',
    serviceTime: '14:00',
    problemDescription: 'El proveedor llegó 30 minutos tarde sin avisar y no completó la limpieza de los baños como se acordó.',
    reportDate: '2024-01-15T18:30:00.000Z',
    status: 'pending'
  },
  {
    id: '2',
    appointmentId: 'c5',
    clientId: 'client2',
    clientName: 'María G.',
    providerId: 'provider2',
    providerName: 'Sofia Garden',
    serviceName: 'Jardinería',
    serviceDate: '2024-01-14',
    serviceTime: '10:00',
    problemDescription: 'No trajeron las herramientas adecuadas y el trabajo quedó incompleto. Además, dejaron basura en el jardín.',
    reportDate: '2024-01-14T16:45:00.000Z',
    status: 'investigating',
    adminNotes: 'Contactando al proveedor para obtener su versión de los hechos.'
  }
];

export const [ReportedProblemsProvider, useReportedProblems] = createContextHook(() => {
  const [reportedProblems, setReportedProblems] = useState<ReportedProblem[]>(mockReportedProblems);
  const [loading, setLoading] = useState(false);

  const saveProblems = async (problems: ReportedProblem[]) => {
    if (!problems || problems.length === 0) return;
    try {
      // For now, just log to console since we can't use AsyncStorage directly
      console.log('Saving reported problems:', problems.length);
    } catch (error) {
      console.error('Error saving reported problems:', error);
    }
  };

  const reportProblem = useCallback(async (problemData: Omit<ReportedProblem, 'id' | 'reportDate' | 'status'>) => {
    setLoading(true);
    try {
      const newProblem: ReportedProblem = {
        ...problemData,
        id: Date.now().toString(),
        reportDate: new Date().toISOString(),
        status: 'pending'
      };

      const updatedProblems = [...reportedProblems, newProblem];
      setReportedProblems(updatedProblems);
      await saveProblems(updatedProblems);

      // Simulate notification to admin
      console.log('🚨 ADMIN ALERT: New problem reported!', {
        id: newProblem.id,
        service: newProblem.serviceName,
        client: newProblem.clientName
      });
    } catch (error) {
      console.error('Error reporting problem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [reportedProblems]);

  const updateProblemStatus = useCallback(async (id: string, status: ReportedProblem['status'], adminNotes?: string) => {
    try {
      const updatedProblems = reportedProblems.map(problem => 
        problem.id === id 
          ? { 
              ...problem, 
              status, 
              adminNotes,
              resolutionDate: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : undefined
            }
          : problem
      );
      
      setReportedProblems(updatedProblems);
      await saveProblems(updatedProblems);
    } catch (error) {
      console.error('Error updating problem status:', error);
      throw error;
    }
  }, [reportedProblems]);

  const getProblemsForAdmin = useCallback(() => {
    return reportedProblems.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
  }, [reportedProblems]);

  const getProblemsForClient = useCallback((clientId: string) => {
    return reportedProblems
      .filter(problem => problem.clientId === clientId)
      .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
  }, [reportedProblems]);

  const getProblemsForProvider = useCallback((providerId: string) => {
    return reportedProblems
      .filter(problem => problem.providerId === providerId)
      .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
  }, [reportedProblems]);

  return useMemo(() => ({
    reportedProblems,
    loading,
    reportProblem,
    updateProblemStatus,
    getProblemsForAdmin,
    getProblemsForClient,
    getProblemsForProvider
  }), [reportedProblems, loading, reportProblem, updateProblemStatus, getProblemsForAdmin, getProblemsForClient, getProblemsForProvider]);
});