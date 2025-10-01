import { useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export const RealocacaoAssociados = () => {
  const { gestores, associados, realocarAssociados } = useData();
  const [gestorOrigemId, setGestorOrigemId] = useState("");
  const [gestorDestinoId, setGestorDestinoId] = useState("");
  const [associadosSelecionados, setAssociadosSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  const gestorOrigem = gestores.find((g) => g.id === gestorOrigemId);
  const gestorDestino = gestores.find((g) => g.id === gestorDestinoId);
  const associadosOrigem = associados.filter((a) => a.gestorId === gestorOrigemId);
  const associadosFiltrados = associadosOrigem.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleRealocar = () => {
    if (associadosSelecionados.length === 0) {
      toast({
        title: "Selecione associados",
        description: "É necessário selecionar ao menos um associado para realocar",
        variant: "destructive",
      });
      return;
    }

    if (!gestorDestinoId) {
      toast({
        title: "Selecione o gestor destino",
        description: "É necessário selecionar o gestor que receberá os associados",
        variant: "destructive",
      });
      return;
    }

    realocarAssociados(associadosSelecionados, gestorDestinoId, "Realocação manual");
    
    toast({
      title: "Realocação concluída!",
      description: `${associadosSelecionados.length} associado(s) realocado(s) com sucesso`,
    });

    setAssociadosSelecionados([]);
  };

  const novaOcupacaoOrigem = gestorOrigem
    ? gestorOrigem.associadosAtuais - associadosSelecionados.length
    : 0;
  const novaOcupacaoDestino = gestorDestino
    ? gestorDestino.associadosAtuais + associadosSelecionados.length
    : 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Realocação de Associados
          </CardTitle>
          <CardDescription>
            Selecione o gestor origem e destino para realizar a transferência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Gestor Origem</Label>
              <Select value={gestorOrigemId} onValueChange={setGestorOrigemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nome} ({g.associadosAtuais})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gestor Destino</Label>
              <Select value={gestorDestinoId} onValueChange={setGestorDestinoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {gestores
                    .filter((g) => g.id !== gestorOrigemId)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nome} ({g.associadosAtuais})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {gestorOrigemId && (
            <>
              <div className="space-y-2">
                <Label>Buscar Associados</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome do associado..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">
                    Associados Disponíveis ({associadosFiltrados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {associadosFiltrados.map((associado) => (
                      <div
                        key={associado.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
                      >
                        <Checkbox
                          checked={associadosSelecionados.includes(associado.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAssociadosSelecionados([...associadosSelecionados, associado.id]);
                            } else {
                              setAssociadosSelecionados(
                                associadosSelecionados.filter((id) => id !== associado.id)
                              );
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{associado.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {associado.segmento} - {associado.subsegmento}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {gestorOrigem && gestorDestino && associadosSelecionados.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Previsão após Realocação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{gestorOrigem.nome}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {gestorOrigem.associadosAtuais}
                    </span>
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">{novaOcupacaoOrigem}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((novaOcupacaoOrigem / gestorOrigem.limiteIdeal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{gestorDestino.nome}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {gestorDestino.associadosAtuais}
                    </span>
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">{novaOcupacaoDestino}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((novaOcupacaoDestino / gestorDestino.limiteIdeal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleRealocar}
            disabled={associadosSelecionados.length === 0 || !gestorDestinoId}
            className="w-full bg-gradient-sicredi hover:opacity-90"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Realizar Realocação ({associadosSelecionados.length} associado
            {associadosSelecionados.length !== 1 ? "s" : ""})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
