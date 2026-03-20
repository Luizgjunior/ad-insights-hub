import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();
      setReport(data);
      setLoading(false);
    })();
  }, [id]);

  function handleDownloadPDF() {
    const html = (report?.content_json as any)?.html;
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    setTimeout(() => {
      win?.print();
      URL.revokeObjectURL(url);
    }, 500);
  }

  function handleShare() {
    const url = `${window.location.origin}/reports/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  }

  if (loading) {
    return (
      <AppShell title="Relatório">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </AppShell>
    );
  }

  if (!report) {
    return (
      <AppShell title="Relatório">
        <div className="p-5 lg:p-8 text-center">
          <p className="text-muted-foreground">Relatório não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </AppShell>
    );
  }

  const contentHtml = (report.content_json as any)?.html;

  return (
    <AppShell title={report.title || 'Relatório'}>
      <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between animate-reveal-up">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button onClick={handleDownloadPDF} disabled={!contentHtml} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </div>

        {/* Report content */}
        {contentHtml ? (
          <div
            className="report-viewer bg-white rounded-xl shadow-[0_4px_32px_rgba(0,0,0,0.3)] max-w-[860px] mx-auto overflow-hidden animate-reveal-up"
            style={{ animationDelay: '100ms' }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : report.status === 'generating' ? (
          <div className="card-surface p-12 text-center">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground mt-4">Relatório sendo gerado...</p>
          </div>
        ) : (
          <div className="card-surface p-12 text-center">
            <p className="text-sm text-danger">Erro ao gerar o relatório. Tente novamente.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
