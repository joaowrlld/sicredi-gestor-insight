import { Download, User, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import * as XLSX from "xlsx";

interface AssociadosGestorProps {
  gestorId: string;
  onClose: () => void;
}

export const AssociadosGestor = ({ gestorId, onClose }: AssociadosGestorProps) => {
  const { gestores, associados } = useData();

  const gestor = gestores.find((g) => g.id === gestorId);
  const associadosGestor = associados.filter((a) => a.gestorId === gestorId);

  const handleExportar = () => {
    const dados = associadosGestor.map((assoc) => ({
      Agencia: assoc.agencia,
      Associado: assoc.nome,
      Conta: assoc.conta,
      Gestor: gestor?.nome || "",
      Carteira: assoc.carteira,
      Segmento: assoc.segmento,
      Subsegmento: assoc.subsegmento,
      Renda: assoc.renda,
      Investimentos: assoc.investimentos,
      Idade: assoc.idade,
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Associados");
    XLSX.writeFile(wb, `associados-${gestor?.nome || "gestor"}.xlsx`);
  };

  if (!gestor) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border-primary/20">
        <CardHeader className="border-b border-border bg-gradient-to-r from-card to-card/80">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Associados de {gestor.nome}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportar}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <div className="p-6 space-y-4">
            {/* Info do Gestor */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Agência</p>
                  <p className="text-lg font-semibold">{gestor.agencia}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Segmento</p>
                  <p className="text-lg font-semibold">
                    {gestor.segmento} - {gestor.subsegmento}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Associados</p>
                  <p className="text-lg font-semibold">{associadosGestor.length}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Ocupação</p>
                  <p className="text-lg font-semibold">
                    {((gestor.associadosAtuais / gestor.limiteIdeal) * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Associados */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Lista de Associados ({associadosGestor.length})
              </h3>
              <div className="space-y-2">
                {associadosGestor.map((assoc) => (
                  <div
                    key={assoc.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/40 transition-all hover:shadow-sicredi"
                  >
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="font-medium">{assoc.nome}</p>
                        <p className="text-xs text-muted-foreground">Conta: {assoc.conta}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Segmento</p>
                        <p className="font-medium">
                          {assoc.segmento} - {assoc.subsegmento}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Renda</p>
                        <p className="font-medium">
                          {assoc.renda.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Investimentos</p>
                        <p className="font-medium">
                          {assoc.investimentos.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Idade</p>
                        <p className="font-medium">{assoc.idade} anos</p>
                      </div>
                    </div>
                  </div>
                ))}
                {associadosGestor.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum associado encontrado
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
