"use client";
import { apiUrl } from "@/lib/api";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Settings,
  Database,
  Shield,
} from "lucide-react";

export default function EinstellungenPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExport = async (format: "json" | "csv") => {
    setExporting(format);
    try {
      const res = await fetch(apiUrl(`/api/export?format=${format}`));
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "json"
          ? `deutschtutor-backup-${new Date().toISOString().slice(0, 10)}.json`
          : `deutschtutor-vocab-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastExport(new Date().toLocaleTimeString("pt-BR"));
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Settings className="h-7 w-7" />
          Einstellungen
        </h1>
        <p className="text-muted-foreground mt-1">Configurações e exportação de dados</p>
      </div>

      {/* Export Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exporte seus dados de aprendizado para backup ou uso em outras ferramentas. 
              O JSON inclui todos os dados; o CSV exporta apenas vocabulário.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <FileJson className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Backup Completo</p>
                      <p className="text-xs text-muted-foreground">JSON — todos os dados</p>
                    </div>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                    <li>• Vocabulário, erros, sessões</li>
                    <li>• Estatísticas diárias, fila de revisão</li>
                    <li>• Submissões de escrita</li>
                  </ul>
                  <Button
                    onClick={() => handleExport("json")}
                    disabled={!!exporting}
                    size="sm"
                    className="w-full"
                  >
                    {exporting === "json" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Baixar JSON
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-50">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Vocabulário CSV</p>
                      <p className="text-xs text-muted-foreground">Compatível com Anki/Excel</p>
                    </div>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                    <li>• Palavras DE → PT</li>
                    <li>• Frases de exemplo</li>
                    <li>• Importável no Anki</li>
                  </ul>
                  <Button
                    onClick={() => handleExport("csv")}
                    disabled={!!exporting}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {exporting === "csv" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Baixar CSV
                  </Button>
                </CardContent>
              </Card>
            </div>

            {lastExport && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Último export: {lastExport}
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Informações do App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Versão</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-muted-foreground">Banco de dados</p>
                <p className="font-medium">SQLite (local)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Motor de IA</p>
                <p className="font-medium">Claude Sonnet 4</p>
              </div>
              <div>
                <p className="text-muted-foreground">SRS</p>
                <p className="font-medium">FSRS v4</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy note */}
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Privacidade</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os dados são armazenados localmente no seu computador. 
                Nenhum dado é enviado para servidores externos, exceto as mensagens 
                enviadas à API da Anthropic para processamento de linguagem natural.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <Badge variant="outline" className="text-xs">
            DeutschTutor Pro — Feito para Caio 🇧🇷🇩🇪
          </Badge>
        </div>
      </div>
    </div>
  );
}
